<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAppState } from '../composables/useAppState';
import { useWorkoutSession } from '../composables/useWorkoutSession';
import { useStrava } from '../composables/useStrava';
import { useI18n } from '@/composables/useI18n';
import { formatDuration } from '../data/sampleWorkouts';
import { createFitFile } from '../utils/fitExporter';

const router = useRouter();
const appState = useAppState();
const session = useWorkoutSession();
const strava = useStrava();
const { t } = useI18n();

// Strava upload state
const uploading = ref(false);
const uploadSuccess = ref(false);
const uploadError = ref('');
const activityUrl = ref('');
const uploadStatus = ref('');

onMounted(() => {
  if (session.dataPoints.value.length === 0) {
    router.push({ name: 'setup' });
  }
});

const stats = computed(() => {
  const data = session.dataPoints.value;
  if (data.length === 0) return null;

  const validPower = data.filter(d => d.power > 0);
  const validHR = data.filter(d => d.heartRate > 0);
  const validCadence = data.filter(d => d.cadence > 0);

  const totalPower = validPower.reduce((sum, d) => sum + d.power, 0);
  const totalHR = validHR.reduce((sum, d) => sum + d.heartRate, 0);
  const totalCadence = validCadence.reduce((sum, d) => sum + d.cadence, 0);
  const lastPoint = data[data.length - 1];

  // Use active elapsed seconds (actual training time, excluding pauses)
  const activeDuration = session.activeElapsedSeconds.value || data.length;

  return {
    duration: formatDuration(activeDuration),
    avgPower: validPower.length > 0 ? Math.round(totalPower / validPower.length) : 0,
    maxPower: Math.max(...data.map(d => d.power || 0)),
    avgHeartRate: validHR.length > 0 ? Math.round(totalHR / validHR.length) : 0,
    maxHeartRate: Math.max(...data.map(d => d.heartRate || 0)),
    avgCadence: validCadence.length > 0 ? Math.round(totalCadence / validCadence.length) : 0,
    distance: ((lastPoint?.distance || 0) / 1000).toFixed(2),
    dataPoints: data.length,
    normalizedPower: calculateNormalizedPower(data),
    intensityFactor: calculateIntensityFactor(data, appState.ftp.value),
    tss: calculateTSS(data, appState.ftp.value, activeDuration)
  };
});

function calculateNormalizedPower(data) {
  if (data.length < 30) return 0;
  const powers = data.map(d => d.power || 0);
  let sum = 0;
  let count = 0;
  for (let i = 29; i < powers.length; i++) {
    const avg30s = powers.slice(i - 29, i + 1).reduce((a, b) => a + b, 0) / 30;
    sum += Math.pow(avg30s, 4);
    count++;
  }
  return count > 0 ? Math.round(Math.pow(sum / count, 0.25)) : 0;
}

function calculateIntensityFactor(data, ftp) {
  const np = calculateNormalizedPower(data);
  return ftp > 0 ? (np / ftp).toFixed(2) : '0.00';
}

function calculateTSS(data, ftp, durationSeconds) {
  const np = calculateNormalizedPower(data);
  if (ftp === 0 || durationSeconds === 0) return 0;
  const intensity = np / ftp;
  const hours = durationSeconds / 3600;
  return Math.round((hours * np * intensity / ftp) * 100);
}

