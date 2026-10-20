/**
 * Erreurs et messages de la préparation de séance (import ZWO, Intervals.icu, FTP).
 *
 * Les messages vivent ici et non dans src/locales/ pour ne pas toucher aux traductions
 * communes pendant que d'autres chantiers les modifient. Les clés sont prêtes à migrer
 * dans un module de locales (`preparation.*`).
 */

/**
 * Erreur dont le message est choisi à l'affichage, dans la langue courante.
 * `code` identifie le cas, `params` alimente les variables du message.
 */
export class PreparationError extends Error {
  constructor(code, params = {}) {
    super(code);
    this.name = 'PreparationError';
    this.code = code;
    this.params = params;
  }
}

const MESSAGES = {
  fr: {
    // Import ZWO
    'zwo.unreadable': 'Impossible de lire ce fichier. Vérifiez qu’il est accessible, puis réessayez.',
    'zwo.tooLarge': 'Ce fichier est trop volumineux pour être une séance ZWO (maximum {maxKb} Ko).',
    'zwo.invalidXml': 'Ce fichier n’est pas un document XML valide. Exportez de nouveau la séance au format .zwo, puis réessayez.',
    'zwo.notZwo': 'Ce fichier XML n’est pas une séance ZWO (élément « workout » introuvable).',
    'zwo.notBike': 'Cette séance ZWO n’est pas une séance de vélo (type « {sportType} »).',
    'zwo.empty': 'Aucun bloc de séance reconnu dans ce fichier (SteadyState, Warmup, Ramp, Cooldown, IntervalsT).',
    'zwo.unsupportedBlock': 'Cette séance contient des blocs que Spinnn ne sait pas encore exécuter : {blocks}. Elle n’a pas été importée pour éviter une séance faussée.',
    'zwo.invalidValue': 'Valeur manquante ou invalide pour « {attr} » dans le bloc n°{index} ({block}).',
    'zwo.imported': 'Séance importée : {name} ({duration})',
    'zwo.importedFrom': 'Fichier : {file}',
    'zwo.retryHint': 'Corrigez le fichier ou choisissez-en un autre : vous pouvez sélectionner à nouveau le même fichier.',

    // Intervals.icu
    'intervals.notConfigured': 'Renseignez votre clé API et votre identifiant athlète Intervals.icu dans les paramètres.',
    'intervals.auth': 'Intervals.icu refuse l’authentification. Vérifiez la clé API et l’identifiant athlète (de la forme i12345).',
    'intervals.rateLimit': 'Intervals.icu limite temporairement les requêtes. Patientez un instant, puis réessayez.',
    'intervals.server': 'Intervals.icu rencontre un problème (erreur {status}). Réessayez dans quelques minutes.',
    'intervals.http': 'Intervals.icu a répondu une erreur inattendue ({status}). Réessayez ou vérifiez vos identifiants.',
    'intervals.network': 'Impossible de joindre Intervals.icu. Vérifiez votre connexion internet, puis réessayez.',
    'intervals.timeout': 'Intervals.icu met trop de temps à répondre. Réessayez dans un instant.',
    'intervals.badResponse': 'La réponse d’Intervals.icu est illisible ou inattendue. Réessayez ; si le problème persiste, signalez-le.',
    'intervals.ftpDiffers': 'FTP Intervals.icu : {sourceFtp} W, FTP Spinnn : {ftp} W. Les cibles en % sont calculées avec la FTP de Spinnn.',
    'intervals.skippedTitle': '{count} séance(s) du jour non importable(s)',
    'intervals.skip.noStructure': 'aucune étape structurée',
    'intervals.skip.notCycling': 'séance non cycliste ({type})',
    'intervals.skip.noDuration': 'étape sans durée (distance ou appui sur tour non pris en charge)',
    'intervals.skip.freeride': 'étape en roue libre (« freeride »)',
    'intervals.skip.noPowerTarget': 'étape sans cible de puissance (cardio, allure ou effort maximal)',
    'intervals.skip.unit': 'unité de puissance non prise en charge ({unit})',
    'intervals.skip.invalidValue': 'valeur de puissance incohérente',
    'intervals.skip.tooDeep': 'répétitions trop imbriquées',

    // FTP
    'ftp.invalid': 'La FTP doit être un nombre de watts compris entre {min} et {max}.',
    'ftp.saved': 'FTP enregistrée : {ftp} W',
    'ftp.storageFailed': 'La FTP n’a pas pu être enregistrée sur cet appareil (stockage du navigateur indisponible).',

    generic: 'Une erreur inattendue est survenue. Réessayez.'
  },
  en: {
    'zwo.unreadable': 'This file cannot be read. Check that it is accessible, then try again.',
    'zwo.tooLarge': 'This file is too large to be a ZWO workout (maximum {maxKb} KB).',
    'zwo.invalidXml': 'This file is not valid XML. Export the workout again as a .zwo file, then retry.',
    'zwo.notZwo': 'This XML file is not a ZWO workout (no “workout” element found).',
    'zwo.notBike': 'This ZWO workout is not a bike workout (type “{sportType}”).',
    'zwo.empty': 'No recognised workout block in this file (SteadyState, Warmup, Ramp, Cooldown, IntervalsT).',
    'zwo.unsupportedBlock': 'This workout contains blocks Spinnn cannot run yet: {blocks}. It was not imported to avoid a distorted workout.',
    'zwo.invalidValue': 'Missing or invalid value for “{attr}” in block #{index} ({block}).',
    'zwo.imported': 'Workout imported: {name} ({duration})',
    'zwo.importedFrom': 'File: {file}',
    'zwo.retryHint': 'Fix the file or pick another one: you can select the same file again.',

    'intervals.notConfigured': 'Enter your Intervals.icu API key and athlete ID in the settings.',
    'intervals.auth': 'Intervals.icu rejected the authentication. Check the API key and athlete ID (like i12345).',
    'intervals.rateLimit': 'Intervals.icu is temporarily rate-limiting requests. Wait a moment, then retry.',
    'intervals.server': 'Intervals.icu is having trouble (error {status}). Retry in a few minutes.',
    'intervals.http': 'Intervals.icu returned an unexpected error ({status}). Retry or check your credentials.',
    'intervals.network': 'Cannot reach Intervals.icu. Check your internet connection, then retry.',
    'intervals.timeout': 'Intervals.icu is taking too long to answer. Retry in a moment.',
    'intervals.badResponse': 'The Intervals.icu response is unreadable or unexpected. Retry; if it persists, report it.',
    'intervals.ftpDiffers': 'Intervals.icu FTP: {sourceFtp} W, Spinnn FTP: {ftp} W. Targets in % are computed with the Spinnn FTP.',
    'intervals.skippedTitle': '{count} workout(s) today cannot be imported',
    'intervals.skip.noStructure': 'no structured steps',
    'intervals.skip.notCycling': 'not a cycling workout ({type})',
    'intervals.skip.noDuration': 'step without a duration (distance or lap-press not supported)',
    'intervals.skip.freeride': 'free-ride step (“freeride”)',
    'intervals.skip.noPowerTarget': 'step without a power target (heart rate, pace or max effort)',
    'intervals.skip.unit': 'unsupported power unit ({unit})',
    'intervals.skip.invalidValue': 'inconsistent power value',
    'intervals.skip.tooDeep': 'repeats nested too deeply',

    'ftp.invalid': 'FTP must be a number of watts between {min} and {max}.',
    'ftp.saved': 'FTP saved: {ftp} W',
    'ftp.storageFailed': 'FTP could not be saved on this device (browser storage unavailable).',

    generic: 'An unexpected error occurred. Please retry.'
  }
};

/**
 * Texte d'une clé, dans la langue demandée (français par défaut), variables {nom} remplacées.
 */
export function preparationText(code, params = {}, locale = 'fr') {
  const dictionary = MESSAGES[locale] || MESSAGES.fr;
  const template = dictionary[code] ?? MESSAGES.fr[code];
  if (template === undefined) return code;

  return template.replace(/\{(\w+)\}/g, (match, name) => (params[name] !== undefined ? String(params[name]) : match));
}

/**
 * Message affichable pour une erreur de préparation. Une erreur d'un autre type
 * (bug, exception du navigateur) donne le message générique plutôt que son texte technique.
 */
export function describePreparationError(error, locale = 'fr') {
  if (error instanceof PreparationError) {
    return preparationText(error.code, error.params, locale);
  }
  return preparationText('generic', {}, locale);
}
