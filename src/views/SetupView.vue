<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import WorkoutSelector from "../components/WorkoutSelector.vue";
import DeviceConnector from "../components/DeviceConnector.vue";
import BluetoothDebug from "../components/BluetoothDebug.vue";
import WorkoutPreviewChart from "../components/WorkoutPreviewChart.vue";
import IntervalsTodayWorkout from "../components/IntervalsTodayWorkout.vue";
import { useAppState } from "../composables/useAppState";
import { useWorkoutSession } from "../composables/useWorkoutSession";

const router = useRouter();
const appState = useAppState();
const session = useWorkoutSession();

const isDeviceReady = ref(false);
const fileInput = ref(null);

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
  return appState.selectedWorkout.value !== null && isDeviceReady.value;
});

function startWorkout() {
  if (canStart.value) {
    session.start(appState.selectedWorkout.value, appState.ftp.value);
    appState.startWorkout();
    router.push({ name: "workout" });
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <BluetoothDebug />

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-card rounded-lg p-6 shadow border border-border">
        <WorkoutSelector @workout-selected="handleWorkoutSelected" />
      </div>
      <div class="bg-card rounded-lg p-6 shadow border border-border space-y-6">
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
          <h2 class="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <img src="/intervals.png" alt="Intervals.icu" class="w-6 h-6 rounded-lg" />
            Intervals.icu <span class="text-sm font-normal text-muted-foreground">(entrainement du jour)</span>
          </h2>
          <IntervalsTodayWorkout @workout-selected="handleWorkoutSelected" />
        </div>
      </div>
    </div>

    <div v-if="appState.selectedWorkout.value" class="bg-card rounded-lg p-4 shadow border border-border">
      <h3 class="text-sm font-medium text-muted-foreground mb-2">Apercu de l'entrainement</h3>
      <WorkoutPreviewChart :ftp="appState.ftp.value" :workout="appState.selectedWorkout.value" :tall="true" />
    </div>

    <div class="bg-card rounded-lg p-6 shadow border border-border">
      <DeviceConnector @device-status-change="handleDeviceStatusChange" @data-update="handleDataUpdate" />
    </div>

    <div class="flex justify-center pt-6">
      <button
        @click="startWorkout"
        :disabled="!canStart"
        :class="[
          'px-8 py-4 rounded-lg text-lg font-bold transition-all transform',
          canStart
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 shadow-lg'
            : 'bg-muted text-muted-foreground cursor-not-allowed',
        ]"
      >
        <span class="flex items-center gap-3">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clip-rule="evenodd"
            />
          </svg>
          Demarrer l'entrainement
        </span>
      </button>
    </div>

    <div v-if="!canStart" class="text-center">
      <p v-if="!appState.selectedWorkout.value" class="text-chart-1 text-sm font-medium">Selectionnez un entrainement ci-dessus</p>
      <p v-else-if="!isDeviceReady" class="text-chart-1 text-sm font-medium">Connectez vos capteurs ou activez le mode simulation</p>
    </div>
  </div>
</template>
