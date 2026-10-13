import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useWorkoutSession } from './useWorkoutSession';
import { useBluetoothTrainer, ControlMode } from './useBluetoothTrainer';
import { useBluetoothHRM } from './useBluetoothHRM';
import { useMockDevices } from './useMockDevices';
import { useAppState } from './useAppState';
import { useFreeRide } from './useFreeRide';
import { usePowerAdjustments } from './usePowerAdjustments';
import { useAudioSettings } from './useAudioSettings';
import { getAdjustedTargetPowerAtTime } from '@/data/sampleWorkouts';

const autoPause = ref(true), deviceError = ref(false);
let mounted = false;

export function useWorkoutEngine() {
  const session = useWorkoutSession(), trainer = useBluetoothTrainer(), hrm = useBluetoothHRM();
  const mock = useMockDevices(), app = useAppState(), free = useFreeRide(), adjustments = usePowerAdjustments();
  const simulated = computed(() => session.source.value === 'simulation');
  const interval = computed(() => session.getCurrentIntervalIndex(session.elapsedSeconds.value, session.workout.value));
  const unstructured = computed(() => session.workout.value?.isFreeRide || session.isWorkoutComplete.value || interval.value?.interval?.type === 'freeride');
  const targetPower = computed(() => !session.workout.value ? 0 : unstructured.value ? free.targetPower.value : getAdjustedTargetPowerAtTime(session.workout.value, session.elapsedSeconds.value, app.ftp.value, adjustments.currentIntervalOffset.value, adjustments.globalOffset.value));
  const currentMetrics = computed(() => simulated.value
    ? { power: mock.power.value, heartRate: mock.heartRate.value, cadence: mock.cadence.value, speed: mock.speed.value }
    : { power: trainer.power.value, heartRate: hrm.heartRate.value, cadence: trainer.cadence.value, speed: trainer.speed.value });
  function togglePause() { autoPause.value = false; session.isPaused.value ? session.resume() : session.pause(); }
  return { session, trainer, hrm, mock, simulated, autoPause, deviceError, targetPower, currentMetrics, unstructured, togglePause };
}

// Mounted once by App: recording and trainer control survive route changes.
export function mountWorkoutEngine() {
  if (mounted) return;
  mounted = true;
  const engine = useWorkoutEngine();
  const { session, trainer, mock, simulated, targetPower, currentMetrics, unstructured } = engine;
  const audio = useAudioSettings();
  let timer, lastSample = 0, inactiveSeconds = 0, sentPower = null, busy = false, wakeLock;
  let countdownInterval = -1;
  async function releaseTrainer() {
    sentPower = null;
    if (!simulated.value && trainer.hasControl.value) deviceError.value = !(await trainer.releaseResistance());
  }
  async function updateControl() {
    if (busy || !session.isActive.value || session.isPaused.value || simulated.value || !trainer.hasControl.value) return;
    // A ZWO FreeRide block must not silently impose an ERG target.
    const current = session.getCurrentIntervalIndex(session.elapsedSeconds.value, session.workout.value);
    if (current?.interval?.type === 'freeride' && !session.workout.value?.isFreeRide) {
      if (sentPower !== 'free') { busy = true; try { if (await trainer.releaseResistance()) sentPower = 'free'; } finally { busy = false; } }
      return;
    }
    if (trainer.controlMode.value !== ControlMode.ERG) return;
    const target = Math.max(0, Math.round(targetPower.value));
    if (target === sentPower) return;
    busy = true;
    try { const ok = await trainer.setTargetPower(target); deviceError.value = !ok; if (ok) sentPower = target; }
    finally { busy = false; }
  }
  async function manageWakeLock() {
    try {
      if (session.isActive.value && !session.isPaused.value && document.visibilityState === 'visible' && navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen');
      else if (wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch { /* Screen lock is an optional browser capability. */ }
  }
  watch(() => session.id.value, () => { autoPause.value = true; inactiveSeconds = 0; sentPower = null; countdownInterval = -1; });
  watch([() => session.isActive.value, simulated], ([active, simulation], [wasActive] = []) => {
    if (active && simulation) mock.start(session.workout.value, session.ftp.value);
    // A setup-page simulation preview is managed by DeviceConnector: only stop mock when a session ends.
    else if (wasActive) mock.stop();
    if (!active) releaseTrainer();
  }, { immediate: true });
  watch(() => session.isPaused.value, paused => {
    lastSample = session.activeElapsedSeconds.value;
    if (paused) releaseTrainer(); else { sentPower = null; updateControl(); }
    manageWakeLock();
  });
  watch(() => trainer.hasControl.value, () => { sentPower = null; updateControl(); });
  watch(() => trainer.controlMode.value, () => { sentPower = null; updateControl(); });
  watch(targetPower, target => { mock.setTargetPower(target); updateControl(); });
  watch(() => session.isWorkoutComplete.value, complete => {
    // Smart transition: start free recovery at the last interval's average power.
    if (complete) {
      const free = useFreeRide();
      free.setTargetPower(free.calculateStartingPower(session.intervalPower.value));
    }
  });
  function collect() {
    if (!session.isActive.value) return;
    const power = currentMetrics.value.power;
    if (!simulated.value && (!trainer.isConnected.value || Date.now() - trainer.lastPowerAt.value > 5000)) { session.pause(); return; }
    if (autoPause.value) {
      if (power > 0) { inactiveSeconds = 0; if (session.isPaused.value) session.resume(); }
      else if (++inactiveSeconds >= 5) session.pause();
    }
    if (session.isPaused.value) return;
    const duration = session.activeElapsedSeconds.value - lastSample;
    // A suspended browser has no reliable sensor samples for the missing period.
    if (duration > 5) { session.pause(); return; }
    if (duration > 0) session.recordDataPoint(currentMetrics.value, duration);
    lastSample = session.activeElapsedSeconds.value;
    const current = session.getCurrentIntervalIndex(session.elapsedSeconds.value, session.workout.value);
    if (!unstructured.value && current?.interval && session.intervalRemainingTime.value <= 3 && countdownInterval !== current.index) {
      countdownInterval = current.index; audio.playIntervalSound();
    }
    updateControl();
  }
  function persist() { if (session.isActive.value) session.pause(); }
  onMounted(() => {
    timer = setInterval(collect, 1000);
    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', manageWakeLock);
  });
  onBeforeUnmount(() => {
    clearInterval(timer); persist(); releaseTrainer(); mock.stop();
    window.removeEventListener('pagehide', persist);
    document.removeEventListener('visibilitychange', manageWakeLock);
    wakeLock?.release(); mounted = false;
  });
}
