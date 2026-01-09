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

export function useWorkoutSession() {

  function start(selectedWorkout, userFtp) {
    if (isActive.value) return;
    
    workout.value = selectedWorkout;
    ftp.value = userFtp;
    startTime.value = new Date();
    elapsedSeconds.value = 0;
    dataPoints.value = [];
    lastDistance = 0;
    isActive.value = true;
    
    intervalId = setInterval(() => {
      elapsedSeconds.value++;
    }, 1000);
  }

  function stop() {
    if (!isActive.value) return;
    
    isActive.value = false;
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
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function resume() {
    if (!isActive.value || !isPaused.value) return;
    isPaused.value = false;
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
    recordDataPoint
  };
}
