<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useWorkoutSession } from '@/composables/useWorkoutSession';
import { useStrava } from '@/composables/useStrava';
import { useI18n } from '@/composables/useI18n';
import { workoutHistory } from '@/utils/workoutHistory';
import { formatDuration } from '@/utils/workoutHelpers';

const session = useWorkoutSession(), strava = useStrava(), router = useRouter(), route = useRoute(), { t } = useI18n();
const ready = ref(false), error = ref(''), busy = ref(false), activityUrl = ref('');
const stats = computed(() => session.stats.value);
const cards = computed(() => [
  [t('metrics.duration'), formatDuration(stats.value.durationSeconds)],
  [t('metrics.distance'), `${(stats.value.distanceMeters / 1000).toFixed(2)} km`],
  [t('metrics.avgPower'), `${stats.value.avgPower} W`],
  [t('metrics.avgHeartRate'), `${stats.value.avgHeartRate} bpm`],
  [t('metrics.normalizedPower'), `${stats.value.normalizedPower} W`],
  ['IF', stats.value.intensityFactor.toFixed(2)], ['TSS', stats.value.trainingStressScore],
  [t('review.work'), `${stats.value.workKj} kJ`],
]);
function download(blob, extension) {
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = `spinnn_${session.id.value}.${extension}`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function fitBlob() {
  const { createFitFile } = await import('@/utils/fitExporter');
  return new Blob([createFitFile(session.sessionData.value, stats.value)], { type: 'application/octet-stream' });
}
async function exportFit() {
  try { download(await fitBlob(), 'fit'); } catch (err) { error.value = err.message; }
}
function exportCsv() {
  const keys = ['recordedAt', 'activeTime', 'timestamp', 'duration', 'power', 'heartRate', 'cadence', 'speed', 'distance'];
  download(new Blob([[keys.join(','), ...session.dataPoints.value.map(p => keys.map(k => p[k] ?? '').join(','))].join('\n')], { type: 'text/csv' }), 'csv');
}
async function retrySave() {
  try { await session.stop(); } catch { error.value = t('review.storageError'); }
}
async function upload() {
  if (busy.value || activityUrl.value) return;
  busy.value = true; error.value = '';
  try {
    const result = await strava.uploadWorkout(await fitBlob(), {
      filename: `spinnn_${session.id.value}.fit`, name: session.workout.value.name,
      description: `Spinnn · ${stats.value.workKj} kJ · TSS ${stats.value.trainingStressScore}`, trainer: true,
    });
    activityUrl.value = `https://www.strava.com/activities/${result.activity_id}`;
    await workoutHistory.save({ ...session.sessionData.value, stravaActivityUrl: activityUrl.value });
  } catch (err) { error.value = err.message; }
  finally { busy.value = false; }
}
onMounted(async () => {
  try {
    if (session.isActive.value) { router.replace({ name: 'workout' }); return; }
    if (route.params.id && (session.id.value !== route.params.id || !session.workout.value)) {
      if (!await session.loadCompleted(route.params.id)) { router.replace({ name: 'history' }); return; }
    }
    if (!session.workout.value) { router.replace({ name: 'history' }); return; }
    ready.value = true;
    const saved = await workoutHistory.get(session.id.value);
    activityUrl.value = saved?.stravaActivityUrl || '';
    await strava.checkStatus();
    if (strava.isConnected.value && strava.autoUploadEnabled.value && !activityUrl.value && !session.saveError.value) await upload();
  } catch { error.value = t('review.historyError'); }
});
</script>
<template>
  <section v-if="ready" class="max-w-4xl mx-auto space-y-5">
    <header><h1 class="text-3xl font-bold">{{ t('workout.summaryTitle') }}</h1><p class="text-muted-foreground mt-2">{{ session.workout.value.name }}</p></header>
    <div v-if="session.saveError.value" class="p-4 border border-destructive rounded-lg"><p role="alert">{{ t('review.storageError') }}</p><button class="touch-button" @click="retrySave">{{ t('review.saveRetry') }}</button></div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3"><div v-for="[label, value] in cards" :key="label" class="p-4 bg-card border border-border rounded-lg"><p class="text-sm text-muted-foreground">{{ label }}</p><p class="text-2xl font-bold mt-2">{{ value }}</p></div></div>
    <p class="text-sm text-muted-foreground">{{ t('review.estimate') }}</p>
    <div class="bg-card border border-border rounded-lg p-4 flex flex-wrap gap-3">
      <button class="touch-button bg-primary text-primary-foreground" @click="exportFit">{{ t('workout.summaryDownloadFIT') }}</button>
      <button class="touch-button bg-secondary text-secondary-foreground" @click="exportCsv">{{ t('workout.summaryDownloadCSV') }}</button>
      <a v-if="activityUrl" :href="activityUrl" target="_blank" rel="noopener noreferrer" class="touch-button text-primary">{{ t('workout.strava.viewActivity') }}</a>
      <button v-else-if="strava.isConnected.value" :disabled="busy" class="touch-button border border-primary" @click="upload">{{ t(busy ? 'workout.strava.uploading' : 'settings.strava.description') }}</button>
      <button v-else class="touch-button border border-border" @click="router.push({ name: 'settings', hash: '#integrations' })">{{ t('settings.strava.connectButton') }}</button>
    </div>
    <p v-if="error" role="alert" class="text-destructive">{{ error }}</p>
    <div class="flex gap-3"><button class="touch-button bg-secondary" @click="router.push({ name: 'history' })">{{ t('navigation.history') }}</button><button class="touch-button" @click="router.push({ name: 'setup' })">{{ t('navigation.home') }}</button></div>
  </section>
</template>
