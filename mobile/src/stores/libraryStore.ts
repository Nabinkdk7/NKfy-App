import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createSeedPlaylists } from '@/data/demoCatalog';
import type { Playlist, Track } from '@/types/music';
import { createId } from '@/utils/id';

export type ScanStatus = 'idle' | 'scanning' | 'ready' | 'unavailable' | 'denied';

export interface AppSettings {
  audioQuality: 'auto' | 'high' | 'saver';
  autoplay: boolean;
  crossfade: number;
  downloadOverWifi: boolean;
  animations: boolean;
  notifications: boolean;
  showExplicit: boolean;
  scanOnLaunch: boolean;
}

interface LibraryState {
  favorites: Track[];
  playlists: Playlist[];
  localTracks: Track[];
  scanStatus: ScanStatus;
  scanError: string | null;
  lastScannedAt: number | null;
  settings: AppSettings;
  recentSearches: string[];
  toggleFavorite: (track: Track) => boolean;
  isFavorite: (trackId: string) => boolean;
  removeFavorite: (trackId: string) => void;
  replaceFavorites: (tracks: Track[]) => void;
  createPlaylist: (
    name: string,
    description?: string,
    tracks?: Track[],
    curatedId?: string
  ) => Playlist;
  updatePlaylist: (id: string, patch: { name?: string; description?: string }) => void;
  deletePlaylist: (id: string) => void;
  addTracksToPlaylist: (id: string, tracks: Track[]) => number;
  removeTrackFromPlaylist: (id: string, trackId: string) => void;
  setPlaylistCloudId: (id: string, cloudId: string) => void;
  mergeCloudPlaylists: (playlists: Playlist[]) => number;
  setLocalTracks: (tracks: Track[]) => void;
  setScanState: (status: ScanStatus, error?: string | null) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

const defaultSettings: AppSettings = {
  audioQuality: 'auto',
  autoplay: true,
  crossfade: 0,
  downloadOverWifi: true,
  animations: true,
  notifications: true,
  showExplicit: false,
  scanOnLaunch: false,
};

const MAX_SEARCHES = 8;

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      favorites: [],
      playlists: createSeedPlaylists(),
      localTracks: [],
      scanStatus: 'idle',
      scanError: null,
      lastScannedAt: null,
      settings: defaultSettings,
      recentSearches: [],

      toggleFavorite: (track) => {
        const exists = get().favorites.some((item) => item.id === track.id);
        set((state) => ({
          favorites: exists
            ? state.favorites.filter((item) => item.id !== track.id)
            : [track, ...state.favorites],
        }));
        return !exists;
      },

      isFavorite: (trackId) => get().favorites.some((item) => item.id === trackId),

      removeFavorite: (trackId) =>
        set((state) => ({ favorites: state.favorites.filter((item) => item.id !== trackId) })),

      replaceFavorites: (tracks) => set({ favorites: tracks }),

      createPlaylist: (name, description, tracks = [], curatedId) => {
        const now = new Date().toISOString();
        const playlist: Playlist = {
          id: createId('playlist'),
          name: name.trim() || 'New Playlist',
          description: description?.trim() || undefined,
          coverUri: tracks[0]?.artwork,
          tracks,
          createdAt: now,
          updatedAt: now,
          curatedId,
        };
        set((state) => ({ playlists: [playlist, ...state.playlists] }));
        return playlist;
      },

      updatePlaylist: (id, patch) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === id
              ? {
                  ...playlist,
                  ...(patch.name !== undefined ? { name: patch.name.trim() || playlist.name } : {}),
                  ...(patch.description !== undefined
                    ? { description: patch.description.trim() || undefined }
                    : {}),
                  updatedAt: new Date().toISOString(),
                }
              : playlist
          ),
        })),

      deletePlaylist: (id) =>
        set((state) => ({ playlists: state.playlists.filter((playlist) => playlist.id !== id) })),

      addTracksToPlaylist: (id, tracks) => {
        let added = 0;
        set((state) => ({
          playlists: state.playlists.map((playlist) => {
            if (playlist.id !== id) return playlist;
            const existing = new Set(playlist.tracks.map((track) => track.id));
            const fresh = tracks.filter((track) => !existing.has(track.id));
            added = fresh.length;
            return {
              ...playlist,
              tracks: [...playlist.tracks, ...fresh],
              coverUri: playlist.coverUri ?? fresh[0]?.artwork ?? tracks[0]?.artwork,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
        return added;
      },

      removeTrackFromPlaylist: (id, trackId) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === id
              ? {
                  ...playlist,
                  tracks: playlist.tracks.filter((track) => track.id !== trackId),
                  updatedAt: new Date().toISOString(),
                }
              : playlist
          ),
        })),

      setPlaylistCloudId: (id, cloudId) =>
        set((state) => ({
          playlists: state.playlists.map((playlist) =>
            playlist.id === id ? { ...playlist, cloudId } : playlist
          ),
        })),

      mergeCloudPlaylists: (incoming) => {
        let merged = 0;
        set((state) => {
          const playlists = [...state.playlists];
          for (const cloud of incoming) {
            const index = playlists.findIndex(
              (playlist) => playlist.cloudId === cloud.id || playlist.id === cloud.id
            );
            if (index >= 0) {
              playlists[index] = {
                ...playlists[index]!,
                name: cloud.name,
                description: cloud.description,
                coverUri: cloud.coverUri,
                tracks: cloud.tracks,
                updatedAt: cloud.updatedAt,
                cloudId: cloud.id,
              };
            } else {
              playlists.unshift({ ...cloud, cloudId: cloud.id });
            }
            merged += 1;
          }
          return { playlists };
        });
        return merged;
      },

      setLocalTracks: (tracks) =>
        set({
          localTracks: tracks,
          scanStatus: 'ready',
          scanError: null,
          lastScannedAt: Date.now(),
        }),

      setScanState: (status, error = null) => set({ scanStatus: status, scanError: error }),

      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),

      addRecentSearch: (query) => {
        const clean = query.trim();
        if (!clean) return;
        set((state) => ({
          recentSearches: [
            clean,
            ...state.recentSearches.filter((item) => item.toLowerCase() !== clean.toLowerCase()),
          ].slice(0, MAX_SEARCHES),
        }));
      },

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'nkfy-library',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persisted) => persisted as LibraryState,
      partialize: (state) => ({
        favorites: state.favorites,
        playlists: state.playlists,
        localTracks: state.localTracks,
        scanStatus: state.scanStatus,
        lastScannedAt: state.lastScannedAt,
        settings: state.settings,
        recentSearches: state.recentSearches,
      }),
    }
  )
);

export const useFavoriteIds = () =>
  useLibraryStore((state) => new Set(state.favorites.map((track) => track.id)));

export function findPlaylist(id: string): Playlist | undefined {
  return useLibraryStore.getState().playlists.find((playlist) => playlist.id === id);
}
