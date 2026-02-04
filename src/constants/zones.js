/**
 * Power zone constants and configurations
 */

/**
 * Default power zones (as % of FTP)
 * Based on standard cycling training zones
 */
export const DEFAULT_POWER_ZONES = {
  z1: { min: 0, max: 55, name: 'Z1 - Récupération active' },
  z2: { min: 56, max: 75, name: 'Z2 - Endurance' },
  z3: { min: 76, max: 90, name: 'Z3 - Tempo' },
  z4: { min: 91, max: 105, name: 'Z4 - Seuil' },
  z5: { min: 106, max: 120, name: 'Z5 - VO2max' },
  z6: { min: 121, max: 150, name: 'Z6 - Anaérobie' },
  z7: { min: 151, max: 200, name: 'Z7 - Neuromusculaire' }
};

/**
 * Default FTP value (Functional Threshold Power in watts)
 */
export const DEFAULT_FTP = 200;
