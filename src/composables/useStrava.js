import { ref, computed } from 'vue';
import { useI18n } from './useI18n';
import { useStorage } from './useStorage';

const storage = useStorage();

const STRAVA_CONFIG = {
  clientId: import.meta.env.VITE_STRAVA_CLIENT_ID || 'YOUR_CLIENT_ID',
  authorizationUrl: 'https://www.strava.com/oauth/authorize',
  scopes: 'activity:write'
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Module-level state for singleton pattern
const isConnected = ref(false);
const athlete = ref(null);
const autoUploadEnabled = ref(storage.getStravaAutoUpload());

// State parameter for CSRF protection
let pendingState = null;

function saveAutoUploadToStorage() {
  storage.setStravaAutoUpload(autoUploadEnabled.value);
}

// Generate random state for CSRF protection
function generateState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Load settings on module initialization
// Auto-upload setting already loaded from storage during ref initialization

export function useStrava() {
  const { t } = useI18n();

  // Computed properties
  const username = computed(() => athlete.value?.username || athlete.value?.firstname || null);
  const athleteId = computed(() => athlete.value?.id || null);

  // Check connection status with backend
  async function checkStatus() {
    try {
      const response = await fetch(`${API_URL}/api/strava/status`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to check Strava status');
      }

      const data = await response.json();
      isConnected.value = data.connected;
      athlete.value = data.athlete;

      return data;
    } catch (error) {
      console.error('Failed to check Strava status:', error);
      isConnected.value = false;
      athlete.value = null;
      return { connected: false, athlete: null };
    }
  }

  // Initiate OAuth flow
  function connect() {
    const state = generateState();
    pendingState = state;
    sessionStorage.setItem('strava_oauth_state', state);

    const params = new URLSearchParams({
      client_id: STRAVA_CONFIG.clientId,
      redirect_uri: `${window.location.origin}/strava-callback`,
      response_type: 'code',
      scope: STRAVA_CONFIG.scopes,
      state: state,
    });

    window.location.href = `${STRAVA_CONFIG.authorizationUrl}?${params.toString()}`;
  }

  // Handle OAuth callback
  async function handleCallback(code, state) {
    const storedState = sessionStorage.getItem('strava_oauth_state');

    if (!storedState || state !== storedState) {
      throw new Error(t('settings.strava.errorInvalidState') || 'Invalid OAuth state');
    }

    sessionStorage.removeItem('strava_oauth_state');

    try {
      if (!STRAVA_CONFIG.clientId || STRAVA_CONFIG.clientId === 'YOUR_CLIENT_ID') {
        throw new Error('Strava Client ID is not configured. Please set VITE_STRAVA_CLIENT_ID in your .env file.');
      }

      const response = await fetch(`${API_URL}/api/strava/oauth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect to Strava');
      }

      const data = await response.json();
      isConnected.value = true;
      athlete.value = data.athlete;

      return data;
    } catch (error) {
      console.error('Failed to handle Strava callback:', error);
      throw error;
    }
  }

  // Disconnect and clear session
  async function disconnect() {
    try {
      const response = await fetch(`${API_URL}/api/strava/deauthorize`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect from Strava');
      }

      isConnected.value = false;
      athlete.value = null;
    } catch (error) {
      console.error('Failed to disconnect from Strava:', error);
      throw error;
    }
  }

  // Poll upload status until complete (merged checkUploadStatus + pollUploadStatus)
  async function pollUploadStatus(uploadId, onProgress) {
    const maxAttempts = 30;
    const pollInterval = 1000;

    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${API_URL}/api/strava/upload/${uploadId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to check upload status');
      }

      const status = await response.json();

      if (status.error) {
        throw new Error(status.error);
      }

      if (status.activity_id) {
        return status;
      }

      if (onProgress) {
        onProgress(status);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Upload timed out - activity is still being processed');
  }

  // Upload FIT file to Strava via backend
  async function uploadWorkout(fitFile, metadata) {
    try {
      const formData = new FormData();
      formData.append('file', fitFile, metadata.filename || 'workout.fit');
      formData.append('name', metadata.name || 'Spinnn Workout');
      formData.append('description', metadata.description || '');
      formData.append('sport_type', 'VirtualRide');
      formData.append('trainer', metadata.trainer ? '1' : '0');
      formData.append('commute', metadata.commute ? '1' : '0');
      formData.append('data_type', 'fit');

      const response = await fetch(`${API_URL}/api/strava/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();

        if (response.status === 401) {
          isConnected.value = false;
          athlete.value = null;
          throw new Error(t('settings.strava.errorNotConnected') || 'Not connected to Strava');
        }

        throw new Error(error.error || 'Failed to upload to Strava');
      }

      const uploadData = await response.json();

      if (uploadData.error) {
        throw new Error(uploadData.error);
      }

      return await pollUploadStatus(uploadData.id, metadata.onProgress);
    } catch (error) {
      console.error('Failed to upload to Strava:', error);
      throw error;
    }
  }

  function setAutoUpload(enabled) {
    autoUploadEnabled.value = enabled;
    saveAutoUploadToStorage();
  }

  return {
    // State
    isConnected,
    athlete,
    username,
    athleteId,
    autoUploadEnabled,

    // Methods
    checkStatus,
    connect,
    disconnect,
    handleCallback,
    pollUploadStatus,
    uploadWorkout,
    setAutoUpload,
  };
}
