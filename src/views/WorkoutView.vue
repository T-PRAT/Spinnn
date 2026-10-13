<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWorkoutEngine } from '@/composables/useWorkoutEngine';
import { useAppState } from '@/composables/useAppState';
import { useFreeRide } from '@/composables/useFreeRide';
import { usePowerAdjustments } from '@/composables/usePowerAdjustments';
import { useStorage } from '@/composables/useStorage';
import { useI18n } from '@/composables/useI18n';
import { ControlMode } from '@/composables/useBluetoothTrainer';
import WorkoutChart from '@/components/workout/WorkoutChart.vue';
import MetricsGrid from '@/components/workout/MetricsGrid.vue';
import AppDialog from '@/components/layout/AppDialog.vue';
import FreeRidePowerControl from '@/components/workout/FreeRidePowerControl.vue';

const router = useRouter(), { t } = useI18n();
const { session, trainer, hrm, simulated, targetPower, currentMetrics, unstructured, togglePause, deviceError } = useWorkoutEngine();
const app = useAppState(), free = useFreeRide(), adjustments = usePowerAdjustments(), storage = useStorage();
const settingsOpen = ref(false), stopOpen = ref(false), saving = ref(false), selectedSlot = ref(null);
const metrics = ref({ 1: 'speed', 2: 'distance', 3: 'energy', 8: 'cadence', ...storage.getMetricsConfig() });
const availableMetrics = ['power', 'heartRate', 'cadence', 'speed', 'distance', 'energy', 'intervalPower', 'intervalHeartRate', 'intervalRemainingTime', 'elapsedTime', 'avgPower', 'avgHeartRate', 'avgCadence'];
const workout = computed(() => session.workout.value);
const graphWorkout = computed(() => session.isWorkoutComplete.value ? { ...workout.value, isFreeRide: true } : workout.value);
const progress = computed(() => workout.value?.isFreeRide ? 0 : Math.min(100, session.elapsedSeconds.value / (workout.value?.duration || 1) * 100));
function metricLabel(key) { return key === 'energy' ? t('review.work') : t(`metrics.${key}`); }
function metricValue(key) {
  const live = currentMetrics.value;
  const values = {
    power: `${live.power} W`, heartRate: `${live.heartRate} bpm`, cadence: `${live.cadence} rpm`,
    speed: `${(live.speed * 3.6).toFixed(1)} km/h`, distance: `${(session.stats.value.distanceMeters / 1000).toFixed(2)} km`,
    energy: `${session.energy.value} kJ`, intervalPower: `${session.intervalPower.value} W`, intervalHeartRate: `${session.intervalHeartRate.value} bpm`,
    intervalRemainingTime: session.formattedIntervalRemainingTime.value, elapsedTime: session.formattedElapsedTime.value,
    avgPower: `${session.avgPower.value} W`, avgHeartRate: `${session.avgHeartRate.value} bpm`, avgCadence: `${session.avgCadence.value} rpm`,
  };
  return values[key] || '—';
}
const slots = ids => ids.map(id => ({ id, label: metricLabel(metrics.value[id]), value: metricValue(metrics.value[id]) }));
const leftSlots = computed(() => slots([1, 2])), rightSlots = computed(() => slots([3, 8]));
const nextInterval = computed(() => {
  const current = session.getCurrentIntervalIndex(session.elapsedSeconds.value, workout.value);
  const next = current?.startTime + (current?.interval?.duration || 0);
  return next < workout.value?.duration ? next : null;
});
function skip() { if (nextInterval.value !== null) session.setElapsedSeconds(nextInterval.value); }
function selectMetric(key) { metrics.value[selectedSlot.value] = key; storage.setMetricsConfig(metrics.value); selectedSlot.value = null; }
async function changeMode(mode) {
  let ok = true;
  if (mode === ControlMode.PASSIVE) ok = await trainer.releaseResistance();
  else if (mode === ControlMode.SIM) ok = await trainer.setSimulation(0);
  else if (mode === ControlMode.RESISTANCE) ok = await trainer.setResistance(0);
  if (ok) trainer.setControlMode(mode);
  deviceError.value = !ok;
}
async function finish() {
  saving.value = true;
  try { await session.stop(); } catch { /* Recovery snapshot and export remain available. */ }
  app.finishWorkout();
  await router.push({ name: 'summary', params: { id: session.id.value } });
  saving.value = false;
}
onMounted(() => {
  if (!session.isActive.value) router.replace({ name: 'setup' });
  else app.setWorkout(workout.value);
});
</script>

