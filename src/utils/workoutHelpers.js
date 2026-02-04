/**
 * Workout utility functions
 * Centralized helper functions for workout calculations and formatting
 */

/**
 * Get the color for an interval based on its power zone
 * @param {string} type - The interval type (warmup, cooldown, etc.)
 * @param {number} power - Power as decimal (e.g., 0.67 = 67% FTP)
 * @param {object} powerZones - Power zones configuration
 * @returns {string} CSS color value
 */
export function getIntervalColor(type, power, powerZones) {
  // Convert power to percentage (power is in decimal, e.g., 0.67 = 67%)
  const powerPercent = (power || 0.7) * 100;

  // Get CSS variable values from computed style
  const computedStyle = getComputedStyle(document.documentElement);

  if (powerPercent <= powerZones.z1.max) {
    return computedStyle.getPropertyValue("--zone-z1").trim();
  }
  if (powerPercent <= powerZones.z2.max) {
    return computedStyle.getPropertyValue("--zone-z2").trim();
  }
  if (powerPercent <= powerZones.z3.max) {
    return computedStyle.getPropertyValue("--zone-z3").trim();
  }
  if (powerPercent <= powerZones.z4.max) {
    return computedStyle.getPropertyValue("--zone-z4").trim();
  }
  if (powerPercent <= powerZones.z5.max) {
    return computedStyle.getPropertyValue("--zone-z5").trim();
  }
  if (powerPercent <= powerZones.z6.max) {
    return computedStyle.getPropertyValue("--zone-z6").trim();
  }
  return computedStyle.getPropertyValue("--zone-z7").trim();
}

/**
 * Flatten nested workout intervals (handles repeat blocks)
 * @param {Array} intervals - Array of workout intervals
 * @returns {Array} Flattened array of intervals
 */
export function flattenIntervals(intervals) {
  const flattened = [];

  function processIntervals(intervalList) {
    intervalList.forEach(interval => {
      if (interval.type === 'repeat' && interval.intervals) {
        // Process repeat block
        for (let i = 0; i < (interval.repeat || 1); i++) {
          processIntervals(interval.intervals);
        }
      } else {
        // Regular interval
        flattened.push(interval);
      }
    });
  }

  processIntervals(intervals);
  return flattened;
}

/**
 * Get the current interval index and details based on elapsed time
 * @param {number} elapsedSeconds - Elapsed workout time in seconds
 * @param {object} workout - Workout object with intervals
 * @returns {object|number} Object with {index, startTime, interval} or -1 if not found
 */
export function getCurrentIntervalIndex(elapsedSeconds, workout) {
  if (!workout || !workout.intervals) return -1;

  const flatIntervals = flattenIntervals(workout.intervals);
  let accumulatedTime = 0;

  for (let i = 0; i < flatIntervals.length; i++) {
    const interval = flatIntervals[i];
    const intervalDuration = interval.duration || 0;

    if (elapsedSeconds < accumulatedTime + intervalDuration) {
      return { index: i, startTime: accumulatedTime, interval };
    }

    accumulatedTime += intervalDuration;
  }

  // Return last interval if we're past the end
  const lastInterval = flatIntervals[flatIntervals.length - 1];
  return {
    index: flatIntervals.length - 1,
    startTime: accumulatedTime - (lastInterval?.duration || 0),
    interval: lastInterval
  };
}

/**
 * Format duration in seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "5:30")
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format duration in seconds to human-readable format (e.g., "5min 30s")
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "5min 30s" or "5min")
 */
export function formatDurationLong(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
}
