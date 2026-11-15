import type { ApiPlaylist, ApiTrack } from '@/api/client';
import type { Playlist, Track } from '@/types/music';

export function toTrack(input: ApiTrack): Track {
  return {
    id: input.id,
    title: input.title,
    artist: input.artist,
    album: input.album,
    artwork: input.artwork,
    duration: input.duration ?? 0,
    url: input.streamUrl,    externalUrl: input.externalUrl,
    source: input.source,
    isPlayable: input.isPlayable,
    providerLabel: input.providerLabel,
    genre: input.genre,
    albumId: input.meta?.albumId ? String(input.meta.albumId) : undefined,
  };
}

export function toPlaylist(input: ApiPlaylist): Playlist {
  const now = new Date().toISOString();
  return {
    id: input.id,
    name: input.name,
    description: input.description,
    coverUri: input.coverUri ?? input.coverUrl,
    tracks: (input.tracks ?? []).map(toTrack),
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

export function toApiTrack(track: Track): ApiTrack {
  return {
    id: track.id,
    source: track.source,
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork: typeof track.artwork === 'string' ? track.artwork : undefined,
    duration: track.duration,
    streamUrl: typeof track.url === 'string' ? track.url : undefined,
    externalUrl: track.externalUrl,
    genre: track.genre,
    isPlayable: track.isPlayable,
    providerLabel: track.providerLabel,
  };
}
