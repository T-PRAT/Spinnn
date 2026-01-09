import { ref, computed, readonly } from 'vue';

// Singleton state - shared across all components
const currentStep = ref(1);
const selectedWorkout = ref(null);
const ftp = ref(200);
const devicesConnected = ref(false);
const mockModeActive = ref(false);

// Default power zones (as % of FTP)
const defaultZones = {
  z1: { min: 0, max: 55, name: 'Z1 - Récupération active' },
  z2: { min: 56, max: 75, name: 'Z2 - Endurance' },
  z3: { min: 76, max: 90, name: 'Z3 - Tempo' },
  z4: { min: 91, max: 105, name: 'Z4 - Seuil' },
  z5: { min: 106, max: 120, name: 'Z5 - VO2max' },
  z6: { min: 121, max: 150, name: 'Z6 - Anaérobie' }
};

const powerZones = ref({ ...defaultZones });

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
    powerZones.value = { ...defaultZones };
    localStorage.setItem('spinnn_power_zones', JSON.stringify(defaultZones));
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
