import { api } from '@/api/client';
import { toApiTrack, toPlaylist, toTrack } from '@/api/mappers';
import { useLibraryStore } from '@/stores/libraryStore';

export interface SyncResult {
  favorites: number;
  playlists: number;
}

/**
 * Uploads the on-device favorites and playlists to the signed-in account.
 * Playlists are linked to their server copy after the first upload so later
 * backups update the same record instead of creating duplicates.
 */
export async function pushLibrary(token: string): Promise<SyncResult> {
  const { favorites, playlists, setPlaylistCloudId } = useLibraryStore.getState();

  await api.replaceFavorites(token, favorites.map(toApiTrack));

  let synced = 0;
  for (const playlist of playlists) {
    const tracks = playlist.tracks.map(toApiTrack);
    if (playlist.cloudId) {
      await api.updatePlaylist(token, playlist.cloudId, {
        name: playlist.name,
        description: playlist.description ?? '',
      });
      await api.updatePlaylistTracks(token, playlist.cloudId, tracks);
    } else {
      const { playlist: created } = await api.createPlaylist(token, {
        name: playlist.name,
        description: playlist.description,
        tracks,
      });
      setPlaylistCloudId(playlist.id, created.id);
    }
    synced += 1;
  }

  return { favorites: favorites.length, playlists: synced };
}

/**
 * Restores favorites from the account and merges server playlists into the
 * device library. Local-only playlists are kept untouched.
 */
export async function pullLibrary(token: string): Promise<SyncResult> {
  const [favoritePayload, playlistPayload] = await Promise.all([
    api.favorites(token),
    api.playlists(token),
  ]);

  const { replaceFavorites, mergeCloudPlaylists } = useLibraryStore.getState();
  replaceFavorites(favoritePayload.tracks.map(toTrack));
  const playlists = mergeCloudPlaylists(playlistPayload.playlists.map(toPlaylist));

  return { favorites: favoritePayload.tracks.length, playlists };
}
