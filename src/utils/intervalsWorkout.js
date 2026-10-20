/**
 * Conversion d'une séance planifiée Intervals.icu (champ `workout_doc` d'un événement
 * de calendrier) en séance Spinnn.
 *
 * Format source, d'après la documentation Intervals.icu :
 *   steps[] : { duration, power: { value | start+end, units }, ramp, warmup, cooldown,
 *               intensity, freeride, maxeffort, cadence, reps, steps[] (répétition) }
 * Unités de puissance prises en charge : « %ftp » et « w ». Une étape qu'on ne saurait pas
 * convertir fidèlement (roue libre, durée en distance, cible cardio…) fait refuser la séance
 * entière, avec la raison, plutôt que de la déformer.
 */
import { PreparationError } from './preparationMessages';

const MAX_NESTING = 4;
const MAX_REPS = 500;
const MAX_POWER_FRACTION = 5;
const CYCLING_TYPE = /ride|bike|cycl|velo/i;

/**
 * Date locale « AAAA-MM-JJ ». toISOString() donnerait la date UTC, donc la veille
 * entre minuit et 1 h ou 2 h heure de Paris.
 */
export function localDateString(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Séance qu'on refuse d'importer : `reason` est une clé `intervals.skip.*`. */
export class UnsupportedWorkout extends Error {
  constructor(reason, params = {}) {
    super(reason);
    this.name = 'UnsupportedWorkout';
    this.reason = reason;
    this.params = params;
  }
}

function round4(value) {
  return Math.round(value * 10000) / 10000;
}

/** Valeur de puissance de la source -> fraction de la FTP de Spinnn. */
function toFraction(value, units, ftp) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new UnsupportedWorkout('invalidValue');
  }

  let fraction;
  if (units === '%ftp') {
    fraction = value / 100;
  } else if (units === 'w') {
    // Des watts absolus restent des watts : on les rapporte à la FTP de Spinnn
    fraction = value / ftp;
  } else {
    throw new UnsupportedWorkout('unit', { unit: units });
  }

  if (fraction <= 0 || fraction > MAX_POWER_FRACTION) {
    throw new UnsupportedWorkout('invalidValue');
  }
  return round4(fraction);
}

function readCadence(cadence) {
  if (!cadence || (cadence.units && String(cadence.units).toLowerCase() !== 'rpm')) return null;

  const value = typeof cadence.value === 'number'
    ? cadence.value
    : typeof cadence.start === 'number' && typeof cadence.end === 'number'
      ? (cadence.start + cadence.end) / 2
      : NaN;

  return Number.isFinite(value) && value >= 30 && value <= 250 ? Math.round(value) : null;
}

function getStepType(step, isGradual) {
  const intensity = typeof step.intensity === 'string' ? step.intensity.toLowerCase() : '';

  if (step.warmup || intensity === 'warmup') return 'warmup';
  if (step.cooldown || intensity === 'cooldown') return 'cooldown';
  if (step.ramp && isGradual) return 'ramp';
  if (intensity === 'rest' || intensity === 'recovery') return 'recovery';
  if (intensity === 'active' || intensity === 'interval') return 'work';
  return 'steady';
}

function convertLeafStep(step, ftp) {
  if (step.freeride) throw new UnsupportedWorkout('freeride');

  const duration = step.duration;
  if (typeof duration !== 'number' || !Number.isFinite(duration) || duration <= 0) {
    throw new UnsupportedWorkout('noDuration');
  }

  const target = step.power;
  if (!target || typeof target !== 'object') throw new UnsupportedWorkout('noPowerTarget');

  const units = String(target.units ?? '%ftp').toLowerCase();
  const hasRange = typeof target.start === 'number' && typeof target.end === 'number';
  if (!hasRange && typeof target.value !== 'number') throw new UnsupportedWorkout('noPowerTarget');

  const start = toFraction(hasRange ? target.start : target.value, units, ftp);
  const end = hasRange ? toFraction(target.end, units, ftp) : start;

  // Une plage « 95-105 % » sans `ramp` est une fourchette à tenir : on vise son milieu.
  // Seul `ramp` demande une progression continue du début à la fin.
  const isGradual = Boolean(step.ramp) && start !== end;
  const interval = {
    type: getStepType(step, isGradual),
    duration: Math.round(duration)
  };

  if (isGradual) {
    interval.powerStart = start;
    interval.powerEnd = end;
  } else {
    interval.power = round4((start + end) / 2);
  }

  const cadence = readCadence(step.cadence);
  if (cadence !== null) interval.cadence = cadence;

  return interval;
}

