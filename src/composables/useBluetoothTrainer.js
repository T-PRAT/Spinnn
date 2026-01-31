import { ref } from 'vue';
import { Connectable, ConnectionStatus } from '../utils/Connectable.js';
import { smartTrainerFilter, SERVICES, CHARACTERISTICS } from '../utils/web-ble.js';
import { xf } from '../utils/EventDispatcher.js';
import { parseCyclingPowerMeasurement, calculateCadence, calculateSpeed } from '../utils/bluetoothParser.js';

/**
 * Smart Trainer Bluetooth Composable
 * Singleton pattern - state is shared across all components
 *
 * Features:
 * - Auto-reconnect on disconnect
 * - Event-driven data streaming
 * - Connection state tracking
 * - Support for multiple service types (Cycling Power, CSC)
 * - FTMS control (ERG mode, Simulation, Resistance)
 * - Clean resource management
 */

// Control modes
export const ControlMode = {
  ERG: 'erg',           // Target power mode
  SIM: 'sim',           // Simulation mode (grade/slope)
  RESISTANCE: 'resistance', // Direct resistance control
  PASSIVE: 'passive',   // No control (free ride)
};

// FTMS Control Point opcodes
const FTMS_OPCODES = {
  REQUEST_CONTROL: 0x00,
  RESET: 0x01,
  SET_TARGET_RESISTANCE: 0x04,
  SET_TARGET_POWER: 0x05,
  SET_INDOOR_BIKE_SIMULATION: 0x11,
  RESPONSE_CODE: 0x80,
};

// FTMS Result codes
const FTMS_RESULTS = {
  SUCCESS: 0x01,
  NOT_SUPPORTED: 0x02,
  INVALID_PARAMETER: 0x03,
  OPERATION_FAILED: 0x04,
  CONTROL_NOT_PERMITTED: 0x05,
};

// Singleton state - shared across all components
const power = ref(0);
const cadence = ref(0);
const speed = ref(0);
const isConnected = ref(false);
const isConnecting = ref(false);
const isReconnecting = ref(false);
const error = ref(null);
const deviceName = ref('');
const status = ref(ConnectionStatus.disconnected);

// FTMS control state
const controlMode = ref(ControlMode.ERG);
const targetPower = ref(0);
const targetResistance = ref(0);
const targetGrade = ref(0);
const hasControl = ref(false);
const ftmsSupported = ref(false);

let connectable = null;
let unsubscribers = [];
let isInitialized = false;

// FTMS control point characteristic
let ftmsControlPoint = null;
let ftmsServer = null;

// State for cadence/speed calculations
let lastCrankRevs = null;
let lastCrankTime = null;
let lastWheelRevs = null;
let lastWheelTime = null;

