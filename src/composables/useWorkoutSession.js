import { ref, computed } from 'vue';

// Singleton state - shared across all components
const isActive = ref(false);
const startTime = ref(null);
const elapsedSeconds = ref(0);
const dataPoints = ref([]);
const workout = ref(null);
const ftp = ref(200);
const isPaused = ref(false);

let intervalId = null;
let lastDistance = 0;

// Storage key for workout persistence
const WORKOUT_STORAGE_KEY = 'spinnn_active_workout';

// Load saved workout state on module init
function loadWorkoutState() {
  const savedState = localStorage.getItem(WORKOUT_STORAGE_KEY);
  if (savedState) {
    try {
      const parsed = JSON.parse(savedState);
      // Check if the saved workout is less than 24 hours old
      const savedTime = new Date(parsed.savedAt);
      const now = new Date();
      const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

      if (hoursDiff < 24 && parsed.isActive) {
        workout.value = parsed.workout;
        elapsedSeconds.value = parsed.elapsedSeconds;
        dataPoints.value = parsed.dataPoints || [];
        ftp.value = parsed.ftp;
        isPaused.value = true; // Always resume in paused state
        isActive.value = true;
        startTime.value = new Date(parsed.startTime);
        lastDistance = parsed.lastDistance || 0;

        return true;
      } else {
        // Clear old workout state
        localStorage.removeItem(WORKOUT_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to load workout state:', e);
      localStorage.removeItem(WORKOUT_STORAGE_KEY);
    }
  }
  return false;
}

// Save current workout state
function saveWorkoutState() {
  if (!isActive.value || !workout.value) {
    localStorage.removeItem(WORKOUT_STORAGE_KEY);
    return;
  }

  const state = {
    isActive: isActive.value,
    startTime: startTime.value.toISOString(),
    elapsedSeconds: elapsedSeconds.value,
    dataPoints: dataPoints.value,
    workout: workout.value,
    ftp: ftp.value,
    isPaused: isPaused.value,
    lastDistance: lastDistance,
    savedAt: new Date().toISOString()
  };

  localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(state));
}

// Clear saved workout state
function clearWorkoutState() {
  localStorage.removeItem(WORKOUT_STORAGE_KEY);
}

// Auto-load saved state on module init (when app starts)
let hasLoadedState = false;

export function useWorkoutSession() {
  // Try to load saved state on first use
  if (!hasLoadedState) {
    hasLoadedState = true;
    loadWorkoutState();
  }

  function start(selectedWorkout, userFtp) {
    if (isActive.value) return;

    workout.value = selectedWorkout;
    ftp.value = userFtp;
    startTime.value = new Date();
    elapsedSeconds.value = 0;
    dataPoints.value = [];
    lastDistance = 0;
    isActive.value = true;

    saveWorkoutState();

    intervalId = setInterval(() => {
      elapsedSeconds.value++;
    }, 1000);
  }

  function stop() {
    if (!isActive.value) return;

    isActive.value = false;
    clearWorkoutState();

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function reset() {
    stop();
    startTime.value = null;
    elapsedSeconds.value = 0;
    dataPoints.value = [];
    workout.value = null;
    isPaused.value = false;
    lastDistance = 0;
  }

  function pause() {
    if (!isActive.value || isPaused.value) return;
    isPaused.value = true;
    saveWorkoutState();

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function resume() {
    if (!isActive.value || !isPaused.value) return;
    isPaused.value = false;
    saveWorkoutState();

    intervalId = setInterval(() => {
      elapsedSeconds.value++;
    }, 1000);
  }

  function recordDataPoint(data) {
    if (!isActive.value) return;

    const distanceIncrement = data.speed > 0 ? data.speed * 1 : 0;
    lastDistance += distanceIncrement;

    dataPoints.value.push({
      timestamp: elapsedSeconds.value,
      power: data.power || 0,
      heartRate: data.heartRate || 0,
      cadence: data.cadence || 0,
      speed: data.speed || 0,
      distance: Math.round(lastDistance)
    });

    // Save state every 10 data points (every 10 seconds)
    if (dataPoints.value.length % 10 === 0) {
      saveWorkoutState();
    }
  }

  const formattedElapsedTime = computed(() => {
    const mins = Math.floor(elapsedSeconds.value / 60);
    const secs = elapsedSeconds.value % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  const formattedWorkoutDuration = computed(() => {
    if (!workout.value) return '0:00';
    const mins = Math.floor(workout.value.duration / 60);
    const secs = workout.value.duration % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  const sessionData = computed(() => ({
    startTime: startTime.value,
    endTime: isActive.value ? null : new Date(startTime.value.getTime() + elapsedSeconds.value * 1000),
    ftp: ftp.value,
    workoutName: workout.value?.name || 'Unknown',
    totalDistance: lastDistance,
    dataPoints: dataPoints.value
  }));

  const isWorkoutComplete = computed(() => {
    if (!workout.value) return false;
    return elapsedSeconds.value >= workout.value.duration;
  });

  // Helper function to flatten intervals (including nested repeat blocks)
  function flattenIntervals(intervals) {
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

  // Calculate current interval index based on elapsed time
  function getCurrentIntervalIndex(elapsedSeconds, workout) {
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

    return { index: flatIntervals.length - 1, startTime: accumulatedTime - (flatIntervals[flatIntervals.length - 1]?.duration || 0), interval: flatIntervals[flatIntervals.length - 1] };
  }

  // Calculate interval power (average power in current interval)
  const intervalPower = computed(() => {
    if (!workout.value || dataPoints.value.length === 0) return 0;

    const currentInterval = getCurrentIntervalIndex(elapsedSeconds.value, workout.value);
    if (currentInterval.index === -1) return 0;

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

  // Calculate interval heart rate (average HR in current interval)
  const intervalHeartRate = computed(() => {
    if (!workout.value || dataPoints.value.length === 0) return 0;

    const currentInterval = getCurrentIntervalIndex(elapsedSeconds.value, workout.value);
    if (currentInterval.index === -1) return 0;

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

  // Calculate remaining time in current interval
  const intervalRemainingTime = computed(() => {
    if (!workout.value) return 0;

    const currentInterval = getCurrentIntervalIndex(elapsedSeconds.value, workout.value);
    if (currentInterval.index === -1) return 0;

    const startTime = currentInterval.startTime;
    const endTime = startTime + (currentInterval.interval?.duration || 0);
    const remaining = endTime - elapsedSeconds.value;

    return Math.max(0, Math.round(remaining));
  });

  const formattedIntervalRemainingTime = computed(() => {
    const remaining = intervalRemainingTime.value;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  // Calculate energy expended in kcal
  // Formula: Energy (kJ) = Power (W) × Time (s) / 1000
  // Energy (kcal) ≈ Energy (kJ) × 0.239
  const energy = computed(() => {
    if (dataPoints.value.length === 0) return 0;

    // Sum of power readings over time gives total work in joules
    // Each data point represents 1 second, so we sum all power values
    const totalWorkJoules = dataPoints.value.reduce((sum, point) => sum + (point.power || 0), 0);

    // Convert to kJ then to kcal (1 kJ ≈ 0.239 kcal)
    const totalWorkKJ = totalWorkJoules / 1000;
    return Math.round(totalWorkKJ * 0.239);
  });

  // Average power for entire session
  const avgPower = computed(() => {
    if (dataPoints.value.length === 0) return 0;
    const totalPower = dataPoints.value.reduce((sum, point) => sum + (point.power || 0), 0);
    return totalPower / dataPoints.value.length;
  });

  // Average heart rate for entire session
  const avgHeartRate = computed(() => {
    const validHR = dataPoints.value.filter(point => point.heartRate > 0);
    if (validHR.length === 0) return 0;
    const totalHR = validHR.reduce((sum, point) => sum + point.heartRate, 0);
    return totalHR / validHR.length;
  });

  // Average cadence for entire session
  const avgCadence = computed(() => {
    const validCadence = dataPoints.value.filter(point => point.cadence > 0);
    if (validCadence.length === 0) return 0;
    const totalCadence = validCadence.reduce((sum, point) => sum + point.cadence, 0);
    return totalCadence / validCadence.length;
  });

  // Maximum power for entire session
  const maxPower = computed(() => {
    if (dataPoints.value.length === 0) return 0;
    return Math.max(...dataPoints.value.map(point => point.power || 0));
  });

  // Maximum heart rate for entire session
  const maxHeartRate = computed(() => {
    const validHR = dataPoints.value.filter(point => point.heartRate > 0);
    if (validHR.length === 0) return 0;
    return Math.max(...validHR.map(point => point.heartRate));
  });

  return {
    isActive,
    startTime,
    elapsedSeconds,
    dataPoints,
    workout,
    ftp,
    isPaused,
    formattedElapsedTime,
    formattedWorkoutDuration,
    sessionData,
    isWorkoutComplete,
    intervalPower,
    intervalHeartRate,
    intervalRemainingTime,
    formattedIntervalRemainingTime,
    energy,
    avgPower,
    avgHeartRate,
    avgCadence,
    maxPower,
    maxHeartRate,
    getCurrentIntervalIndex,
    start,
    stop,
    reset,
    pause,
    resume,
    recordDataPoint,
    loadWorkoutState,
    clearWorkoutState
  };
}
