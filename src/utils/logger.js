/**
 * Centralized logging utility
 * Provides consistent logging across the application with environment-aware behavior
 */

/**
 * Logger instance with environment-aware methods
 *
 * @example
 * import { logger } from '@/utils/logger';
 *
 * logger.debug('Debug info', { data });  // Only in development
 * logger.info('User action');            // Always logged
 * logger.warn('Warning message');        // Always logged
 * logger.error('Error occurred', error); // Always logged
 */
export const logger = {
  /**
   * Debug logging - only active in development
   * Use for verbose debugging information
   */
  debug: (...args) => {
    if (import.meta.env.DEV) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info logging - always active
   * Use for general informational messages
   */
  info: (...args) => {
    console.log('[INFO]', ...args);
  },

  /**
   * Warning logging - always active
   * Use for potentially problematic situations
   */
  warn: (...args) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error logging - always active
   * Use for errors and exceptions
   */
  error: (...args) => {
    console.error('[ERROR]', ...args);
  }
};
