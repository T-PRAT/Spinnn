<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAppState } from '../composables/useAppState';
import { useWorkoutSession } from '../composables/useWorkoutSession';
import { formatDuration } from '../data/sampleWorkouts';

const router = useRouter();
const appState = useAppState();
const session = useWorkoutSession();

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

  return {
    duration: formatDuration(session.elapsedSeconds.value),
    avgPower: validPower.length > 0 ? Math.round(totalPower / validPower.length) : 0,
    maxPower: Math.max(...data.map(d => d.power || 0)),
    avgHeartRate: validHR.length > 0 ? Math.round(totalHR / validHR.length) : 0,
    maxHeartRate: Math.max(...data.map(d => d.heartRate || 0)),
    avgCadence: validCadence.length > 0 ? Math.round(totalCadence / validCadence.length) : 0,
    distance: ((lastPoint?.distance || 0) / 1000).toFixed(2),
    dataPoints: data.length,
    normalizedPower: calculateNormalizedPower(data),
    intensityFactor: calculateIntensityFactor(data, appState.ftp.value),
    tss: calculateTSS(data, appState.ftp.value, session.elapsedSeconds.value)
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
  alert('Export FIT bientot disponible !');
}

function startNewWorkout() {
  session.reset();
  appState.restartFromBeginning();
  router.push({ name: 'setup' });
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-foreground tracking-tight">Entrainement termine !</h2>
      <p class="text-muted-foreground mt-2">{{ appState.selectedWorkout.value?.name }}</p>
    </div>

    <div v-if="stats" class="space-y-6">
      <!-- Main stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-card rounded-lg p-6 shadow border border-border text-center">
          <div class="text-sm text-muted-foreground mb-2">Duree</div>
          <div class="text-3xl font-bold text-foreground">{{ stats.duration }}</div>
        </div>
        <div class="bg-card rounded-lg p-6 shadow border border-border text-center">
          <div class="text-sm text-muted-foreground mb-2">Distance</div>
          <div class="text-3xl font-bold text-primary">{{ stats.distance }}<span class="text-sm">km</span></div>
        </div>
        <div class="bg-card rounded-lg p-6 shadow border border-border text-center">
          <div class="text-sm text-muted-foreground mb-2">Puissance moy.</div>
          <div class="text-3xl font-bold text-chart-1">{{ stats.avgPower }}<span class="text-sm">W</span></div>
        </div>
        <div class="bg-card rounded-lg p-6 shadow border border-border text-center">
          <div class="text-sm text-muted-foreground mb-2">FC moyenne</div>
          <div class="text-3xl font-bold text-destructive">{{ stats.avgHeartRate }}<span class="text-sm">bpm</span></div>
        </div>
      </div>

      <!-- Detailed stats -->
      <div class="bg-card rounded-lg p-6 shadow border border-border">
        <h3 class="text-lg font-semibold text-foreground mb-4">Statistiques detaillees</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <div class="text-sm text-muted-foreground">Puissance max</div>
            <div class="text-xl font-semibold text-foreground">{{ stats.maxPower }}W</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">FC max</div>
            <div class="text-xl font-semibold text-foreground">{{ stats.maxHeartRate }} bpm</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">Cadence moy.</div>
            <div class="text-xl font-semibold text-foreground">{{ stats.avgCadence }} rpm</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">Puissance normalisee</div>
            <div class="text-xl font-semibold text-foreground">{{ stats.normalizedPower }}W</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">Facteur d'intensite</div>
            <div class="text-xl font-semibold text-foreground">{{ stats.intensityFactor }}</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">TSS</div>
            <div class="text-xl font-semibold text-foreground">{{ stats.tss }}</div>
          </div>
        </div>
      </div>

      <!-- Export buttons -->
      <div class="bg-card rounded-lg p-6 shadow border border-border">
        <h3 class="text-lg font-semibold text-foreground mb-4">Exporter les donnees</h3>
        <div class="flex gap-4">
          <button
            @click="downloadCSV"
            class="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Telecharger CSV
          </button>
          <button
            @click="downloadFIT"
            class="flex-1 px-6 py-3 bg-chart-3 hover:bg-chart-3/90 text-primary-foreground rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Telecharger FIT
          </button>
        </div>
      </div>

      <!-- Restart button -->
      <div class="flex justify-center pt-4">
        <button
          @click="startNewWorkout"
          class="px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Nouvel entrainement
        </button>
      </div>
    </div>
  </div>
</template>
