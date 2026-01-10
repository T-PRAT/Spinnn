/**
 * Connectable - Base class for Bluetooth device connections
 * Inspired by OK's architecture - handles GATT connection, auto-reconnect, and state management
 *
 * Features:
 * - GATT connection management
 * - Auto-reconnect with watchAdvertisements() support
 * - Service discovery and characteristic setup
 * - Connection state tracking
 * - Event-driven architecture
 */

import { xf } from './EventDispatcher.js';
import { isBluetoothAvailable, supportsGetDevices, getPairedDeviceById, shortUuidToFull } from './web-ble.js';

/**
 * Connection status enum
 */
export const ConnectionStatus = {
  disconnected: 'disconnected',
  connecting: 'connecting',
  connected: 'connected',
  reconnecting: 'reconnecting',
  disconnecting: 'disconnecting',
};

/**
 * @typedef {Object} ServiceConfig
 * @property {string} name - Service name for logging
 * @property {number|string} serviceUuid - Service UUID
 * @property {number|string} characteristicUuid - Characteristic UUID
 * @property {Function} onData - Callback for data received
 * @property {Function} [onError] - Optional error callback
 */

/**
 * @typedef {Object} ConnectableConfig
 * @property {string} name - Device name (for logging)
 * @property {Function} filter - BLE filter function for requestDevice()
 * @property {ServiceConfig[]} services - Array of service configurations
 * @property {boolean} [autoReconnect] - Enable auto-reconnect on disconnect
 * @property {number} [reconnectDelay] - Delay before reconnect attempt (ms)
 * @property {number} [reconnectTimeout] - Timeout for watchAdvertisements (ms)
 * @property {Function} [onConnected] - Callback when connected
 * @property {Function} [onDisconnected] - Callback when disconnected
 * @property {Function} [onData] - Callback for all device data
 */

export class Connectable {
  /**
   * @param {ConnectableConfig} config
   */
  constructor(config) {
    this.config = {
      autoReconnect: true,
      reconnectDelay: 1000,
      reconnectTimeout: 60000,
      ...config,
    };

    // State
    this.status = ConnectionStatus.disconnected;
    this.device = null;
    this.server = null;
    this.services = new Map();
    this.abortController = null;

    // Reconnect state
    this.reconnectTimer = null;
    this.watchAbortController = null;

    // Bind methods
    this.handleDisconnect = this.handleDisconnect.bind(this);
  }

  /**
   * Check if connected
   */
  get isConnected() {
    return this.status === ConnectionStatus.connected &&
           this.device?.gatt?.connected === true;
  }

  /**
   * Get device ID
   */
  get deviceId() {
    return this.device?.id ?? null;
  }

  /**
   * Get device name
   */
  get deviceName() {
    return this.device?.name ?? this.config.name ?? 'Unknown Device';
  }

