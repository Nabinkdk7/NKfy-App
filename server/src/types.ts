export type TrackSource = 'local' | 'audius' | 'jamendo' | 'youtube' | 'demo';

export interface NormalizedTrack {
  id: string;
  source: TrackSource;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  /** Duration in seconds. */
  duration?: number;
  /** Direct audio URL. Never returned for YouTube. */
  streamUrl?: string;
  /** Official page for the track or video. */
  externalUrl?: string;
  genre?: string;
  isPlayable: boolean;
  providerLabel: string;
  /** Provider-specific extra data (safe to expose). */
  meta?: Record<string, string | number | undefined>;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface PlaylistRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_uri: string | null;
  tracks_json: string;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUri?: string;
  tracks: NormalizedTrack[];
  createdAt: string;
  updatedAt: string;
}

export interface CuratedPlaylist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  query: string;
  accent: string;
}
