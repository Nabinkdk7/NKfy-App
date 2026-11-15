import { createApp } from './app.js';
import { config } from './config.js';
import { closeDatabase } from './db.js';

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`[nkfy] API listening on ${config.publicUrl}`);
  console.log('[nkfy] Providers:', {
    audius: true,
    youtube: Boolean(config.youtubeApiKey),
    jamendo: Boolean(config.jamendoClientId),
  });
});

function shutdown(signal: string) {
  console.log(`[nkfy] ${signal} received, shutting down`);
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