export function useBluetoothTrainer() {

  /**
   * Initialize the Connectable instance (only once for singleton)
   */
  function initConnectable() {
    if (isInitialized) return;
    isInitialized = true;

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
      onConnected: async (device) => {
        deviceName.value = device.name || 'Unknown Trainer';
        isConnected.value = true;
        isConnecting.value = false;
        isReconnecting.value = false;
        error.value = null;

        // Try to setup FTMS control (for ERG mode)
        if (connectable?.server) {
          await setupFTMSControl(connectable.server);
        }
      },

      onDisconnected: () => {
        isConnected.value = false;
        isConnecting.value = false;
        resetData();
        // Reset FTMS state
        hasControl.value = false;
        ftmsControlPoint = null;
        ftmsServer = null;
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
        const calculatedCadence = calculateCadence(
          data.crankRevolutions,
          lastCrankRevs,
          data.lastCrankEventTime,
          lastCrankTime
        );
        // Only update cadence if we got a valid value (> 0)
        // This prevents drops when BLE events have duplicate timestamps
        if (calculatedCadence > 0) {
          cadence.value = calculatedCadence;
        }
      }
      lastCrankRevs = data.crankRevolutions;
      lastCrankTime = data.lastCrankEventTime;
    }

    if (data.wheelRevolutions !== null && data.lastWheelEventTime !== null) {
      if (lastWheelRevs !== null && lastWheelTime !== null) {
        const calculatedSpeed = calculateSpeed(
          data.wheelRevolutions,
          lastWheelRevs,
          data.lastWheelEventTime,
          lastWheelTime
        );
        // Only update speed if we got a valid value (> 0)
        if (calculatedSpeed > 0) {
          speed.value = calculatedSpeed;
        }
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
        const calculatedCadence = calculateCadence(crankRevs, lastCrankRevs, crankTime, lastCrankTime);
        // Only update cadence if we got a valid value (> 0)
        if (calculatedCadence > 0) {
          cadence.value = calculatedCadence;
        }
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
        const calculatedSpeed = calculateSpeed(wheelRevs, lastWheelRevs, wheelTime, lastWheelTime);
        // Only update speed if we got a valid value (> 0)
        if (calculatedSpeed > 0) {
          speed.value = calculatedSpeed;
        }
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
   * Setup FTMS control after connection
   */
  async function setupFTMSControl(server) {
    try {
      ftmsServer = server;
      const ftmsService = await server.getPrimaryService(SERVICES.fitnessMachine);
      ftmsControlPoint = await ftmsService.getCharacteristic(CHARACTERISTICS.fitnessMachineControlPoint);

      // Enable notifications for control point responses
      await ftmsControlPoint.startNotifications();
      ftmsControlPoint.addEventListener('characteristicvaluechanged', handleFTMSResponse);

      ftmsSupported.value = true;
      console.log('[Trainer] FTMS Control Point setup successful');

      // Request control automatically
      await requestControl();

      return true;
    } catch (err) {
      console.warn('[Trainer] FTMS not supported or setup failed:', err.message);
      ftmsSupported.value = false;
      return false;
    }
  }

  /**
   * Handle FTMS Control Point responses
   */
  function handleFTMSResponse(event) {
    const data = event.target.value;
    const responseCode = data.getUint8(0);

    if (responseCode === FTMS_OPCODES.RESPONSE_CODE) {
      const requestOpcode = data.getUint8(1);
      const result = data.getUint8(2);

      const resultName = Object.keys(FTMS_RESULTS).find(k => FTMS_RESULTS[k] === result) || 'UNKNOWN';
      console.log(`[Trainer] FTMS Response: opcode=${requestOpcode}, result=${resultName}`);

      if (requestOpcode === FTMS_OPCODES.REQUEST_CONTROL) {
        hasControl.value = (result === FTMS_RESULTS.SUCCESS);
        if (hasControl.value) {
          console.log('[Trainer] Control granted');
        } else {
          console.warn('[Trainer] Control request failed:', resultName);
        }
      }
    }
  }

  /**
   * Request control of the trainer
   */
  async function requestControl() {
    if (!ftmsControlPoint) {
      console.warn('[Trainer] FTMS not available');
      return false;
    }

    try {
      const buffer = new ArrayBuffer(1);
      const view = new DataView(buffer);
      view.setUint8(0, FTMS_OPCODES.REQUEST_CONTROL);
      await ftmsControlPoint.writeValue(buffer);
      console.log('[Trainer] Requested control');
      return true;
    } catch (err) {
      console.error('[Trainer] Failed to request control:', err);
      return false;
    }
  }

  /**
   * Set target power (ERG mode)
   * @param {number} watts - Target power in watts
   */
  async function setTargetPower(watts) {
    if (!ftmsControlPoint || !hasControl.value) {
      console.warn('[Trainer] Cannot set power - no control');
      return false;
    }

    // Clamp to reasonable range
    const clampedWatts = Math.max(0, Math.min(2000, Math.round(watts)));

    try {
      const buffer = new ArrayBuffer(3);
      const view = new DataView(buffer);
      view.setUint8(0, FTMS_OPCODES.SET_TARGET_POWER);
      view.setInt16(1, clampedWatts, true); // Little-endian signed int16
      await ftmsControlPoint.writeValue(buffer);

      targetPower.value = clampedWatts;
      controlMode.value = ControlMode.ERG;
      console.log(`[Trainer] Set target power: ${clampedWatts}W`);
      return true;
    } catch (err) {
      console.error('[Trainer] Failed to set target power:', err);
      return false;
    }
  }

  /**
   * Set simulation parameters (SIM mode)
   * @param {number} grade - Grade/slope in percentage (-100 to +100)
   * @param {number} [windSpeed=0] - Wind speed in m/s
   * @param {number} [crr=0.004] - Rolling resistance coefficient
   * @param {number} [cw=0.51] - Wind resistance coefficient (drag * area)
   */
  async function setSimulation(grade, windSpeed = 0, crr = 0.004, cw = 0.51) {
    if (!ftmsControlPoint || !hasControl.value) {
      console.warn('[Trainer] Cannot set simulation - no control');
      return false;
    }

    // Clamp grade to -45% to +45%
    const clampedGrade = Math.max(-45, Math.min(45, grade));

    try {
      const buffer = new ArrayBuffer(7);
      const view = new DataView(buffer);
      view.setUint8(0, FTMS_OPCODES.SET_INDOOR_BIKE_SIMULATION);
      view.setInt16(1, Math.round(windSpeed * 1000), true); // Wind speed in 0.001 m/s
      view.setInt16(3, Math.round(clampedGrade * 100), true); // Grade in 0.01%
      view.setUint8(5, Math.round(crr * 10000)); // CRR in 0.0001
      view.setUint8(6, Math.round(cw * 100)); // CW in 0.01 kg/m
      await ftmsControlPoint.writeValue(buffer);

      targetGrade.value = clampedGrade;
      controlMode.value = ControlMode.SIM;
      console.log(`[Trainer] Set simulation: grade=${clampedGrade}%`);
      return true;
    } catch (err) {
      console.error('[Trainer] Failed to set simulation:', err);
      return false;
    }
  }

  /**
   * Set resistance level (RESISTANCE mode)
   * @param {number} level - Resistance level 0-100%
   */
  async function setResistance(level) {
    if (!ftmsControlPoint || !hasControl.value) {
      console.warn('[Trainer] Cannot set resistance - no control');
      return false;
    }

    // Clamp to 0-100%
    const clampedLevel = Math.max(0, Math.min(100, level));

    try {
      const buffer = new ArrayBuffer(2);
      const view = new DataView(buffer);
      view.setUint8(0, FTMS_OPCODES.SET_TARGET_RESISTANCE);
      view.setUint8(1, Math.round(clampedLevel * 2)); // Resolution is 0.5%
      await ftmsControlPoint.writeValue(buffer);

      targetResistance.value = clampedLevel;
      controlMode.value = ControlMode.RESISTANCE;
      console.log(`[Trainer] Set resistance: ${clampedLevel}%`);
      return true;
    } catch (err) {
      console.error('[Trainer] Failed to set resistance:', err);
      return false;
    }
  }

  /**
   * Set control mode
   * @param {string} mode - One of ControlMode values
   */
  function setControlMode(mode) {
    if (Object.values(ControlMode).includes(mode)) {
      controlMode.value = mode;
      console.log(`[Trainer] Control mode set to: ${mode}`);
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

  // Note: No onUnmounted cleanup for singleton - connection persists across components

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

    // FTMS control state
    controlMode,
    targetPower,
    targetResistance,
    targetGrade,
    hasControl,
    ftmsSupported,

    // Connection methods
    connect,
    disconnect,
    reconnect,
    cancelReconnect,

    // FTMS control methods
    setTargetPower,
    setSimulation,
    setResistance,
    setControlMode,
    requestControl,

    // Internal (for debugging)
    get connectable() {
      return connectable;
    },
  };
}
