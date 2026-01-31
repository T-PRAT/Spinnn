/**
 * CORS middleware configuration
 */

import { cors } from 'hono/cors';
import { config } from '../config/env.js';

/**
 * CORS middleware for Hono
 * Allows credentials (cookies) and configures allowed origins
 */
export const corsMiddleware = cors({
  origin: (origin) => {
    // Allow requests without origin (e.g., mobile apps, curl)
    if (!origin) return config.frontendUrl;

    // Allow configured frontend URL
    if (origin === config.frontendUrl) return origin;

    // Allow localhost variations in development
    if (!config.isProduction) {
      const devOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ];
      if (devOrigins.includes(origin)) return origin;
    }

    return null; // Reject
  },
  credentials: true,
  maxAge: 86400, // 24 hours
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
});
