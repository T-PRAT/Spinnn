/**
 * Centralized localStorage management
 * Provides type-safe access to application storage with validation
 */

import { DEFAULT_POWER_ZONES, DEFAULT_FTP } from '@/constants/zones';

/**
 * Storage keys with 'spinnn_' prefix
 */
export const STORAGE_KEYS = {
  FTP: 'spinnn_ftp',
  POWER_ZONES: 'spinnn_power_zones',
  THEME: 'spinnn_theme',
  LOCALE: 'spinnn_locale',
  INTERVALS_API_KEY: 'spinnn_intervals_api_key',
  INTERVALS_ATHLETE_ID: 'spinnn_intervals_athlete_id',
  STRAVA_AUTO_UPLOAD: 'spinnn_strava_auto_upload',
  AUDIO_ENABLED: 'spinnn_audio_enabled',
  AUDIO_SELECTED: 'spinnn_audio_selected',
  METRICS_CONFIG: 'spinnn_metrics_config',
  WORKOUT_SESSION: 'spinnn_active_workout'
};

/**
 * Centralized storage composable
 * All localStorage operations should go through this composable
 */
export function useStorage() {
  // ============================================================================
  // FTP (Functional Threshold Power)
  // ============================================================================

  function getFtp() {
    const stored = localStorage.getItem(STORAGE_KEYS.FTP);
    if (stored) {
      const value = parseInt(stored, 10);
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
    return DEFAULT_FTP;
  }

  function setFtp(value) {
    if (typeof value !== 'number' || value <= 0) {
      console.warn('Invalid FTP value:', value);
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.FTP, value.toString());
    return true;
  }

  // ============================================================================
  // Power Zones
  // ============================================================================

  function getPowerZones() {
    const stored = localStorage.getItem(STORAGE_KEYS.POWER_ZONES);
    if (stored) {
      try {
        const zones = JSON.parse(stored);
        // Validate structure
        if (zones && typeof zones === 'object' && zones.z1 && zones.z7) {
          return zones;
        }
      } catch (e) {
        console.error('Failed to parse power zones:', e);
      }
    }
    return { ...DEFAULT_POWER_ZONES };
  }

  function setPowerZones(zones) {
    if (!zones || typeof zones !== 'object') {
      console.warn('Invalid power zones:', zones);
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.POWER_ZONES, JSON.stringify(zones));
    return true;
  }

  function resetPowerZones() {
    return setPowerZones(DEFAULT_POWER_ZONES);
  }

  // ============================================================================
  // Theme
  // ============================================================================

  function getTheme() {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return null; // No preference stored
  }

  function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') {
      console.warn('Invalid theme:', theme);
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    return true;
  }

  // ============================================================================
  // Locale (i18n)
  // ============================================================================

  function getLocale() {
    return localStorage.getItem(STORAGE_KEYS.LOCALE);
  }

  function setLocale(locale) {
    if (!locale || typeof locale !== 'string') {
      console.warn('Invalid locale:', locale);
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.LOCALE, locale);
    return true;
  }

  // ============================================================================
  // Intervals.icu API
  // ============================================================================

  function getIntervalsCredentials() {
    const apiKey = localStorage.getItem(STORAGE_KEYS.INTERVALS_API_KEY);
    const athleteId = localStorage.getItem(STORAGE_KEYS.INTERVALS_ATHLETE_ID);

    if (apiKey && athleteId) {
      return { apiKey, athleteId };
    }
    return null;
  }

  function setIntervalsCredentials(apiKey, athleteId) {
    if (!apiKey || !athleteId) {
      console.warn('Invalid Intervals.icu credentials');
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.INTERVALS_API_KEY, apiKey);
    localStorage.setItem(STORAGE_KEYS.INTERVALS_ATHLETE_ID, athleteId);
    return true;
  }

  function clearIntervalsCredentials() {
    localStorage.removeItem(STORAGE_KEYS.INTERVALS_API_KEY);
    localStorage.removeItem(STORAGE_KEYS.INTERVALS_ATHLETE_ID);
  }

  // ============================================================================
  // Strava Settings
  // ============================================================================

  function getStravaAutoUpload() {
    const stored = localStorage.getItem(STORAGE_KEYS.STRAVA_AUTO_UPLOAD);
    return stored === 'true';
  }

  function setStravaAutoUpload(enabled) {
    localStorage.setItem(STORAGE_KEYS.STRAVA_AUTO_UPLOAD, String(enabled));
  }

  // ============================================================================
  // Audio Settings
  // ============================================================================

  function getAudioSettings() {
    const enabled = localStorage.getItem(STORAGE_KEYS.AUDIO_ENABLED);
    const selected = localStorage.getItem(STORAGE_KEYS.AUDIO_SELECTED);

    return {
      enabled: enabled === null ? true : enabled === 'true',
      selectedSound: selected || 'beep'
    };
  }

  function setAudioEnabled(enabled) {
    localStorage.setItem(STORAGE_KEYS.AUDIO_ENABLED, String(enabled));
  }

  function setAudioSelected(soundId) {
    if (!soundId || typeof soundId !== 'string') {
      console.warn('Invalid audio sound ID:', soundId);
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.AUDIO_SELECTED, soundId);
    return true;
  }

  // ============================================================================
  // Metrics Configuration
  // ============================================================================

  function getMetricsConfig() {
    const stored = localStorage.getItem(STORAGE_KEYS.METRICS_CONFIG);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse metrics config:', e);
      }
    }
    return null;
  }

  function setMetricsConfig(config) {
    if (!config || typeof config !== 'object') {
      console.warn('Invalid metrics config:', config);
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.METRICS_CONFIG, JSON.stringify(config));
    return true;
  }

  // ============================================================================
  // Workout Session
  // ============================================================================

  function getWorkoutSession() {
    const stored = localStorage.getItem(STORAGE_KEYS.WORKOUT_SESSION);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse workout session:', e);
      }
    }
    return null;
  }

  function setWorkoutSession(session) {
    if (!session || typeof session !== 'object') {
      console.warn('Invalid workout session:', session);
      return false;
    }
    localStorage.setItem(STORAGE_KEYS.WORKOUT_SESSION, JSON.stringify(session));
    return true;
  }

  function clearWorkoutSession() {
    localStorage.removeItem(STORAGE_KEYS.WORKOUT_SESSION);
  }

  // ============================================================================
  // Return public API
  // ============================================================================

  return {
    // FTP
    getFtp,
    setFtp,

    // Power Zones
    getPowerZones,
    setPowerZones,
    resetPowerZones,

    // Theme
    getTheme,
    setTheme,

    // Locale
    getLocale,
    setLocale,

    // Intervals.icu
    getIntervalsCredentials,
    setIntervalsCredentials,
    clearIntervalsCredentials,

    // Strava
    getStravaAutoUpload,
    setStravaAutoUpload,

    // Audio
    getAudioSettings,
    setAudioEnabled,
    setAudioSelected,

    // Metrics
    getMetricsConfig,
    setMetricsConfig,

    // Workout Session
    getWorkoutSession,
    setWorkoutSession,
    clearWorkoutSession,

    // Export keys for direct access if needed
    KEYS: STORAGE_KEYS
  };
}
