/**
 * Strava API service
 */

import type {
  StravaTokenResponse,
  StravaUploadResponse,
  StravaError as StravaErrorType,
} from '../types/strava.js';
import { config } from '../config/env.js';

const STRAVA_BASE_URL = 'https://www.strava.com/api/v3';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_DEAUTH_URL = 'https://www.strava.com/oauth/deauthorize';

class StravaError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'StravaError';
  }
}

/**
 * Service for interacting with Strava API
 */
export class StravaService {
  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
    const params = new URLSearchParams({
      client_id: config.stravaClientId,
      client_secret: config.stravaClientSecret,
      code,
      grant_type: 'authorization_code',
    });

    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = (await response.json()) as StravaErrorType;
      throw new StravaError(error.message || 'Failed to exchange code for token', response.status);
    }

    const data = (await response.json()) as StravaTokenResponse;
    console.log(`[Strava] Token exchanged for athlete: ${data.athlete.username || data.athlete.firstname}`);

    return data;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<StravaTokenResponse> {
    const params = new URLSearchParams({
      client_id: config.stravaClientId,
      client_secret: config.stravaClientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = (await response.json()) as StravaErrorType;
      throw new StravaError(error.message || 'Failed to refresh token', response.status);
    }

    return (await response.json()) as StravaTokenResponse;
  }

  /**
   * Upload FIT file to Strava
   */
  async uploadToFitFile(
    accessToken: string,
    file: Blob,
    metadata: {
      name?: string;
      description?: string;
      sportType?: string;
      trainer?: boolean;
      commute?: boolean;
    } = {}
  ): Promise<StravaUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data_type', 'fit');

    if (metadata.name) formData.append('name', metadata.name);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.sportType) formData.append('sport_type', metadata.sportType);
    if (metadata.trainer !== undefined) formData.append('trainer', metadata.trainer ? '1' : '0');
    if (metadata.commute !== undefined) formData.append('commute', metadata.commute ? '1' : '0');

    const response = await fetch(`${STRAVA_BASE_URL}/uploads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = (await response.json()) as StravaErrorType;
      throw new StravaError(error.message || 'Failed to upload FIT file', response.status);
    }

    const data = (await response.json()) as StravaUploadResponse;
    console.log(`[Strava] Upload started: ${data.id} (${data.status})`);

    return data;
  }

  /**
   * Check upload status
   */
  async getUploadStatus(accessToken: string, uploadId: number): Promise<StravaUploadResponse> {
    const response = await fetch(`${STRAVA_BASE_URL}/uploads/${uploadId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new StravaError('Failed to check upload status', response.status);
    }

    return (await response.json()) as StravaUploadResponse;
  }

  /**
   * Deauthorize (revoke) the access token
   */
  async deauthorize(accessToken: string): Promise<void> {
    const response = await fetch(STRAVA_DEAUTH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok && response.status !== 401) {
      // 401 means token is already invalid, which is fine
      throw new StravaError('Failed to deauthorize', response.status);
    }

    console.log('[Strava] Token deauthorized');
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(expiresAt: number): boolean {
    // Add 5 minute buffer to refresh before actual expiry
    return Date.now() >= expiresAt - 5 * 60 * 1000;
  }
}

// Export singleton instance
export const stravaService = new StravaService();
