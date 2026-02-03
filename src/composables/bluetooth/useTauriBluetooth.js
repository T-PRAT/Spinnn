/**
 * Tauri Bluetooth Composable
 * Handles BLE communication via Tauri's native backend
 * Works as a drop-in replacement for useBluetoothHRM and useBluetoothTrainer in desktop mode
 */

import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

/**
 * Tauri Heart Rate Monitor Composable
 * Provides the same interface as useBluetoothHRM but uses Tauri commands
 */

const heartRate = ref(0);
const isConnected = ref(false);
const isConnecting = ref(false);
const isReconnecting = ref(false);
const error = ref(null);
const deviceName = ref('');

let hrmDeviceId = null;
let hrmUnlisten = null;

export function useTauriBluetoothHRM() {
  /**
   * Connect to a heart rate monitor
   */
  async function connect(options = {}) {
    try {
      isConnecting.value = true;
      error.value = null;

      // Check if Bluetooth is available
      const available = await invoke('ble_is_available');
      if (!available) {
        throw new Error('Bluetooth is not available on this system');
      }

      // Scan for heart rate devices
      const devices = await invoke('ble_scan', {
        serviceUuid: '0000180d-0000-1000-8000-00805f9b34fb',
      });

      if (devices.length === 0) {
        throw new Error('No heart rate monitors found');
      }

      // For now, just connect to the first device
      // In a real app, you'd show a device picker
      const device = devices[0];
      const connection = await invoke('ble_connect', { deviceId: device.id });

      hrmDeviceId = device.id;
      deviceName.value = connection.name || device.name || 'Unknown HR Monitor';
      isConnected.value = true;

      // Subscribe to heart rate measurements
      await invoke('ble_subscribe_hrm', { deviceId: device.id });

      // Set up event listener for heart rate data
      if (!hrmUnlisten) {
        hrmUnlisten = await listen('hrm:data', (event) => {
          const data = event.payload;
          heartRate.value = data.bpm;
        });
      }

      return true;
    } catch (err) {
      error.value = err.message || err.toString();
      isConnecting.value = false;
      isConnected.value = false;
      return false;
    }
  }

  /**
   * Disconnect from the device
   */
  async function disconnect() {
    try {
      if (hrmDeviceId) {
        await invoke('ble_disconnect', { deviceId: hrmDeviceId });
      }

      // Remove event listener
      if (hrmUnlisten) {
        await hrmUnlisten();
        hrmUnlisten = null;
      }

      isConnected.value = false;
      isConnecting.value = false;
      isReconnecting.value = false;
      heartRate.value = 0;
      deviceName.value = '';
      hrmDeviceId = null;
    } catch (err) {
      error.value = err.message || err.toString();
    }
  }

  return {
    heartRate,
    isConnected,
    isConnecting,
    isReconnecting,
    error,
    deviceName,
    connect,
    disconnect,
  };
}

/**
 * Tauri Smart Trainer Composable
 * Provides the same interface as useBluetoothTrainer but uses Tauri commands
 */

// Control modes matching the web version
export const ControlMode = {
  ERG: 'erg',
  SIM: 'sim',
  RESISTANCE: 'resistance',
  PASSIVE: 'passive',
};

const power = ref(0);
const cadence = ref(0);
const speed = ref(0);
const trainerIsConnected = ref(false);
const trainerIsConnecting = ref(false);
const trainerIsReconnecting = ref(false);
const trainerError = ref(null);
const trainerDeviceName = ref('');

// FTMS control state
const controlMode = ref(ControlMode.ERG);
const targetPower = ref(0);
const targetResistance = ref(0);
const targetGrade = ref(0);
const hasControl = ref(false);
const ftmsSupported = ref(false);

let trainerDeviceId = null;
let powerUnlisten = null;
let cscUnlisten = null;

