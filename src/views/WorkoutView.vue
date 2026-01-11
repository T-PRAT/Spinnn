<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import WorkoutChart from "../components/WorkoutChart.vue";
import { useAppState } from "../composables/useAppState";
import { useWorkoutSession } from "../composables/useWorkoutSession";
import { useBluetoothHRM } from "../composables/useBluetoothHRM";
import { useBluetoothTrainer } from "../composables/useBluetoothTrainer";
import { useMockDevices } from "../composables/useMockDevices";
import { useAudioSettings } from "../composables/useAudioSettings";

const router = useRouter();
const appState = useAppState();
const session = useWorkoutSession();
const hrm = useBluetoothHRM();
const trainer = useBluetoothTrainer();
const mockDevices = useMockDevices();
const audioSettings = useAudioSettings();

const showStopConfirmation = ref(false);
const showReconnectMenu = ref(false);
const currentIntervalIndex = ref(-1);
let dataInterval = null;

onMounted(() => {
  // Only try to load saved workout state if no workout is currently active
  // (This handles browser refresh scenarios)
  if (!session.isActive.value) {
    const wasLoaded = session.loadWorkoutState();

    if (wasLoaded) {
      // Restore app state from loaded session
      appState.setWorkout(session.workout.value);
    }
  }

  if (!appState.selectedWorkout.value || !session.isActive.value) {
    router.push({ name: "setup" });
    return;
  }

  // Start mock devices if in mock mode
  if (appState.mockModeActive.value && !mockDevices.isActive.value) {
    mockDevices.start(appState.selectedWorkout.value, appState.ftp.value);
  }

  startDataCollection();
});

onBeforeUnmount(() => {
  stopDataCollection();

  // Stop mock devices if they were started
  if (appState.mockModeActive.value && mockDevices.isActive.value) {
    mockDevices.stop();
  }
});

