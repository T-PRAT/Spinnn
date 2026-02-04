/**
 * Bluetooth Low Energy (BLE) constants and configurations
 */

/**
 * BLE time resolution for cadence and speed calculations
 * Time values are in 1/1024 second units
 */
export const BLE_TIME_RESOLUTION = 1024;

/**
 * Default delay before attempting reconnection (in milliseconds)
 */
export const DEFAULT_RECONNECT_DELAY = 1000;

/**
 * Default timeout for watchAdvertisements during reconnection (in milliseconds)
 */
export const DEFAULT_RECONNECT_TIMEOUT = 60000;

/**
 * Default wheel circumference for speed calculation (in meters)
 * 2.105m = 700c x 25mm tire (standard road bike)
 */
export const DEFAULT_WHEEL_CIRCUMFERENCE = 2.105;

/**
 * BLE GATT Service UUIDs
 */
export const BLE_SERVICES = {
  HEART_RATE: 0x180D,
  CYCLING_POWER: 0x1818,
  CYCLING_SPEED_CADENCE: 0x1816,
  FITNESS_MACHINE: 0x1826
};

/**
 * BLE GATT Characteristic UUIDs
 */
export const BLE_CHARACTERISTICS = {
  HEART_RATE_MEASUREMENT: 0x2A37,
  CYCLING_POWER_MEASUREMENT: 0x2A63,
  CYCLING_POWER_FEATURE: 0x2A65,
  CYCLING_POWER_CONTROL_POINT: 0x2A66,
  CSC_MEASUREMENT: 0x2A5B,
  FITNESS_MACHINE_FEATURE: 0x2ACC,
  INDOOR_BIKE_DATA: 0x2AD2,
  TRAINING_STATUS: 0x2AD3,
  FITNESS_MACHINE_CONTROL_POINT: 0x2AD9,
  FITNESS_MACHINE_STATUS: 0x2ADA
};
