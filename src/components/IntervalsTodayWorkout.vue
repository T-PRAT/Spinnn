<script setup>
import { ref, onMounted, watch } from "vue";
import { useIntervalsIcu } from "../composables/useIntervalsIcu";
import { useAppState } from "../composables/useAppState";
import { formatDuration } from "../data/sampleWorkouts";
import WorkoutPreviewChart from "./WorkoutPreviewChart.vue";

const emit = defineEmits(["workout-selected"]);
const intervals = useIntervalsIcu();
const appState = useAppState();

const todayWorkouts = ref([]);
const isLoading = ref(false);
const error = ref("");

async function loadTodayWorkouts() {
  if (!intervals.isConnected.value) {
    todayWorkouts.value = [];
    return;
  }

  isLoading.value = true;
  error.value = "";

  try {
    todayWorkouts.value = await intervals.getTodayWorkouts();
  } catch (err) {
    error.value = err.message;
    console.error("Failed to load today workouts:", err);
  } finally {
    isLoading.value = false;
  }
}

function selectWorkout(workout) {
  emit("workout-selected", workout);
}

onMounted(() => {
  loadTodayWorkouts();
});

watch(
  () => intervals.isConnected.value,
  () => {
    loadTodayWorkouts();
  }
);
</script>

<template>
  <div class="space-y-3">
    <div v-if="intervals.isConnected.value" class="flex justify-end">
      <button
        @click="loadTodayWorkouts"
        :disabled="isLoading"
        class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        <svg :class="['w-4 h-4', { 'animate-spin': isLoading }]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

    <div v-if="!intervals.isConnected.value" class="p-4 bg-muted/50 rounded-lg border border-border">
      <p class="text-sm text-muted-foreground text-center">Connectez-vous à Intervals.icu dans les paramètres pour voir votre entrainement du jour</p>
    </div>

    <div v-else-if="isLoading" class="p-4 bg-muted/50 rounded-lg border border-border">
      <div class="flex items-center justify-center gap-2">
        <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span class="text-sm text-muted-foreground">Chargement...</span>
      </div>
    </div>

    <div v-else-if="error" class="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
      <p class="text-sm text-destructive">{{ error }}</p>
      <button @click="loadTodayWorkouts" class="mt-2 text-sm text-primary hover:underline">Réessayer</button>
    </div>

    <div v-else-if="todayWorkouts.length === 0" class="p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-center gap-2">
      <img src="/intervals.png" alt="Intervals.icu" class="w-6 h-6" />
      <span class="text-sm text-muted-foreground text-center">Intervals.icu</span>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="workout in todayWorkouts"
        :key="workout.id"
        @click="selectWorkout(workout)"
        class="p-3 border-2 border-border hover:border-primary bg-card hover:bg-primary/5 rounded-lg cursor-pointer transition-all"
      >
        <WorkoutPreviewChart :ftp="appState.ftp.value" :workout="workout" :compact="true" />
      </div>
    </div>
  </div>
</template>
