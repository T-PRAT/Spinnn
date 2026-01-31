/**
 * Route aggregation
 */

import { Hono } from 'hono';
import healthRoutes from './health.js';
import stravaRoutes from './strava.js';

const app = new Hono();

// Health check routes
app.route('/', healthRoutes);

// Strava routes
app.route('/api/strava', stravaRoutes);

export default app;
