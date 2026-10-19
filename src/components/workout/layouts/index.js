import { markRaw } from 'vue';
import ClassicWorkoutLayout from './ClassicWorkoutLayout.vue';
import RingWorkoutLayout from './RingWorkoutLayout.vue';
import { WORKOUT_LAYOUT_IDS, DEFAULT_WORKOUT_LAYOUT } from '@/constants/workoutLayouts';

/**
 * Association id -> composant des vues d'entraînement.
 *
 * Les métadonnées (libellés, ordre) sont dans src/constants/workoutLayouts.js, les aperçus
 * des Paramètres dans ./previews : ce fichier est le seul à importer les layouts eux-mêmes.
 * Pour ajouter une vue, il faut une entrée dans chacun de ces trois registres.
 *
 * Tous les layouts reçoivent le même contrôleur de séance (`ctrl`) en prop.
 */
const WORKOUT_LAYOUT_COMPONENTS = {
  [WORKOUT_LAYOUT_IDS.CLASSIC]: markRaw(ClassicWorkoutLayout),
  [WORKOUT_LAYOUT_IDS.RING]: markRaw(RingWorkoutLayout)
};

/**
 * @param {string} id - Identifiant de la vue
 * @returns {object} Le composant de la vue, ou celui de la vue par défaut si l'id est inconnu
 */
export function getWorkoutLayoutComponent(id) {
  return WORKOUT_LAYOUT_COMPONENTS[id] ?? WORKOUT_LAYOUT_COMPONENTS[DEFAULT_WORKOUT_LAYOUT];
}
