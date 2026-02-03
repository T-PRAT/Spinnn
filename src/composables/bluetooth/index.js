/**
 * Bluetooth Composables Barrel Export
 *
 * This module provides unified access to Bluetooth functionality
 * across both web and desktop (Tauri) platforms.
 *
 * Usage:
 *   import { useBluetoothHRM } from '@/composables/bluetooth'
 *   const hrm = useBluetoothHRM()
 *
 * The factory automatically selects the appropriate implementation
 * based on whether the app is running in Tauri or a web browser.
 */

export {
  useBluetoothHRM,
  useBluetoothTrainer,
  ControlMode,
  // Direct exports for specific platform implementations
  useTauriBluetoothHRM,
  useTauriBluetoothTrainer,
  useWebBluetooth,
} from './useBluetoothFactory.js';
