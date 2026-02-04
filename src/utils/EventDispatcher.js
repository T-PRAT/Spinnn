import { logger } from '@/utils/logger';

/**
 * Event Dispatcher System
 * Simple pub/sub pattern for BLE data streaming (inspired by OK's xf dispatcher)
 *
 * Usage:
 *   xf.dispatch('heartRate', { value: 120, timestamp: Date.now() });
 *   xf.sub('heartRate', (data) => logger.debug('HR:', data.value));
 *   xf.unsub('heartRate', handler);
 */

class EventDispatcher {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  sub(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.unsub(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  unsub(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);

      // Clean up empty event sets
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Dispatch an event with data
   * @param {string} event - Event name
   * @param {*} data - Data to pass to callbacks
   */
  dispatch(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`Error in event handler for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event only once
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  once(event, callback) {
    const wrappedCallback = (data) => {
      callback(data);
      this.unsub(event, wrappedCallback);
    };

    return this.sub(event, wrappedCallback);
  }

  /**
   * Remove all subscribers for an event or all events
   * @param {string} [event] - Optional event name, if not provided clears all
   */
  clear(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get number of subscribers for an event
   * @param {string} event - Event name
   * @returns {number}
   */
  count(event) {
    return this.listeners.get(event)?.size ?? 0;
  }

  /**
   * Check if there are any subscribers for an event
   * @param {string} event - Event name
   * @returns {boolean}
   */
  has(event) {
    return this.listeners.has(event) && this.listeners.get(event).size > 0;
  }
}

// Singleton instance
export const xf = new EventDispatcher();

// Export class for testing or custom instances
export default EventDispatcher;
