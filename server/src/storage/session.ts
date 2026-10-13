/**
 * In-memory session storage
 */

import type { StravaSession } from '../types/strava.js';

interface SessionStore {
  [sessionId: string]: StravaSession;
}

// Matches the cookie max-age set by the Strava routes (30 days).
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * In-memory session storage with idle expiration.
 * Can be easily replaced with Redis or a database later.
 */
class SessionStorage {
  private sessions: SessionStore = {};
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleSessions();
    }, 5 * 60 * 1000);
    // Never keep the process alive just for cleanup.
    this.cleanupInterval.unref?.();
  }

  /**
   * Generate a random session ID
   */
  private generateSessionId(): string {
    return crypto.randomUUID();
  }

  /**
   * Create a new session
   */
  create(accessToken: string, refreshToken: string, expiresAt: number, athlete: StravaSession['athlete']): string {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    this.sessions[sessionId] = {
      id: sessionId,
      accessToken,
      refreshToken,
      expiresAt,
      athlete,
      createdAt: now,
      lastAccessedAt: now,
    };

    return sessionId;
  }

  /**
   * Get a session by ID.
   * A session outlives its access token: the Strava routes refresh the token
   * with the refresh token, so expiry here is idle time, not token expiry.
   */
  get(sessionId: string): StravaSession | null {
    const session = this.sessions[sessionId];

    if (!session) {
      return null;
    }

    if (Date.now() - session.lastAccessedAt > SESSION_TTL_MS) {
      delete this.sessions[sessionId];
      return null;
    }

    session.lastAccessedAt = Date.now();

    return session;
  }

  /**
   * Update a session with new tokens
   */
  update(sessionId: string, updates: Partial<StravaSession>): boolean {
    const session = this.sessions[sessionId];

    if (!session) {
      return false;
    }

    Object.assign(session, updates);
    session.lastAccessedAt = Date.now();

    return true;
  }

  /**
   * Delete a session
   */
  delete(sessionId: string): boolean {
    if (!this.sessions[sessionId]) {
      return false;
    }

    delete this.sessions[sessionId];
    return true;
  }

  /**
   * Check if a session exists and is valid
   */
  isValid(sessionId: string): boolean {
    return this.get(sessionId) !== null;
  }

  /**
   * Get session count
   */
  count(): number {
    return Object.keys(this.sessions).length;
  }

  /**
   * Remove sessions idle for longer than the TTL.
   */
  private cleanupIdleSessions(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const sessionId in this.sessions) {
      if (now - this.sessions[sessionId].lastAccessedAt > SESSION_TTL_MS) {
        delete this.sessions[sessionId];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Session] Cleaned up ${cleaned} idle session(s)`);
    }
  }

  /**
   * Clear all sessions (for testing)
   */
  clear(): void {
    this.sessions = {};
    console.log('[Session] Cleared all sessions');
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export singleton instance
export const sessionStorage = new SessionStorage();
