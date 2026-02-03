/**
 * Platform Detection Utility
 * Detects whether the app is running in Tauri (desktop) or web environment
 */

/**
 * Check if running in Tauri desktop environment
 * @returns {boolean}
 */
export function isTauri() {
  // Check for Tauri's internal API marker
  return window.__TAURI__ !== undefined;
}

/**
 * Get the current platform
 * @returns {'desktop' | 'web'}
 */
export function platform() {
  return isTauri() ? 'desktop' : 'web';
}

/**
 * Get the operating system
 * @returns {'windows' | 'macos' | 'linux' | 'unknown'}
 */
export function os() {
  if (isTauri()) {
    // In Tauri, we can use the Tauri API to get the OS
    // For now, return a simple detection
    return navigator.platform.toLowerCase();
  }

  // Web platform detection
  const platform = navigator.platform.toLowerCase();

  if (platform.includes('win')) return 'windows';
  if (platform.includes('mac') || platform.includes('darwin')) return 'macos';
  if (platform.includes('linux')) return 'linux';

  return 'unknown';
}

/**
 * Check if Web Bluetooth API is available
 * In Tauri, this will use the native backend instead
 * @returns {boolean}
 */
export function isBluetoothAvailable() {
  if (isTauri()) {
    // In Tauri, Bluetooth is handled by the Rust backend
    // We'll check availability via invoke
    return true; // Placeholder - actual check would use invoke
  }

  return !!navigator?.bluetooth?.requestDevice;
}

/**
 * Check if the platform supports native notifications
 * @returns {boolean}
 */
export function supportsNativeNotifications() {
  if (isTauri()) return true;
  return 'Notification' in window;
}

/**
 * Check if the platform supports persistent storage
 * @returns {boolean}
 */
export function supportsPersistentStorage() {
  if (isTauri()) return true;
  return 'storage' in navigator && 'persist' in navigator.storage;
}
