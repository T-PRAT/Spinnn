/**
 * Environment configuration with validation
 */

interface Config {
  port: number;
  nodeEnv: string;
  frontendUrl: string;
  stravaClientId: string | null;
  stravaClientSecret: string | null;
  sessionSecret: string;
  isProduction: boolean;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? defaultValue!;
}

function getOptionalEnvVar(key: string): string | null {
  const value = process.env[key];
  if (!value || value === `your_${key.toLowerCase()}_here`) {
    return null;
  }
  return value;
}

function parsePort(value: string): number {
  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: ${value}`);
  }
  return port;
}

export const config: Config = {
  port: parsePort(getEnvVar('PORT', '3001')),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  frontendUrl: getEnvVar('FRONTEND_URL', 'http://localhost:5173'),
  stravaClientId: getOptionalEnvVar('STRAVA_CLIENT_ID'),
  stravaClientSecret: getOptionalEnvVar('STRAVA_CLIENT_SECRET'),
  sessionSecret: getEnvVar('SESSION_SECRET', 'spinnn-dev-secret-change-in-production'),
  isProduction: getEnvVar('NODE_ENV', 'development') === 'production',
};

// Validate Strava config
if (!config.stravaClientId) {
  console.warn('⚠️  STRAVA_CLIENT_ID is not configured - Strava integration will not work');
}

if (!config.stravaClientSecret) {
  console.warn('⚠️  STRAVA_CLIENT_SECRET is not configured - Strava integration will not work');
}
