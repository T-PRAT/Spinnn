/**
 * Validation de la FTP (Functional Threshold Power), en watts.
 * Partagé par le stockage, l'état global et le formulaire des réglages.
 */

export const FTP_MIN = 50;
export const FTP_MAX = 600;

/**
 * Lit une FTP saisie (nombre, ou texte comme « 250 » / « 250,4 »).
 * @returns {number|null} Watts entiers dans [FTP_MIN, FTP_MAX], sinon null
 */
export function parseFtp(input) {
  let value = input;

  if (typeof value === 'string') {
    const text = value.trim().replace(',', '.');
    if (text === '' || !/^\d+(\.\d+)?$/.test(text)) return null;
    value = Number(text);
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) return null;

  const watts = Math.round(value);
  return watts >= FTP_MIN && watts <= FTP_MAX ? watts : null;
}
