import { config } from '../config.js';
import type { NormalizedTrack } from '../types.js';

interface JamendoTrack {
  id: string;
  name: string;
  duration?: number;
  artist_name?: string;
  album_name?: string;
  image?: string;
  audio?: string;
  shareurl?: string;
  genre?: string;
}

interface JamendoResponse {
  results?: JamendoTrack[];
}

const searchCache = new Map<string, { tracks: NormalizedTrack[]; expiresAt: number }>();
const streamUrlCache = new Map<string, { url: string; expiresAt: number }>();

function isConfigured(): boolean {
  return Boolean(config.jamendoClientId);
}

function normalize(track: JamendoTrack): NormalizedTrack {
  return {
    id: `jamendo:${track.id}`,
    source: 'jamendo',
    title: track.name,
    artist: track.artist_name || 'Jamendo artist',
    album: track.album_name,
    artwork: track.image,
    duration: track.duration,
    streamUrl: `${config.publicUrl}/api/stream/jamendo/${encodeURIComponent(track.id)}`,
    externalUrl: track.shareurl || `https://www.jamendo.com/track/${track.id}`,
    genre: track.genre,
    isPlayable: true,
    providerLabel: 'Jamendo',
  };
}

export async function searchJamendo(query: string, limit = 20): Promise<NormalizedTrack[]> {
  if (!isConfigured()) return [];

  const cacheKey = `${query}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.tracks;

  const params = new URLSearchParams({
    client_id: config.jamendoClientId,
    format: 'json',
    limit: String(limit),
    search: query,
    include: 'musicinfo',
    audioformat: 'mp32',
  });

  const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Jamendo responded with ${response.status}`);
  }

  const payload = (await response.json()) as JamendoResponse;
  const tracks = (payload.results ?? []).map(normalize).filter((track) => track.title);
  searchCache.set(cacheKey, { tracks, expiresAt: Date.now() + 5 * 60 * 1000 });
  return tracks;
}

export async function resolveJamendoStreamUrl(trackId: string): Promise<string | null> {
  if (!isConfigured()) return null;

  const cached = streamUrlCache.get(trackId);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const params = new URLSearchParams({
    client_id: config.jamendoClientId,
    format: 'json',
    id: trackId,
    audioformat: 'mp32',
  });

  const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as { results?: JamendoTrack[] };
  const url = payload.results?.[0]?.audio;
  if (!url) return null;

  streamUrlCache.set(trackId, { url, expiresAt: Date.now() + 10 * 60 * 1000 });
  return url;
}
