<script setup>
import { ref, onMounted } from 'vue';
import { useBluetoothHRM } from '../composables/useBluetoothHRM';
import { useBluetoothTrainer } from '../composables/useBluetoothTrainer';

const hrm = useBluetoothHRM();
const trainer = useBluetoothTrainer();

const debugInfo = ref({
  protocol: '',
  hostname: '',
  hasNavigator: false,
  hasBluetooth: false,
  bluetoothType: '',
  userAgent: '',
  platform: '',
  bluetoothAvailable: false,
  hasRequestDevice: false,
  requestDeviceType: '',
  testResult: ''
});

const isTesting = ref(false);

onMounted(() => {
  // Detailed bluetooth checking
  const hasBluetooth = !!navigator.bluetooth;
  const bluetoothType = typeof navigator.bluetooth;
  const hasRequestDevice = hasBluetooth && typeof navigator.bluetooth.requestDevice === 'function';

  debugInfo.value = {
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    hasNavigator: !!window.navigator,
    hasBluetooth: hasBluetooth,
    bluetoothType: bluetoothType,
    userAgent: navigator.userAgent,
    platform: navigator.platform || navigator.userAgentData?.platform || 'Unknown',
    bluetoothAvailable: !!(navigator.bluetooth && typeof navigator.bluetooth.getAvailability === 'function'),
    hasRequestDevice: hasRequestDevice,
    requestDeviceType: hasBluetooth ? typeof navigator.bluetooth.requestDevice : 'N/A'
  };
});

async function testBluetooth() {
  isTesting.value = true;
  debugInfo.value.testResult = 'Testing...';

  try {
    // First, check if navigator.bluetooth exists and is usable
    if (!navigator.bluetooth) {
      debugInfo.value.testResult = '✗ navigator.bluetooth is undefined or null.\n\nWeb Bluetooth API is not available in this browser.\n\nPossible causes:\n- Not using Chrome/Edge/Opera (Firefox/Safari do not support Web Bluetooth)\n- Web Bluetooth disabled in browser flags\n- Not using HTTPS or localhost';
      isTesting.value = false;
      return;
    }

    // Test if bluetooth.requestDevice is a function
    if (typeof navigator.bluetooth.requestDevice !== 'function') {
      debugInfo.value.testResult = `✗ navigator.bluetooth exists but requestDevice is not a function.\n\nType: ${typeof navigator.bluetooth}\n\nThis usually means:\n1. Web Bluetooth is not enabled in chrome://flags\n2. You need to enable: chrome://flags/#enable-experimental-web-platform-features\n3. Restart Chrome completely after enabling the flag`;
      isTesting.value = false;
      return;
    }

    // Test if bluetooth.getAvailability exists
    if (typeof navigator.bluetooth.getAvailability === 'function') {
      const available = await navigator.bluetooth.getAvailability();
      debugInfo.value.testResult = `Bluetooth Available: ${available}\n\n`;
    } else {
      debugInfo.value.testResult = 'getAvailability() not supported - this is normal on some Linux systems\n\n';
    }

    // Try to request a device to see if it prompts
    debugInfo.value.testResult += 'Attempting to request device... (this may prompt you)';
    try {
      await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['heart_rate', 'cycling_power']
      });
      debugInfo.value.testResult += '\n✓ Device request succeeded! Bluetooth is working.';
    } catch (error) {
      debugInfo.value.testResult += `\n✗ Device request failed: ${error.message}`;
      if (error.name === 'NotFoundError') {
        debugInfo.value.testResult += '\n(This is expected if you cancelled the dialog)';
      }
    }
  } catch (error) {
    debugInfo.value.testResult = `Error: ${error.message}`;
  } finally {
    isTesting.value = false;
  }
}

</script>