  /**
   * Connect to a device
   * @param {Object} options
   * @param {boolean} [options.requesting=true] - Request new device if not found
   * @param {boolean} [options.watching=false] - Use watchAdvertisements mode
   * @param {string} [options.deviceId] - Specific device ID to connect to
   */
  async connect(options = {}) {
    const {
      requesting = true,
      watching = false,
      deviceId = null,
    } = options;

    // Prevent concurrent connection attempts
    if (this.status === ConnectionStatus.connecting ||
        this.status === ConnectionStatus.reconnecting) {
      console.warn(`[${this.config.name}] Connection already in progress`);
      return;
    }

    try {
      // Clean up any existing connection
      this.cleanup();

      // Update status
      this.status = watching ? ConnectionStatus.reconnecting : ConnectionStatus.connecting;
      xf.dispatch(`${this.config.name}:status`, this.status);

      // Get device
      if (deviceId && supportsGetDevices()) {
        // Connect to specific previously paired device
        this.device = await getPairedDeviceById(deviceId);
        if (!this.device && requesting) {
          throw new Error(`Device ${deviceId} not found in paired devices`);
        }
      } else if (watching) {
        // Watch mode - wait for device advertisement
        this.device = await this.watchForDevice();
      } else if (requesting) {
        // Request new device
        this.device = await this.requestDevice();
      } else {
        throw new Error('No device ID provided and requesting=false');
      }

      if (!this.device) {
        throw new Error('No device available');
      }

      // Set up disconnect handler
      this.device.removeEventListener('gattserverdisconnected', this.handleDisconnect);
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);

      // Connect GATT server
      this.server = await this.device.gatt.connect();

      // Set up services
      await this.setupServices();

      // Update status
      this.status = ConnectionStatus.connected;
      xf.dispatch(`${this.config.name}:status`, this.status);
      xf.dispatch(`${this.config.name}:connected`, {
        deviceId: this.deviceId,
        name: this.deviceName,
      });

      console.log(`[${this.config.name}] Connected to ${this.deviceName}`);

      // Call connected callback if provided
      if (this.config.onConnected) {
        this.config.onConnected(this.device);
      }

      return this.device;

    } catch (error) {
      console.error(`[${this.config.name}] Connection failed:`, error);
      this.status = ConnectionStatus.disconnected;
      xf.dispatch(`${this.config.name}:status`, this.status);
      xf.dispatch(`${this.config.name}:error`, error);

      // Trigger auto-reconnect if enabled
      if (this.config.autoReconnect && !error.name?.includes('NotFoundError')) {
        this.scheduleReconnect();
      }

      throw error;
    }
  }

  /**
   * Request a new device from the user
   */
  async requestDevice() {
    if (!isBluetoothAvailable()) {
      throw new Error('Web Bluetooth API is not available');
    }

    const filter = this.config.filter();
    console.log(`[${this.config.name}] Requesting device with filter:`, filter);

    this.device = await navigator.bluetooth.requestDevice(filter);
    return this.device;
  }

  /**
   * Watch for device advertisements (for auto-reconnect)
   */
  async watchForDevice() {
    if (!supportsGetDevices()) {
      throw new Error('getDevices() not supported, cannot watch for device');
    }

    // Get all paired devices
    const devices = await navigator.bluetooth.getDevices();

    // Find devices that match our filter (simplified - just check if previously connected)
    const matchingDevices = devices.filter(d => d.id === this.deviceId);

    if (matchingDevices.length === 0) {
      throw new Error('No matching paired devices found');
    }

    const device = matchingDevices[0];
    console.log(`[${this.config.name}] Watching for device: ${device.name || device.id}`);

    // Set up abort controller for watch
    this.watchAbortController = new AbortController();

    // Watch for advertisements
    const watchPromise = device.watchAdvertisements({
      signal: this.watchAbortController.signal,
    });

    // Race between watch and timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Watch advertisements timeout')),
                  this.config.reconnectTimeout);
    });

    await Promise.race([watchPromise, timeoutPromise]);

    // Cancel watch after device appears
    this.watchAbortController.abort();
    this.watchAbortController = null;

    return device;
  }

  /**
   * Set up GATT services and characteristics
   */
  async setupServices() {
    const { services: serviceConfigs } = this.config;

    for (const serviceConfig of serviceConfigs) {
      try {
        const service = await this.server.getPrimaryService(serviceConfig.serviceUuid);
        const characteristic = await service.getCharacteristic(serviceConfig.characteristicUuid);

        // Start notifications
        await characteristic.startNotifications();

        // Set up data handler
        const handler = (event) => {
          const data = event.target.value;

          // Service-specific callback
          if (serviceConfig.onData) {
            serviceConfig.onData(data);
          }

          // Global data callback
          if (this.config.onData) {
            this.config.onData(serviceConfig.name, data);
          }
        };

        characteristic.addEventListener('characteristicvaluechanged', handler);

        // Store service info
        this.services.set(serviceConfig.name, {
          service,
          characteristic,
          handler,
          config: serviceConfig,
        });

        console.log(`[${this.config.name}] Service ${serviceConfig.name} set up successfully`);

      } catch (error) {
        console.error(`[${this.config.name}] Failed to set up service ${serviceConfig.name}:`, error);

        if (serviceConfig.onError) {
          serviceConfig.onError(error);
        }
      }
    }
  }

  /**
   * Handle device disconnection
   */
  handleDisconnect() {
    console.log(`[${this.config.name}] Device disconnected`);

    this.status = ConnectionStatus.disconnected;
    xf.dispatch(`${this.config.name}:status`, this.status);
    xf.dispatch(`${this.config.name}:disconnected`, {
      deviceId: this.deviceId,
      name: this.deviceName,
    });

    // Call disconnected callback
    if (this.config.onDisconnected) {
      this.config.onDisconnected();
    }

    // Auto-reconnect if enabled
    if (this.config.autoReconnect) {
      this.scheduleReconnect();
    }

    this.cleanup();
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    // Clear existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    console.log(`[${this.config.name}] Scheduling reconnect in ${this.config.reconnectDelay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.attemptReconnect();
    }, this.config.reconnectDelay);
  }

  /**
   * Attempt to reconnect
   */
  async attemptReconnect() {
    if (this.isConnected) {
      return;
    }

    console.log(`[${this.config.name}] Attempting to reconnect...`);

    try {
      // Try direct reconnection first
      if (this.device) {
        await this.connect({
          requesting: false,
          watching: false,
          deviceId: this.deviceId,
        });
        return;
      }
    } catch (error) {
      console.warn(`[${this.config.name}] Direct reconnection failed:`, error.message);
    }

    // Fall back to watchAdvertisements if available
    try {
      await this.connect({
        requesting: false,
        watching: true,
        deviceId: this.deviceId,
      });
    } catch (error) {
      console.error(`[${this.config.name}] Reconnection with watch failed:`, error);

      // Schedule another attempt
      if (this.config.autoReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Disconnect from device
   */
  async disconnect() {
    console.log(`[${this.config.name}] Disconnecting...`);

    this.status = ConnectionStatus.disconnecting;
    xf.dispatch(`${this.config.name}:status`, this.status);

    // Disable auto-reconnect
    const prevAutoReconnect = this.config.autoReconnect;
    this.config.autoReconnect = false;

    // Cancel reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Cancel watch
    if (this.watchAbortController) {
      this.watchAbortController.abort();
      this.watchAbortController = null;
    }

    // Disconnect GATT
    if (this.device?.gatt?.connected) {
      await this.device.gatt.disconnect();
    }

    this.cleanup();

    this.status = ConnectionStatus.disconnected;
    xf.dispatch(`${this.config.name}:status`, this.status);

    // Restore auto-reconnect setting
    this.config.autoReconnect = prevAutoReconnect;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Stop notifications and remove listeners
    for (const [name, serviceInfo] of this.services.entries()) {
      try {
        serviceInfo.characteristic.removeEventListener(
          'characteristicvaluechanged',
          serviceInfo.handler
        );
        serviceInfo.characteristic.stopNotifications().catch(err => {
          console.warn(`[${this.config.name}] Failed to stop notifications:`, err);
        });
      } catch (error) {
        console.warn(`[${this.config.name}] Error cleaning up service ${name}:`, error);
      }
    }

    this.services.clear();

    // Remove disconnect listener
    if (this.device) {
      this.device.removeEventListener('gattserverdisconnected', this.handleDisconnect);
    }

    // Cancel any pending operations
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.server = null;
    // Keep device reference for reconnect
  }

  /**
   * Cancel auto-reconnect
   */
  cancelReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.watchAbortController) {
      this.watchAbortController.abort();
      this.watchAbortController = null;
    }
  }
}

export default Connectable;
