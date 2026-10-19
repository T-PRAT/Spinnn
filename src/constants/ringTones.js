/**
 * Palette de la vue Anneau.
 *
 * La vue Anneau est toujours sombre : une teinte par zone de puissance, pensée pour des lueurs.
 * Z1 à Z7 reprennent les --zone-zN de theme-maquette.css (le style par défaut) : à changer
 * ensemble. Avec ?style=ancien, le reste du site garde les couleurs de zones de l'ancien thème.
 *
 * Clés : « recovery » (récupération), « sweet » (sweet spot) et « z1 » à « z7 ».
 */
export const RING_TONE_COLORS = {
  recovery: '#8A847F',
  sweet: '#EBC03A',
  z1: '#8A847F',
  z2: '#5AA9FF',
  z3: '#5BE38A',
  z4: '#FF9340',
  z5: '#FF5A5F',
  z6: '#A78BFA',
  z7: '#F472B6'
};

// Sortie libre et « fin de séance » : pas de zone, une teinte neutre
export const RING_NEUTRAL_COLOR = '#B8C0CC';

// Vitesse des cercles (aurore et lueurs qui tournent) selon la zone : 1 = vitesse d'origine
// (un tour d'aurore en 60 s). Plus la zone est élevée, plus ils tournent vite. Récupération et
// sweet spot se placent entre les zones voisines ; sans zone (sortie libre, fin de séance),
// ils tournent comme en Z2.
export const RING_MOTION_SPEED = {
  recovery: 1.2,
  sweet: 4.8,
  z1: 1.2,
  z2: 2,
  z3: 3.6,
  z4: 6,
  z5: 9,
  z6: 12,
  z7: 16
};

export const RING_MOTION_SPEED_DEFAULT = 2;

// Étincelles (particules qui montent) : une par coup de pédale. Une étincelle met 12 s en
// moyenne à monter à vitesse 1, donc il en part 2 par seconde ; à cadence/60 coups par seconde,
// la vitesse vaut cadence / 120. À l'arrêt, elles ralentissent jusqu'à presque s'immobiliser.
export const RING_SPARK_PER_RPM = 1 / 120;
export const RING_SPARK_MIN = 0.05;
export const RING_SPARK_MAX = 2;
