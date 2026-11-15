import { config } from '../config.js';
import type { NormalizedTrack } from '../types.js';

const HOST_TTL_MS = 30 * 60 * 1000;
let cachedHost: { url: string; expiresAt: number } | null = null;

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Audius responded with ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function getHost(): Promise<string> {
  if (cachedHost && cachedHost.expiresAt > Date.now()) {
    return cachedHost.url;
  }

  const payload = await fetchJson<{ data?: string[] }>('https://api.audius.co');
  const host = payload.data?.find((candidate) => candidate.startsWith('https://'));
  if (!host) {
    throw new Error('No Audius discovery node available');
  }

  cachedHost = { url: host.replace(/\/+$/, ''), expiresAt: Date.now() + HOST_TTL_MS };
  return cachedHost.url;
}

interface AudiusTrack {
  id: string;
  title: string;
  duration?: number;
  genre?: string;
  permalink?: string;
  play_count?: number;
  artwork?: Record<string, string | undefined>;
  user?: { name?: string; handle?: string };
}

interface AudiusResponse {
  data?: AudiusTrack[];
}

interface AudiusUser {
  id: string;
  handle?: string;
  name?: string;
}

interface AudiusUsersResponse {
  data?: AudiusUser[];
}

function normalize(track: AudiusTrack, host: string): NormalizedTrack {
  const artwork =
    track.artwork?.['480x480'] ||
    track.artwork?.['1000x1000'] ||
    track.artwork?.['150x150'];

  return {
    id: `audius:${track.id}`,
    source: 'audius',
    title: track.title,
    artist: track.user?.name || track.user?.handle || 'Audius artist',
    artwork,
    duration: track.duration,
    streamUrl: `${host}/v1/tracks/${encodeURIComponent(track.id)}/stream?app_name=${encodeURIComponent(
      config.audiusAppName
    )}`,
    externalUrl: track.permalink ? `https://audius.co${track.permalink}` : undefined,
    genre: track.genre,
    isPlayable: true,
    providerLabel: 'Audius',
    meta: {
      plays: track.play_count,
      handle: track.user?.handle,
    },
  };
}

export async function searchAudiusUsers(query: string, limit = 5): Promise<AudiusUser[]> {
  const host = await getHost();
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    app_name: config.audiusAppName,
  });
  const payload = await fetchJson<AudiusUsersResponse>(`${host}/v1/users/search?${params}`);
  return payload.data ?? [];
}

export async function getAudiusUserTracks(userId: string, limit = 20): Promise<NormalizedTrack[]> {
  const host = await getHost();
  const params = new URLSearchParams({
    limit: String(limit),
    app_name: config.audiusAppName,
  });
  const payload = await fetchJson<AudiusResponse>(`${host}/v1/users/${encodeURIComponent(userId)}/tracks?${params}`);
  return (payload.data ?? []).map((track) => normalize(track, host));
}

export async function searchAudius(query: string, limit = 20): Promise<NormalizedTrack[]> {
  const host = await getHost();
  const params = new URLSearchParams({
    query,
    limit: String(Math.min(limit, 50)),
    app_name: config.audiusAppName,
  });

  const [trackResult, usersResult] = await Promise.allSettled([
    fetchJson<AudiusResponse>(`${host}/v1/tracks/search?${params}`).then((p) =>
      (p.data ?? []).map((track) => normalize(track, host))
    ),
    searchAudiusUsers(query, 3),
  ]);

  const tracks = trackResult.status === 'fulfilled' ? trackResult.value : [];
  const users = usersResult.status === 'fulfilled' ? usersResult.value : [];

  // Fetch full catalogs for matching artists to surface all their songs.
  const catalogResults = await Promise.allSettled(
    users.slice(0, 3).map((user) => getAudiusUserTracks(user.id, 25))
  );
  const catalogs = catalogResults.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

  const seen = new Set<string>();
  const merged: NormalizedTrack[] = [];
  for (const track of [...catalogs, ...tracks]) {
    if (seen.has(track.id)) continue;
    seen.add(track.id);
    merged.push(track);
  }
  return merged.slice(0, Math.max(limit, 30));
}

export async function trendingAudius(genre?: string, limit = 20): Promise<NormalizedTrack[]> {
  const host = await getHost();
  const params = new URLSearchParams({
    limit: String(limit),
    app_name: config.audiusAppName,
  });
  if (genre) params.set('genre', genre);

  const payload = await fetchJson<AudiusResponse>(`${host}/v1/tracks/trending?${params}`);
  return (payload.data ?? []).map((track) => normalize(track, host));
}

export async function getAudiusTrack(id: string): Promise<NormalizedTrack | null> {
  const host = await getHost();
  const payload = await fetchJson<{ data?: AudiusTrack }>(
    `${host}/v1/tracks/${encodeURIComponent(id)}?app_name=${encodeURIComponent(config.audiusAppName)}`
  );

  return payload.data ? normalize(payload.data, host) : null;
}
