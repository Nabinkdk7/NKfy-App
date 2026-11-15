import 'dotenv/config';
import path from 'node:path';

function required(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = required(
  'JWT_SECRET',
  isProduction ? undefined : 'nkfy-development-secret-change-before-deploying'
);

if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}
if (!isProduction && !process.env.JWT_SECRET) {
  console.warn('[nkfy] Using a development JWT secret. Set JWT_SECRET before deploying.');
}

const publicUrl = (process.env.PUBLIC_URL || 'http://localhost:4000').replace(/\/+$/, '');

const defaultDbPath = process.env.VERCEL ? '/tmp/nkfy.db' : './data/nkfy.db';

export const config = {
  isProduction,
  port: Number(process.env.PORT || 4000),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  dbPath: path.resolve(process.cwd(), process.env.DB_PATH || defaultDbPath),
  publicUrl,
  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  audiusAppName: process.env.AUDIUS_APP_NAME || 'NKfy',
  youtubeApiKey: process.env.YOUTUBE_API_KEY?.trim() || '',
  jamendoClientId: process.env.JAMENDO_CLIENT_ID?.trim() || '',
  regionCode: process.env.REGION_CODE?.trim() || 'NP',
  relevanceLanguage: process.env.RELEVANCE_LANGUAGE?.trim() || 'ne',
} as const;

export const providerAvailability = {
  audius: true,
  jamendo: Boolean(config.jamendoClientId),
  youtube: Boolean(config.youtubeApiKey),
} as const;
