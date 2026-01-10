import { ref, onUnmounted } from 'vue';
import { Connectable, ConnectionStatus } from '../utils/Connectable.js';
import { smartTrainerFilter, SERVICES, CHARACTERISTICS } from '../utils/web-ble.js';
import { xf } from '../utils/EventDispatcher.js';
import { parseCyclingPowerMeasurement, calculateCadence, calculateSpeed } from '../utils/bluetoothParser.js';

/**
 * Smart Trainer Bluetooth Composable
 * Refactored to use Connectable base class with auto-reconnect support
 *
 * Features:
 * - Auto-reconnect on disconnect
 * - Event-driven data streaming
 * - Connection state tracking
 * - Support for multiple service types (Cycling Power, CSC)
 * - Clean resource management
 */
export function useBluetoothTrainer() {
  const power = ref(0);
  const cadence = ref(0);
  const speed = ref(0);
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const isReconnecting = ref(false);
  const error = ref(null);
  const deviceName = ref('');
  const status = ref(ConnectionStatus.disconnected);

  let connectable = null;
  let unsubscribers = [];

  // State for cadence/speed calculations
  let lastCrankRevs = null;
  let lastCrankTime = null;
  let lastWheelRevs = null;
  let lastWheelTime = null;

  /**
   * Initialize the Connectable instance
   */
  function initConnectable() {
    if (connectable) return;

    connectable = new Connectable({
      name: 'trainer',
      filter: smartTrainerFilter,
      autoReconnect: true,
      reconnectDelay: 1000,
      reconnectTimeout: 60000,

      // Service configuration - will try multiple services
      services: [{
        name: 'cyclingPower',
        serviceUuid: SERVICES.cyclingPower,
        characteristicUuid: CHARACTERISTICS.cyclingPowerMeasurement,
        onData: handleCyclingPowerData,
      }, {
        name: 'csc',
        serviceUuid: SERVICES.cyclingSpeedCadence,
        characteristicUuid: CHARACTERISTICS.cscMeasurement,
        onData: handleCSCData,
      }],

      // Lifecycle callbacks
      onConnected: (device) => {
        deviceName.value = device.name || 'Unknown Trainer';
        isConnected.value = true;
        isConnecting.value = false;
        isReconnecting.value = false;
        error.value = null;
      },

      onDisconnected: () => {
        isConnected.value = false;
        isConnecting.value = false;
        resetData();
      },

      onData: (serviceName, data) => {
        // This is called by the service's onData handler
      },
    });

    // Subscribe to connection status events
    unsubscribers.push(
      xf.sub('trainer:status', (newStatus) => {
        status.value = newStatus;
        isConnecting.value = newStatus === ConnectionStatus.connecting;
        isReconnecting.value = newStatus === ConnectionStatus.reconnecting;
      }),

      xf.sub('trainer:connected', (info) => {
        isConnected.value = true;
        deviceName.value = info.name;
      }),

      xf.sub('trainer:disconnected', () => {
        isConnected.value = false;
        resetData();
      }),

      xf.sub('trainer:error', (err) => {
        error.value = err.message || err.toString();
      })
    );
  }

  /**
   * Reset data state
   */
  function resetData() {
    power.value = 0;
    cadence.value = 0;
    speed.value = 0;
    lastCrankRevs = null;
    lastCrankTime = null;
    lastWheelRevs = null;
    lastWheelTime = null;
  }

  /**
   * Handle cycling power measurement data
   */
  function handleCyclingPowerData(dataView) {
    const data = parseCyclingPowerMeasurement(dataView);

    power.value = data.power;

    if (data.crankRevolutions !== null && data.lastCrankEventTime !== null) {
      if (lastCrankRevs !== null && lastCrankTime !== null) {
        cadence.value = calculateCadence(
          data.crankRevolutions,
          lastCrankRevs,
          data.lastCrankEventTime,
          lastCrankTime
        );
      }
      lastCrankRevs = data.crankRevolutions;
      lastCrankTime = data.lastCrankEventTime;
    }

    if (data.wheelRevolutions !== null && data.lastWheelEventTime !== null) {
      if (lastWheelRevs !== null && lastWheelTime !== null) {
        speed.value = calculateSpeed(
          data.wheelRevolutions,
          lastWheelRevs,
          data.lastWheelEventTime,
          lastWheelTime
        );
      }
      lastWheelRevs = data.wheelRevolutions;
      lastWheelTime = data.lastWheelEventTime;
    }

    // Dispatch to event system for other components
    xf.dispatch('power', {
      value: power.value,
      timestamp: Date.now(),
    });

    if (cadence.value > 0) {
      xf.dispatch('cadence', {
        value: cadence.value,
        timestamp: Date.now(),
      });
    }

    if (speed.value > 0) {
      xf.dispatch('speed', {
        value: speed.value,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Handle CSC (Cycling Speed and Cadence) measurement data
   */
  function handleCSCData(dataView) {
    // CSC feature flag is at byte 0
    const flags = dataView.getUint8(0);
    let offset = 1;

    // Check if crank revolution data is present (bit 0)
    const hasCrankData = (flags & 0x01) !== 0;
    // Check if wheel revolution data is present (bit 1)
    const hasWheelData = (flags & 0x02) !== 0;

    if (hasCrankData) {
      const crankRevs = dataView.getUint16(offset, true);
      offset += 2;
      const crankTime = dataView.getUint16(offset, true);
      offset += 2;

      if (lastCrankRevs !== null && lastCrankTime !== null) {
        cadence.value = calculateCadence(crankRevs, lastCrankRevs, crankTime, lastCrankTime);
      }

      lastCrankRevs = crankRevs;
      lastCrankTime = crankTime;

      xf.dispatch('cadence', {
        value: cadence.value,
        timestamp: Date.now(),
      });
    }

    if (hasWheelData) {
      const wheelRevs = dataView.getUint32(offset, true);
      offset += 4;
      const wheelTime = dataView.getUint16(offset, true);
      offset += 2;

      if (lastWheelRevs !== null && lastWheelTime !== null) {
        speed.value = calculateSpeed(wheelRevs, lastWheelRevs, wheelTime, lastWheelTime);
      }

      lastWheelRevs = wheelRevs;
      lastWheelTime = wheelTime;

      xf.dispatch('speed', {
        value: speed.value,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Connect to a smart trainer
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
      error.value = err.message;
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
    resetData();
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

  /**
   * Clean up on unmount
   */
  onUnmounted(() => {
    // Unsubscribe from events
    unsubscribers.forEach(unsub => unsub());
    unsubscribers = [];

    // Disconnect and cleanup
    if (connectable) {
      connectable.config.autoReconnect = false;
      connectable.cancelReconnect();
      connectable.disconnect();
      connectable = null;
    }
  });

  return {
    // State
    power,
    cadence,
    speed,
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
