<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import WorkoutSelector from "../components/workout/WorkoutSelector.vue";
import DeviceConnector from "../components/device/DeviceConnector.vue";
import WorkoutPreviewChart from "../components/workout/WorkoutPreviewChart.vue";
import IntervalsTodayWorkout from "../components/layout/IntervalsTodayWorkout.vue";
import { useAppState } from "../composables/useAppState";
import { useWorkoutSession } from "../composables/useWorkoutSession";
import { useIntervalsIcu } from "../composables/useIntervalsIcu";

const router = useRouter();
const appState = useAppState();
const session = useWorkoutSession();
const intervals = useIntervalsIcu();

const isDeviceReady = ref(false);
const fileInput = ref(null);
const hasPendingWorkout = ref(false);
const deviceConnector = ref(null);
const intervalsWorkoutRef = ref(null);

// Check for existing workout on mount
onMounted(() => {
  hasPendingWorkout.value = session.isActive.value;
});

function handleWorkoutSelected(workout) {
  appState.setWorkout(workout);
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, "text/xml");

      const workout = parseZwoFile(xmlDoc);
      appState.setWorkout(workout);
    } catch (error) {
      alert("Failed to parse workout file. Please ensure it is a valid .zwo file.");
      console.error(error);
    }
  };
  reader.readAsText(file);
}

function parseZwoFile(xmlDoc) {
  const workoutName = xmlDoc.querySelector("workout")?.getAttribute("name") || "Custom Workout";
  const intervals = [];
  let totalDuration = 0;

  const elements = xmlDoc.querySelectorAll("SteadyState, Ramp, IntervalsT, FreeRide, Cooldown, Warmup");

  elements.forEach((element) => {
    const duration = parseInt(element.getAttribute("Duration") || 0);
    totalDuration += duration;

    if (element.tagName === "SteadyState") {
      intervals.push({
        type: "steady",
        duration: duration,
        power: parseFloat(element.getAttribute("Power") || 0.5),
      });
    } else if (element.tagName === "Ramp") {
      intervals.push({
        type: "ramp",
        duration: duration,
        powerStart: parseFloat(element.getAttribute("PowerLow") || 0.5),
        powerEnd: parseFloat(element.getAttribute("PowerHigh") || 0.7),
      });
    } else if (element.tagName === "Warmup") {
      intervals.push({
        type: "warmup",
        duration: duration,
        powerStart: parseFloat(element.getAttribute("PowerLow") || 0.5),
        powerEnd: parseFloat(element.getAttribute("PowerHigh") || 0.7),
      });
    } else if (element.tagName === "Cooldown") {
      intervals.push({
        type: "cooldown",
        duration: duration,
        powerStart: parseFloat(element.getAttribute("PowerLow") || 0.7),
        powerEnd: parseFloat(element.getAttribute("PowerHigh") || 0.5),
      });
    }
  });

  return {
    id: "custom",
    name: workoutName,
    description: "Uploaded workout file",
    duration: totalDuration,
    difficulty: "Custom",
    intervals: intervals,
  };
}

function handleDeviceStatusChange(status) {
  isDeviceReady.value = status.isConnected || status.isMockMode;
  appState.setDevicesConnected(status.isConnected);
  appState.setMockModeActive(status.isMockMode);
}

function handleDataUpdate() {}

const canStart = computed(() => {
  // Can start if devices are ready AND (new workout selected OR pending workout exists)
  const hasWorkout = appState.selectedWorkout.value !== null || hasPendingWorkout.value;
  return hasWorkout && isDeviceReady.value;
});

const canResume = computed(() => {
  // Can resume if there's a pending workout AND devices are ready
  return hasPendingWorkout.value && isDeviceReady.value;
});

function startWorkout() {
  // If there's a pending workout, we can resume even if devices aren't "ready" yet
  // because the workout was already in progress
  if (hasPendingWorkout.value) {
    // Restore the workout in appState
    appState.setWorkout(session.workout.value);
    appState.startWorkout();
    router.push({ name: "workout" });
    return;
  }

  // For new workouts, require devices to be ready
  if (!isDeviceReady.value) return;

  // Clear any saved workout state before starting a new workout
  session.clearWorkoutState();

  // Start new workout
  session.start(appState.selectedWorkout.value, appState.ftp.value);
  appState.startWorkout();
  router.push({ name: "workout" });
}