<template>
  <section class="workout-screen" v-if="workout">
    <header class="workout-heading bg-card border border-border rounded-lg">
      <div class="min-w-0"><h1 class="font-bold truncate">{{ workout.isFreeRide ? t('review.free') : workout.name }}</h1>
        <p class="text-xs text-muted-foreground">{{ simulated ? t('review.demoActive') : t('navigation.workout') }}</p></div>
      <div class="text-right"><strong class="text-primary text-xl tabular-nums" data-testid="elapsed">{{ session.formattedElapsedTime.value }}</strong><span class="text-xs ml-2">/ {{ session.formattedWorkoutDuration.value }}</span></div>
      <progress v-if="!workout.isFreeRide" :value="progress" max="100" :aria-label="t('workout.progress')" class="workout-progress" />
    </header>
    <MetricsGrid :current-metrics="currentMetrics" :session="session" :left-slots="leftSlots" :right-slots="rightSlots" :current-target-power="targetPower" :workout="graphWorkout" :elapsed-seconds="session.elapsedSeconds.value" @configure="selectedSlot = $event" />
    <div class="workout-chart bg-card border border-border rounded-lg" data-testid="workout-chart">
      <WorkoutChart :data-points="session.dataPoints.value" :ftp="app.ftp.value" :workout="graphWorkout" :elapsed-seconds="session.elapsedSeconds.value" :target-power="targetPower" />
    </div>
    <p v-if="deviceError" role="alert" class="text-destructive text-sm">{{ t('review.trainerError') }}</p>
    <p v-if="session.saveError.value" role="alert" class="text-destructive text-sm">{{ t('review.storageError') }}</p>
    <footer class="workout-controls bg-card border border-border rounded-lg">
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm"><span class="text-muted-foreground">{{ t('review.target') }}</span> <strong class="text-primary text-xl">{{ targetPower }} W</strong></span>
        <span class="text-xs text-muted-foreground" role="status">{{ session.isPaused.value ? t('workout.pedalToStart') : session.isWorkoutComplete.value ? t('review.completed') : '' }}</span>
      </div>
      <div class="workout-actions">
        <button @click="settingsOpen = true" class="touch-button bg-secondary text-secondary-foreground" :aria-label="t('review.controls')">⚙ <span>{{ t('navigation.settings') }}</span></button>
        <button data-testid="pause" @click="togglePause" class="touch-button bg-primary text-primary-foreground">{{ t(session.isPaused.value ? 'common.buttons.resume' : 'common.buttons.pause') }}</button>
        <button v-if="!unstructured" data-testid="skip" @click="skip" :disabled="nextInterval === null" class="touch-button bg-secondary text-secondary-foreground">{{ t('common.buttons.next') }}</button>
        <button data-testid="stop" @click="stopOpen = true" class="touch-button bg-destructive text-destructive-foreground">{{ t('common.buttons.stop') }}</button>
      </div>
    </footer>
    <AppDialog v-if="stopOpen" :title="t('review.stopTitle')" @close="stopOpen = false">
      <p>{{ t('review.stopHint') }}</p>
      <div class="flex gap-3"><button class="touch-button bg-secondary" @click="stopOpen = false">{{ t('common.buttons.cancel') }}</button><button data-testid="confirm-stop" :disabled="saving" class="touch-button bg-primary text-primary-foreground" @click="finish">{{ t('review.stop') }}</button></div>
    </AppDialog>
    <AppDialog v-if="selectedSlot !== null" :title="t('review.configure')" @close="selectedSlot = null">
      <div class="grid grid-cols-2 gap-2"><button v-for="key in availableMetrics" :key="key" class="touch-button border border-border" :aria-pressed="metrics[selectedSlot] === key" @click="selectMetric(key)">{{ metricLabel(key) }}</button></div>
    </AppDialog>
    <AppDialog v-if="settingsOpen" :title="t('review.controls')" @close="settingsOpen = false">
      <FreeRidePowerControl v-if="unstructured" :current-power="targetPower" :ftp="app.ftp.value" :min-power="50" :max-power="app.ftp.value * 1.5" @power-change="free.setTargetPower" />
      <div v-else class="space-y-3">
        <div class="flex items-center justify-between gap-2"><span>{{ t('review.interval') }}</span><button class="touch-button bg-secondary" :aria-label="t('workout.adjustCurrentDown')" @click="adjustments.adjustCurrentInterval(-0.05)">−5%</button><button class="touch-button" @click="adjustments.resetCurrentIntervalOffset">{{ adjustments.formattedCurrentOffset.value }}</button><button class="touch-button bg-secondary" :aria-label="t('workout.adjustCurrentUp')" @click="adjustments.adjustCurrentInterval(0.05)">+5%</button></div>
        <div class="flex items-center justify-between gap-2"><span>{{ t('review.global') }}</span><button class="touch-button bg-secondary" :aria-label="t('workout.adjustGlobalDown')" @click="adjustments.adjustGlobalWorkout(-0.05)">−5%</button><button class="touch-button" @click="adjustments.globalOffset.value = 0">{{ adjustments.formattedGlobalOffset.value }}</button><button class="touch-button bg-secondary" :aria-label="t('workout.adjustGlobalUp')" @click="adjustments.adjustGlobalWorkout(0.05)">+5%</button></div>
      </div>
      <div v-if="!simulated" class="space-y-3">
        <div v-if="trainer.ftmsSupported.value" class="flex flex-wrap gap-2"><button v-for="mode in Object.values(ControlMode)" :key="mode" :aria-pressed="trainer.controlMode.value === mode" class="touch-button border border-border" @click="changeMode(mode)">{{ mode.toUpperCase() }}</button></div>
        <button class="touch-button border border-border w-full" :disabled="trainer.isConnecting.value || trainer.isConnected.value" @click="trainer.connect">{{ trainer.isConnected.value ? trainer.deviceName.value : t('device.connectTrainer') }}</button>
        <button class="touch-button border border-border w-full" :disabled="hrm.isConnecting.value || hrm.isConnected.value" @click="hrm.connect">{{ hrm.isConnected.value ? hrm.deviceName.value : t('device.connectHRM') }}</button>
      </div>
    </AppDialog>
  </section>
</template>
