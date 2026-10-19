import { ref, readonly } from 'vue';
import { useStorage } from './useStorage';
import {
  WORKOUT_LAYOUTS,
  DEFAULT_WORKOUT_LAYOUT,
  isWorkoutLayoutId
} from '@/constants/workoutLayouts';
import { logger } from '@/utils/logger';

const storage = useStorage();

// Singleton state - la préférence est partagée entre la séance et les paramètres.
// Une valeur inconnue (vue retirée, stockage modifié à la main) retombe sur la vue par défaut.
const storedLayout = storage.getWorkoutLayout();
const layoutId = ref(isWorkoutLayoutId(storedLayout) ? storedLayout : DEFAULT_WORKOUT_LAYOUT);

export function useWorkoutLayout() {
  function setLayout(id) {
    if (!isWorkoutLayoutId(id)) {
      logger.warn('Unknown workout layout:', id);
      return false;
    }
    if (storage.setWorkoutLayout(id)) {
      layoutId.value = id;
      return true;
    }
    return false;
  }

  return {
    layoutId: readonly(layoutId),
    layouts: WORKOUT_LAYOUTS,
    setLayout
  };
}