function dismissPendingWorkout() {
  session.reset();
  hasPendingWorkout.value = false;
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-3 md:space-y-6">
    <!-- Pending workout banner -->
    <div v-if="hasPendingWorkout" class="bg-primary/10 border border-primary/30 rounded-lg p-3 md:p-4 space-y-2 md:space-y-3">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h3 class="text-lg font-semibold text-primary mb-1">Entraînement en cours</h3>
          <p class="text-sm text-foreground mb-2">
            <strong>{{ session.workout.value?.name }}</strong>
          </p>
          <p class="text-sm text-muted-foreground">
            Progression: {{ session.formattedElapsedTime.value }} / {{ session.formattedWorkoutDuration.value }} •
            {{ Math.round((session.elapsedSeconds.value / session.workout.value.duration) * 100) }}% terminé
          </p>
        </div>
        <button
          @click="dismissPendingWorkout"
          class="text-muted-foreground hover:text-destructive transition-colors p-1"
          title="Ignorer et recommencer"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="flex gap-3">
        <button
          @click="startWorkout"
          class="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors"
        >
          Reprendre l'entraînement
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
      <div class="bg-card rounded-lg p-4 md:p-6 shadow border border-border">
        <WorkoutSelector @workout-selected="handleWorkoutSelected" />
      </div>
      <div class="bg-card rounded-lg p-4 md:p-6 shadow border border-border space-y-4 md:space-y-6">
        <div>
          <h2 class="text-xl font-bold text-foreground mb-4">Importer un fichier</h2>
          <label class="block">
            <input
              ref="fileInput"
              type="file"
              accept=".zwo"
              @change="handleFileUpload"
              class="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer file:transition-colors"
            />
          </label>
        </div>

        <div class="border-t border-border pt-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-foreground flex items-center gap-2">
              <img src="/intervals.png" alt="Intervals.icu" class="w-6 h-6 rounded-lg" />
              Intervals.icu <span class="text-sm font-normal text-muted-foreground">(entrainement du jour)</span>
            </h2>
            <button
              v-if="intervals.isConnected"
              @click="intervalsWorkoutRef?.loadTodayWorkouts()"
              :disabled="intervalsWorkoutRef?.isLoading"
              class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <svg :class="['w-4 h-4', { 'animate-spin': intervalsWorkoutRef?.isLoading }]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Rafraichir
            </button>
          </div>
          <IntervalsTodayWorkout ref="intervalsWorkoutRef" @workout-selected="handleWorkoutSelected" />
        </div>
      </div>
    </div>

    <div v-if="appState.selectedWorkout.value" class="bg-card rounded-lg p-3 md:p-4 shadow border border-border">
      <h3 class="text-sm font-medium text-muted-foreground mb-2">Apercu de l'entrainement</h3>
      <WorkoutPreviewChart :ftp="appState.ftp.value" :workout="appState.selectedWorkout.value" :tall="true" />
    </div>

    <div class="bg-card rounded-lg p-4 md:p-6 shadow border border-border">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Colonne gauche: Device Connector -->
        <div>
          <DeviceConnector ref="deviceConnector" @device-status-change="handleDeviceStatusChange" @data-update="handleDataUpdate" />
        </div>

        <!-- Colonne droite: Bouton démarrer + Message -->
        <div class="flex flex-col justify-center items-center space-y-4">
          <!-- Indicateur mode simulation -->
          <div v-if="deviceConnector?.useMockMode?.value" class="text-center">
            <span class="inline-flex items-center gap-1 text-xs text-muted-foreground bg-accent px-2 py-1 rounded">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
              </svg>
              Mode simulation
            </span>
          </div>

          <!-- Bouton démarrer -->
          <button
            @click="startWorkout"
            :disabled="!canStart"
            :class="[
              'px-6 py-3 rounded-lg text-base font-bold transition-all transform whitespace-nowrap',
              canStart
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 shadow-lg'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            ]"
          >
            <span class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clip-rule="evenodd"
                />
              </svg>
              Démarrer l'entraînement
            </span>
          </button>

          <!-- Messages d'erreur -->
          <div v-if="!canStart" class="text-center space-y-2">
            <p v-if="!appState.selectedWorkout.value" class="text-chart-1 text-xs font-medium">Sélectionnez un entraînement ci-dessus</p>
            <div v-else-if="!isDeviceReady" class="space-y-2">
              <p class="text-chart-1 text-xs font-medium">Connectez vos capteurs ou activez le mode simulation</p>
              <button
                v-if="!deviceConnector?.useMockMode?.value"
                @click="deviceConnector?.enableMockMode()"
                class="px-3 py-1 bg-accent text-accent-foreground rounded text-xs font-medium hover:bg-accent/80 transition-colors"
              >
                Activer la simulation
              </button>
            </div>
          </div>

          <!-- Message d'encouragement (seulement si prêt) -->
          <p v-if="canStart" class="text-sm text-muted-foreground">Bonne séance ! 💪</p>
        </div>
      </div>
    </div>
  </div>
</template>
