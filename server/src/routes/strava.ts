/**
 * Strava OAuth and upload routes
 */

import { Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { stravaService } from '../services/strava.service.js';
import { sessionStorage } from '../storage/session.js';
import { config } from '../config/env.js';
import type { StravaSession } from '../types/strava.js';

const app = new Hono();

const COOKIE_NAME = 'spinnn_session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'Lax' as const,
  maxAge: 30 * 24 * 60 * 60, // 30 days
  path: '/',
};

/**
 * Helper: Get session from request
 */
function getSession(c: any): StravaSession | null {
  const sessionId = getCookie(c, COOKIE_NAME);
  if (!sessionId) return null;
  return sessionStorage.get(sessionId);
}

/**
 * Helper: Ensure session is valid and token is fresh
 */
async function ensureValidToken(session: StravaSession): Promise<string> {
  // Check if token needs refresh
  if (stravaService.isTokenExpired(session.expiresAt)) {
    console.log('[Strava] Token expired, refreshing...');

    const data = await stravaService.refreshAccessToken(session.refreshToken);

    // Update session with new tokens
    sessionStorage.update(session.id, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at * 1000,
    });

    return data.access_token;
  }

  return session.accessToken;
}

/**
 * GET /api/strava/status
 * Check Strava connection status
 */
app.get('/status', (c) => {
  const session = getSession(c);

  if (!session) {
    return c.json({
      connected: false,
      athlete: null,
    });
  }

  return c.json({
    connected: true,
    athlete: session.athlete,
  });
});

/**
 * POST /api/strava/oauth/exchange
 * Exchange authorization code for access token
 */
app.post('/oauth/exchange', async (c) => {
  try {
    const { code } = await c.req.json();

    if (!code) {
      return c.json({ error: 'Missing authorization code' }, 400);
    }

    // Exchange code for token
    const data = await stravaService.exchangeCodeForToken(code);

    // Create session
    const sessionId = sessionStorage.create(
      data.access_token,
      data.refresh_token,
      data.expires_at * 1000,
      {
        id: data.athlete.id,
        username: data.athlete.username,
        firstname: data.athlete.firstname,
        lastname: data.athlete.lastname,
      }
    );

    // Set session cookie
    setCookie(c, COOKIE_NAME, sessionId, COOKIE_OPTIONS);

    return c.json({
      success: true,
      athlete: {
        id: data.athlete.id,
        username: data.athlete.username,
        firstname: data.athlete.firstname,
        lastname: data.athlete.lastname,
      },
    });
  } catch (error: any) {
    console.error('[Strava OAuth] Error:', error);

    if (error.name === 'StravaError') {
      return c.json(
        { error: 'Failed to exchange code for token', details: error.message },
        error.statusCode || 400
      );
    }

    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * POST /api/strava/deauthorize
 * Disconnect from Strava and clear session
 */
app.post('/deauthorize', async (c) => {
  try {
    const session = getSession(c);

    if (session) {
      // Try to revoke token on Strava (best effort)
      try {
        await stravaService.deauthorize(session.accessToken);
      } catch (e) {
        // Token might already be invalid, continue with cleanup
        console.warn('[Strava] Could not revoke token:', e);
      }

      // Delete session
      sessionStorage.delete(session.id);
    }

    // Clear cookie
    deleteCookie(c, COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Strava Deauthorize] Error:', error);
    return c.json({ error: 'Failed to disconnect' }, 500);
  }
});

/**
 * POST /api/strava/upload
 * Upload FIT file to Strava
 */
app.post('/upload', async (c) => {
  try {
    const session = getSession(c);

    if (!session) {
      return c.json(
        { error: 'Not connected to Strava', message: 'Please connect your account first' },
        401
      );
    }

    // Ensure we have a valid token
    const accessToken = await ensureValidToken(session);

    // Parse form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Get optional metadata
    const name = (formData.get('name') as string | null) || 'Spinnn Workout';
    const description = (formData.get('description') as string | null) || undefined;
    const sportType = (formData.get('sport_type') as string | null) || 'VirtualRide';
    const trainer = (formData.get('trainer') as string | null) === '1';
    const commute = (formData.get('commute') as string | null) === '1';

    // Convert File to Blob
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });

    // Upload to Strava
    const uploadData = await stravaService.uploadToFitFile(accessToken, blob, {
      name,
      description,
      sportType,
      trainer,
      commute,
    });

    return c.json(uploadData);
  } catch (error: any) {
    console.error('[Strava Upload] Error:', error);

    if (error.name === 'StravaError') {
      return c.json(
        { error: 'Failed to upload to Strava', details: error.message },
        error.statusCode || 500
      );
    }

    return c.json({ error: 'Internal server error' }, 500);
  }
});

/**
 * GET /api/strava/upload/:uploadId
 * Check upload status (for polling)
 */
app.get('/upload/:uploadId', async (c) => {
  try {
    const session = getSession(c);

    if (!session) {
      return c.json({ error: 'Not connected to Strava' }, 401);
    }

    // Ensure we have a valid token
    const accessToken = await ensureValidToken(session);

    const uploadId = parseInt(c.req.param('uploadId'), 10);

    if (isNaN(uploadId)) {
      return c.json({ error: 'Invalid upload ID' }, 400);
    }

    const status = await stravaService.getUploadStatus(accessToken, uploadId);

    return c.json(status);
  } catch (error: any) {
    console.error('[Strava Upload Status] Error:', error);

    if (error.name === 'StravaError') {
      return c.json(
        { error: 'Failed to check upload status', details: error.message },
        error.statusCode || 500
      );
    }

    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default app;
