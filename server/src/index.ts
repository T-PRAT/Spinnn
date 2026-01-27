import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';

// Initialize Hono app
const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => {
    // Allow frontend in development and production
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5173',
    ];
    // In production, replace with your actual domain
    allowed.push(process.env.FRONTEND_URL || 'https://your-domain.com');
    return allowed.includes(origin);
  },
  credentials: true,
}));

// Health check endpoint
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'spinnn-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Check Strava connection status
app.get('/api/strava/status', async (c) => {
  const session = c.req.header('Cookie')?.match(/strava_session=([^;]+)/);

  if (!session) {
    return c.json({ connected: false, athlete: null });
  }

  // Here you would validate the session with your session store
  // For now, we'll check if we have athlete data in the session
  // TODO: Implement proper session validation (Redis, database, etc.)

  return c.json({
    connected: true,
    athlete: {
      username: 'test_user', // Would come from session
      id: 12345
    }
  });
});

// OAuth exchange endpoint
app.post('/api/strava/oauth/exchange', async (c) => {
  try {
    const { code, state } = await c.req.json();

    if (!code || !state) {
      return c.json({ error: 'Missing code or state parameter' }, 400);
    }

    console.log(`[Strava OAuth] Exchanging code for access token...`);

    // Exchange authorization code for access token
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`[Strava OAuth] Token exchange failed:`, error);
      return c.json({ error: error.message || 'Failed to exchange token' }, response.status);
    }

    const data = await response.json();

    // Set session cookie
    // TODO: Implement proper session management (Redis, database, etc.)
    // For now, we'll set a simple cookie
    const expiresAt = new Date(data.expires_at * 1000);

    const responseHeaders = new Headers();
    responseHeaders.append('Set-Cookie',
      `strava_session=${data.access_token}; HttpOnly; Secure; SameSite=Lax; Expires=${expiresAt.toUTCString()}`
    );

    // Get athlete info from Strava
    const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
      headers: {
        'Authorization': `Bearer ${data.access_token}`,
      },
    });

    const athlete = await athleteResponse.json();

    console.log(`[Strava OAuth] Connected: ${athlete.username || athlete.firstname}`);

    return c.json({
      access_token: data.access_token, // In production, DON'T return this to client
      refresh_token: data.refresh_token, // Same here
      expires_at: data.expires_at,
      athlete: {
        id: athlete.id,
        username: athlete.username,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile_medium: athlete.profile_medium,
        profile: athlete.profile,
      },
    }, 200);
  } catch (error) {
    console.error('[Strava OAuth] Error:', error);
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
});

// Deauthorize endpoint (logout from Strava + clear session)
app.post('/api/strava/deauthorize', async (c) => {
  try {
    // Clear session cookie
    const responseHeaders = new Headers();
    responseHeaders.append('Set-Cookie', 'strava_session=; Max-Age=0; HttpOnly; Secure; SameSite=Lax');

    return c.json({ success: true, message: 'Disconnected from Strava' });
  } catch (error) {
    console.error('[Strava] Logout error:', error);
    return c.json({ error: error.message || 'Failed to disconnect' }, 500);
  }
});

// Upload FIT file to Strava
app.post('/api/strava/upload', async (c) => {
  try {
    const session = c.req.header('Cookie')?.match(/strava_session=([^;]+)/);

    if (!session) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    const token = session[1]; // Get access token from session cookie

    // Get the file from form data
    const formData = await c.req.formData();
    const file = formData.get('file');
    const name = formData.get('name') || 'Spinnn Workout';
    const description = formData.get('description') || '';
    const sportType = formData.get('sport_type') || 'VirtualRide';
    const trainer = formData.get('trainer') === '1';
    const commute = formData.get('commute') === '1';

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Convert File to Blob for Strava API
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });

    // Create upload form data for Strava
    const uploadFormData = new FormData();
    uploadFormData.append('file', blob, file.name);
    uploadFormData.append('name', name);
    uploadFormData.append('description', description);
    uploadFormData.append('sport_type', sportType);
    uploadFormData.append('trainer', trainer ? '1' : '0');
    uploadFormData.append('commute', commute ? '1' : '0');
    uploadFormData.append('data_type', 'fit');

    console.log(`[Strava Upload] Uploading: ${name}`);

    // Upload to Strava
    const response = await fetch('https://www.strava.com/api/v3/uploads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`[Strava Upload] Upload failed:`, error);
      return c.json({ error: error.message || error.error || 'Upload failed' }, response.status);
    }

    const uploadData = await response.json();

    console.log(`[Strava Upload] Upload started: ${uploadData.id}`);

    return c.json(uploadData);
  } catch (error) {
    console.error('[Strava Upload] Error:', error);
    return c.json({ error: error.message || 'Upload failed' }, 500);
  }
});

// Check upload status (for polling)
app.get('/api/strava/upload/:uploadId', async (c) => {
  try {
    const { uploadId } = c.req.param();
    const session = c.req.header('Cookie')?.match(/strava_session=([^;]+)/);

    if (!session) {
      return c.json({ error: 'Not authenticated' }, 401);
    }

    const token = session[1];

    const response = await fetch(`https://www.strava.com/api/v3/uploads/${uploadId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return c.json({ error: 'Failed to check upload status' }, response.status);
    }

    return c.json(await response.json());
  } catch (error) {
    console.error('[Strava Upload Status] Error:', error);
    return c.json({ error: error.message || 'Failed to check upload status' }, 500);
  }
});

// Start server
const port = parseInt(process.env.PORT || '3001');

console.log(`
🚀 Spinnn API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Environment: ${process.env.NODE_ENV || 'development'}
  Port: ${port}
  Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
  Strava Client ID: ${process.env.STRAVA_CLIENT_ID?.substring(0, 10)}...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

serve({
  fetch: app.fetch,
  port,
});
