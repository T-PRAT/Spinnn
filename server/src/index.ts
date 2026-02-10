/**
 * Spinnn API Server
 * Built with Bun and Hono
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { config } from './config/env.js';
import { corsMiddleware } from './middleware/cors.js';
import { sessionStorage } from './storage/session.js';
import routes from './routes/index.js';

// Create Hono app
const app = new Hono();

// Global middleware
app.use('*', logger());
app.use('*', corsMiddleware);

// Register routes
app.route('/', routes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    {
      error: 'Internal server error',
      message: config.isProduction ? undefined : err.message,
    },
    500
  );
});

// Start server
const port = config.port;

console.log(`
🚀 Spinnn API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Environment: ${config.nodeEnv}
  Port: ${port}
  Frontend URL: ${config.frontendUrl}
  Strava Client ID: ${config.stravaClientId ? `${config.stravaClientId.slice(0, 8)}...` : 'Not configured'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  sessionStorage.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  sessionStorage.destroy();
  process.exit(0);
});

// Export as default for Bun's built-in HMR support with --watch
export default {
  fetch: app.fetch,
  port,
};
