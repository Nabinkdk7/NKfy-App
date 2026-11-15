import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { config } from './config.js';
import authRoutes from './routes/auth.js';
import discoverRoutes from './routes/discover.js';
import favoritesRoutes from './routes/favorites.js';
import playlistRoutes from './routes/playlists.js';
import { errorHandler, notFoundHandler } from './utils/http.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  app.use(
    cors({
      origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
      credentials: false,
      maxAge: 86400,
    })
  );

  app.use(express.json({ limit: '1mb' }));

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 240,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: { code: 'rate_limited', message: 'Too many requests. Try again shortly.' } },
    })
  );

  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 30,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: {
        error: { code: 'rate_limited', message: 'Too many sign-in attempts. Try again later.' },
      },
    })
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/playlists', playlistRoutes);
  app.use('/api/favorites', favoritesRoutes);
  app.use('/api', discoverRoutes);

  app.get('/', (_req, res) => {
    res.json({
      name: 'NKfy API',
      tagline: 'Feel The Music',
      docs: '/api/health',
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
