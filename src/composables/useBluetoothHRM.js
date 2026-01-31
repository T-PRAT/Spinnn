import { ref } from 'vue';
import { Connectable, ConnectionStatus } from '../utils/Connectable.js';
import { heartRateMonitorFilter, SERVICES, CHARACTERISTICS } from '../utils/web-ble.js';
import { xf } from '../utils/EventDispatcher.js';
import { parseHeartRateMeasurement } from '../utils/bluetoothParser.js';

/**
 * Heart Rate Monitor Bluetooth Composable
 * Singleton pattern - state is shared across all components
 *
 * Features:
 * - Auto-reconnect on disconnect
 * - Event-driven data streaming
 * - Connection state tracking
 * - Clean resource management
 */

// Singleton state - shared across all components
const heartRate = ref(0);
const isConnected = ref(false);
const isConnecting = ref(false);
const isReconnecting = ref(false);
const error = ref(null);
const deviceName = ref('');
const status = ref(ConnectionStatus.disconnected);

let connectable = null;
let unsubscribers = [];
let isInitialized = false;

export function useBluetoothHRM() {

  /**
   * Initialize the Connectable instance (only once for singleton)
   */
  function initConnectable() {
    if (isInitialized) return;
    isInitialized = true;

    connectable = new Connectable({
      name: 'hrm',
      filter: heartRateMonitorFilter,
      autoReconnect: true,
      reconnectDelay: 1000,
      reconnectTimeout: 60000,

      // Service configuration
      services: [{
        name: 'heartRate',
        serviceUuid: SERVICES.heartRate,
        characteristicUuid: CHARACTERISTICS.heartRateMeasurement,
        onData: handleHeartRateData,
      }],

      // Lifecycle callbacks
      onConnected: (device) => {
        deviceName.value = device.name || 'Unknown HR Monitor';
        isConnected.value = true;
        isConnecting.value = false;
        isReconnecting.value = false;
        error.value = null;
      },

      onDisconnected: () => {
        isConnected.value = false;
        isConnecting.value = false;
        heartRate.value = 0;
      },

      onData: (serviceName, data) => {
        // This is called by the service's onData handler
      },
    });

    // Subscribe to connection status events
    unsubscribers.push(
      xf.sub('hrm:status', (newStatus) => {
        status.value = newStatus;
        isConnecting.value = newStatus === ConnectionStatus.connecting;
        isReconnecting.value = newStatus === ConnectionStatus.reconnecting;
      }),

      xf.sub('hrm:connected', (info) => {
        isConnected.value = true;
        deviceName.value = info.name;
      }),

      xf.sub('hrm:disconnected', () => {
        isConnected.value = false;
        heartRate.value = 0;
      }),

      xf.sub('hrm:error', (err) => {
        error.value = err.message || err.toString();
      })
    );
  }

  /**
   * Handle heart rate measurement data
   */
  function handleHeartRateData(dataView) {
    const { heartRate: hr } = parseHeartRateMeasurement(dataView);

    // Accept any valid heart rate value (> 0 and reasonable < 250 bpm)
    if (hr > 0 && hr < 250) {
      heartRate.value = hr;

      // Dispatch to event system for other components
      xf.dispatch('heartRate', {
        value: hr,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Connect to a heart rate monitor
   * @param {Object} options
   * @param {boolean} [options.autoReconnect=true] - Enable auto-reconnect
   */
  async function connect(options = {}) {
    if (!navigator.bluetooth) {
      error.value = 'Web Bluetooth API is not available in this browser.';
      return false;
    }

    try {
      initConnectable();

      // Update auto-reconnect setting if provided
      if (typeof options.autoReconnect === 'boolean') {
        connectable.config.autoReconnect = options.autoReconnect;
      }

      isConnecting.value = true;
      error.value = null;

      await connectable.connect({
        requesting: true,
        watching: false,
      });

      return true;
    } catch (err) {
      if (!err.message.includes('User cancelled')) {
        error.value = err.message;
      }
      isConnecting.value = false;
      isConnected.value = false;
      return false;
    }
  }

  /**
   * Disconnect from the device
   */
  async function disconnect() {
    if (connectable) {
      await connectable.disconnect();
    }

    isConnected.value = false;
    isConnecting.value = false;
    isReconnecting.value = false;
    heartRate.value = 0;
    deviceName.value = '';
  }

  /**
   * Reconnect to the last device (if paired)
   */
  async function reconnect() {
    if (!connectable?.deviceId) {
      error.value = 'No previous device to reconnect to';
      return false;
    }

    try {
      isReconnecting.value = true;
      error.value = null;

      await connectable.connect({
        requesting: false,
        watching: false,
        deviceId: connectable.deviceId,
      });

      return true;
    } catch (err) {
      error.value = err.message;
      isReconnecting.value = false;
      return false;
    }
  }

  /**
   * Cancel auto-reconnect
   */
  function cancelReconnect() {
    if (connectable) {
      connectable.cancelReconnect();
    }
    isReconnecting.value = false;
  }

  // Note: No onUnmounted cleanup for singleton - connection persists across components

  return {
    // State
    heartRate,
    isConnected,
    isConnecting,
    isReconnecting,
    error,
    deviceName,
    status,

    // Methods
    connect,
    disconnect,
    reconnect,
    cancelReconnect,

    // Internal (for debugging)
    get connectable() {
      return connectable;
    },
  };
}
