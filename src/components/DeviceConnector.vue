<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useBluetoothHRM } from '../composables/useBluetoothHRM';
import { useBluetoothTrainer } from '../composables/useBluetoothTrainer';
import { useMockDevices } from '../composables/useMockDevices';

const hrm = useBluetoothHRM();
const trainer = useBluetoothTrainer();
const mockDevices = useMockDevices();

const bluetoothSupported = ref(false);
const bluetoothMessage = ref('');
const useMockMode = ref(false);

onMounted(() => {
  checkBluetoothSupport();
});

function checkBluetoothSupport() {
  if (!navigator.bluetooth) {
    bluetoothSupported.value = false;
    bluetoothMessage.value = 'Web Bluetooth API is not available in this browser.';
    return;
  }

  if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    bluetoothSupported.value = false;
    bluetoothMessage.value = 'Web Bluetooth requires HTTPS or localhost.';
    return;
  }

  bluetoothSupported.value = !!navigator.bluetooth;
}

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

const emit = defineEmits(['data-update', 'device-status-change']);

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
    <div v-if="!bluetoothSupported" class="p-4 bg-chart-1/10 border border-chart-1/30 rounded-lg">
      <p class="text-chart-1 text-sm font-medium mb-2">
        Bluetooth Non Disponible
      </p>
      <p class="text-chart-1/80 text-xs mb-3">
        {{ bluetoothMessage }}
      </p>
      <div class="space-y-2">
        <p class="text-chart-1 text-xs font-semibold">Sur Linux Chrome, activez Web Bluetooth:</p>
        <ol class="text-chart-1/80 text-xs list-decimal list-inside space-y-1 ml-2">
          <li>Ouvrez <code class="bg-chart-1/20 px-1 py-0.5 rounded">chrome://flags/#enable-web-bluetooth</code></li>
          <li>Activez l'option</li>
          <li>Redemarrez Chrome</li>
        </ol>
      </div>
    </div>

    <div v-else-if="!useMockMode" class="p-4 bg-chart-3/10 border border-chart-3/30 rounded-lg">
      <p class="text-chart-3 text-sm flex items-center gap-2">
        <span class="font-medium">Web Bluetooth est pret!</span> Cliquez sur les boutons ci-dessous pour connecter vos appareils.
      </p>
    </div>

    <div v-if="bluetoothSupported === true" class="p-3 bg-muted rounded-lg">
      <div class="flex items-center justify-between">
        <p class="text-foreground text-xs font-medium">
          {{ useMockMode ? 'Mode Mock Actif - Donnees simulees' : 'Mode Dev/Test Disponible' }}
        </p>
        <button
          v-if="!useMockMode"
          @click="enableMockMode"
          class="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/80 transition-colors text-xs font-medium"
        >
          Activer Mode Mock
        </button>
        <button
          v-else
          @click="disableMockMode"
          class="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-xs font-medium"
        >
          Desactiver Mode Mock
        </button>
      </div>
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
              'w-3 h-3 rounded-full',
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

        <div v-else>
          <button
            @click="connectHRM"
            :disabled="hrm.isConnecting.value || !bluetoothSupported"
            class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            {{ hrm.isConnecting.value ? 'Connexion...' : 'Connecter Cardio' }}
          </button>
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
              'w-3 h-3 rounded-full',
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

        <div v-else>
          <button
            @click="connectTrainer"
            :disabled="trainer.isConnecting.value || !bluetoothSupported"
            class="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            {{ trainer.isConnecting.value ? 'Connexion...' : 'Connecter Trainer' }}
          </button>
          <p v-if="trainer.error.value" class="text-xs text-destructive mt-2">{{ trainer.error.value }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
