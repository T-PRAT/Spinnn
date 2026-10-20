<script setup>
import { ref, computed, watch } from "vue";
import { useIntervalsIcu } from "../../composables/useIntervalsIcu";
import { useAppState } from "../../composables/useAppState";
import { useI18n } from "@/composables/useI18n";
import { describePreparationError, preparationText } from "@/utils/preparationMessages";
import WorkoutPreviewChart from "../workout/WorkoutPreviewChart.vue";

const emit = defineEmits(["workout-selected"]);
const intervals = useIntervalsIcu();
const appState = useAppState();
const { t, currentLocale } = useI18n();

const todayWorkouts = ref([]);
const skippedWorkouts = ref([]);
const isLoading = ref(false);
const loadError = ref(null);

// Une réponse tardive d'un chargement ancien ne doit pas écraser le plus récent
let latestRequest = 0;

const errorMessage = computed(() => (loadError.value ? describePreparationError(loadError.value, currentLocale.value) : ""));

const skippedSummary = computed(() =>
  skippedWorkouts.value.map((skipped) => ({
    id: skipped.id,
    text: `${skipped.name} : ${preparationText(skipped.reason, skipped.params, currentLocale.value)}`,
  }))
);

// Les cibles en % sont calculées avec la FTP de Spinnn : prévenir si celle d'Intervals.icu diffère
const ftpDifference = computed(() => {
  const sourceFtp = todayWorkouts.value.find((workout) => workout.sourceFtp && workout.sourceFtp !== appState.ftp.value)?.sourceFtp;
  return sourceFtp ? preparationText("intervals.ftpDiffers", { sourceFtp, ftp: appState.ftp.value }, currentLocale.value) : "";
});

async function loadTodayWorkouts() {
  if (!intervals.isConnected.value) {
    todayWorkouts.value = [];
    skippedWorkouts.value = [];
    return;
  }

  const requestId = ++latestRequest;
  isLoading.value = true;
  loadError.value = null;

  try {
    const result = await intervals.getTodayWorkouts(appState.ftp.value);
    if (requestId !== latestRequest) return;
    todayWorkouts.value = result.workouts;
    skippedWorkouts.value = result.skipped;
  } catch (err) {
    if (requestId !== latestRequest) return;
    todayWorkouts.value = [];
    skippedWorkouts.value = [];
    loadError.value = err;
    console.error("Failed to load today workouts:", err);
  } finally {
    if (requestId === latestRequest) isLoading.value = false;
  }
}

function selectWorkout(workout) {
  emit("workout-selected", workout);
}

watch(
  () => intervals.isConnected.value,
  () => {
    loadTodayWorkouts();
  },
  { immediate: true }
);

// Expose loadTodayWorkouts to parent component
defineExpose({
  loadTodayWorkouts,
  isLoading,
});
</script>

<template>
  <div class="space-y-3">
    <div v-if="!intervals.isConnected.value" class="p-4 bg-muted/50 rounded-lg border border-border">
      <p class="text-sm text-muted-foreground text-center">
        {{ t('workout.intervalsNotConnected') }}
        <router-link to="/settings#integrations" class="text-primary hover:underline">{{ t('workout.intervalsSettingsLink') }}</router-link>
        {{ t('workout.intervalsNotConnectedSuffix') }}
      </p>
    </div>

    <div v-else-if="isLoading" class="p-4 bg-muted/50 rounded-lg border border-border" role="status">
      <div class="flex items-center justify-center gap-2">
        <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span class="text-sm text-muted-foreground">{{ t('workout.loading') }}</span>
      </div>
    </div>

    <div v-else-if="loadError" class="p-4 bg-destructive/10 rounded-lg border border-destructive/20" role="alert" data-testid="intervals-error">
      <p class="text-sm text-destructive">{{ errorMessage }}</p>
      <button @click="loadTodayWorkouts" class="mt-2 text-sm text-primary hover:underline">{{ t('workout.retry') }}</button>
    </div>

    <template v-else>
      <div v-if="todayWorkouts.length === 0" class="p-4 bg-muted/50 rounded-lg border border-border flex items-center justify-center" data-testid="intervals-empty">
        <span class="text-sm text-muted-foreground text-center">{{ t('workout.noWorkoutToday') }}</span>
      </div>

      <div v-else class="space-y-2">
        <p v-if="ftpDifference" class="text-xs text-muted-foreground" data-testid="intervals-ftp-difference">{{ ftpDifference }}</p>
        <div
          v-for="workout in todayWorkouts"
          :key="workout.id"
          @click="selectWorkout(workout)"
          class="p-3 border-2 border-border hover:border-primary bg-card hover:bg-primary/5 rounded-lg cursor-pointer transition-all"
          data-testid="intervals-workout"
        >
          <WorkoutPreviewChart :ftp="appState.ftp.value" :workout="workout" :compact="true" />
        </div>
      </div>

      <div v-if="skippedSummary.length > 0" class="p-3 bg-muted/50 rounded-lg border border-border space-y-1" data-testid="intervals-skipped">
        <p class="text-xs font-medium text-foreground">{{ preparationText('intervals.skippedTitle', { count: skippedSummary.length }, currentLocale) }}</p>
        <ul class="text-xs text-muted-foreground list-disc pl-4">
          <li v-for="skipped in skippedSummary" :key="skipped.id">{{ skipped.text }}</li>
        </ul>
      </div>
    </template>
  </div>
</template>
