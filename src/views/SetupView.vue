<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import WorkoutSelector from '../components/WorkoutSelector.vue';
import DeviceConnector from '../components/DeviceConnector.vue';
import BluetoothDebug from '../components/BluetoothDebug.vue';
import { useAppState } from '../composables/useAppState';
import { useWorkoutSession } from '../composables/useWorkoutSession';

const router = useRouter();
const appState = useAppState();
const session = useWorkoutSession();

const isDeviceReady = ref(false);

function handleWorkoutSelected(workout) {
  appState.setWorkout(workout);
}

function handleDeviceStatusChange(status) {
  isDeviceReady.value = status.isConnected || status.isMockMode;
  appState.setDevicesConnected(status.isConnected);
  appState.setMockModeActive(status.isMockMode);
}

function handleDataUpdate() {}

const canStart = computed(() => {
  return appState.selectedWorkout.value !== null && isDeviceReady.value;
});

function startWorkout() {
  if (canStart.value) {
    session.start(appState.selectedWorkout.value, appState.ftp.value);
    appState.startWorkout();
    router.push({ name: 'workout' });
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="text-center mb-8">
      <h2 class="text-3xl font-bold text-foreground tracking-tight">Preparez votre entrainement</h2>
      <p class="text-muted-foreground mt-2">Selectionnez un workout et connectez vos capteurs</p>
    </div>

    <BluetoothDebug />

    <div class="bg-card rounded-lg p-6 shadow border border-border">
      <WorkoutSelector @workout-selected="handleWorkoutSelected" />
    </div>

    <div class="bg-card rounded-lg p-6 shadow border border-border">
      <DeviceConnector
        @device-status-change="handleDeviceStatusChange"
        @data-update="handleDataUpdate"
      />
    </div>

    <div class="flex justify-center pt-6">
      <button
        @click="startWorkout"
        :disabled="!canStart"
        :class="[
          'px-8 py-4 rounded-lg text-lg font-bold transition-all transform',
          canStart
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105 shadow-lg'
            : 'bg-muted text-muted-foreground cursor-not-allowed'
        ]"
      >
        <span class="flex items-center gap-3">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
          Demarrer l'entrainement
        </span>
      </button>
    </div>

    <div v-if="!canStart" class="text-center">
      <p v-if="!appState.selectedWorkout.value" class="text-chart-1 text-sm font-medium">
        Selectionnez un entrainement ci-dessus
      </p>
      <p v-else-if="!isDeviceReady" class="text-chart-1 text-sm font-medium">
        Connectez vos capteurs ou activez le mode simulation
      </p>
    </div>
  </div>
</template>
