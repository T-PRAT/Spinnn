/**
 * Import d'un fichier de séance ZWO (format Zwift).
 *
 * Les répétitions (IntervalsT) sont mises à plat en intervalles travail / récupération,
 * comme le fait l'import Intervals.icu, et les puissances sont des fractions de la FTP
 * (0,75 = 75 %). Un fichier invalide ou une séance qu'on ne saurait pas exécuter fidèlement
 * est refusé avec une PreparationError plutôt qu'importé en silence de travers.
 */
import { PreparationError } from './preparationMessages';

export const ZWO_MAX_BYTES = 1024 * 1024;

// Des sprints à 300-400 % de la FTP existent dans des séances réelles ; au-delà de 500 %,
// ce sont presque toujours des watts saisis à la place d'une fraction (Power="250")
const MAX_POWER_FRACTION = 5;
const MAX_REPEAT = 500;

const STEADY_TAGS = new Set(['steadystate', 'solidstate']);
const RAMP_TAGS = new Set(['warmup', 'cooldown', 'ramp']);
// Éléments qui accompagnent les blocs sans être une étape de la séance
const IGNORED_TAGS = new Set(['textevent', 'message']);

function tagOf(element) {
  return element.localName.toLowerCase();
}

function getAttribute(element, name) {
  const wanted = name.toLowerCase();
  for (const attribute of Array.from(element.attributes)) {
    if (attribute.name.toLowerCase() === wanted) return attribute.value;
  }
  return null;
}

/**
 * Lit un attribut numérique obligatoire.
 * @throws {PreparationError} zwo.invalidValue si absent, non numérique ou hors bornes
 */
function readRequired(block, attribute, { min = 0, max = Infinity, integer = false, exclusiveMin = false }) {
  const raw = getAttribute(block.element, attribute);
  const text = raw === null ? '' : raw.trim().replace(',', '.');
  let value = text === '' ? NaN : Number(text);

  if (Number.isFinite(value) && integer) value = Math.round(value);

  const tooSmall = exclusiveMin ? value <= min : value < min;
  if (!Number.isFinite(value) || tooSmall || value > max) {
    throw new PreparationError('zwo.invalidValue', {
      attr: attribute,
      index: block.index,
      block: block.element.localName
    });
  }
  return value;
}

function readDuration(block, attribute = 'Duration') {
  return readRequired(block, attribute, { min: 1, max: 24 * 3600, integer: true });
}

function readPower(block, attribute) {
  return readRequired(block, attribute, { min: 0, max: MAX_POWER_FRACTION, exclusiveMin: true });
}

/**
 * Puissance d'un palier. Certains fichiers (convertis depuis d'autres outils, très répandus)
 * écrivent PowerLow et PowerHigh égaux au lieu de Power : on les accepte. Si les deux diffèrent,
 * on ne devine pas s'il s'agit d'une fourchette ou d'une rampe : le fichier est refusé.
 */
function readSteadyPower(block) {
  const hasPower = getAttribute(block.element, 'Power') !== null;
  const hasRange = getAttribute(block.element, 'PowerLow') !== null && getAttribute(block.element, 'PowerHigh') !== null;

  if (hasPower || !hasRange) return readPower(block, 'Power');

  const low = readPower(block, 'PowerLow');
  const high = readPower(block, 'PowerHigh');
  if (low !== high) {
    throw new PreparationError('zwo.invalidValue', { attr: 'Power', index: block.index, block: block.element.localName });
  }
  return low;
}

/** Cadence facultative en tr/min : ignorée si absente ou incohérente. */
function readCadence(block, attribute = 'Cadence') {
  const value = Number(getAttribute(block.element, attribute));
  return Number.isFinite(value) && value >= 30 && value <= 250 ? Math.round(value) : null;
}

function withCadence(interval, cadence) {
  return cadence === null ? interval : { ...interval, cadence };
}

/** Intervalle à puissance fixe, ou progressive si le début et la fin diffèrent. */
function gradualInterval(type, duration, powerStart, powerEnd, cadence) {
  const interval =
    powerStart === powerEnd
      ? { type, duration, power: powerStart }
      : { type, duration, powerStart, powerEnd };
  return withCadence(interval, cadence);
}

