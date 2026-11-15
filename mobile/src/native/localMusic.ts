import { Platform, PermissionsAndroid, type Permission } from 'react-native';

import NkfyLocalMusic, { type NativeLocalSong } from '../../modules/nkfy-local-music';
import type { Track } from '@/types/music';

export type LocalAccess = 'granted' | 'denied' | 'unavailable' | 'restricted';

export function localMusicAvailable(): boolean {
  try {
    return Boolean(NkfyLocalMusic?.isAvailable?.());
  } catch {
    return false;
  }
}

export async function requestLocalMusicAccess(): Promise<LocalAccess> {
  if (!NkfyLocalMusic) return 'unavailable';

  if (Platform.OS === 'android') {
    try {
      const permission = (
        Number(Platform.Version) >= 33
          ? 'android.permission.READ_MEDIA_AUDIO'
          : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      ) as Permission;
      const result = await PermissionsAndroid.request(permission);
      if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
      if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'denied';
      return 'denied';
    } catch {
      return 'unavailable';
    }
  }

  if (Platform.OS === 'ios') {
    try {
      const status = await NkfyLocalMusic.requestPermission?.();
      if (status === 'granted') return 'granted';
      if (status === 'restricted') return 'restricted';
      return 'denied';
    } catch {
      return 'unavailable';
    }
  }

  return 'unavailable';
}

export async function scanLocalMusic(): Promise<Track[]> {
  if (!NkfyLocalMusic) return [];
  const songs = await NkfyLocalMusic.scan();
  return songs.map(toLocalTrack).sort((a, b) => a.title.localeCompare(b.title));
}

export function toLocalTrack(song: NativeLocalSong): Track {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    albumId: song.albumId,
    artwork: song.artwork,
    duration: song.duration,
    url: song.uri,
    source: 'local',
    isPlayable: true,
    providerLabel: 'On this device',
    folder: song.folder,
    filename: song.filename,
    trackNumber: song.trackNumber,
    year: song.year && song.year > 0 ? song.year : undefined,
    addedAt: song.dateAdded,
  };
}
