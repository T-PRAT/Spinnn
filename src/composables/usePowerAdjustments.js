import { ref, computed, watch } from "vue";
import { useWorkoutSession } from "./useWorkoutSession";
import { useAppState } from "./useAppState";
import { getCurrentIntervalIndex } from "@/data/sampleWorkouts";

/**
 * Composable singleton pour gérer les ajustements de puissance en temps réel
 *
 * Deux types d'ajustements :
 * 1. Ajustement tour (currentIntervalOffset) : S'applique à l'intervalle actuel uniquement, reset automatiquement
 * 2. Ajustement séance (globalOffset) : S'applique à toute la séance, persiste jusqu'à la fin
 *
 * Les deux ajustements sont additifs et limités entre -20% et +20%
 */
let instance = null;

export function usePowerAdjustments() {
  if (instance) {
    return instance;
  }

  const session = useWorkoutSession();
  const appState = useAppState();

  // État réactif
  const currentIntervalOffset = ref(0); // Offset tour (-0.20 à +0.20)
  const globalOffset = ref(0); // Offset séance (-0.20 à +0.20)
  const lastIntervalIndex = ref(-1); // Dernier intervalle pour détecter les changements

  const DELTA_STEP = 0.05; // 5% par clic

  /**
   * Ajuste l'offset de l'intervalle actuel (tour)
   * @param {number} delta - Variation à appliquer (ex: 0.05 pour +5%, -0.05 pour -5%)
   */
  function adjustCurrentInterval(delta) {
    currentIntervalOffset.value += delta;
  }

  /**
   * Ajuste l'offset global de la séance
   * @param {number} delta - Variation à appliquer (ex: 0.05 pour +5%, -0.05 pour -5%)
   */
  function adjustGlobalWorkout(delta) {
    globalOffset.value += delta;
  }

  /**
   * Reset l'offset de l'intervalle actuel (appelé automatiquement quand l'intervalle change)
   */
  function resetCurrentIntervalOffset() {
    currentIntervalOffset.value = 0;
  }

  /**
   * Reset tous les offsets (appelé quand la séance se termine)
   */
  function resetAll() {
    currentIntervalOffset.value = 0;
    globalOffset.value = 0;
    lastIntervalIndex.value = -1;
  }

  // Formattage pour affichage
  const formattedCurrentOffset = computed(() => {
    const percentage = Math.round(currentIntervalOffset.value * 100);
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  });

  const formattedGlobalOffset = computed(() => {
    const percentage = Math.round(globalOffset.value * 100);
    return percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  });

  // Watch pour détecter les changements d'intervalle et reset l'offset tour
  watch(
    () => session.elapsedSeconds.value,
    (newElapsedSeconds) => {
      if (!appState.selectedWorkout.value) return;
      if (session.isWorkoutComplete.value) return;

      // Obtenir l'index de l'intervalle actuel
      const currentIndex = getCurrentIntervalIndex(
        appState.selectedWorkout.value,
        newElapsedSeconds
      );

      // Si l'intervalle a changé, reset l'offset tour
      if (currentIndex !== lastIntervalIndex.value && lastIntervalIndex.value !== -1) {
        resetCurrentIntervalOffset();
      }

      // Mettre à jour l'index de l'intervalle
      lastIntervalIndex.value = currentIndex;
    },
    { immediate: true }
  );

  // Watch pour reset quand l'entraînement se termine
  watch(
    () => session.isWorkoutComplete.value,
    (isComplete) => {
      if (isComplete) {
        resetAll();
      }
    }
  );

  instance = {
    // État
    currentIntervalOffset,
    globalOffset,
    lastIntervalIndex,

    // Fonctions
    adjustCurrentInterval,
    adjustGlobalWorkout,
    resetCurrentIntervalOffset,
    resetAll,

    // Computed
    formattedCurrentOffset,
    formattedGlobalOffset,
  };

  return instance;
}
