import { ref, computed, readonly } from 'vue';
import { DEFAULT_POWER_ZONES, DEFAULT_FTP } from '@/constants/zones';

// Singleton state - shared across all components
const currentStep = ref(1);
const selectedWorkout = ref(null);
const ftp = ref(DEFAULT_FTP);
const devicesConnected = ref(false);
const mockModeActive = ref(false);

const powerZones = ref({ ...DEFAULT_POWER_ZONES });

// Load FTP and zones from localStorage on module init
const storedFtp = localStorage.getItem('spinnn_ftp');
if (storedFtp) {
  ftp.value = parseInt(storedFtp, 10);
}

const storedZones = localStorage.getItem('spinnn_power_zones');
if (storedZones) {
  try {
    powerZones.value = JSON.parse(storedZones);
  } catch (e) {
    console.error('Failed to parse stored zones:', e);
  }
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

  function setPowerZones(zones) {
    powerZones.value = zones;
    localStorage.setItem('spinnn_power_zones', JSON.stringify(zones));
  }

  function resetPowerZones() {
    powerZones.value = { ...DEFAULT_POWER_ZONES };
    localStorage.setItem('spinnn_power_zones', JSON.stringify(DEFAULT_POWER_ZONES));
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
    selectedWorkout, // Not readonly to allow restoration from session
    ftp: readonly(ftp),
    powerZones: readonly(powerZones),
    devicesConnected: readonly(devicesConnected),
    mockModeActive: readonly(mockModeActive),
    canStartWorkout,
    setWorkout,
    setDevicesConnected,
    setMockModeActive,
    setFtp,
    setPowerZones,
    resetPowerZones,
    goToStep,
    startWorkout,
    finishWorkout,
    restartFromBeginning
  };
}
