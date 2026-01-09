<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import WorkoutChart from '../components/WorkoutChart.vue';
import { useAppState } from '../composables/useAppState';
import { useWorkoutSession } from '../composables/useWorkoutSession';
import { useBluetoothHRM } from '../composables/useBluetoothHRM';
import { useBluetoothTrainer } from '../composables/useBluetoothTrainer';
import { useMockDevices } from '../composables/useMockDevices';

const router = useRouter();
const appState = useAppState();
const session = useWorkoutSession();
const hrm = useBluetoothHRM();
const trainer = useBluetoothTrainer();
const mockDevices = useMockDevices();

let dataInterval = null;

onMounted(() => {
  if (!appState.selectedWorkout.value || !session.isActive.value) {
    router.push({ name: 'setup' });
    return;
  }
  startDataCollection();
});

onBeforeUnmount(() => {
  stopDataCollection();
});

function startDataCollection() {
  dataInterval = setInterval(() => {
    if (!session.isPaused.value && session.isActive.value) {
      const data = appState.mockModeActive.value
        ? {
            heartRate: mockDevices.heartRate.value,
            power: mockDevices.power.value,
            cadence: mockDevices.cadence.value,
            speed: mockDevices.speed.value
          }
        : {
            heartRate: hrm.heartRate.value,
            power: trainer.power.value,
            cadence: trainer.cadence.value,
            speed: trainer.speed.value
          };
      session.recordDataPoint(data);
    }
  }, 1000);
}

function stopDataCollection() {
  if (dataInterval) {
    clearInterval(dataInterval);
    dataInterval = null;
  }
}

function togglePause() {
  if (session.isPaused.value) {
    session.resume();
  } else {
    session.pause();
  }
}

function stopWorkout() {
  session.stop();
  stopDataCollection();
  appState.finishWorkout();
  router.push({ name: 'summary' });
}

watch(() => session.isWorkoutComplete.value, (isComplete) => {
  if (isComplete && session.isActive.value) {
    stopWorkout();
  }
});

const currentMetrics = computed(() => {
  if (session.dataPoints.value.length === 0) {
    return { power: 0, heartRate: 0, cadence: 0, speed: 0 };
  }
  return session.dataPoints.value[session.dataPoints.value.length - 1];
});
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-4">
    <!-- Status banner -->
    <div class="bg-card rounded-lg p-4 shadow border border-border">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-foreground">{{ appState.selectedWorkout.value?.name }}</h2>
          <p class="text-muted-foreground text-sm">{{ appState.selectedWorkout.value?.description }}</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-primary">{{ session.formattedElapsedTime.value }}</div>
            <div class="text-xs text-muted-foreground">/ {{ session.formattedWorkoutDuration.value }}</div>
          </div>
          <div v-if="!session.isPaused.value" class="flex items-center gap-2">
            <div class="w-3 h-3 bg-chart-3 rounded-full animate-pulse"></div>
            <span class="text-chart-3 text-sm font-medium">En cours</span>
          </div>
          <div v-else class="flex items-center gap-2">
            <div class="w-3 h-3 bg-chart-1 rounded-full"></div>
            <span class="text-chart-1 text-sm font-medium">En pause</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Large chart -->
    <div class="bg-card rounded-lg p-6 shadow border border-border">
      <WorkoutChart
        :data-points="session.dataPoints.value"
        :ftp="appState.ftp.value"
        :workout="appState.selectedWorkout.value"
        :elapsed-seconds="session.elapsedSeconds.value"
      />
    </div>

    <!-- Compact metrics -->
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-card rounded-lg p-4 shadow border border-border text-center">
        <div class="text-sm text-muted-foreground mb-1">Puissance</div>
        <div class="text-3xl font-bold text-chart-1">{{ currentMetrics.power }}<span class="text-sm">W</span></div>
      </div>
      <div class="bg-card rounded-lg p-4 shadow border border-border text-center">
        <div class="text-sm text-muted-foreground mb-1">FC</div>
        <div class="text-3xl font-bold text-destructive">{{ currentMetrics.heartRate }}<span class="text-sm">bpm</span></div>
      </div>
      <div class="bg-card rounded-lg p-4 shadow border border-border text-center">
        <div class="text-sm text-muted-foreground mb-1">Cadence</div>
        <div class="text-3xl font-bold text-chart-2">{{ currentMetrics.cadence }}<span class="text-sm">rpm</span></div>
      </div>
      <div class="bg-card rounded-lg p-4 shadow border border-border text-center">
        <div class="text-sm text-muted-foreground mb-1">Vitesse</div>
        <div class="text-3xl font-bold text-primary">{{ (currentMetrics.speed * 3.6).toFixed(1) }}<span class="text-sm">km/h</span></div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex justify-center gap-4 pt-4">
      <button
        @click="togglePause"
        :class="[
          'px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2',
          session.isPaused.value
            ? 'bg-chart-3 hover:bg-chart-3/90 text-primary-foreground'
            : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
        ]"
      >
        <svg v-if="session.isPaused.value" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        {{ session.isPaused.value ? 'Reprendre' : 'Pause' }}
      </button>

      <button
        @click="stopWorkout"
        class="px-8 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-semibold transition-all flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
        </svg>
        Arreter
      </button>
    </div>
  </div>
</template>