<template>
  <details class="bg-muted p-4 rounded-lg text-xs" open>
    <summary class="cursor-pointer font-semibold text-foreground mb-3">🔧 Bluetooth Debug Info</summary>
    <div class="space-y-3">
      <!-- Basic Info -->
      <div class="space-y-1 text-muted-foreground font-mono">
        <div><strong class="text-foreground">Platform:</strong> {{ debugInfo.platform }}</div>
        <div><strong class="text-foreground">Protocol:</strong> {{ debugInfo.protocol }}</div>
        <div><strong class="text-foreground">Hostname:</strong> {{ debugInfo.hostname }}</div>
        <div><strong class="text-foreground">Has Navigator:</strong> {{ debugInfo.hasNavigator }}</div>
        <div><strong class="text-foreground">Has Bluetooth:</strong> <span :class="debugInfo.hasBluetooth ? 'text-chart-3' : 'text-destructive'">{{ debugInfo.hasBluetooth }}</span></div>
        <div><strong class="text-foreground">Bluetooth Type:</strong> {{ debugInfo.bluetoothType }}</div>
        <div><strong class="text-foreground">requestDevice():</strong> <span :class="debugInfo.hasRequestDevice ? 'text-chart-3' : 'text-destructive'">{{ debugInfo.hasRequestDevice ? 'Available' : 'NOT Available' }}</span></div>
        <div v-if="debugInfo.hasBluetooth"><strong class="text-foreground">requestDevice Type:</strong> {{ debugInfo.requestDeviceType }}</div>
        <div><strong class="text-foreground">getAvailability():</strong> <span :class="debugInfo.bluetoothAvailable ? 'text-chart-3' : 'text-chart-1'">{{ debugInfo.bluetoothAvailable ? 'Supported' : 'Not Supported' }}</span></div>
        <div class="text-xs break-all"><strong class="text-foreground">User Agent:</strong> {{ debugInfo.userAgent }}</div>
      </div>

      <!-- Test Button -->
      <div class="pt-2 border-t border-border">
        <button
          @click="testBluetooth"
          :disabled="isTesting"
          class="px-3 py-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
        >
          {{ isTesting ? 'Testing...' : 'Test Bluetooth Connection' }}
        </button>
      </div>

      <!-- Test Results -->
      <div v-if="debugInfo.testResult" class="p-3 bg-card rounded border border-border">
        <pre class="text-xs whitespace-pre-wrap text-foreground">{{ debugInfo.testResult }}</pre>
      </div>

      <!-- Current Connection Status -->
      <div class="pt-2 border-t border-border">
        <div class="font-semibold text-foreground mb-2">Current Connection Status:</div>
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <div :class="['w-2 h-2 rounded-full', hrm.isConnected.value ? 'bg-chart-3' : 'bg-destructive']"></div>
            <span>HRM: {{ hrm.isConnected.value ? 'Connected' : 'Not Connected' }}</span>
            <span v-if="hrm.deviceName.value" class="text-muted-foreground">({{ hrm.deviceName.value }})</span>
          </div>
          <div class="flex items-center gap-2">
            <div :class="['w-2 h-2 rounded-full', trainer.isConnected.value ? 'bg-chart-3' : 'bg-destructive']"></div>
            <span>Trainer: {{ trainer.isConnected.value ? 'Connected' : 'Not Connected' }}</span>
            <span v-if="trainer.deviceName.value" class="text-muted-foreground">({{ trainer.deviceName.value }})</span>
          </div>
        </div>
      </div>

      <!-- Troubleshooting Tips -->
      <div class="pt-2 border-t border-border">
        <div class="font-semibold text-foreground mb-2">Linux Troubleshooting:</div>
        <div class="space-y-3 text-muted-foreground">
          <div>
            <p class="font-medium text-foreground mb-1">Required Chrome Flags:</p>
            <ol class="list-decimal list-inside space-y-1 text-xs">
              <li>
                Open <code class="bg-muted-foreground/20 px-1 rounded">chrome://flags/#enable-experimental-web-platform-features</code>
              </li>
              <li>Set to <strong>"Enabled"</strong></li>
              <li>Restart Chrome completely</li>
            </ol>
          </div>
          <div>
            <p class="font-medium text-foreground mb-1">Verify Bluetooth System Status:</p>
            <ul class="list-disc list-inside space-y-1 text-xs">
              <li><code class="bg-muted-foreground/20 px-1 rounded">bluetoothctl</code> - Check if Bluetooth is running</li>
              <li><code class="bg-muted-foreground/20 px-1 rounded">systemctl status bluetooth</code> - Verify service status</li>
              <li><code class="bg-muted-foreground/20 px-1 rounded">sudo systemctl start bluetooth</code> - Start if needed</li>
            </ul>
          </div>
          <div>
            <p class="font-medium text-foreground mb-1">Test Connection:</p>
            <p class="text-xs">Click the "Test Bluetooth Connection" button above to verify everything is working.</p>
          </div>
          <div class="p-2 bg-chart-3/10 border border-chart-3/30 rounded">
            <p class="text-xs text-chart-3 font-medium">💡 Pro Tip: These improvements add automatic retry logic and better error recovery, making connections more reliable on Linux!</p>
          </div>
        </div>
      </div>
    </div>
  </details>
</template>
