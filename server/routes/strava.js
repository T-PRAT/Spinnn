import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_UPLOAD_URL = 'https://www.strava.com/api/v3/uploads';
const STRAVA_DEAUTH_URL = 'https://www.strava.com/oauth/deauthorize';

// Helper: Check if token is expired
function isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  return Date.now() >= expiresAt;
}

// Helper: Refresh access token
async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    client_secret: STRAVA_CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to refresh token');
  }

  return await response.json();
}

// Helper: Get valid access token (refresh if needed)
async function getValidAccessToken(req) {
  const session = req.session.strava;

  if (!session || !session.accessToken) {
    throw new Error('Not connected to Strava');
  }

  // Check if token is expired
  if (isTokenExpired(session.expiresAt) && session.refreshToken) {
    console.log('Token expired, refreshing...');
    const data = await refreshAccessToken(session.refreshToken);

    // Update session with new tokens
    req.session.strava = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at * 1000,
      athlete: data.athlete,
    };

    return data.access_token;
  }

  return session.accessToken;
}

// GET /api/strava/status
// Check if user is connected to Strava
router.get('/status', (req, res) => {
  const isConnected = !!(req.session.strava && req.session.strava.accessToken);

  res.json({
    connected: isConnected,
    athlete: isConnected ? req.session.strava.athlete : null,
  });
});

// POST /api/strava/oauth/exchange
// Exchange authorization code for access token
router.post('/oauth/exchange', async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Exchange code for token
    const params = new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
    });

    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Strava OAuth error:', error);
      return res.status(response.status).json({
        error: 'Failed to exchange code for token',
        details: error,
      });
    }

    const data = await response.json();

    // Store tokens in session (server-side, secure)
    req.session.strava = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at * 1000, // Convert to milliseconds
      athlete: data.athlete,
    };

    console.log(`✅ Strava connected: ${data.athlete.username || data.athlete.firstname}`);

    res.json({
      success: true,
      athlete: {
        id: data.athlete.id,
        username: data.athlete.username,
        firstname: data.athlete.firstname,
        lastname: data.athlete.lastname,
      },
    });
  } catch (error) {
    console.error('OAuth exchange error:', error);
    res.status(500).json({
      error: 'Failed to connect to Strava',
      message: error.message,
    });
  }
});

// POST /api/strava/deauthorize
// Disconnect from Strava
router.post('/deauthorize', async (req, res) => {
  try {
    if (req.session.strava && req.session.strava.accessToken) {
      // Revoke token on Strava
      try {
        const response = await fetch(STRAVA_DEAUTH_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${req.session.strava.accessToken}`,
          },
        });

        if (response.ok) {
          console.log('✅ Strava token revoked');
        }
      } catch (e) {
        console.warn('Failed to revoke Strava token:', e.message);
      }
    }

    // Clear session
    delete req.session.strava;

    res.json({ success: true });
  } catch (error) {
    console.error('Deauthorize error:', error);
    res.status(500).json({
      error: 'Failed to disconnect from Strava',
      message: error.message,
    });
  }
});

// POST /api/strava/upload
// Upload FIT file to Strava
router.post('/upload', async (req, res) => {
  try {
    // Get valid access token (auto-refresh if needed)
    const accessToken = await getValidAccessToken(req);

    // Parse multipart form data
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data' });
    }

    // Forward the upload request to Strava
    const response = await fetch(STRAVA_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        ...req.headers,
      },
      body: req,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Strava upload error:', data);
      return res.status(response.status).json({
        error: 'Failed to upload to Strava',
        details: data,
      });
    }

    console.log(`✅ Workout uploaded to Strava: ${data.id}`);
    res.json(data);
  } catch (error) {
    console.error('Upload error:', error);

    if (error.message === 'Not connected to Strava') {
      return res.status(401).json({
        error: 'Not connected to Strava',
        message: 'Please connect to Strava first',
      });
    }

    res.status(500).json({
      error: 'Failed to upload workout',
      message: error.message,
    });
  }
});

// GET /api/strava/upload/:uploadId
// Check upload status
router.get('/upload/:uploadId', async (req, res) => {
  try {
    const accessToken = await getValidAccessToken(req);
    const { uploadId } = req.params;

    const response = await fetch(`${STRAVA_UPLOAD_URL}/${uploadId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to check upload status',
        details: data,
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Upload status error:', error);

    if (error.message === 'Not connected to Strava') {
      return res.status(401).json({
        error: 'Not connected to Strava',
      });
    }

    res.status(500).json({
      error: 'Failed to check upload status',
      message: error.message,
    });
  }
});

export default router;
