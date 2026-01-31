import { ref, computed, watch } from "vue";
import { useWorkoutSession } from "./useWorkoutSession";
import { useAppState } from "./useAppState";
import { getCurrentIntervalIndex } from "@/data/sampleWorkouts";

/**
 * Composable for managing real-time power adjustments
 */
let instance = null;

export function usePowerAdjustments() {
  if (instance) {
    return instance;
  }

  const session = useWorkoutSession();
  const appState = useAppState();

  const currentIntervalOffset = ref(0);
  const globalOffset = ref(0);
  const lastIntervalIndex = ref(-1);

  const DELTA_STEP = 0.05;

  function adjustCurrentInterval(delta) {
    currentIntervalOffset.value += delta;
  }

  function adjustGlobalWorkout(delta) {
    globalOffset.value += delta;
  }

  function resetCurrentIntervalOffset() {
    currentIntervalOffset.value = 0;
  }

  function resetAll() {
    currentIntervalOffset.value = 0;
    globalOffset.value = 0;
    lastIntervalIndex.value = -1;
  }

  const formattedCurrentOffset = computed(() => {
    const percentage = Math.round(currentIntervalOffset.value * 100);
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  });

  const formattedGlobalOffset = computed(() => {
    const percentage = Math.round(globalOffset.value * 100);
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  });

  watch(
    () => session.elapsedSeconds.value,
    (newElapsedSeconds) => {
      if (!appState.selectedWorkout.value) return;
      if (session.isWorkoutComplete.value) return;

      const currentIndex = getCurrentIntervalIndex(
        appState.selectedWorkout.value,
        newElapsedSeconds
      );

      if (currentIndex !== lastIntervalIndex.value && lastIntervalIndex.value !== -1) {
        resetCurrentIntervalOffset();
      }

      lastIntervalIndex.value = currentIndex;
    },
    { immediate: true }
  );

  watch(
    () => session.isWorkoutComplete.value,
    (isComplete) => {
      if (isComplete) {
        resetAll();
      }
    }
  );

  instance = {
    currentIntervalOffset,
    globalOffset,
    lastIntervalIndex,
    adjustCurrentInterval,
    adjustGlobalWorkout,
    resetCurrentIntervalOffset,
    resetAll,
    formattedCurrentOffset,
    formattedGlobalOffset,
  };

  return instance;
}
