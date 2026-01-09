import { ref, computed, readonly } from 'vue';

// Singleton state - shared across all components
const currentStep = ref(1);
const selectedWorkout = ref(null);
const ftp = ref(200);
const devicesConnected = ref(false);
const mockModeActive = ref(false);

// Load FTP from localStorage on module init
const storedFtp = localStorage.getItem('spinnn_ftp');
if (storedFtp) {
  ftp.value = parseInt(storedFtp, 10);
}

export function useAppState() {
  const canStartWorkout = computed(() => {
    return selectedWorkout.value !== null &&
           (devicesConnected.value || mockModeActive.value);
  });

  function setWorkout(workout) {
    selectedWorkout.value = workout;
  }

  function setDevicesConnected(connected) {
    devicesConnected.value = connected;
  }

  function setMockModeActive(active) {
    mockModeActive.value = active;
  }

  function setFtp(value) {
    ftp.value = value;
    localStorage.setItem('spinnn_ftp', value.toString());
  }

  function goToStep(step) {
    if (step >= 1 && step <= 3) {
      currentStep.value = step;
    }
  }

  function startWorkout() {
    if (canStartWorkout.value) {
      currentStep.value = 2;
    }
  }

  function finishWorkout() {
    currentStep.value = 3;
  }

  function restartFromBeginning() {
    selectedWorkout.value = null;
    currentStep.value = 1;
  }

  return {
    currentStep: readonly(currentStep),
    selectedWorkout: readonly(selectedWorkout),
    ftp: readonly(ftp),
    devicesConnected: readonly(devicesConnected),
    mockModeActive: readonly(mockModeActive),
    canStartWorkout,
    setWorkout,
    setDevicesConnected,
    setMockModeActive,
    setFtp,
    goToStep,
    startWorkout,
    finishWorkout,
    restartFromBeginning
  };
}
