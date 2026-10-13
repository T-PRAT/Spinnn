<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import WorkoutSelector from '@/components/workout/WorkoutSelector.vue';
import DeviceConnector from '@/components/device/DeviceConnector.vue';
import WorkoutPreviewChart from '@/components/workout/WorkoutPreviewChart.vue';
import IntervalsTodayWorkout from '@/components/layout/IntervalsTodayWorkout.vue';
import { useAppState } from '@/composables/useAppState';
import { useWorkoutSession } from '@/composables/useWorkoutSession';
import { useI18n } from '@/composables/useI18n';
import { useFreeRide } from '@/composables/useFreeRide';
import { parseZwoFile, MAX_ZWO_BYTES } from '@/utils/zwoParser';

const router = useRouter(), app = useAppState(), session = useWorkoutSession(), free = useFreeRide(), { t } = useI18n();
const deviceConnector = ref(null), ready = ref(false), importError = ref(false);
const canStart = computed(() => ready.value && app.selectedWorkout.value && !session.isActive.value);
function statusChanged(status) {
  ready.value = status.isConnected || status.isMockMode;
  app.setDevicesConnected(status.isConnected); app.setMockModeActive(status.isMockMode);
}
async function importFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  importError.value = false;
  try {
    if (file.size > MAX_ZWO_BYTES) throw new Error('oversized');
    app.setWorkout(parseZwoFile(new DOMParser().parseFromString(await file.text(), 'text/xml')));
  } catch { importError.value = true; }
  event.target.value = '';
}
function start(isFree = false) {
  if (!ready.value || session.isActive.value) return;
  if (isFree) { app.setWorkout(free.createFreeRideWorkout()); free.getTargetPower(); }
  session.start(app.selectedWorkout.value, app.ftp.value, app.mockModeActive.value ? 'simulation' : 'bluetooth');
  app.startWorkout(); router.push({ name: 'workout' });
}
</script>
<template>
  <div class="max-w-6xl mx-auto space-y-5">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div><h1 class="text-2xl font-bold">{{ t('review.welcome') }}</h1><p class="text-muted-foreground text-sm mt-1">{{ t('review.setupHint') }}</p></div>
      <button data-testid="simulation" class="touch-button border border-primary text-primary" :aria-pressed="app.mockModeActive.value" @click="deviceConnector && (app.mockModeActive.value ? deviceConnector.disableMockMode() : deviceConnector.enableMockMode())">{{ t(app.mockModeActive.value ? 'review.demoActive' : 'review.demo') }}</button>
    </header>
    <div v-if="session.isActive.value" class="bg-primary/10 border border-primary rounded-lg p-4 flex flex-wrap gap-3 items-center">
      <p class="flex-1">{{ t('workout.inProgress') }} · {{ session.workout.value?.name }} · {{ session.formattedElapsedTime.value }}</p>
      <button class="touch-button bg-primary text-primary-foreground" @click="router.push({ name: 'workout' })">{{ t('workout.resumeButton') }}</button>
    </div>
    <div v-else-if="session.saveError.value && session.workout.value" class="p-4 border border-destructive rounded-lg">
      <p role="alert">{{ t('review.storageError') }}</p><button class="touch-button" @click="router.push({ name: 'summary', params: { id: session.id.value } })">{{ t('review.open') }}</button>
    </div>
    <section aria-labelledby="choose-workout" class="bg-card border border-border rounded-lg p-4 md:p-5">
      <h2 id="choose-workout" class="font-bold text-lg mb-4">{{ t('review.choose') }}</h2>
      <div class="grid md:grid-cols-2 gap-5">
        <WorkoutSelector @workout-selected="app.setWorkout" />
        <div class="space-y-5">
          <div><label for="zwo-file" class="font-semibold block mb-2">{{ t('workout.importFile') }} (.zwo)</label><input id="zwo-file" type="file" accept=".zwo" class="max-w-full text-sm" @change="importFile" /><p v-if="importError" role="alert" class="text-destructive text-sm mt-2">{{ t('review.importError') }}</p></div>
          <div class="border-t border-border pt-4"><h3 class="font-semibold mb-2">Intervals.icu</h3><IntervalsTodayWorkout @workout-selected="app.setWorkout" /></div>
          <WorkoutPreviewChart v-if="app.selectedWorkout.value" :ftp="app.ftp.value" :workout="app.selectedWorkout.value" :tall="true" />
        </div>
      </div>
    </section>
    <section aria-labelledby="connect-devices" class="bg-card border border-border rounded-lg p-4 md:p-5">
      <h2 id="connect-devices" class="font-bold text-lg mb-4">{{ t('review.devices') }}</h2>
      <DeviceConnector ref="deviceConnector" @device-status-change="statusChanged" />
    </section>
    <section class="setup-start bg-card border border-border rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
      <div><h2 class="font-bold">{{ t('review.start') }}</h2><p class="text-sm text-muted-foreground">FTP {{ app.ftp.value }} W · {{ app.selectedWorkout.value?.name || t('common.messages.selectWorkout') }}</p></div>
      <div class="flex flex-wrap gap-2"><button data-testid="start-workout" class="touch-button bg-primary text-primary-foreground" :disabled="!canStart" @click="start()">{{ t('workout.startButton') }}</button><button data-testid="start-free" class="touch-button bg-secondary text-secondary-foreground" :disabled="!ready || session.isActive.value" @click="start(true)">{{ t('review.free') }}</button></div>
    </section>
  </div>
</template>
