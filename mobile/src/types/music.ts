export type TrackSource = 'local' | 'audius' | 'jamendo' | 'youtube' | 'demo';

export type MediaSource = string | number;

export type ArtworkSource = MediaSource | { uri: string };

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: ArtworkSource;
  /** Duration in seconds. */
  duration: number;
  /** Audio URI (or bundled asset) for playable tracks. */
  url?: MediaSource;
  /** Official web page (used for YouTube). */
  externalUrl?: string;
  source: TrackSource;
  isPlayable: boolean;
  providerLabel: string;
  genre?: string;
  folder?: string;
  year?: number;
  trackNumber?: number;
  filename?: string;
  albumId?: string;
  addedAt?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUri?: ArtworkSource;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
  isSystem?: boolean;
  curatedId?: string;
  /** Server playlist id once this playlist has been backed up. */
  cloudId?: string;
}

export interface AlbumSummary {
  id: string;
  title: string;
  artist: string;
  artwork?: ArtworkSource;
  year?: number;
  tracks: Track[];
}

export interface ArtistSummary {
  id: string;
  name: string;
  artwork?: ArtworkSource;
  followers?: number;
  verified?: boolean;
  tracks: Track[];
  albums: AlbumSummary[];
}

export interface FolderSummary {
  path: string;
  name: string;
  trackCount: number;
  tracks: Track[];
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface EqBand {
  frequency: number;
  label: string;
  gain: number;
}

export interface EqualizerSettings {
  enabled: boolean;
  presetId: string;
  bands: number[];
  bassBoost: number;
  vocal: number;
  treble: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  avatar?: string;
  isGuest?: boolean;
}

export interface AuthSession {
  token: string;
  user: User;
}
