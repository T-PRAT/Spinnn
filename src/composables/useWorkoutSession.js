import { ref, computed } from 'vue';
import { getCurrentIntervalIndex } from '@/utils/workoutHelpers';
import { useStorage } from './useStorage';
import { useWorkoutData } from './useWorkoutData';
import { useWorkoutStats } from './useWorkoutStats';
import { workoutHistory } from '@/utils/workoutHistory';

const storage = useStorage(), data = useWorkoutData();
const isActive = ref(false), isPaused = ref(false);
const startTime = ref(null), endTime = ref(null), workout = ref(null);
const elapsedSeconds = ref(0), activeElapsedSeconds = ref(0), ftp = ref(200);
const id = ref(null), events = ref([]), saveError = ref(false), source = ref('bluetooth');
let clock = null, lastTick = 0, initialized = false;

function tick() {
  const now = performance.now();
  const delta = Math.max(0, (now - lastTick) / 1000);
  lastTick = now;
  if (isActive.value && !isPaused.value) {
    elapsedSeconds.value += delta; activeElapsedSeconds.value += delta;
  }
}
function startClock() {
  clearInterval(clock); lastTick = performance.now(); clock = setInterval(tick, 100);
}
function haltClock() { clearInterval(clock); clock = null; }
function snapshot() {
  return {
    version: 2, id: id.value, isActive: isActive.value, isPaused: isPaused.value,
    startTime: startTime.value?.toISOString(), endTime: endTime.value?.toISOString(),
    elapsedSeconds: elapsedSeconds.value, activeElapsedSeconds: activeElapsedSeconds.value,
    workout: workout.value, ftp: ftp.value, source: source.value,
    dataPoints: data.dataPoints.value, lastDistance: data.getDistance(),
    events: events.value, savedAt: new Date().toISOString(),
  };
}
function saveWorkoutState() {
  if (workout.value) saveError.value = !storage.setWorkoutSession(snapshot());
}
function restore(saved) {
  if (!saved?.workout || !Array.isArray(saved.dataPoints) || !Number.isFinite(saved.elapsedSeconds) || !Number.isFinite(new Date(saved.startTime).getTime())) return false;
  haltClock();
  id.value = saved.id || crypto.randomUUID(); workout.value = saved.workout;
  startTime.value = new Date(saved.startTime); endTime.value = saved.endTime ? new Date(saved.endTime) : null;
  elapsedSeconds.value = saved.elapsedSeconds; activeElapsedSeconds.value = saved.activeElapsedSeconds ?? saved.dataPoints.length;
  data.loadDataPoints(saved.dataPoints, saved.lastDistance || 0);
  ftp.value = saved.ftp || 200; source.value = saved.source || 'bluetooth'; events.value = saved.events || [];
  isActive.value = Boolean(saved.isActive); isPaused.value = isActive.value;
  if (isActive.value && events.value.at(-1)?.type === 'start') events.value.push({ type: 'stop', at: new Date(saved.savedAt).getTime() });
  return true;
}
function loadWorkoutState() {
  if (isActive.value) return true;
  const saved = storage.getWorkoutSession(); return saved ? restore(saved) : false;
}
function start(selectedWorkout, userFtp, deviceSource = 'bluetooth') {
  if (isActive.value || !selectedWorkout) return;
  reset(); id.value = crypto.randomUUID(); workout.value = selectedWorkout;
  ftp.value = userFtp; source.value = deviceSource; startTime.value = new Date();
  isActive.value = true; isPaused.value = true;
  saveWorkoutState();
}
function pause() {
  if (!isActive.value || isPaused.value) return;
  tick(); isPaused.value = true; haltClock();
  events.value.push({ type: 'stop', at: Date.now() }); saveWorkoutState();
}
function resume() {
  if (!isActive.value || !isPaused.value) return;
  isPaused.value = false; events.value.push({ type: 'start', at: Date.now() });
  startClock(); saveWorkoutState();
}
async function stop() {
  if (!workout.value) return;
  pause(); isActive.value = false; endTime.value ||= new Date();
  saveWorkoutState(); // Keep recovery data until the archive transaction commits.
  try {
    await workoutHistory.save(snapshot()); storage.clearWorkoutSession(); saveError.value = false;
  } catch (error) { saveError.value = true; throw error; }
}
function reset() {
  haltClock(); isActive.value = false; isPaused.value = false;
  startTime.value = endTime.value = workout.value = id.value = null;
  elapsedSeconds.value = activeElapsedSeconds.value = 0; events.value = []; data.reset(); storage.clearWorkoutSession();
}
function setElapsedSeconds(seconds) {
  if (!isActive.value || !Number.isFinite(seconds)) return;
  if (!isPaused.value) tick();
  elapsedSeconds.value = Math.max(0, seconds); saveWorkoutState();
}
function recordDataPoint(metrics, duration = 1) {
  if (!isActive.value || isPaused.value) return;
  if (data.recordDataPoint(metrics, elapsedSeconds.value, true, duration, activeElapsedSeconds.value)) saveWorkoutState();
}
async function loadCompleted(sessionId) {
  if (isActive.value) return false;
  const saved = await workoutHistory.get(sessionId); return saved ? restore(saved) : false;
}
const stats = useWorkoutStats(data.dataPoints, workout, elapsedSeconds, ftp, activeElapsedSeconds);
const formatTime = seconds => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
const sessionData = computed(() => ({ ...snapshot(), workoutName: workout.value?.name || '', totalDistance: data.getDistance() }));
const isWorkoutComplete = computed(() => Boolean(workout.value && !workout.value.isFreeRide && elapsedSeconds.value >= workout.value.duration));

export function useWorkoutSession() {
  if (!initialized) { initialized = true; loadWorkoutState(); }
  return {
    id, isActive, isPaused, startTime, endTime, workout, ftp, source, saveError,
    elapsedSeconds, activeElapsedSeconds, dataPoints: data.dataPoints,
    formattedElapsedTime: computed(() => formatTime(activeElapsedSeconds.value)),
    formattedWorkoutDuration: computed(() => workout.value?.isFreeRide ? '∞' : formatTime(workout.value?.duration || 0)),
    sessionData, isWorkoutComplete, ...stats, getCurrentIntervalIndex,
    start, stop, reset, pause, resume, setElapsedSeconds, recordDataPoint,
    saveWorkoutState, loadWorkoutState, loadCompleted, clearWorkoutState: storage.clearWorkoutSession,
  };
}
