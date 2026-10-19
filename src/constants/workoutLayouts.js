/**
 * Vues d'entraînement disponibles
 *
 * Métadonnées pures, sans aucun import de composant : ce fichier est utilisé aussi bien par
 * le composable de préférence que par les layouts eux-mêmes (via leur sélecteur), il ne doit
 * donc jamais dépendre d'eux sous peine de créer un cycle d'imports. L'association
 * id -> composant se fait dans src/components/workout/layouts/index.js.
 *
 * Pour ajouter une vue : une entrée ici, les traductions `workout.layouts.<id>` (fr + en) et
 * une entrée dans le registre des composants.
 */
export const WORKOUT_LAYOUT_IDS = {
  CLASSIC: 'classic',
  RING: 'ring'
};

export const DEFAULT_WORKOUT_LAYOUT = WORKOUT_LAYOUT_IDS.CLASSIC;

export const WORKOUT_LAYOUTS = [
  {
    id: WORKOUT_LAYOUT_IDS.CLASSIC,
    labelKey: 'workout.layouts.classic.label',
    descriptionKey: 'workout.layouts.classic.description'
  },
  {
    id: WORKOUT_LAYOUT_IDS.RING,
    labelKey: 'workout.layouts.ring.label',
    descriptionKey: 'workout.layouts.ring.description'
  }
];

export function isWorkoutLayoutId(id) {
  return WORKOUT_LAYOUTS.some(layout => layout.id === id);
}
