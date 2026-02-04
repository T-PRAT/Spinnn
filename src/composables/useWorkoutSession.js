/**
 * Workout session management
 * Handles session state, timing, pause/resume, and persistence
 */

import { ref, computed } from 'vue';
import { getCurrentIntervalIndex } from '@/utils/workoutHelpers';
import { useStorage } from './useStorage';
import { useWorkoutData } from './useWorkoutData';
import { useWorkoutStats } from './useWorkoutStats';
import { logger } from '@/utils/logger';

const storage = useStorage();
const workoutData = useWorkoutData();

// Singleton state - shared across all components
const isActive = ref(false);
const startTime = ref(null);
const elapsedSeconds = ref(0);
const workout = ref(null);
const ftp = ref(200);
const isPaused = ref(false);

let intervalId = null;
let actualStartTime = null; // Real start time for precise elapsed calculation
let accumulatedPausedTime = 0; // Total time spent paused
let pauseStartTime = null; // When the current pause started

// Load saved workout state on module init
function loadWorkoutState() {
  const savedState = storage.getWorkoutSession();
  if (savedState) {
    try {
      // Check if the saved workout is less than 24 hours old
      const savedTime = new Date(savedState.savedAt);
      const now = new Date();
      const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

      if (hoursDiff < 24 && savedState.isActive) {
        workout.value = savedState.workout;
        elapsedSeconds.value = savedState.elapsedSeconds;
        workoutData.loadDataPoints(savedState.dataPoints || [], savedState.lastDistance || 0);
        ftp.value = savedState.ftp;
        isPaused.value = true; // Always resume in paused state
        isActive.value = true;
        startTime.value = new Date(savedState.startTime);

        return true;
      } else {
        // Clear old workout state
        storage.clearWorkoutSession();
      }
    } catch (e) {
      logger.error('Failed to load workout state:', e);
      storage.clearWorkoutSession();
    }
  }
  return false;
}

// Save current workout state
function saveWorkoutState() {
  if (!isActive.value || !workout.value) {
    storage.clearWorkoutSession();
    return;
  }

  const state = {
    isActive: isActive.value,
    startTime: startTime.value.toISOString(),
    elapsedSeconds: elapsedSeconds.value,
    dataPoints: workoutData.dataPoints.value,
    workout: workout.value,
    ftp: ftp.value,
    isPaused: isPaused.value,
    lastDistance: workoutData.getDistance(),
    savedAt: new Date().toISOString()
  };

  storage.setWorkoutSession(state);
}

// Clear saved workout state
function clearWorkoutState() {
  storage.clearWorkoutSession();
}

// Auto-load saved state on module init (when app starts)
let hasLoadedState = false;

export function useWorkoutSession() {
  // Try to load saved state on first use
  if (!hasLoadedState) {
    hasLoadedState = true;
    loadWorkoutState();
  }

  // Create stats composable with current refs
  const stats = useWorkoutStats(workoutData.dataPoints, workout, elapsedSeconds);

  // ============================================================================
  // Session Control
  // ============================================================================

  function start(selectedWorkout, userFtp) {
    if (isActive.value) return;

    workout.value = selectedWorkout;
    ftp.value = userFtp;
    startTime.value = new Date();
    actualStartTime = Date.now();
    accumulatedPausedTime = 0;
    pauseStartTime = null;
    elapsedSeconds.value = 0;
    workoutData.reset();
    isActive.value = true;

    saveWorkoutState();

    // Update elapsed time every 100ms based on real elapsed time
    intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - actualStartTime - accumulatedPausedTime) / 1000;
      elapsedSeconds.value = Math.max(0, Math.round(elapsed * 10) / 10); // Round to 1 decimal place
    }, 100);
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
    actualStartTime = null;
    elapsedSeconds.value = 0;
    workoutData.reset();
    workout.value = null;
    isPaused.value = false;
    accumulatedPausedTime = 0;
    pauseStartTime = null;
  }

  function pause() {
    if (!isActive.value || isPaused.value) return;
    isPaused.value = true;
    pauseStartTime = Date.now();
    saveWorkoutState();

    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function resume() {
    if (!isActive.value || !isPaused.value) return;
    isPaused.value = false;

    // Account for time spent paused
    if (pauseStartTime) {
      accumulatedPausedTime += Date.now() - pauseStartTime;
      pauseStartTime = null;
    }

    saveWorkoutState();

    // Update elapsed time every 100ms based on real elapsed time
    intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - actualStartTime - accumulatedPausedTime) / 1000;
      elapsedSeconds.value = Math.max(0, Math.round(elapsed * 10) / 10); // Round to 1 decimal place
    }, 100);
  }

  // ============================================================================
  // Data Recording
  // ============================================================================

  /**
   * Manually set elapsed time (used for skipping intervals)
   */
  function setElapsedSeconds(seconds) {
    if (!isActive.value) return;

    const now = Date.now();
    const targetElapsed = Math.max(0, seconds);

    // Adjust actualStartTime so that the elapsed time will be correct
    // This avoids conflicts with the interval timer
    actualStartTime = now - (targetElapsed * 1000) - accumulatedPausedTime;
    elapsedSeconds.value = Math.max(0, Math.round(targetElapsed * 10) / 10);

    saveWorkoutState();
  }

  /**
   * Record a new data point during workout
   */
  function recordDataPoint(data) {
    if (!isActive.value) return;

    const shouldSave = workoutData.recordDataPoint(data, elapsedSeconds.value, isActive.value);

    // Save state every 10 data points (every 10 seconds)
    if (shouldSave) {
      saveWorkoutState();
    }
  }

  // ============================================================================
  // Computed Properties
  // ============================================================================

  const formattedElapsedTime = computed(() => {
    // Use active elapsed time (time actually spent training, not including skips)
    const totalSeconds = Math.floor(activeElapsedSeconds.value);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  // Active elapsed time: actual training time (based on recorded data points, excluding pauses)
  const activeElapsedSeconds = computed(() => {
    if (!workoutData.dataPoints.value || workoutData.dataPoints.value.length === 0) return 0;
    // Each data point represents 1 second of active training
    return workoutData.dataPoints.value.length;
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
    totalDistance: workoutData.getDistance(),
    dataPoints: workoutData.dataPoints.value
  }));

  const isWorkoutComplete = computed(() => {
    if (!workout.value) return false;
    return elapsedSeconds.value >= workout.value.duration;
  });

  // ============================================================================
  // Return Public API
  // ============================================================================

  return {
    // State
    isActive,
    startTime,
    elapsedSeconds,
    activeElapsedSeconds,
    dataPoints: workoutData.dataPoints,
    workout,
    ftp,
    isPaused,

    // Formatted values
    formattedElapsedTime,
    formattedWorkoutDuration,

    // Session data
    sessionData,
    isWorkoutComplete,

    // Statistics (from useWorkoutStats)
    ...stats,

    // Helpers
    getCurrentIntervalIndex,

    // Control methods
    start,
    stop,
    reset,
    pause,
    resume,
    setElapsedSeconds,
    recordDataPoint,

    // Persistence
    loadWorkoutState,
    clearWorkoutState
  };
}
