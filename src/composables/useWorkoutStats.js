import { computed } from 'vue';
import { getCurrentIntervalIndex } from '@/utils/workoutHelpers';
import { calculateWorkoutStats } from '@/utils/workoutStats';

export function useWorkoutStats(dataPoints, workout, elapsedSeconds, ftp, activeDuration) {
  const stats = computed(() => calculateWorkoutStats(dataPoints.value, ftp?.value || 200, activeDuration?.value));
  const interval = computed(() => getCurrentIntervalIndex(elapsedSeconds.value, workout.value));
  const intervalStats = computed(() => {
    const current = interval.value;
    if (!current?.interval) return calculateWorkoutStats([]);
    return calculateWorkoutStats(dataPoints.value.filter(p => p.timestamp >= current.startTime && p.timestamp < current.startTime + current.interval.duration));
  });
  const intervalRemainingTime = computed(() => {
    const current = interval.value;
    if (!current?.interval || workout.value?.isFreeRide) return 0;
    return Math.max(0, Math.ceil(current.startTime + current.interval.duration - elapsedSeconds.value));
  });
  return {
    stats,
    ...Object.fromEntries(['avgPower', 'maxPower', 'avgHeartRate', 'maxHeartRate', 'avgCadence'].map(key => [key, computed(() => stats.value[key])])),
    energy: computed(() => stats.value.workKj),
    intervalPower: computed(() => intervalStats.value.avgPower), intervalHeartRate: computed(() => intervalStats.value.avgHeartRate),
    intervalRemainingTime,
    formattedIntervalRemainingTime: computed(() => `${Math.floor(intervalRemainingTime.value / 60)}:${(intervalRemainingTime.value % 60).toString().padStart(2, '0')}`),
  };
}
