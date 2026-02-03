/**
 * Bluetooth Factory Composable
 * Provides the appropriate Bluetooth implementation based on the platform
 * (Web Bluetooth vs Tauri native)
 */

import { isTauri } from '@/utils/platform';

// Lazy import the implementations to avoid loading unnecessary code
async function getHRMImplementation() {
  if (isTauri()) {
    const { useTauriBluetoothHRM } = await import('./useTauriBluetooth.js');
    return useTauriBluetoothHRM;
  } else {
    const { useBluetoothHRM } = await import('./useWebBluetooth.js');
    return useBluetoothHRM;
  }
}

async function getTrainerImplementation() {
  if (isTauri()) {
    const { useTauriBluetoothTrainer, ControlMode } = await import('./useTauriBluetooth.js');
    return { useTauriBluetoothTrainer, ControlMode };
  } else {
    const { useBluetoothTrainer, ControlMode } = await import('./useWebBluetooth.js');
    return { useBluetoothTrainer, ControlMode };
  }
}

/**
 * Get the appropriate HRM composable for the current platform
 * @returns {Function} The HRM composable
 */
export async function useBluetoothHRM() {
  const impl = await getHRMImplementation();
  return impl();
}

/**
 * Get the appropriate Trainer composable for the current platform
 * @returns {Function} The Trainer composable
 */
export async function useBluetoothTrainer() {
  const impl = await getTrainerImplementation();
  const composableName = isTauri() ? 'useTauriBluetoothTrainer' : 'useBluetoothTrainer';
  return impl[composableName]();
}

/**
 * Export ControlMode for convenience
 */
export { ControlMode } from './useTauriBluetooth.js';

/**
 * Re-export the non-async versions for direct use
 * These are useful when you know you want a specific implementation
 */
export { useTauriBluetoothHRM, useTauriBluetoothTrainer } from './useTauriBluetooth.js';
export { useWebBluetooth } from './useWebBluetooth.js';