function downloadCSV() {
  const data = session.dataPoints.value;
  const headers = ['timestamp', 'power', 'heartRate', 'cadence', 'speed', 'distance'];
  const csvContent = [
    headers.join(','),
    ...data.map(d => headers.map(h => d[h] || 0).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  const workoutName = appState.selectedWorkout.value?.name?.replace(/\s+/g, '_') || 'workout';
  a.download = `spinnn_${date}_${workoutName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadFIT() {
  const sessionData = session.sessionData.value;
  const lastPoint = sessionData.dataPoints[sessionData.dataPoints.length - 1];

  // Use active elapsed seconds (actual training time, excluding pauses)
  const activeDuration = session.activeElapsedSeconds.value || session.dataPoints.value.length;

  const fitStats = {
    durationSeconds: activeDuration,
    distanceMeters: lastPoint?.distance || 0,
    avgPower: stats.value.avgPower,
    maxPower: stats.value.maxPower,
    avgHeartRate: stats.value.avgHeartRate,
    maxHeartRate: stats.value.maxHeartRate,
    avgCadence: stats.value.avgCadence,
    normalizedPower: stats.value.normalizedPower,
  };

  const fitData = createFitFile(sessionData, fitStats);

  const blob = new Blob([fitData], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const date = new Date().toISOString().split('T')[0];
  const workoutName = appState.selectedWorkout.value?.name?.replace(/\s+/g, '_') || 'workout';
  a.download = `spinnn_${date}_${workoutName}.fit`;
  a.click();
  URL.revokeObjectURL(url);
}

async function uploadToStrava() {
  if (!strava.isConnected.value) {
    router.push({ name: 'settings', hash: '#integrations' });
    return;
  }

  uploadError.value = '';
  uploadSuccess.value = false;
  uploadStatus.value = '';
  uploading.value = true;

  try {
    const sessionData = session.sessionData.value;
    const lastPoint = sessionData.dataPoints[sessionData.dataPoints.length - 1];

    // Use active elapsed seconds (actual training time, excluding pauses)
    const activeDuration = session.activeElapsedSeconds.value || session.dataPoints.value.length;

    const fitStats = {
      durationSeconds: activeDuration,
      distanceMeters: lastPoint?.distance || 0,
      avgPower: stats.value.avgPower,
      maxPower: stats.value.maxPower,
      avgHeartRate: stats.value.avgHeartRate,
      maxHeartRate: stats.value.maxHeartRate,
      avgCadence: stats.value.avgCadence,
      normalizedPower: stats.value.normalizedPower,
    };

    const fitData = createFitFile(sessionData, fitStats);
    const date = new Date().toISOString().split('T')[0];
    const workoutName = appState.selectedWorkout.value?.name || 'Spinnn Workout';

    // Create Blob from FIT data
    const fitBlob = new Blob([fitData], { type: 'application/octet-stream' });

    // Progress callback to show status during polling
    const onProgress = (status) => {
      uploadStatus.value = status.status || 'Processing...';
    };

    const result = await strava.uploadWorkout(fitBlob, {
      filename: `spinnn_${date}_${workoutName.replace(/\s+/g, '_')}.fit`,
      name: workoutName,
      description: `Workout from Spinnn - Duration: ${stats.value.duration}, NP: ${stats.value.normalizedPower}W, TSS: ${stats.value.tss}`,
      sportType: 'VirtualRide', // Indoor trainer activity type
      trainer: true,
      commute: false,
      onProgress
    });

    // Activity is now ready with the final activity_id
    activityUrl.value = result.activity_id ? `https://www.strava.com/activities/${result.activity_id}` : null;
    uploadSuccess.value = true;
    uploadStatus.value = '';
  } catch (err) {
    uploadError.value = err.message || t('workout.strava.error') || 'Failed to upload to Strava';
    uploadStatus.value = '';
  } finally {
    uploading.value = false;
  }
}

async function tryAutoUpload() {
  if (strava.autoUploadEnabled.value && strava.isConnected.value) {
    await uploadToStrava();
  }
}

// Auto-upload if enabled
onMounted(async () => {
  if (session.dataPoints.value.length === 0) {
    router.push({ name: 'setup' });
    return;
  }

  // Wait a bit before auto-uploading so the user sees the summary first
  setTimeout(() => {
    tryAutoUpload();
  }, 1000);
});

function startNewWorkout() {
  session.reset();
  appState.restartFromBeginning();
  router.push({ name: 'setup' });
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-3 md:space-y-6">
    <div class="text-center mb-4 md:mb-8">
      <h2 class="text-3xl font-bold text-foreground tracking-tight">{{ t('workout.summaryTitle') }}</h2>
      <p class="text-muted-foreground mt-2">{{ appState.selectedWorkout.value?.name }}</p>
    </div>

    <div v-if="stats" class="space-y-3 md:space-y-6">
      <!-- Main stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <div class="bg-card rounded-lg p-3 md:p-6 shadow border border-border text-center">
          <div class="text-sm text-muted-foreground mb-2">{{ t('workout.summaryStats.duration') }}</div>
          <div class="text-3xl font-bold text-foreground">{{ stats.duration }}</div>
        </div>
        <div class="bg-card rounded-lg p-3 md:p-6 shadow border border-border text-center">
          <div class="text-sm text-muted-foreground mb-2">{{ t('workout.summaryStats.distance') }}</div>
          <div class="text-3xl font-bold text-primary">{{ stats.distance }}<span class="text-sm">km</span></div>
        </div>
        <div class="bg-card rounded-lg p-3 md:p-6 shadow border border-border text-center">
          <div class="text-sm text-muted-foreground mb-2">{{ t('workout.summaryStats.avgPower') }}</div>
          <div class="text-3xl font-bold text-chart-1">{{ stats.avgPower }}<span class="text-sm">W</span></div>
        </div>
        <div class="bg-card rounded-lg p-3 md:p-6 shadow border border-border text-center">
          <div class="text-sm text-muted-foreground mb-2">{{ t('workout.summaryStats.avgHeartRate') }}</div>
          <div class="text-3xl font-bold text-destructive">{{ stats.avgHeartRate }}<span class="text-sm">bpm</span></div>
        </div>
      </div>

      <!-- Detailed stats -->
      <div class="bg-card rounded-lg p-4 md:p-6 shadow border border-border">
        <h3 class="text-lg font-semibold text-foreground mb-3 md:mb-4">{{ t('workout.summaryDetailedStats') }}</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          <div>
            <div class="text-sm text-muted-foreground">{{ t('workout.summaryStats.maxPower') }}</div>
            <div class="text-xl font-semibold text-foreground">{{ stats.maxPower }}W</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">{{ t('workout.summaryStats.maxHeartRate') }}</div>
            <div class="text-xl font-semibold text-foreground">{{ stats.maxHeartRate }} bpm</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">{{ t('workout.summaryStats.avgCadence') }}</div>
            <div class="text-xl font-semibold text-foreground">{{ stats.avgCadence }} rpm</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">{{ t('workout.summaryStats.normalizedPower') }}</div>
            <div class="text-xl font-semibold text-foreground">{{ stats.normalizedPower }}W</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">{{ t('workout.summaryStats.intensityFactor') }}</div>
            <div class="text-xl font-semibold text-foreground">{{ stats.intensityFactor }}</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">{{ t('workout.summaryStats.tss') }}</div>
            <div class="text-xl font-semibold text-foreground">{{ stats.tss }}</div>
          </div>
        </div>
      </div>

      <!-- Export buttons -->
      <div class="bg-card rounded-lg p-4 md:p-6 shadow border border-border">
        <h3 class="text-lg font-semibold text-foreground mb-3 md:mb-4">{{ t('workout.summaryExportData') }}</h3>

        <!-- Download buttons -->
        <div class="flex flex-col md:flex-row gap-3 md:gap-4 mb-4">
          <button
            @click="downloadCSV"
            class="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {{ t('workout.summaryDownloadCSV') }}
          </button>
          <button
            @click="downloadFIT"
            class="flex-1 px-6 py-3 bg-chart-3 hover:bg-chart-3/90 text-primary-foreground rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {{ t('workout.summaryDownloadFIT') }}
          </button>
        </div>

        <!-- Strava upload section -->
        <div class="border-t border-border pt-4">
          <div class="flex flex-col md:flex-row gap-3">
            <!-- Not connected state -->
            <button
              v-if="!strava.isConnected.value"
              @click="router.push({ name: 'settings', hash: '#integrations' })"
              class="w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 hover:opacity-90"
              style="background-color: #FC4C02"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
              </svg>
              {{ t('workout.strava.connect') || 'Connect Strava' }}
            </button>

            <!-- Upload button -->
            <button
              v-else
              @click="uploadToStrava"
              :disabled="uploading || uploadSuccess"
              class="w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style="background-color: #FC4C02"
            >
              <svg v-if="uploading" class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else-if="uploadSuccess" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
              </svg>
              <span v-if="uploading">{{ uploadStatus || (t('workout.strava.uploading') || 'Uploading...') }}</span>
              <span v-else-if="uploadSuccess">{{ t('workout.strava.success') || 'Uploaded!' }}</span>
              <span v-else>{{ t('workout.strava.upload') || 'Upload to Strava' }}</span>
            </button>
          </div>

          <!-- Upload status -->
          <div v-if="uploadError" class="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p class="text-sm text-destructive">{{ uploadError }}</p>
          </div>
          <div v-if="uploadSuccess && activityUrl" class="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p class="text-sm text-green-900 dark:text-green-100 mb-2">{{ t('workout.strava.success') || 'Successfully uploaded to Strava!' }}</p>
            <a
              :href="activityUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              {{ t('workout.strava.viewActivity') || 'View activity on Strava' }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Restart button -->
      <div class="flex justify-center pt-2 md:pt-4">
        <button
          @click="startNewWorkout"
          class="px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ t('workout.summaryNewWorkout') }}
        </button>
      </div>
    </div>
  </div>
</template>
