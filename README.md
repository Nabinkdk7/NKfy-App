# NKfy — Feel The Music

Spotify-inspired music app (React Native + Expo) with a Node/Express backend. Ships
as an Android/iOS app (via EAS) and as a web build (via Vercel), with the backend
deployed to Vercel as serverless functions.

## Layout

```
mobile/   Expo (SDK 58) React Native app — Expo Router, audio, EQ, playlists
server/   Node/Express + node:sqlite API — auth, playlists, favorites, discovery
```

## Run locally

Prereq: Node.js >= 22.13.

Backend:

```bash
cd server
npm install
cp .env.example .env   # set JWT_SECRET, etc.
npm run dev             # http://localhost:4000
```

Mobile (web):

```bash
cd mobile
npm install
npm run web             # http://localhost:8081
```

Mobile (native) requires a development build (`npx expo run:ios|android` or EAS).

## Checks

```bash
cd mobile && npm run typecheck && npm run lint
cd server && npm run typecheck
```

## Deploy

### Backend (Vercel)

1. Create a Vercel project with **Root Directory** = `server`.
2. Set environment variables:
   - `JWT_SECRET` (>= 32 chars)
   - `CORS_ORIGINS` = your web origin (or `*` for dev)
   - `DB_PATH` = `/tmp/nkfy.db` (Vercel filesystem is ephemeral; use a hosted DB for production)
   - `YOUTUBE_API_KEY`, `JAMENDO_CLIENT_ID` (optional)
3. Deploy. The API is served from `/api/*`.

> Note: `node:sqlite` storage on Vercel is ephemeral and not shared across
> serverless instances. For durable data, replace SQLite with a hosted database
> (e.g. Turso / Neon / Vercel Postgres) — the data layer is isolated in
> `server/src/db.ts`.

### Web (Vercel)

1. Create a Vercel project with **Root Directory** = `mobile`.
2. Set `EXPO_PUBLIC_API_URL` to your deployed backend URL.
3. Deploy (build command `npm run build:web`, output `dist-web`).

### Mobile native (EAS)

```bash
cd mobile
npx eas-cli build --platform all
```

## GitHub

```bash
git init
git add .
git commit -m "Initial NKfy commit"
# then push to your GitHub repo
```