function convertSteps(steps, ftp, depth, out) {
  if (depth > MAX_NESTING) throw new UnsupportedWorkout('tooDeep');

  for (const step of steps) {
    if (Array.isArray(step.steps) && step.steps.length > 0) {
      const reps = step.reps ?? 1;
      if (!Number.isInteger(reps) || reps < 1 || reps > MAX_REPS) throw new UnsupportedWorkout('invalidValue');

      for (let rep = 0; rep < reps; rep++) {
        convertSteps(step.steps, ftp, depth + 1, out);
      }
    } else {
      out.push(convertLeafStep(step, ftp));
    }
  }
}

/**
 * Convertit un événement du calendrier en séance Spinnn.
 * @param {object} event - Événement Intervals.icu (catégorie WORKOUT)
 * @param {object} context
 * @param {number} context.ftp - FTP de l'athlète dans Spinnn, en watts
 * @returns {object} Séance { id, name, description, duration, difficulty, intervals, source, sourceFtp }
 * @throws {UnsupportedWorkout} Séance qu'on ne peut pas importer fidèlement
 */
export function convertIntervalsEvent(event, { ftp }) {
  if (event.type && !CYCLING_TYPE.test(String(event.type))) {
    throw new UnsupportedWorkout('notCycling', { type: event.type });
  }

  const doc = event.workout_doc;
  if (!doc || !Array.isArray(doc.steps) || doc.steps.length === 0) {
    throw new UnsupportedWorkout('noStructure');
  }
  if (doc.target && !['POWER', 'AUTO'].includes(String(doc.target).toUpperCase())) {
    throw new UnsupportedWorkout('noPowerTarget');
  }

  const intervals = [];
  convertSteps(doc.steps, ftp, 0, intervals);
  if (intervals.length === 0) throw new UnsupportedWorkout('noStructure');

  return {
    id: `intervals-${event.id}`,
    name: event.name || 'Intervals.icu',
    description: typeof doc.description === 'string' ? doc.description : '',
    duration: intervals.reduce((total, interval) => total + interval.duration, 0),
    difficulty: 'Custom',
    intervals,
    source: 'intervals.icu',
    sourceFtp: typeof doc.ftp === 'number' && doc.ftp > 0 ? doc.ftp : null
  };
}

/**
 * Trie les événements d'un jour : séances importables d'un côté, séances refusées
 * (avec la raison) de l'autre. Les événements qui ne sont pas des séances sont ignorés.
 * @param {Array} events - Réponse de /athlete/{id}/events
 * @param {object} context
 * @param {string} context.date - Jour voulu, « AAAA-MM-JJ »
 * @param {number} context.ftp - FTP de l'athlète dans Spinnn
 * @returns {{workouts: Array, skipped: Array<{id, name, reason, params}>}}
 * @throws {PreparationError} Réponse qui n'est pas une liste d'événements
 */
export function extractDayWorkouts(events, { date, ftp }) {
  if (!Array.isArray(events)) {
    throw new PreparationError('intervals.badResponse');
  }

  const workouts = [];
  const skipped = [];

  events
    .filter((event) => event?.category === 'WORKOUT' && String(event.start_date_local ?? '').startsWith(date))
    .forEach((event) => {
      try {
        workouts.push(convertIntervalsEvent(event, { ftp }));
      } catch (error) {
        if (!(error instanceof UnsupportedWorkout)) throw error;
        skipped.push({
          id: `intervals-${event.id}`,
          name: event.name || 'Intervals.icu',
          reason: `intervals.skip.${error.reason}`,
          params: error.params
        });
      }
    });

  return { workouts, skipped };
}
