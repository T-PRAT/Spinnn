export const workoutCategories = [
  {
    id: 'endurance',
    name: 'Endurance',
    icon: '🚴',
    workouts: [
      {
        id: 'endurance-easy',
        name: 'Sortie facile',
        description: '45min @ 65% FTP - Recuperation active',
        duration: 2700,
        difficulty: 'Easy',
        intervals: [
          { type: 'warmup', duration: 300, powerStart: 0.5, powerEnd: 0.65 },
          { type: 'steady', duration: 2100, power: 0.65 },
          { type: 'cooldown', duration: 300, powerStart: 0.65, powerEnd: 0.5 }
        ]
      },
      {
        id: 'endurance-moderate',
        name: 'Endurance classique',
        description: '60min @ 70% FTP - Base aerobique',
        duration: 3600,
        difficulty: 'Easy',
        intervals: [
          { type: 'warmup', duration: 600, powerStart: 0.5, powerEnd: 0.7 },
          { type: 'steady', duration: 2400, power: 0.7 },
          { type: 'cooldown', duration: 600, powerStart: 0.7, powerEnd: 0.5 }
        ]
      },
      {
        id: 'endurance-long',
        name: 'Sortie longue',
        description: '90min @ 68% FTP - Endurance fondamentale',
        duration: 5400,
        difficulty: 'Moderate',
        intervals: [
          { type: 'warmup', duration: 600, powerStart: 0.5, powerEnd: 0.68 },
          { type: 'steady', duration: 4200, power: 0.68 },
          { type: 'cooldown', duration: 600, powerStart: 0.68, powerEnd: 0.5 }
        ]
      }
    ]
  },
  {
    id: 'tempo',
    name: 'Tempo',
    icon: '⚡',
    workouts: [
      {
        id: 'tempo-sweet-spot',
        name: 'Sweet Spot',
        description: '3x10min @ 88% FTP - Seuil inferieur',
        duration: 2700,
        difficulty: 'Moderate',
        intervals: [
          { type: 'warmup', duration: 600, powerStart: 0.5, powerEnd: 0.7 },
          { type: 'work', duration: 600, power: 0.88, name: 'Interval 1' },
          { type: 'recovery', duration: 300, power: 0.6 },
          { type: 'work', duration: 600, power: 0.88, name: 'Interval 2' },
          { type: 'recovery', duration: 300, power: 0.6 },
          { type: 'work', duration: 600, power: 0.88, name: 'Interval 3' },
          { type: 'cooldown', duration: 300, powerStart: 0.7, powerEnd: 0.5 }
        ]
      },
      {
        id: 'tempo-threshold',
        name: 'Seuil continu',
        description: '2x20min @ 95% FTP - Travail au seuil',
        duration: 3300,
        difficulty: 'Hard',
        intervals: [
          { type: 'warmup', duration: 600, powerStart: 0.5, powerEnd: 0.8 },
          { type: 'work', duration: 1200, power: 0.95, name: 'Bloc 1' },
          { type: 'recovery', duration: 300, power: 0.6 },
          { type: 'work', duration: 1200, power: 0.95, name: 'Bloc 2' },
          { type: 'cooldown', duration: 600, powerStart: 0.8, powerEnd: 0.5 }
        ]
      },
      {
        id: 'tempo-pyramid',
        name: 'Pyramide tempo',
        description: '8-12-8min @ 90% FTP - Progression pyramidale',
        duration: 3000,
        difficulty: 'Moderate',
        intervals: [
          { type: 'warmup', duration: 600, powerStart: 0.5, powerEnd: 0.75 },
          { type: 'work', duration: 480, power: 0.90, name: 'Montee' },
          { type: 'recovery', duration: 240, power: 0.6 },
          { type: 'work', duration: 720, power: 0.90, name: 'Plateau' },
          { type: 'recovery', duration: 240, power: 0.6 },
          { type: 'work', duration: 480, power: 0.90, name: 'Descente' },
          { type: 'cooldown', duration: 240, powerStart: 0.75, powerEnd: 0.5 }
        ]
      }
    ]
  },
  {
    id: 'vo2max',
    name: 'VO2 Max',
    icon: '🔥',
    workouts: [
      {
        id: 'vo2-classic',
        name: 'VO2 classique',
        description: '5x3min @ 120% FTP - Intensite maximale',
        duration: 2400,
        difficulty: 'Hard',
        intervals: [
          { type: 'warmup', duration: 600, powerStart: 0.5, powerEnd: 0.7 },
          { type: 'work', duration: 180, power: 1.2, name: 'Interval 1' },
          { type: 'recovery', duration: 180, power: 0.5 },
          { type: 'work', duration: 180, power: 1.2, name: 'Interval 2' },
          { type: 'recovery', duration: 180, power: 0.5 },
          { type: 'work', duration: 180, power: 1.2, name: 'Interval 3' },
          { type: 'recovery', duration: 180, power: 0.5 },
          { type: 'work', duration: 180, power: 1.2, name: 'Interval 4' },
          { type: 'recovery', duration: 180, power: 0.5 },
          { type: 'work', duration: 180, power: 1.2, name: 'Interval 5' },
          { type: 'cooldown', duration: 300, powerStart: 0.7, powerEnd: 0.5 }
        ]
      },
      {
        id: 'vo2-short',
        name: 'VO2 court',
        description: '8x2min @ 125% FTP - Intervalles courts',
        duration: 2700,
        difficulty: 'Hard',
        intervals: [
          { type: 'warmup', duration: 600, powerStart: 0.5, powerEnd: 0.7 },
          { type: 'work', duration: 120, power: 1.25, name: 'Rep 1' },
          { type: 'recovery', duration: 120, power: 0.5 },
          { type: 'work', duration: 120, power: 1.25, name: 'Rep 2' },
          { type: 'recovery', duration: 120, power: 0.5 },
          { type: 'work', duration: 120, power: 1.25, name: 'Rep 3' },
          { type: 'recovery', duration: 120, power: 0.5 },
          { type: 'work', duration: 120, power: 1.25, name: 'Rep 4' },
          { type: 'recovery', duration: 120, power: 0.5 },
          { type: 'work', duration: 120, power: 1.25, name: 'Rep 5' },
          { type: 'recovery', duration: 120, power: 0.5 },
          { type: 'work', duration: 120, power: 1.25, name: 'Rep 6' },
          { type: 'recovery', duration: 120, power: 0.5 },
          { type: 'work', duration: 120, power: 1.25, name: 'Rep 7' },
          { type: 'recovery', duration: 120, power: 0.5 },
          { type: 'work', duration: 120, power: 1.25, name: 'Rep 8' },
          { type: 'cooldown', duration: 300, powerStart: 0.7, powerEnd: 0.5 }
        ]
      },
      {
        id: 'vo2-long',
        name: 'VO2 long',
        description: '4x4min @ 115% FTP - Intervalles prolonges',
        duration: 2700,
        difficulty: 'Hard',
        intervals: [
          { type: 'warmup', duration: 600, powerStart: 0.5, powerEnd: 0.7 },
          { type: 'work', duration: 240, power: 1.15, name: 'Bloc 1' },
          { type: 'recovery', duration: 240, power: 0.5 },
          { type: 'work', duration: 240, power: 1.15, name: 'Bloc 2' },
          { type: 'recovery', duration: 240, power: 0.5 },
          { type: 'work', duration: 240, power: 1.15, name: 'Bloc 3' },
          { type: 'recovery', duration: 240, power: 0.5 },
          { type: 'work', duration: 240, power: 1.15, name: 'Bloc 4' },
          { type: 'cooldown', duration: 300, powerStart: 0.7, powerEnd: 0.5 }
        ]
      }
    ]
  },
  {
    id: 'test',
    name: 'Test',
    icon: '🧪',
    workouts: [
      {
        id: 'test-short',
        name: 'Test 3min',
        description: '3min - Rampe + intervalles pour tests',
        duration: 180,
        difficulty: 'Moderate',
        intervals: [
          { type: 'warmup', duration: 20, powerStart: 0.5, powerEnd: 0.75, name: 'Rampe' },
          { type: 'work', duration: 30, power: 0.90, name: 'Interval 1' },
          { type: 'recovery', duration: 20, power: 0.60, name: 'Repos' },
          { type: 'work', duration: 30, power: 1.00, name: 'Interval 2' },
          { type: 'recovery', duration: 20, power: 0.60, name: 'Repos' },
          { type: 'work', duration: 30, power: 1.10, name: 'Interval 3' },
          { type: 'cooldown', duration: 30, powerStart: 0.7, powerEnd: 0.5, name: 'Retour calme' }
        ]
      }
    ]
  }
];

