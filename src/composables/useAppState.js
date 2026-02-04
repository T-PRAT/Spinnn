import { ref, computed, readonly } from 'vue';
import { DEFAULT_POWER_ZONES, DEFAULT_FTP } from '@/constants/zones';
import { useStorage } from './useStorage';

const storage = useStorage();

// Singleton state - shared across all components
const currentStep = ref(1);
const selectedWorkout = ref(null);
const ftp = ref(storage.getFtp());
const devicesConnected = ref(false);
const mockModeActive = ref(false);

const powerZones = ref(storage.getPowerZones());

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
    if (storage.setFtp(value)) {
      ftp.value = value;
    }
  }

  function setPowerZones(zones) {
    if (storage.setPowerZones(zones)) {
      powerZones.value = zones;
    }
  }

  function resetPowerZones() {
    const defaultZones = { ...DEFAULT_POWER_ZONES };
    if (storage.setPowerZones(defaultZones)) {
      powerZones.value = defaultZones;
    }
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
