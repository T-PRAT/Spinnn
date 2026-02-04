export const workoutCategories = [
  {
    id: 'endurance',
    name: 'Endurance',
    icon: '🚴',
    workouts: [
      {
        id: 'endurance-easy',
        name: 'Easy Ride',
        description: '45min @ 65% FTP - Active recovery',
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
        name: 'Classic Endurance',
        description: '60min @ 70% FTP - Aerobic base',
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
        name: 'Long Ride',
        description: '90min @ 68% FTP - Fundamental endurance',
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
        description: '3x10min @ 88% FTP - Below threshold',
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
        name: 'Continuous Threshold',
        description: '2x20min @ 95% FTP - Threshold work',
        duration: 3300,
        difficulty: 'Hard',
        intervals: [
          { type: 'warmup', duration: 600, powerStart: 0.5, powerEnd: 0.8 },
          { type: 'work', duration: 1200, power: 0.95, name: 'Block 1' },
          { type: 'recovery', duration: 300, power: 0.6 },
          { type: 'work', duration: 1200, power: 0.95, name: 'Block 2' },
          { type: 'cooldown', duration: 600, powerStart: 0.8, powerEnd: 0.5 }
        ]
      },
      {
        id: 'tempo-pyramid',
        name: 'Tempo Pyramid',
        description: '8-12-8min @ 90% FTP - Pyramid progression',
        duration: 3000,
        difficulty: 'Moderate',
        intervals: [
          { type: 'warmup', duration: 600, powerStart: 0.5, powerEnd: 0.75 },
          { type: 'work', duration: 480, power: 0.90, name: 'Climb' },
          { type: 'recovery', duration: 240, power: 0.6 },
          { type: 'work', duration: 720, power: 0.90, name: 'Plateau' },
          { type: 'recovery', duration: 240, power: 0.6 },
          { type: 'work', duration: 480, power: 0.90, name: 'Descent' },
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
        name: 'Classic VO2',
        description: '5x3min @ 120% FTP - Max intensity',
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
        name: 'Short VO2',
        description: '8x2min @ 125% FTP - Short intervals',
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
        name: 'Long VO2',
        description: '4x4min @ 115% FTP - Extended intervals',
        duration: 2700,
        difficulty: 'Hard',
        intervals: [
          { type: 'warmup', duration: 600, powerStart: 0.5, powerEnd: 0.7 },
          { type: 'work', duration: 240, power: 1.15, name: 'Block 1' },
          { type: 'recovery', duration: 240, power: 0.5 },
          { type: 'work', duration: 240, power: 1.15, name: 'Block 2' },
          { type: 'recovery', duration: 240, power: 0.5 },
          { type: 'work', duration: 240, power: 1.15, name: 'Block 3' },
          { type: 'recovery', duration: 240, power: 0.5 },
          { type: 'work', duration: 240, power: 1.15, name: 'Block 4' },
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
        name: '3min Test',
        description: '3min - Ramp + intervals for testing',
        duration: 180,
        difficulty: 'Moderate',
        intervals: [
          { type: 'warmup', duration: 20, powerStart: 0.5, powerEnd: 0.75, name: 'Ramp' },
          { type: 'work', duration: 30, power: 0.90, name: 'Interval 1' },
          { type: 'recovery', duration: 20, power: 0.60, name: 'Rest' },
          { type: 'work', duration: 30, power: 1.00, name: 'Interval 2' },
          { type: 'recovery', duration: 20, power: 0.60, name: 'Rest' },
          { type: 'work', duration: 30, power: 1.10, name: 'Interval 3' },
          { type: 'cooldown', duration: 30, powerStart: 0.7, powerEnd: 0.5, name: 'Cooldown' }
        ]
      }
    ]
  }
];

// Flatten all workouts for backward compatibility
export const sampleWorkouts = workoutCategories.flatMap(category =>
  category.workouts.map(workout => ({ ...workout, category: category.id }))
);

// Re-export from workoutHelpers for backward compatibility
export { formatDuration } from '@/utils/workoutHelpers';

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
 * Get the current interval index at a given time
 * Used to detect interval changes
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
