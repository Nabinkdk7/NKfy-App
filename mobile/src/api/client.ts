import { Platform } from 'react-native';

const fallback = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || fallback).replace(/\/+$/, '');

export type ApiSource = 'local' | 'audius' | 'jamendo' | 'youtube' | 'demo';

export interface ApiTrack {
  id: string;
  source: ApiSource;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number;
  streamUrl?: string;
  externalUrl?: string;
  genre?: string;
  isPlayable: boolean;
  providerLabel: string;
  meta?: Record<string, string | number | undefined>;
}

export interface ApiPlaylist {
  id: string;
  name: string;
  description?: string;
  coverUri?: string;
  coverUrl?: string;
  tracks: ApiTrack[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface HomeFeed {
  featured?: ApiPlaylist;
  curated: ApiPlaylist[];
  trending: ApiTrack[];
  genres: string[];
  providers?: Record<string, boolean>;
  degraded?: boolean;
}

export interface SearchResults {
  query: string;
  tracks: ApiTrack[];
  youtube: ApiTrack[];
  errors?: string[];
}

export interface CuratedPayload {
  playlist: ApiPlaylist;
  tracks: ApiTrack[];
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 0, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  timeoutMs?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, timeoutMs = 12000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};

    if (!response.ok) {
      const error = payload.error as { message?: string; code?: string } | undefined;
      throw new ApiError(
        error?.message || `Request failed with ${response.status}`,
        response.status,
        error?.code
      );
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The server took too long to respond', 0, 'timeout');
    }
    throw new ApiError('Cannot reach the NKfy service. Check your connection.', 0, 'network');
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  health: () => request<{ ok: boolean }>('/api/health'),

  version: () =>
    request<{ version: string; minVersion: string; downloadUrl: string; webUrl: string }>('/api/version'),

  home: () => request<HomeFeed>('/api/discover/home'),

  genres: () => request<{ genres: string[] }>('/api/genres'),

  curated: (id: string) =>
    request<CuratedPayload>(`/api/discover/curated/${encodeURIComponent(id)}`),

  trending: (genre?: string) =>
    request<{ tracks: ApiTrack[] }>(
      `/api/trending${genre ? `?genre=${encodeURIComponent(genre)}` : ''}`
    ),

  search: (query: string, limit = 20) =>
    request<SearchResults>(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  register: (email: string, password: string, displayName?: string) =>
    request<{ token: string; user: ApiUser }>('/api/auth/register', {
      method: 'POST',
      body: { email, password, displayName },
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: ApiUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  me: (token: string) => request<{ user: ApiUser }>('/api/auth/me', { token }),

  updateProfile: (token: string, displayName: string) =>
    request<{ user: ApiUser }>('/api/auth/me', {
      method: 'PATCH',
      token,
      body: { displayName },
    }),

  playlists: (token: string) =>
    request<{ playlists: ApiPlaylist[] }>('/api/playlists', { token }),

  createPlaylist: (
    token: string,
    input: { name: string; description?: string; tracks?: ApiTrack[] }
  ) =>
    request<{ playlist: ApiPlaylist }>('/api/playlists', {
      method: 'POST',
      token,
      body: input,
    }),

  updatePlaylist: (token: string, id: string, input: { name?: string; description?: string }) =>
    request<{ playlist: ApiPlaylist }>(`/api/playlists/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      token,
      body: input,
    }),

  deletePlaylist: (token: string, id: string) =>
    request<{ ok: boolean }>(`/api/playlists/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token,
    }),

  updatePlaylistTracks: (token: string, id: string, tracks: ApiTrack[]) =>
    request<{ playlist: ApiPlaylist }>(`/api/playlists/${encodeURIComponent(id)}/tracks`, {
      method: 'PUT',
      token,
      body: { tracks },
    }),

  favorites: (token: string) => request<{ tracks: ApiTrack[] }>('/api/favorites', { token }),

  replaceFavorites: (token: string, tracks: ApiTrack[]) =>
    request<{ tracks: ApiTrack[] }>('/api/favorites', {
      method: 'PUT',
      token,
      body: { tracks },
    }),
};
