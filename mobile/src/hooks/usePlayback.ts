import { useCallback } from 'react';
import { Linking } from 'react-native';

import { usePlayerStore } from '@/stores/playerStore';
import { prepareLocalTrackUri } from '@/native/localMusic';
import { toast } from '@/stores/uiStore';
import type { Track } from '@/types/music';

export interface PlayCollectionOptions {
  shuffle?: boolean;
  startTrackId?: string;
}

async function resolveLocalTracks(tracks: Track[]): Promise<Track[]> {
  const results = await Promise.allSettled(
    tracks.map(async (track) => {
      if (track.source !== 'local' || !track.url) return track;
      const url = await prepareLocalTrackUri(String(track.url), track.filename);
      return { ...track, url };
    })
  );
  return results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    return tracks[index];
  });
}

export function usePlayTrack() {

  return useCallback(
    (track: Track, list?: Track[], label?: string) => {
      if (!track.isPlayable) {
        if (track.externalUrl) {
          void Linking.openURL(track.externalUrl).catch(() =>
            toast('Could not open the external player', 'error')
          );
          toast('Opening in the official YouTube app');
        } else {
          toast('This track is not playable in NKfy');
        }
        return;
      }

      void (async () => {
        const queue = list && list.length > 0 ? list : [track];
        const resolved = await resolveLocalTracks(queue);
        const index = Math.max(
          0,
          resolved.findIndex((item) => item.id === track.id)
        );
        usePlayerStore.getState().playQueue(resolved, index, label);
      })();
    },
    []
  );
}

export function usePlayCollection() {

  return useCallback(
    (tracks: Track[], label?: string, options: PlayCollectionOptions = {}) => {
      void (async () => {
        const playable = tracks.filter((track) => track.isPlayable && track.url);
        if (playable.length === 0) {
          toast('There are no playable tracks here yet');
          return;
        }

        const resolved = await resolveLocalTracks(playable);
        let start = 0;
        if (options.startTrackId) {
          const index = resolved.findIndex((track) => track.id === options.startTrackId);
          if (index >= 0) start = index;
        }
        if (options.shuffle) {
          start = Math.floor(Math.random() * resolved.length);
        }
        usePlayerStore.getState().playQueue(resolved, start, label);
      })();
    },
    []
  );
}

export function useTogglePlayCollection() {
  const playCollection = usePlayCollection();
  const toggle = usePlayerStore((state) => state.toggle);
  const current = usePlayerStore((state) => {
    const index = state.order[state.cursor];
    return index === undefined ? null : state.queue[index] ?? null;
  });

  return useCallback(
    (tracks: Track[], label?: string) => {
      const isThisCollection = current && tracks.some((track) => track.id === current.id);
      if (isThisCollection) {
        toggle();
        return;
      }
      playCollection(tracks, label);
    },
    [current, playCollection, toggle]
  );
}
