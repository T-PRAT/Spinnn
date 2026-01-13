/**
 * Web Bluetooth Utility Module
 * Based on OK's architecture - provides UUIDs, filters, and browser detection
 */

/**
 * Bluetooth Service UUIDs
 */
export const SERVICES = {
  heartRate: 0x180D,
  cyclingPower: 0x1818,
  cyclingSpeedCadence: 0x1816,
  fitnessMachine: 0x1826,
  battery: 0x180F,
  deviceInformation: 0x180A,
};

/**
 * Bluetooth Characteristic UUIDs
 */
export const CHARACTERISTICS = {
  // Heart Rate Service
  heartRateMeasurement: 0x2A37,

  // Cycling Power Service
  cyclingPowerMeasurement: 0x2A63,
  cyclingPowerFeature: 0x2A65,
  cyclingPowerControlPoint: 0x2A66,
  sensorLocation: 0x2A5D,

  // Cycling Speed and Cadence
  cscMeasurement: 0x2A5B,
  cscFeature: 0x2A5C,

  // Fitness Machine Service
  fitnessMachineFeature: 0x2ACC,
  indoorBikeData: 0x2AD2,
  fitnessMachineControlPoint: 0x2AD9,
  fitnessMachineStatus: 0x2ADA,
  supportedResistanceLevelRange: 0x2AD6,
  supportedPowerRange: 0x2AD8,

  // Battery Service
  batteryLevel: 0x2A19,

  // Device Information
  manufacturerName: 0x2A29,
  modelNumber: 0x2A24,
  serialNumber: 0x2A25,
  firmwareRevision: 0x2A26,
  hardwareRevision: 0x2A27,
};

/**
 * Check if Web Bluetooth API is available
 * Requires HTTPS or localhost + compatible browser (Chrome/Edge)
 * @returns {boolean}
 */
export function isBluetoothAvailable() {
  return !!navigator?.bluetooth?.requestDevice;
}

/**
 * Check if getDevices() is supported (Chrome 85+)
 * @returns {boolean}
 */
export function supportsGetDevices() {
  return isBluetoothAvailable() &&
    typeof navigator.bluetooth.getDevices === 'function';
}

/**
 * Check if watchAdvertisements() is supported (Chrome 85+)
 * @returns {boolean}
 */
export function supportsWatchAdvertisements() {
  // We can't fully check this without a device object, but Chrome 85+ supports it
  return isBluetoothAvailable();
}

/**
 * Get all previously paired devices
 * @returns {Promise<BluetoothDevice[]>}
 */
export async function getPairedDevices() {
  if (!supportsGetDevices()) {
    throw new Error('getDevices() is not supported in this browser');
  }

  try {
    const devices = await navigator.bluetooth.getDevices();
    return devices;
  } catch (error) {
    console.error('Failed to get paired devices:', error);
    throw error;
  }
}

/**
 * Get device by ID from paired devices
 * @param {string} deviceId
 * @returns {Promise<BluetoothDevice|null>}
 */
export async function getPairedDeviceById(deviceId) {
  try {
    const devices = await getPairedDevices();
    return devices.find(device => device.id === deviceId) || null;
  } catch (error) {
    console.error(`Failed to get device ${deviceId}:`, error);
    return null;
  }
}

/**
 * Filter for Heart Rate Monitor
 */
export function heartRateMonitorFilter() {
  return {
    filters: [{ services: [SERVICES.heartRate] }],
    optionalServices: [
      SERVICES.battery,
      SERVICES.deviceInformation,
    ]
  };
}

/**
 * Filter for Smart Trainer (Cycling Power, CSC, or FTMS)
 * FTMS is included as optional service to enable ERG mode control
 */
export function smartTrainerFilter() {
  return {
    filters: [
      { services: [SERVICES.cyclingPower] },
      { services: [SERVICES.cyclingSpeedCadence] },
      { services: [SERVICES.fitnessMachine] },
    ],
    optionalServices: [
      SERVICES.fitnessMachine,
      SERVICES.cyclingPower,
      SERVICES.cyclingSpeedCadence,
      SERVICES.heartRate,
      SERVICES.battery,
      SERVICES.deviceInformation,
    ]
  };
}

/**
 * Generic filter that excludes already connected devices
 * Useful for preventing duplicate connections
 * @param {BluetoothDevice[]} excludeDevices
 */
export function genericFilterWithExclusions(excludeDevices = []) {
  const exclusionFilters = excludeDevices
    .filter(device => device?.gatt?.connected)
    .map(device => ({ name: device?.name ?? 'unknown' }))
    .filter(filter => filter.name !== 'unknown');

  return {
    filters: [
      { services: [SERVICES.heartRate] },
      { services: [SERVICES.cyclingPower] },
      { services: [SERVICES.cyclingSpeedCadence] },
      { services: [SERVICES.fitnessMachine] },
    ],
    optionalServices: [
      SERVICES.battery,
      SERVICES.deviceInformation,
    ],
    exclusionFilters,
  };
}

/**
 * Convert 16-bit UUID to full 128-bit UUID string
 * @param {number} shortUuid - 16-bit UUID (e.g., 0x180D)
 * @returns {string} Full UUID string (e.g., '0000180d-0000-1000-8000-00805f9b34fb')
 */
export function shortUuidToFull(shortUuid) {
  const hex = shortUuid.toString(16).padStart(4, '0');
  return `0000${hex}-0000-1000-8000-00805f9b34fb`;
}

/**
 * Convert full UUID string to 16-bit UUID number
 * @param {string} fullUuid - Full UUID string
 * @returns {number} 16-bit UUID number
 */
export function fullUuidToShort(fullUuid) {
  const match = fullUuid.match(/0000([0-9a-f]{4})-0000-1000-8000-00805f9b34fb/i);
  if (match) {
    return parseInt(match[1], 16);
  }
  return null;
}
