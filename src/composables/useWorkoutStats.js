/**
 * Workout statistics calculations
 * Provides computed statistics based on workout data points
 */

import { computed } from 'vue';
import { getCurrentIntervalIndex } from '@/utils/workoutHelpers';

export function useWorkoutStats(dataPoints, workout, elapsedSeconds) {
  // ============================================================================
  // Session-wide statistics
  // ============================================================================

  /**
   * Average power for entire session
   */
  const avgPower = computed(() => {
    if (!dataPoints.value || dataPoints.value.length === 0) return 0;
    const totalPower = dataPoints.value.reduce((sum, point) => sum + (point.power || 0), 0);
    return totalPower / dataPoints.value.length;
  });

  /**
   * Average heart rate for entire session
   */
  const avgHeartRate = computed(() => {
    if (!dataPoints.value) return 0;
    const validHR = dataPoints.value.filter(point => point.heartRate > 0);
    if (validHR.length === 0) return 0;
    const totalHR = validHR.reduce((sum, point) => sum + point.heartRate, 0);
    return totalHR / validHR.length;
  });

  /**
   * Average cadence for entire session
   */
  const avgCadence = computed(() => {
    if (!dataPoints.value) return 0;
    const validCadence = dataPoints.value.filter(point => point.cadence > 0);
    if (validCadence.length === 0) return 0;
    const totalCadence = validCadence.reduce((sum, point) => sum + point.cadence, 0);
    return totalCadence / validCadence.length;
  });

  /**
   * Maximum power for entire session
   */
  const maxPower = computed(() => {
    if (!dataPoints.value || dataPoints.value.length === 0) return 0;
    return Math.max(...dataPoints.value.map(point => point.power || 0));
  });

  /**
   * Maximum heart rate for entire session
   */
  const maxHeartRate = computed(() => {
    if (!dataPoints.value) return 0;
    const validHR = dataPoints.value.filter(point => point.heartRate > 0);
    if (validHR.length === 0) return 0;
    return Math.max(...validHR.map(point => point.heartRate));
  });

  /**
   * Calculate energy expended in kcal
   * Formula: Energy (kJ) = Power (W) × Time (s) / 1000
   * Energy (kcal) ≈ Energy (kJ) × 0.239
   */
  const energy = computed(() => {
    if (!dataPoints.value || dataPoints.value.length === 0) return 0;

    // Sum of power readings over time gives total work in joules
    // Each data point represents 1 second, so we sum all power values
    const totalWorkJoules = dataPoints.value.reduce((sum, point) => sum + (point.power || 0), 0);

    // Convert to kJ then to kcal (1 kJ ≈ 0.239 kcal)
    const totalWorkKJ = totalWorkJoules / 1000;
    return Math.round(totalWorkKJ * 0.239);
  });

  // ============================================================================
  // Interval-specific statistics
  // ============================================================================

  /**
   * Calculate interval power (average power in current interval)
   */
  const intervalPower = computed(() => {
    if (!workout.value || !dataPoints.value || dataPoints.value.length === 0) return 0;

    const currentInterval = getCurrentIntervalIndex(elapsedSeconds.value, workout.value);
    if (currentInterval === -1 || currentInterval.index === -1) return 0;

    const startTime = currentInterval.startTime;
    const endTime = startTime + (currentInterval.interval?.duration || 0);

    // Filter data points within current interval
    const intervalData = dataPoints.value.filter(point =>
      point.timestamp >= startTime && point.timestamp <= endTime
    );

    if (intervalData.length === 0) return 0;

    // Calculate average power
    const totalPower = intervalData.reduce((sum, point) => sum + point.power, 0);
    return Math.round(totalPower / intervalData.length);
  });

  /**
   * Calculate interval heart rate (average HR in current interval)
   */
  const intervalHeartRate = computed(() => {
    if (!workout.value || !dataPoints.value || dataPoints.value.length === 0) return 0;

    const currentInterval = getCurrentIntervalIndex(elapsedSeconds.value, workout.value);
    if (currentInterval === -1 || currentInterval.index === -1) return 0;

    const startTime = currentInterval.startTime;
    const endTime = startTime + (currentInterval.interval?.duration || 0);

    // Filter data points within current interval
    const intervalData = dataPoints.value.filter(point =>
      point.timestamp >= startTime && point.timestamp <= endTime
    );

    if (intervalData.length === 0) return 0;

    // Calculate average heart rate
    const totalHR = intervalData.reduce((sum, point) => sum + point.heartRate, 0);
    return Math.round(totalHR / intervalData.length);
  });

  /**
   * Calculate remaining time in current interval
   */
  const intervalRemainingTime = computed(() => {
    if (!workout.value) return 0;

    const currentInterval = getCurrentIntervalIndex(elapsedSeconds.value, workout.value);
    if (currentInterval === -1 || currentInterval.index === -1) return 0;

    const startTime = currentInterval.startTime;
    const endTime = startTime + (currentInterval.interval?.duration || 0);
    const remaining = endTime - elapsedSeconds.value;

    return Math.max(0, Math.round(remaining));
  });

  /**
   * Formatted interval remaining time (MM:SS)
   */
  const formattedIntervalRemainingTime = computed(() => {
    const remaining = intervalRemainingTime.value;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  // ============================================================================
  // Return public API
  // ============================================================================

  return {
    // Session-wide stats
    avgPower,
    avgHeartRate,
    avgCadence,
    maxPower,
    maxHeartRate,
    energy,

    // Interval-specific stats
    intervalPower,
    intervalHeartRate,
    intervalRemainingTime,
    formattedIntervalRemainingTime
  };
}
