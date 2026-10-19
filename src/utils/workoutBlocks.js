/**
 * Découpage d'une séance en blocs pour la vue Anneau.
 *
 * Les importeurs (Intervals.icu, .ZWO) aplatissent les répétitions : une séance
 * 5 × (3 min à 120 % / 3 min à 50 %) arrive sous la forme de dix intervalles à plat. On
 * retrouve donc les séries par leur motif (deux blocs identiques qui alternent) plutôt que
 * par une structure explicite, pour pouvoir afficher « répétition 2 sur 5 ».
 */
import { flattenIntervals, getZoneIndex } from '@/utils/workoutHelpers';

// Plage « sweet spot », en fraction de la FTP
const SWEET_SPOT_MIN = 0.88;
const SWEET_SPOT_MAX = 0.94;
const EPSILON = 1e-6;

// Une série compte au moins deux répétitions du bloc de travail
const MIN_SERIES_REPS = 2;

/**
 * Puissance de début et de fin d'un intervalle, en fraction de la FTP.
 * Même lecture que getTargetPowerAtTime : `power` fixe, sinon rampe powerStart -> powerEnd.
 */
function getPowerRange(interval) {
  if (interval.power !== undefined) {
    return [interval.power, interval.power];
  }
  if (interval.powerStart !== undefined && interval.powerEnd !== undefined) {
    return [interval.powerStart, interval.powerEnd];
  }
  return [0, 0];
}

/**
 * Clé de libellé d'un bloc : « recovery », « warmup », « cooldown », « ramp », « sweet »
 * ou « z1 » à « z7 ». La récupération garde son nom quelle que soit sa puissance.
 */
function getLabelKey(type, zone, avgPower, isGradual) {
  if (type === 'recovery') return 'recovery';
  if (type === 'warmup' || type === 'cooldown') return type;
  if (type === 'ramp' || isGradual) return 'ramp';

  const isSweetSpot =
    avgPower >= SWEET_SPOT_MIN - EPSILON &&
    avgPower <= SWEET_SPOT_MAX + EPSILON &&
    (zone === 3 || zone === 4);
  return isSweetSpot ? 'sweet' : `z${zone}`;
}

/**
 * Met la séance à plat sous forme de blocs avec leur position dans le temps.
 * Une sortie libre n'a pas de blocs.
 * @param {object} workout - Séance sélectionnée
 * @param {object} powerZones - Zones de puissance de l'athlète
 * @returns {Array} Blocs { index, type, start, end, duration, powerStart, powerEnd, avgPower, zone, isGradual, cadence, labelKey }
 */
export function buildTimeline(workout, powerZones) {
  if (!workout || workout.isFreeRide || !Array.isArray(workout.intervals)) return [];

  let start = 0;
  return flattenIntervals(workout.intervals).map((interval, index) => {
    const duration = interval.duration || 0;
    const [powerStart, powerEnd] = getPowerRange(interval);
    const avgPower = (powerStart + powerEnd) / 2;
    const isGradual = powerStart !== powerEnd;
    const zone = getZoneIndex(avgPower, powerZones);

    const block = {
      index,
      type: interval.type,
      start,
      end: start + duration,
      duration,
      powerStart,
      powerEnd,
      avgPower,
      zone,
      isGradual,
      cadence: typeof interval.cadence === 'number' ? interval.cadence : null,
      labelKey: getLabelKey(interval.type, zone, avgPower, isGradual)
    };
    start += duration;
    return block;
  });
}

/**
 * Index du bloc en cours à un instant donné. Au-delà de la fin, on reste sur le dernier.
 */
export function findBlockIndex(timeline, elapsedSeconds) {
  for (let i = 0; i < timeline.length; i++) {
    if (elapsedSeconds < timeline[i].end) return i;
  }
  return timeline.length - 1;
}

/**
 * Puissance de base (fraction de la FTP, sans ajustement) visée à un instant du bloc.
 */
export function getBlockPowerAt(block, elapsedSeconds) {
  if (!block.isGradual || block.duration <= 0) return block.powerStart;

  const progress = Math.min(1, Math.max(0, (elapsedSeconds - block.start) / block.duration));
  return block.powerStart + (block.powerEnd - block.powerStart) * progress;
}

/**
 * Teinte d'un bloc : « recovery », « sweet » ou « z1 » à « z7 ».
 * Les blocs progressifs (échauffement, rampes) prennent la teinte de la puissance donnée
 * (début de bloc par défaut), pour que la couleur suive la montée en charge.
 */
export function getBlockTone(block, powerZones, power = block.powerStart) {
  if (block.labelKey === 'recovery') return 'recovery';
  if (block.labelKey === 'sweet') return 'sweet';

  const zone = block.isGradual ? getZoneIndex(power, powerZones) : block.zone;
  return `z${zone}`;
}

function signature(block) {
  return `${block.duration}|${Math.round(block.powerStart * 100)}|${Math.round(block.powerEnd * 100)}`;
}

/**
 * Repère les séries (travail / récupération qui alternent à l'identique).
 * @param {Array} blocks - Blocs issus de buildTimeline
 * @returns {Array} Pour chaque bloc, null ou { group, rep, reps, role: 'work' | 'recovery' }.
 *   La récupération porte le numéro de la répétition qu'elle suit ; celle qui précède la
 *   première ou suit la dernière répétition n'appartient pas à la série.
 */
export function detectSeries(blocks) {
  const info = new Array(blocks.length).fill(null);
  let group = 0;
  let i = 0;

  while (i < blocks.length - 1) {
    const sigA = signature(blocks[i]);
    const sigB = signature(blocks[i + 1]);
    if (sigA === sigB) {
      i++;
      continue;
    }

    // Étend l'alternance A B A B ... qui démarre en i
    let end = i + 2;
    while (end < blocks.length && signature(blocks[end]) === ((end - i) % 2 === 0 ? sigA : sigB)) {
      end++;
    }

    // Le bloc de travail est le plus puissant des deux
    const workOffset = blocks[i].avgPower >= blocks[i + 1].avgPower ? 0 : 1;
    const workIndexes = [];
    for (let k = i + workOffset; k < end; k += 2) workIndexes.push(k);

    if (workIndexes.length < MIN_SERIES_REPS) {
      i++;
      continue;
    }

    const reps = workIndexes.length;
    workIndexes.forEach((blockIndex, n) => {
      info[blockIndex] = { group, rep: n + 1, reps, role: 'work' };
      if (n < reps - 1) {
        info[blockIndex + 1] = { group, rep: n + 1, reps, role: 'recovery' };
      }
    });
    group++;
    i = end;
  }

  return info;
}

/**
 * Horloge « m:ss », ou « h:mm:ss » à partir d'une heure.
 * @param {number} totalSeconds - Durée en secondes entières
 */
export function formatClock(totalSeconds) {
  const total = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, '0');

  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
}

/**
 * Durée en toutes lettres abrégées : « 45 s », « 6 min », « 1 min 30 s », « 1 h 05 ».
 */
export function formatSpan(totalSeconds) {
  const total = Math.max(0, Math.round(totalSeconds));
  if (total < 60) return `${total} s`;

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours} h ${String(minutes).padStart(2, '0')}` : `${hours} h`;
  }
  return seconds > 0 ? `${minutes} min ${seconds} s` : `${minutes} min`;
}