function startDataCollection() {
  dataInterval = setInterval(() => {
    if (!session.isPaused.value && session.isActive.value) {
      const data = appState.mockModeActive.value
        ? {
            heartRate: mockDevices.heartRate.value,
            power: mockDevices.power.value,
            cadence: mockDevices.cadence.value,
            speed: mockDevices.speed.value,
          }
        : {
            heartRate: hrm.heartRate.value,
            power: trainer.power.value,
            cadence: trainer.cadence.value,
            speed: trainer.speed.value,
          };
      session.recordDataPoint(data);
    }
  }, 1000); // Collecte chaque seconde pour précision
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

function confirmStop() {
  showStopConfirmation.value = true;
}

function cancelStop() {
  showStopConfirmation.value = false;
}

function proceedStop() {
  showStopConfirmation.value = false;
  stopWorkout();
}

function stopWorkout() {
  session.stop();
  stopDataCollection();
  appState.finishWorkout();
  router.push({ name: "summary" });
}

watch(
  () => session.isWorkoutComplete.value,
  (isComplete) => {
    if (isComplete && session.isActive.value) {
      stopWorkout();
    }
  }
);

const currentMetrics = computed(() => {
  if (session.dataPoints.value.length === 0) {
    return { power: 0, heartRate: 0, cadence: 0, speed: 0 };
  }
  return session.dataPoints.value[session.dataPoints.value.length - 1];
});

// Check if any device is disconnected (only in real mode, not mock)
const hasDisconnectedDevices = computed(() => {
  if (appState.mockModeActive.value) return false;
  return !hrm.isConnected.value || !trainer.isConnected.value;
});

const deviceStatus = computed(() => {
  return {
    hrm: {
      connected: hrm.isConnected.value || appState.mockModeActive.value,
      connecting: hrm.isConnecting.value,
    },
    trainer: {
      connected: trainer.isConnected.value || appState.mockModeActive.value,
      connecting: trainer.isConnecting.value,
    },
  };
});

async function reconnectHRM() {
  await hrm.connect();
}

async function reconnectTrainer() {
  await trainer.connect();
}

// Helper function to flatten intervals (including nested repeat blocks)
function flattenIntervals(intervals) {
  const flattened = [];

  function processIntervals(intervalList) {
    intervalList.forEach(interval => {
      if (interval.type === 'repeat' && interval.intervals) {
        // Process repeat block
        for (let i = 0; i < (interval.repeat || 1); i++) {
          processIntervals(interval.intervals);
        }
      } else {
        // Regular interval
        flattened.push(interval);
      }
    });
  }

  processIntervals(intervals);
  return flattened;
}

// Calculate current interval index based on elapsed time
function getCurrentIntervalIndex(elapsedSeconds, workout) {
  if (!workout || !workout.intervals) return -1;

  const flatIntervals = flattenIntervals(workout.intervals);
  let accumulatedTime = 0;

  for (let i = 0; i < flatIntervals.length; i++) {
    const interval = flatIntervals[i];
    const intervalDuration = interval.duration || 0;

    if (elapsedSeconds < accumulatedTime + intervalDuration) {
      return i;
    }

    accumulatedTime += intervalDuration;
  }

  return flatIntervals.length - 1; // Last interval
}

// Watch for interval changes and play sound
watch(
  () => session.elapsedSeconds.value,
  (newElapsedSeconds) => {
    if (!appState.selectedWorkout.value || session.isPaused.value) return;

    const newIntervalIndex = getCurrentIntervalIndex(newElapsedSeconds, appState.selectedWorkout.value);

    // Interval changed
    if (newIntervalIndex !== currentIntervalIndex.value && newIntervalIndex >= 0) {
      const previousIndex = currentIntervalIndex.value;
      currentIntervalIndex.value = newIntervalIndex;

      // Play sound on interval change (but not on the very first interval)
      if (previousIndex >= 0) {
        audioSettings.playIntervalSound();
      }
    }
  }
);
</script>

<template>
  <div class="max-w-screen-2xl mx-auto px-0 md:px-2 space-y-1 landscape:space-y-1 md:space-y-4">
    <!-- Status banner -->
    <div class="bg-card rounded-lg p-2 landscape:p-2 md:p-4 shadow border border-border">
      <div class="flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <h2 class="text-base landscape:text-lg md:text-xl font-bold text-foreground truncate">{{ appState.selectedWorkout.value?.name }}</h2>
          <p class="text-muted-foreground text-xs landscape:text-sm md:text-sm hidden landscape:block">{{ appState.selectedWorkout.value?.description }}</p>
        </div>
        <div class="flex items-center gap-2 landscape:gap-4 md:gap-4">
          <div class="text-center">
            <div class="text-xl landscape:text-2xl md:text-3xl font-bold text-primary">{{ session.formattedElapsedTime.value }}</div>
            <div class="text-[10px] landscape:text-xs md:text-xs text-muted-foreground">/ {{ session.formattedWorkoutDuration.value }}</div>
          </div>
          <div v-if="!session.isPaused.value" class="flex items-center gap-1 landscape:gap-2 md:gap-2">
            <div class="w-2 h-2 landscape:w-3 landscape:h-3 md:w-3 md:h-3 bg-chart-3 rounded-full animate-pulse"></div>
            <span class="text-chart-3 text-xs landscape:text-sm md:text-sm font-medium hidden landscape:inline">En cours</span>
          </div>
          <div v-else class="flex items-center gap-1 landscape:gap-2 md:gap-2">
            <div class="w-2 h-2 landscape:w-3 landscape:h-3 md:w-3 md:h-3 bg-chart-1 rounded-full"></div>
            <span class="text-chart-1 text-xs landscape:text-sm md:text-sm font-medium hidden landscape:inline">En pause</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Device connection status (only show in real mode) -->
    <div v-if="!appState.mockModeActive.value" class="flex items-center justify-center gap-2 landscape:gap-3 md:gap-6">
      <!-- HRM status -->
      <button
        @click="deviceStatus.hrm.connected || deviceStatus.hrm.connecting ? null : reconnectHRM()"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
          deviceStatus.hrm.connected
            ? 'bg-chart-3/10 border border-chart-3/30 cursor-default'
            : deviceStatus.hrm.connecting
            ? 'bg-yellow-500/10 border border-yellow-500/30 cursor-wait'
            : 'bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 cursor-pointer',
        ]"
        :disabled="deviceStatus.hrm.connected || deviceStatus.hrm.connecting"
      >
        <div
          :class="[
            'w-3 h-3 rounded-full',
            deviceStatus.hrm.connected ? 'bg-chart-3 animate-pulse' : deviceStatus.hrm.connecting ? 'bg-yellow-500 animate-pulse' : 'bg-destructive',
          ]"
        ></div>
        <span
          :class="[
            'text-sm font-medium',
            deviceStatus.hrm.connected ? 'text-chart-3' : deviceStatus.hrm.connecting ? 'text-yellow-600 dark:text-yellow-500' : 'text-destructive',
          ]"
        >
          {{ deviceStatus.hrm.connecting ? "HRM..." : deviceStatus.hrm.connected ? "HRM" : "HRM deconnecte" }}
        </span>
      </button>

      <!-- Trainer status -->
      <button
        @click="deviceStatus.trainer.connected || deviceStatus.trainer.connecting ? null : reconnectTrainer()"
        :class="[
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
          deviceStatus.trainer.connected
            ? 'bg-chart-3/10 border border-chart-3/30 cursor-default'
            : deviceStatus.trainer.connecting
            ? 'bg-yellow-500/10 border border-yellow-500/30 cursor-wait'
            : 'bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 cursor-pointer',
        ]"
        :disabled="deviceStatus.trainer.connected || deviceStatus.trainer.connecting"
      >
        <div
          :class="[
            'w-3 h-3 rounded-full',
            deviceStatus.trainer.connected
              ? 'bg-chart-3 animate-pulse'
              : deviceStatus.trainer.connecting
              ? 'bg-yellow-500 animate-pulse'
              : 'bg-destructive',
          ]"
        ></div>
        <span
          :class="[
            'text-sm font-medium',
            deviceStatus.trainer.connected
              ? 'text-chart-3'
              : deviceStatus.trainer.connecting
              ? 'text-yellow-600 dark:text-yellow-500'
              : 'text-destructive',
          ]"
        >
          {{ deviceStatus.trainer.connecting ? "Home-trainer..." : deviceStatus.trainer.connected ? "Home-trainer" : "Home-trainer deconnecte" }}
        </span>
      </button>
    </div>

    <!-- Large chart -->
    <div class="bg-card rounded-lg p-1 landscape:p-1 md:p-2 shadow border border-border min-h-[200px] landscape:min-h-[140px] md:min-h-[500px]">
      <WorkoutChart
        :data-points="session.dataPoints.value"
        :ftp="appState.ftp.value"
        :workout="appState.selectedWorkout.value"
        :elapsed-seconds="session.elapsedSeconds.value"
      />
    </div>

    <!-- Metrics: Cadence | PUISSANCE | FC | Vitesse -->
    <div class="grid grid-cols-4 landscape:grid-cols-4 lg:grid-cols-4 gap-1 landscape:gap-1.5 md:gap-4">
      <!-- Cadence (petite) -->
      <div class="bg-card rounded-lg p-1 landscape:p-1.5 md:p-3 shadow border border-border text-center">
        <div class="text-[9px] landscape:text-[10px] md:text-xs text-muted-foreground mb-0.5 md:mb-1">Cadence</div>
        <div class="text-sm landscape:text-base md:text-2xl font-semibold text-chart-2">{{ currentMetrics.cadence }}<span class="text-[8px] landscape:text-[10px] md:text-sm ml-0.5 md:ml-1">rpm</span></div>
      </div>

      <!-- PUISSANCE (GRANDE) -->
      <div class="bg-card rounded-lg p-1 landscape:p-1.5 md:p-6 shadow border border-border text-center">
        <div class="text-[9px] landscape:text-[10px] md:text-sm text-muted-foreground mb-0.5 md:mb-2">Puissance</div>
        <div class="text-lg landscape:text-xl md:text-6xl font-bold text-chart-1">{{ currentMetrics.power }}<span class="text-xs landscape:text-sm md:text-2xl ml-0.5 md:ml-1">W</span></div>
      </div>

      <!-- FC (GRANDE) -->
      <div class="bg-card rounded-lg p-1 landscape:p-1.5 md:p-6 shadow border border-border text-center">
        <div class="text-[9px] landscape:text-[10px] md:text-sm text-muted-foreground mb-0.5 md:mb-2">FC</div>
        <div class="text-lg landscape:text-xl md:text-6xl font-bold text-destructive">
          {{ currentMetrics.heartRate }}<span class="text-xs landscape:text-sm md:text-2xl ml-0.5 md:ml-1">bpm</span>
        </div>
      </div>

      <!-- Vitesse (petite) -->
      <div class="bg-card rounded-lg p-1 landscape:p-1.5 md:p-3 shadow border border-border text-center">
        <div class="text-[9px] landscape:text-[10px] md:text-xs text-muted-foreground mb-0.5 md:mb-1">Vitesse</div>
        <div class="text-sm landscape:text-base md:text-2xl font-semibold text-primary">
          {{ (currentMetrics.speed * 3.6).toFixed(1) }}<span class="text-[8px] landscape:text-[10px] md:text-sm ml-0.5 md:ml-1">km/h</span>
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="flex justify-center gap-2 landscape:gap-3 md:gap-4 pt-1 landscape:pt-1.5 md:pt-4">
      <button
        @click="togglePause"
        :class="[
          'px-4 landscape:px-6 md:px-8 py-2 landscape:py-2.5 md:py-3 rounded-lg text-sm landscape:text-base md:text-base font-semibold transition-all flex items-center gap-1 landscape:gap-2 md:gap-2',
          session.isPaused.value
            ? 'bg-chart-3 hover:bg-chart-3/90 text-primary-foreground'
            : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
        ]"
      >
        <svg v-if="session.isPaused.value" class="w-4 h-4 landscape:w-5 landscape:h-5 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clip-rule="evenodd"
          />
        </svg>
        <svg v-else class="w-4 h-4 landscape:w-5 landscape:h-5 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
        {{ session.isPaused.value ? "Reprendre" : "Pause" }}
      </button>

      <button
        @click="confirmStop"
        class="px-4 landscape:px-6 md:px-8 py-2 landscape:py-2.5 md:py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm landscape:text-base md:text-base font-semibold transition-all flex items-center gap-1 landscape:gap-2 md:gap-2"
      >
        <svg class="w-4 h-4 landscape:w-5 landscape:h-5 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
            clip-rule="evenodd"
          />
        </svg>
        Arreter
      </button>
    </div>

    <!-- Modal de confirmation d'arrêt -->
    <div v-if="showStopConfirmation" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="cancelStop">
      <div class="bg-card border border-border rounded-lg p-6 max-w-md mx-4 shadow-lg">
        <h3 class="text-lg font-semibold text-foreground mb-3">Arrêter l'entraînement ?</h3>
        <p class="text-muted-foreground mb-6">Êtes-vous sûr de vouloir arrêter la séance ? Vos données seront sauvegardées.</p>
        <div class="flex gap-3 justify-end">
          <button @click="cancelStop" class="px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            Annuler
          </button>
          <button @click="proceedStop" class="px-4 py-2 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
            Arrêter la séance
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