// Flatten all workouts for backward compatibility
export const sampleWorkouts = workoutCategories.flatMap(category =>
  category.workouts.map(workout => ({ ...workout, category: category.id }))
);

export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getTargetPowerAtTime(workout, elapsedSeconds, ftp) {
  let currentTime = 0;

  for (const interval of workout.intervals) {
    if (elapsedSeconds >= currentTime && elapsedSeconds < currentTime + interval.duration) {
      if (interval.power !== undefined) {
        return Math.round(interval.power * ftp);
      } else if (interval.powerStart !== undefined && interval.powerEnd !== undefined) {
        const intervalProgress = (elapsedSeconds - currentTime) / interval.duration;
        const powerPercent = interval.powerStart + (interval.powerEnd - interval.powerStart) * intervalProgress;
        return Math.round(powerPercent * ftp);
      }
    }
    currentTime += interval.duration;
  }

  return 0;
}

/**
 * Obtenir l'index de l'intervalle actuel à un moment donné
 * Utilisé pour détecter les changements d'intervalle
 */
export function getCurrentIntervalIndex(workout, elapsedSeconds) {
  let currentTime = 0;

  for (let i = 0; i < workout.intervals.length; i++) {
    const interval = workout.intervals[i];
    if (elapsedSeconds >= currentTime && elapsedSeconds < currentTime + interval.duration) {
      return i;
    }
    currentTime += interval.duration;
  }

  return -1;
}

/**
 * Get target power adjusted with power offsets
 */
export function getAdjustedTargetPowerAtTime(workout, elapsedSeconds, ftp, currentOffset, globalOffset) {
  const basePower = getTargetPowerAtTime(workout, elapsedSeconds, ftp);
  if (basePower === 0) return 0;

  const totalOffsetPercent = currentOffset + globalOffset;
  const adjustedPower = basePower * (1 + totalOffsetPercent);

  const minPower = 50;
  const maxPower = Math.min(ftp * 1.5, 2000);

  return Math.max(minPower, Math.min(maxPower, Math.round(adjustedPower)));
}
