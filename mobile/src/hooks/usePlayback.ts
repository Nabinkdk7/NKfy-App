import { useCallback } from 'react';
import { Linking } from 'react-native';

import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import type { Track } from '@/types/music';

export interface PlayCollectionOptions {
  shuffle?: boolean;
  startTrackId?: string;
}

export function usePlayTrack() {
  const playQueue = usePlayerStore((state) => state.playQueue);

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

      const queue = list && list.length > 0 ? list : [track];
      const index = Math.max(
        0,
        queue.findIndex((item) => item.id === track.id)
      );
      playQueue(queue, index, label);
    },
    [playQueue]
  );
}

export function usePlayCollection() {
  const playQueue = usePlayerStore((state) => state.playQueue);

  return useCallback(
    (tracks: Track[], label?: string, options: PlayCollectionOptions = {}) => {
      const playable = tracks.filter((track) => track.isPlayable && track.url);
      if (playable.length === 0) {
        toast('There are no playable tracks here yet');
        return;
      }

      let start = 0;
      if (options.startTrackId) {
        const index = playable.findIndex((track) => track.id === options.startTrackId);
        if (index >= 0) start = index;
      }
      if (options.shuffle) {
        start = Math.floor(Math.random() * playable.length);
      }
      playQueue(playable, start, label);
    },
    [playQueue]
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
