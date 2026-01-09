export const sampleWorkouts = [
  {
    id: 'easy-endurance',
    name: 'Easy Endurance',
    description: '30 min steady endurance ride at 65% FTP',
    duration: 1800,
    difficulty: 'Easy',
    intervals: [
      {
        type: 'warmup',
        duration: 300,
        powerStart: 0.5,
        powerEnd: 0.65
      },
      {
        type: 'steady',
        duration: 1200,
        power: 0.65
      },
      {
        type: 'cooldown',
        duration: 300,
        powerStart: 0.65,
        powerEnd: 0.5
      }
    ]
  },
  {
    id: 'sweet-spot',
    name: 'Sweet Spot Intervals',
    description: '3x10min @ 88% FTP with 5min recovery',
    duration: 2700,
    difficulty: 'Moderate',
    intervals: [
      {
        type: 'warmup',
        duration: 600,
        powerStart: 0.5,
        powerEnd: 0.7
      },
      {
        type: 'work',
        duration: 600,
        power: 0.88,
        name: 'Interval 1'
      },
      {
        type: 'recovery',
        duration: 300,
        power: 0.6
      },
      {
        type: 'work',
        duration: 600,
        power: 0.88,
        name: 'Interval 2'
      },
      {
        type: 'recovery',
        duration: 300,
        power: 0.6
      },
      {
        type: 'work',
        duration: 600,
        power: 0.88,
        name: 'Interval 3'
      },
      {
        type: 'cooldown',
        duration: 300,
        powerStart: 0.7,
        powerEnd: 0.5
      }
    ]
  },
  {
    id: 'vo2-max',
    name: 'VO2 Max Blaster',
    description: '5x3min @ 120% FTP with 3min recovery',
    duration: 2400,
    difficulty: 'Hard',
    intervals: [
      {
        type: 'warmup',
        duration: 600,
        powerStart: 0.5,
        powerEnd: 0.7
      },
      {
        type: 'work',
        duration: 180,
        power: 1.2,
        name: 'Interval 1'
      },
      {
        type: 'recovery',
        duration: 180,
        power: 0.5
      },
      {
        type: 'work',
        duration: 180,
        power: 1.2,
        name: 'Interval 2'
      },
      {
        type: 'recovery',
        duration: 180,
        power: 0.5
      },
      {
        type: 'work',
        duration: 180,
        power: 1.2,
        name: 'Interval 3'
      },
      {
        type: 'recovery',
        duration: 180,
        power: 0.5
      },
      {
        type: 'work',
        duration: 180,
        power: 1.2,
        name: 'Interval 4'
      },
      {
        type: 'recovery',
        duration: 180,
        power: 0.5
      },
      {
        type: 'work',
        duration: 180,
        power: 1.2,
        name: 'Interval 5'
      },
      {
        type: 'cooldown',
        duration: 300,
        powerStart: 0.7,
        powerEnd: 0.5
      }
    ]
  }
];

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
