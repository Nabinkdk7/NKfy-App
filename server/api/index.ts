import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createApp } = require('../dist/app.js');

// Vercel invokes this module as a serverless function. The Express app is
// itself a request handler, so it can be exported directly.
const app = createApp();

export default app;
