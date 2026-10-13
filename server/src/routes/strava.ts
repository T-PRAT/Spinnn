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

// OAuth state lives server-side: single use, short-lived, and bound to nothing else.
const STATE_TTL_MS = 10 * 60 * 1000;
const pendingStates = new Map<string, number>();

const DEV_LOOPBACK = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // Strava accepts up to 25MB; stay below it.

/**
 * Origins the OAuth flow may redirect back to.
 */
function allowedRedirectOrigins(): Set<string> {
  const origins = new Set<string>([new URL(config.frontendUrl).origin]);
  origins.add('http://localhost:5173');
  origins.add('http://localhost:5174');
  origins.add('http://127.0.0.1:5173');
  origins.add('http://127.0.0.1:5174');
  return origins;
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // non-browser clients (curl, tests)
  if (allowedRedirectOrigins().has(origin)) return true;
  if (!config.isProduction && DEV_LOOPBACK.test(origin)) return true;
  return false;
}

/**
 * Tiny fixed-window rate limiter, keyed per client or per session.
 * Returns true when the request is allowed.
 */
const buckets = new Map<string, number[]>();
function allowRequest(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter(t => now - t < windowMs);
  hits.push(now);
  buckets.set(key, hits);
  return hits.length <= max;
}

function clientKey(c: any): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

function tooManyRequests(c: any) {
  return c.json({ error: 'Too many requests' }, 429);
}

/**
 * Helper: Get session from request
 */
function getSession(c: any): StravaSession | null {
  const sessionId = getCookie(c, COOKIE_NAME);
  if (!sessionId) return null;
  return sessionStorage.get(sessionId);
}

/**
 * Helper: Ensure session is valid and token is fresh.
 * A refresh rejection means the grant itself is gone: drop the session.
 */
async function ensureValidToken(c: any, session: StravaSession): Promise<string> {
  if (stravaService.isTokenExpired(session.expiresAt)) {
    try {
      const data = await stravaService.refreshAccessToken(session.refreshToken);

      sessionStorage.update(session.id, {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at * 1000,
      });

      return data.access_token;
    } catch (error: any) {
      if (error.statusCode === 400) {
        sessionStorage.delete(session.id);
        deleteCookie(c, COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
      }
      throw error;
    }
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
 * GET /api/strava/oauth/authorize
 * Generate Strava authorization URL (keeps client_id server-side)
 */
app.get('/oauth/authorize', (c) => {
  if (!allowRequest(`authorize:${clientKey(c)}`, 20, 60_000)) {
    return tooManyRequests(c);
  }

  const redirectUri = c.req.query('redirect_uri');

  if (!redirectUri) {
    return c.json({ error: 'Missing redirect_uri parameter' }, 400);
  }

  // Only redirect back to origins we trust (frontend origin, or loopback in dev).
  let redirectOrigin: string;
  try {
    redirectOrigin = new URL(redirectUri).origin;
  } catch {
    return c.json({ error: 'Invalid redirect_uri parameter' }, 400);
  }
  if (!isAllowedOrigin(redirectOrigin)) {
    return c.json({ error: 'redirect_uri not allowed' }, 400);
  }

  // Drop expired states while we are here.
  const now = Date.now();
  for (const [state, expiresAt] of pendingStates) {
    if (expiresAt <= now) pendingStates.delete(state);
  }

  const state = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  pendingStates.set(state, now + STATE_TTL_MS);

  const params = new URLSearchParams({
    client_id: config.stravaClientId ?? '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'activity:write',
    state,
  });

  return c.json({
    url: `https://www.strava.com/oauth/authorize?${params.toString()}`,
    state,
  });
});

/**
 * POST /api/strava/oauth/exchange
 * Exchange authorization code for access token.
 * The OAuth state must be one this server issued and not yet consumed.
 */
app.post('/oauth/exchange', async (c) => {
  try {
    if (!allowRequest(`exchange:${clientKey(c)}`, 10, 15 * 60_000)) {
      return tooManyRequests(c);
    }

    const contentType = c.req.header('content-type') ?? '';
    if (!contentType.startsWith('application/json')) {
      return c.json({ error: 'Content-Type must be application/json' }, 415);
    }

    const origin = c.req.header('origin');
    if (!isAllowedOrigin(origin)) {
      return c.json({ error: 'Origin not allowed' }, 403);
    }

    const { code, state } = await c.req.json();

    if (!code) {
      return c.json({ error: 'Missing authorization code' }, 400);
    }

    if (!state || !pendingStates.has(state)) {
      return c.json({ error: 'Invalid or expired OAuth state' }, 401);
    }
    pendingStates.delete(state); // single use

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
    console.error('[Strava OAuth] Error:', error.message);

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
      if (!allowRequest(`deauth:${session.id}`, 10, 60_000)) {
        return tooManyRequests(c);
      }

      // Try to revoke token on Strava (best effort)
      try {
        await stravaService.deauthorize(session.accessToken);
      } catch (e: any) {
        // Token might already be invalid, continue with cleanup
        console.warn('[Strava] Could not revoke token:', e.message);
      }

      // Delete session
      sessionStorage.delete(session.id);
    }

    // Clear cookie
    deleteCookie(c, COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Strava Deauthorize] Error:', error.message);
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

    if (!allowRequest(`upload:${session.id}`, 12, 60 * 60_000)) {
      return tooManyRequests(c);
    }

    // Ensure we have a valid token
    const accessToken = await ensureValidToken(c, session);

    // Parse form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Accept FIT payloads only, by name or content type.
    const looksLikeFit = file.name?.toLowerCase().endsWith('.fit') ||
      file.type === 'application/octet-stream' || file.type === '';
    if (!looksLikeFit) {
      return c.json({ error: 'Only FIT files can be uploaded' }, 400);
    }
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return c.json({ error: 'Invalid file size' }, 400);
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
    console.error('[Strava Upload] Error:', error.message);

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

    if (!allowRequest(`status:${session.id}`, 120, 60_000)) {
      return tooManyRequests(c);
    }

    // Ensure we have a valid token
    const accessToken = await ensureValidToken(c, session);

    const uploadId = parseInt(c.req.param('uploadId'), 10);

    if (isNaN(uploadId)) {
      return c.json({ error: 'Invalid upload ID' }, 400);
    }

    const status = await stravaService.getUploadStatus(accessToken, uploadId);

    return c.json(status);
  } catch (error: any) {
    console.error('[Strava Upload Status] Error:', error.message);

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
