import { requireOptionalNativeModule } from 'expo-modules-core';

export interface NativeLocalSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumId: string;
  duration: number;
  uri: string;
  artwork?: string;
  folder?: string;
  filename?: string;
  trackNumber?: number;
  year?: number;
  dateAdded?: number;
}

export interface NkfyLocalMusicModule {
  scan(): Promise<NativeLocalSong[]>;
  requestPermission(): Promise<string>;
  getPermissionStatus(): Promise<string>;
  isAvailable(): boolean;
}

const NkfyLocalMusic = requireOptionalNativeModule<NkfyLocalMusicModule>('NkfyLocalMusic');

export default NkfyLocalMusic;
