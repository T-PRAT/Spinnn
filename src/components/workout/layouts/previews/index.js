import { markRaw } from 'vue';
import ClassicLayoutPreview from './ClassicLayoutPreview.vue';
import RingLayoutPreview from './RingLayoutPreview.vue';
import { WORKOUT_LAYOUT_IDS, DEFAULT_WORKOUT_LAYOUT } from '@/constants/workoutLayouts';

/**
 * Miniatures des vues d'entraînement, affichées dans les Paramètres.
 * Séparées du registre des layouts (../index.js) pour que la page Paramètres n'ait pas à
 * importer les layouts complets.
 */
const WORKOUT_LAYOUT_PREVIEWS = {
  [WORKOUT_LAYOUT_IDS.CLASSIC]: markRaw(ClassicLayoutPreview),
  [WORKOUT_LAYOUT_IDS.RING]: markRaw(RingLayoutPreview)
};

/**
 * @param {string} id - Identifiant de la vue
 * @returns {object} La miniature de la vue, ou celle de la vue par défaut si l'id est inconnu
 */
export function getWorkoutLayoutPreview(id) {
  return WORKOUT_LAYOUT_PREVIEWS[id] ?? WORKOUT_LAYOUT_PREVIEWS[DEFAULT_WORKOUT_LAYOUT];
}
