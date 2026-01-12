<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useBluetoothHRM } from '../../composables/useBluetoothHRM';
import { useBluetoothTrainer } from '../../composables/useBluetoothTrainer';
import { useMockDevices } from '../../composables/useMockDevices';
import { isBluetoothAvailable } from '../../utils/web-ble.js';

const hrm = useBluetoothHRM();
const trainer = useBluetoothTrainer();
const mockDevices = useMockDevices();

const bluetoothSupported = ref(false);
const useMockMode = ref(false);

onMounted(() => {
  bluetoothSupported.value = isBluetoothAvailable();
});

function enableMockMode() {
  useMockMode.value = true;
  mockDevices.start();
}

function disableMockMode() {
  useMockMode.value = false;
  mockDevices.stop();
}

async function connectHRM() {
  await hrm.connect();
}

async function connectTrainer() {
  await trainer.connect();
}

async function disconnectHRM() {
  await hrm.disconnect();
}

async function disconnectTrainer() {
  await trainer.disconnect();
}

async function reconnectHRM() {
  await hrm.reconnect();
}

async function reconnectTrainer() {
  await trainer.reconnect();
}

const emit = defineEmits(['data-update', 'device-status-change']);

defineExpose({
  useMockMode,
  enableMockMode,
  disableMockMode
});

const isConnected = computed(() => {
  return hrm.isConnected.value || trainer.isConnected.value;
});

watch([() => hrm.isConnected.value, () => trainer.isConnected.value, useMockMode], () => {
  emit('device-status-change', {
    isConnected: isConnected.value,
    isMockMode: useMockMode.value
  });
}, { immediate: true });

function emitDataUpdate() {
  if (useMockMode.value) {
    emit('data-update', {
      heartRate: mockDevices.heartRate.value,
      power: mockDevices.power.value,
      cadence: mockDevices.cadence.value,
      speed: mockDevices.speed.value
    });
  } else {
    emit('data-update', {
      heartRate: hrm.heartRate.value,
      power: trainer.power.value,
      cadence: trainer.cadence.value,
      speed: trainer.speed.value
    });
  }
}

setInterval(emitDataUpdate, 100);
</script>

<template>
  <div class="space-y-4">
    <!-- Bluetooth not supported -->
    <div v-if="!bluetoothSupported" class="p-4 bg-chart-1/10 border border-chart-1/30 rounded-lg">
      <p class="text-chart-1 text-sm font-medium">Bluetooth non disponible</p>
      <p class="text-chart-1/80 text-xs mt-1">Utilisez Chrome/Edge en HTTPS ou localhost</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="p-4 border border-border rounded-lg bg-card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-foreground flex items-center gap-2">
            <svg class="w-5 h-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            </svg>
            Cardio (HRM)
          </h3>
          <div
            :class="[
              'w-4 h-4 rounded-full',
              hrm.isConnected.value || useMockMode ? 'bg-chart-3' : 'bg-muted'
            ]"
          ></div>
        </div>

        <div v-if="useMockMode || hrm.isConnected.value" class="space-y-2">
          <p class="text-sm text-muted-foreground">{{ useMockMode ? 'Mock HR Monitor' : hrm.deviceName.value }}</p>
          <p class="text-3xl font-bold text-destructive">{{ useMockMode ? mockDevices.heartRate.value : hrm.heartRate.value }} <span class="text-sm text-muted-foreground">bpm</span></p>
          <button
            v-if="!useMockMode"
            @click="disconnectHRM"
            class="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            Deconnecter
          </button>
        </div>

        <div v-else-if="hrm.isReconnecting.value" class="space-y-2">
          <p class="text-sm text-muted-foreground">Reconnexion en cours...</p>
          <div class="flex items-center gap-2 text-chart-2 text-sm">
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Tentative de reconnexion auto</span>
          </div>
          <button
            @click="hrm.cancelReconnect()"
            class="w-full px-3 py-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
          >
            Annuler la reconnexion
          </button>
        </div>

        <div v-else>
          <button
            @click="connectHRM"
            :disabled="hrm.isConnecting.value || !bluetoothSupported"
            class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            {{ hrm.isConnecting.value ? 'Connexion...' : 'Connecter Cardio' }}
          </button>
          <div v-if="hrm.connectable?.deviceId" class="mt-2">
            <button
              @click="reconnectHRM"
              :disabled="hrm.isConnecting.value"
              class="w-full px-3 py-1.5 bg-chart-2 text-chart-2-foreground rounded-lg hover:bg-chart-2/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors text-sm"
            >
              Reconnecter au dernier appareil
            </button>
          </div>
          <p v-if="hrm.error.value" class="text-xs text-destructive mt-2">{{ hrm.error.value }}</p>
        </div>
      </div>

      <div class="p-4 border border-border rounded-lg bg-card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-foreground flex items-center gap-2">
            <svg class="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 11V7a1 1 0 112 0v4a1 1 0 11-2 0z" />
            </svg>
            Smart Trainer
          </h3>
          <div
            :class="[
              'w-4 h-4 rounded-full',
              trainer.isConnected.value || useMockMode ? 'bg-chart-3' : 'bg-muted'
            ]"
          ></div>
        </div>

        <div v-if="useMockMode || trainer.isConnected.value" class="space-y-2">
          <p class="text-sm text-muted-foreground">{{ useMockMode ? 'Mock Smart Trainer' : trainer.deviceName.value }}</p>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div>
              <p class="text-xs text-muted-foreground">Puissance</p>
              <p class="text-xl font-bold text-chart-1">{{ useMockMode ? mockDevices.power.value : trainer.power.value }}<span class="text-xs">W</span></p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Cadence</p>
              <p class="text-xl font-bold text-chart-2">{{ useMockMode ? mockDevices.cadence.value : trainer.cadence.value }}<span class="text-xs">rpm</span></p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Vitesse</p>
              <p class="text-xl font-bold text-primary">{{ useMockMode ? (mockDevices.speed.value * 3.6).toFixed(1) : (trainer.speed.value * 3.6).toFixed(1) }}<span class="text-xs">km/h</span></p>
            </div>
          </div>
          <button
            v-if="!useMockMode"
            @click="disconnectTrainer"
            class="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            Deconnecter
          </button>
        </div>

        <div v-else-if="trainer.isReconnecting.value" class="space-y-2">
          <p class="text-sm text-muted-foreground">Reconnexion en cours...</p>
          <div class="flex items-center gap-2 text-chart-2 text-sm">
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Tentative de reconnexion auto</span>
          </div>
          <button
            @click="trainer.cancelReconnect()"
            class="w-full px-3 py-1.5 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm"
          >
            Annuler la reconnexion
          </button>
        </div>

        <div v-else>
          <button
            @click="connectTrainer"
            :disabled="trainer.isConnecting.value || !bluetoothSupported"
            class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            {{ trainer.isConnecting.value ? 'Connexion...' : 'Connecter Trainer' }}
          </button>
          <div v-if="trainer.connectable?.deviceId" class="mt-2">
            <button
              @click="reconnectTrainer"
              :disabled="trainer.isConnecting.value"
              class="w-full px-3 py-1.5 bg-chart-2 text-chart-2-foreground rounded-lg hover:bg-chart-2/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors text-sm"
            >
              Reconnecter au dernier appareil
            </button>
          </div>
          <p v-if="trainer.error.value" class="text-xs text-destructive mt-2">{{ trainer.error.value }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