export function useTauriBluetoothTrainer() {
  /**
   * Connect to a smart trainer
   */
  async function connect(options = {}) {
    try {
      trainerIsConnecting.value = true;
      trainerError.value = null;

      // Check if Bluetooth is available
      const available = await invoke('ble_is_available');
      if (!available) {
        throw new Error('Bluetooth is not available on this system');
      }

      // Scan for trainers (Cycling Power or FTMS)
      const powerDevices = await invoke('ble_scan', {
        serviceUuid: '00001818-0000-1000-8000-00805f9b34fb',
      });

      const ftmsDevices = await invoke('ble_scan', {
        serviceUuid: '00001826-0000-1000-8000-00805f9b34fb',
      });

      // Combine and deduplicate devices
      const allDevices = [...powerDevices];
      ftmsDevices.forEach((d) => {
        if (!allDevices.find((ad) => ad.id === d.id)) {
          allDevices.push(d);
        }
      });

      if (allDevices.length === 0) {
        throw new Error('No smart trainers found');
      }

      // For now, just connect to the first device
      const device = allDevices[0];
      const connection = await invoke('ble_connect', { deviceId: device.id });

      trainerDeviceId = device.id;
      trainerDeviceName.value = connection.name || device.name || 'Unknown Trainer';
      trainerIsConnected.value = true;

      // Subscribe to power measurements
      await invoke('ble_subscribe_power', { deviceId: device.id });

      // Subscribe to CSC measurements (for cadence/speed)
      await invoke('ble_subscribe_csc', { deviceId: device.id });

      // Set up event listeners for data
      if (!powerUnlisten) {
        powerUnlisten = await listen('power:data', (event) => {
          const data = event.payload;
          power.value = data.watts;
          if (data.cadence !== undefined) {
            cadence.value = data.cadence;
          }
        });
      }

      if (!cscUnlisten) {
        cscUnlisten = await listen('csc:data', (event) => {
          const data = event.payload;
          if (data.cadence !== undefined) {
            cadence.value = data.cadence;
          }
          if (data.speed !== undefined) {
            speed.value = data.speed;
          }
        });
      }

      ftmsSupported.value = true;
      hasControl.value = true;

      return true;
    } catch (err) {
      trainerError.value = err.message || err.toString();
      trainerIsConnecting.value = false;
      trainerIsConnected.value = false;
      return false;
    }
  }

  /**
   * Disconnect from the device
   */
  async function disconnect() {
    try {
      if (trainerDeviceId) {
        await invoke('ble_disconnect', { deviceId: trainerDeviceId });
      }

      // Remove event listeners
      if (powerUnlisten) {
        await powerUnlisten();
        powerUnlisten = null;
      }

      if (cscUnlisten) {
        await cscUnlisten();
        cscUnlisten = null;
      }

      trainerIsConnected.value = false;
      trainerIsConnecting.value = false;
      trainerIsReconnecting.value = false;
      power.value = 0;
      cadence.value = 0;
      speed.value = 0;
      trainerDeviceName.value = '';
      trainerDeviceId = null;
      hasControl.value = false;
      ftmsSupported.value = false;
    } catch (err) {
      trainerError.value = err.message || err.toString();
    }
  }

  /**
   * Set target power (ERG mode)
   */
  async function setTargetPower(watts) {
    try {
      if (!trainerDeviceId || !hasControl.value) {
        console.warn('[Tauri Trainer] Cannot set power - no control');
        return false;
      }

      const clampedWatts = Math.max(0, Math.min(2000, Math.round(watts)));
      await invoke('ble_set_target_power', {
        deviceId: trainerDeviceId,
        watts: clampedWatts,
      });

      targetPower.value = clampedWatts;
      controlMode.value = ControlMode.ERG;
      return true;
    } catch (err) {
      console.error('[Tauri Trainer] Failed to set target power:', err);
      return false;
    }
  }

  /**
   * Set simulation parameters (SIM mode)
   */
  async function setSimulation(grade, windSpeed = 0, crr = 0.004, cw = 0.51) {
    try {
      if (!trainerDeviceId || !hasControl.value) {
        console.warn('[Tauri Trainer] Cannot set simulation - no control');
        return false;
      }

      const clampedGrade = Math.max(-45, Math.min(45, grade));
      await invoke('ble_set_simulation', {
        deviceId: trainerDeviceId,
        grade: clampedGrade,
        windSpeed,
        crr,
        cw,
      });

      targetGrade.value = clampedGrade;
      controlMode.value = ControlMode.SIM;
      return true;
    } catch (err) {
      console.error('[Tauri Trainer] Failed to set simulation:', err);
      return false;
    }
  }

  /**
   * Set resistance level (RESISTANCE mode)
   */
  async function setResistance(level) {
    try {
      if (!trainerDeviceId || !hasControl.value) {
        console.warn('[Tauri Trainer] Cannot set resistance - no control');
        return false;
      }

      const clampedLevel = Math.max(0, Math.min(100, Math.round(level)));
      await invoke('ble_set_resistance', {
        deviceId: trainerDeviceId,
        level: clampedLevel,
      });

      targetResistance.value = clampedLevel;
      controlMode.value = ControlMode.RESISTANCE;
      return true;
    } catch (err) {
      console.error('[Tauri Trainer] Failed to set resistance:', err);
      return false;
    }
  }

  return {
    power,
    cadence,
    speed,
    isConnected: trainerIsConnected,
    isConnecting: trainerIsConnecting,
    isReconnecting: trainerIsReconnecting,
    error: trainerError,
    deviceName: trainerDeviceName,
    controlMode,
    targetPower,
    targetResistance,
    targetGrade,
    hasControl,
    ftmsSupported,
    connect,
    disconnect,
    setTargetPower,
    setSimulation,
    setResistance,
  };
}
