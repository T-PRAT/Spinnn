/**
 * Workout data management
 * Handles data point recording and distance tracking
 */

import { ref, readonly } from 'vue';

// Singleton state - shared across all components
const dataPoints = ref([]);
let lastDistance = 0;
let dataPointIndex = 0;

export function useWorkoutData() {
  /**
   * Record a new data point during workout
   * @param {Object} data - Data point containing power, heartRate, cadence, speed
   * @param {number} elapsedSeconds - Current elapsed time in seconds
   * @param {boolean} isActive - Whether workout is currently active
   */
  function recordDataPoint(data, elapsedSeconds, isActive) {
    if (!isActive) return;

    const distanceIncrement = data.speed > 0 ? data.speed * 1 : 0;
    lastDistance += distanceIncrement;

    dataPoints.value.push({
      timestamp: elapsedSeconds,
      power: data.power || 0,
      heartRate: data.heartRate || 0,
      cadence: data.cadence || 0,
      speed: data.speed || 0,
      distance: Math.round(lastDistance)
    });

    dataPointIndex++;

    // Return whether we should save state (every 10 points)
    return dataPoints.value.length % 10 === 0;
  }

  /**
   * Reset all data points and distance
   */
  function reset() {
    dataPoints.value = [];
    lastDistance = 0;
    dataPointIndex = 0;
  }

  /**
   * Load data points from saved state
   * @param {Array} savedPoints - Array of data points to restore
   * @param {number} savedDistance - Last distance value to restore
   */
  function loadDataPoints(savedPoints, savedDistance = 0) {
    dataPoints.value = savedPoints || [];
    lastDistance = savedDistance;
    dataPointIndex = dataPoints.value.length;
  }

  /**
   * Get current distance
   */
  function getDistance() {
    return lastDistance;
  }

  return {
    // State (readonly)
    dataPoints: readonly(dataPoints),

    // Methods
    recordDataPoint,
    reset,
    loadDataPoints,
    getDistance
  };
}