function convertBlock(block) {
  const tag = tagOf(block.element);

  if (STEADY_TAGS.has(tag)) {
    const duration = readDuration(block);
    return [withCadence({ type: 'steady', duration, power: readSteadyPower(block) }, readCadence(block))];
  }

  if (RAMP_TAGS.has(tag)) {
    // Dans un ZWO, PowerLow est la puissance de début de bloc et PowerHigh celle de fin,
    // y compris pour une descente (Cooldown, Ramp décroissante).
    const duration = readDuration(block);
    const powerStart = readPower(block, 'PowerLow');
    const powerEnd = readPower(block, 'PowerHigh');
    return [gradualInterval(tag, duration, powerStart, powerEnd, readCadence(block))];
  }

  if (tag === 'intervalst') {
    const repeat = readRequired(block, 'Repeat', { min: 1, max: MAX_REPEAT, integer: true });
    const onDuration = readDuration(block, 'OnDuration');
    const offDuration = readRequired(block, 'OffDuration', { min: 0, max: 24 * 3600, integer: true });
    const onPower = readPower(block, 'OnPower');
    const offPower = readPower(block, 'OffPower');
    const onCadence = readCadence(block);
    const offCadence = readCadence(block, 'CadenceResting');

    const intervals = [];
    for (let rep = 0; rep < repeat; rep++) {
      intervals.push(withCadence({ type: 'work', duration: onDuration, power: onPower }, onCadence));
      if (offDuration > 0) {
        intervals.push(withCadence({ type: 'recovery', duration: offDuration, power: offPower }, offCadence));
      }
    }
    return intervals;
  }

  return null;
}

function findElements(root, name) {
  return Array.from(root.getElementsByTagName('*')).filter((element) => tagOf(element) === name);
}

function readText(root, name) {
  const element = Array.from(root.children).find((child) => tagOf(child) === name);
  return element?.textContent.trim() || '';
}

/**
 * Convertit le contenu d'un fichier ZWO en séance Spinnn.
 * @param {string} text - Contenu du fichier
 * @param {object} [options]
 * @param {string} [options.fallbackName] - Nom à utiliser si le fichier n'en porte pas
 * @returns {object} Séance { id, name, description, duration, difficulty, intervals, source }
 * @throws {PreparationError} Fichier illisible, invalide ou non exécutable fidèlement
 */
export function parseZwo(text, { fallbackName = '' } = {}) {
  const content = String(text ?? '').replace(/^﻿/, '').trim();

  if (content.length > ZWO_MAX_BYTES) {
    throw new PreparationError('zwo.tooLarge', { maxKb: Math.round(ZWO_MAX_BYTES / 1024) });
  }

  // DOMParser ne lève pas d'exception sur un XML cassé : il renvoie un document « parsererror »
  const doc = new DOMParser().parseFromString(content, 'text/xml');
  if (content === '' || doc.getElementsByTagName('parsererror').length > 0) {
    throw new PreparationError('zwo.invalidXml');
  }

  const workoutElement = findElements(doc.documentElement, 'workout')[0] ?? (tagOf(doc.documentElement) === 'workout' ? doc.documentElement : null);
  if (!workoutElement) {
    throw new PreparationError('zwo.notZwo');
  }

  const sportType = readText(doc.documentElement, 'sporttype');
  if (sportType && sportType.toLowerCase() !== 'bike') {
    throw new PreparationError('zwo.notBike', { sportType });
  }

  const intervals = [];
  const unsupported = new Set();

  Array.from(workoutElement.children).forEach((element, position) => {
    const tag = tagOf(element);
    if (IGNORED_TAGS.has(tag)) return;

    const converted = convertBlock({ element, index: position + 1 });
    if (converted === null) {
      unsupported.add(element.localName);
      return;
    }
    intervals.push(...converted);
  });

  if (unsupported.size > 0) {
    throw new PreparationError('zwo.unsupportedBlock', { blocks: Array.from(unsupported).join(', ') });
  }
  if (intervals.length === 0) {
    throw new PreparationError('zwo.empty');
  }

  return {
    id: 'custom',
    name: readText(doc.documentElement, 'name') || getAttribute(workoutElement, 'name') || fallbackName || 'ZWO',
    description: readText(doc.documentElement, 'description'),
    duration: intervals.reduce((total, interval) => total + interval.duration, 0),
    difficulty: 'Custom',
    intervals,
    source: 'zwo'
  };
}
