import { ref, computed } from 'vue';
import { useI18n } from './useI18n';

const STRAVA_CONFIG = {
  clientId: import.meta.env.VITE_STRAVA_CLIENT_ID || 'YOUR_CLIENT_ID',
  authorizationUrl: 'https://www.strava.com/oauth/authorize',
  scopes: 'activity:write'
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Module-level state for singleton pattern
const isConnected = ref(false);
const athlete = ref(null);
const autoUploadEnabled = ref(false);
const selectedSportType = ref('VirtualRide');

// State parameter for CSRF protection
let pendingState = null;

// Load from localStorage on module initialization
function loadFromStorage() {
  try {
    const storedAutoUpload = localStorage.getItem('spinnn_strava_auto_upload');
    autoUploadEnabled.value = storedAutoUpload === 'true';

    const storedSportType = localStorage.getItem('spinnn_strava_sport_type');
    if (storedSportType) {
      selectedSportType.value = storedSportType;
    }
  } catch (e) {
    console.warn('Failed to load Strava settings from storage:', e);
  }
}

function saveAutoUploadToStorage() {
  try {
    localStorage.setItem('spinnn_strava_auto_upload', String(autoUploadEnabled.value));
  } catch (e) {
    console.warn('Failed to save Strava auto-upload setting to storage:', e);
  }
}

// Generate random state for CSRF protection
function generateState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Load settings on module initialization
loadFromStorage();

// Available sport types from Strava API
const SPORT_TYPES = [
  { value: 'VirtualRide', label: 'Virtual Ride' },
  { value: 'Workout', label: 'Workout' },
  { value: 'Ride', label: 'Ride' },
  { value: 'EBikeRide', label: 'E-Bike Ride' },
  { value: 'GravelRide', label: 'Gravel Ride' },
  { value: 'MountainBikeRide', label: 'Mountain Bike Ride' },
  { value: 'HighIntensityIntervalTraining', label: 'HIIT' }
];

export function useStrava() {
  const { t } = useI18n();

  // Computed properties
  const username = computed(() => athlete.value?.username || athlete.value?.firstname || null);
  const athleteId = computed(() => athlete.value?.id || null);

  // Check connection status with backend
  async function checkStatus() {
    try {
      const response = await fetch(`${API_URL}/api/strava/status`, {
        credentials: 'include', // Important: send cookies
      });

      if (!response.ok) {
        throw new Error('Failed to check Strava status');
      }

      const data = await response.json();
      isConnected.value = data.connected;
      athlete.value = data.athlete;

      console.log('Strava status:', data.connected ? 'connected' : 'disconnected');
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
    // Generate state for CSRF protection
    const state = generateState();
    pendingState = state;
    sessionStorage.setItem('strava_oauth_state', state);

    // Build authorization URL (no PKCE needed - backend handles everything)
    const params = new URLSearchParams({
      client_id: STRAVA_CONFIG.clientId,
      redirect_uri: `${window.location.origin}/strava-callback`,
      response_type: 'code',
      scope: STRAVA_CONFIG.scopes,
      state: state,
    });

    const authUrl = `${STRAVA_CONFIG.authorizationUrl}?${params.toString()}`;

    // Redirect to Strava
    window.location.href = authUrl;
  }

  // Handle OAuth callback
  async function handleCallback(code, state) {
    // Verify state to prevent CSRF
    const storedState = sessionStorage.getItem('strava_oauth_state');

    if (!storedState || state !== storedState) {
      throw new Error(t('settings.strava.errorInvalidState') || 'Invalid OAuth state');
    }

    // Clear sessionStorage
    sessionStorage.removeItem('strava_oauth_state');

    try {
      // Check if client ID is configured
      if (!STRAVA_CONFIG.clientId || STRAVA_CONFIG.clientId === 'YOUR_CLIENT_ID') {
        throw new Error('Strava Client ID is not configured. Please set VITE_STRAVA_CLIENT_ID in your .env file.');
      }

      // Send code to backend for exchange
      const response = await fetch(`${API_URL}/api/strava/oauth/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: send/receive cookies
        body: JSON.stringify({
          code: code,
          state: state,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OAuth exchange failed:', error);
        throw new Error(error.error || 'Failed to connect to Strava');
      }

      const data = await response.json();

      // Update local state
      isConnected.value = true;
      athlete.value = data.athlete;

      console.log(`✅ Connected to Strava: ${data.athlete.username || data.athlete.firstname}`);

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

      console.log('✅ Disconnected from Strava');
    } catch (error) {
      console.error('Failed to disconnect from Strava:', error);
      throw error;
    }
  }

  // Check upload status by polling
  async function checkUploadStatus(uploadId) {
    const response = await fetch(`${API_URL}/api/strava/upload/${uploadId}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to check upload status');
    }

    return await response.json();
  }

  // Poll upload status until complete
  async function pollUploadStatus(uploadId, onProgress) {
    const maxAttempts = 30; // 30 seconds max
    const pollInterval = 1000; // 1 second (recommended by Strava)

    for (let i = 0; i < maxAttempts; i++) {
      const status = await checkUploadStatus(uploadId);

      // Check if there's an error
      if (status.error) {
        throw new Error(status.error);
      }

      // Check if activity is ready
      if (status.activity_id) {
        return status;
      }

      // Still processing - call progress callback if provided
      if (onProgress) {
        onProgress(status);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Upload timed out - activity is still being processed');
  }

  // Upload FIT file to Strava via backend
  async function uploadWorkout(fitFile, metadata) {
    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', fitFile, metadata.filename || 'workout.fit');
      formData.append('name', metadata.name || 'Spinnn Workout');
      formData.append('description', metadata.description || '');
      formData.append('sport_type', metadata.sportType || selectedSportType.value || 'VirtualRide');
      formData.append('trainer', metadata.trainer ? '1' : '0');
      formData.append('commute', metadata.commute ? '1' : '0');
      formData.append('data_type', 'fit');

      // Send to backend API
      const response = await fetch(`${API_URL}/api/strava/upload`, {
        method: 'POST',
        credentials: 'include', // Important: send session cookie
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();

        // Handle not authenticated error
        if (response.status === 401) {
          isConnected.value = false;
          athlete.value = null;
          throw new Error(t('settings.strava.errorNotConnected') || 'Not connected to Strava');
        }

        throw new Error(error.error || 'Failed to upload to Strava');
      }

      const uploadData = await response.json();

      // Check for immediate errors
      if (uploadData.error) {
        throw new Error(uploadData.error);
      }

      // Poll for completion since uploads are asynchronous
      const finalStatus = await pollUploadStatus(uploadData.id, metadata.onProgress);

      // Save to upload history
      if (finalStatus.activity_id) {
        saveToUploadHistory({
          activityId: finalStatus.activity_id,
          name: metadata.name || 'Spinnn Workout',
          uploadedAt: new Date().toISOString(),
          sportType: metadata.sportType || selectedSportType.value || 'VirtualRide'
        });
      }

      return finalStatus;
    } catch (error) {
      console.error('Failed to upload to Strava:', error);
      throw error;
    }
  }

  // Upload history tracking
  function getUploadHistory() {
    try {
      const stored = localStorage.getItem('spinnn_strava_upload_history');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  function saveToUploadHistory(upload) {
    try {
      const history = getUploadHistory();
      history.unshift(upload);
      // Keep only last 50 uploads
      const trimmed = history.slice(0, 50);
      localStorage.setItem('spinnn_strava_upload_history', JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save upload history:', e);
    }
  }

  function setSportType(sportType) {
    selectedSportType.value = sportType;
    localStorage.setItem('spinnn_strava_sport_type', sportType);
  }

  // Toggle auto-upload
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
    selectedSportType,

    // Constants
    SPORT_TYPES,

    // Methods
    checkStatus,
    connect,
    disconnect,
    handleCallback,
    checkUploadStatus,
    pollUploadStatus,
    uploadWorkout,
    setAutoUpload,
    setSportType,
    getUploadHistory,
  };
}
