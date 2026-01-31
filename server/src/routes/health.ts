/**
 * Health check routes
 */

import { Hono } from 'hono';
import { config } from '../config/env.js';
import { sessionStorage } from '../storage/session.js';

const app = new Hono();

/**
 * GET / - Health check endpoint
 */
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'spinnn-api',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    sessionCount: sessionStorage.count(),
  });
});

export default app;
