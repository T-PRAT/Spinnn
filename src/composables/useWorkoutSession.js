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
