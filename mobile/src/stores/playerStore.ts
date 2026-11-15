import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { shuffleArray } from '@/utils/array';
import type { RepeatMode, Track } from '@/types/music';

interface SeekRequest {
  id: number;
  seconds: number;
}

export interface PlayerState {
  /** Tracks in their natural order. */
  queue: Track[];
  /** Playback order expressed as indices into `queue`. */
  order: number[];
  /** Position inside `order`. */
  cursor: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  repeat: RepeatMode;
  shuffle: boolean;
  recents: Track[];
  contextLabel: string | null;
  seekRequest: SeekRequest | null;
  trackNonce: number;
  playQueue: (tracks: Track[], startIndex?: number, label?: string) => void;
  playTrack: (track: Track, context?: Track[], label?: string) => void;
  toggle: () => void;
  setPlaying: (playing: boolean) => void;
  next: (auto?: boolean) => void;
  previous: () => void;
  jumpTo: (cursorPosition: number) => void;
  seek: (seconds: number) => void;
  setPosition: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  cycleRepeat: () => void;
  toggleShuffle: () => void;
  enqueue: (track: Track) => void;
  enqueueMany: (tracks: Track[]) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (queueIndex: number) => void;
  clearQueue: () => void;
  forgetRecents: () => void;
}

const MAX_RECENTS = 24;

export function trackAt(state: Pick<PlayerState, 'queue' | 'order' | 'cursor'>): Track | null {
  const queueIndex = state.order[state.cursor];
  return queueIndex === undefined ? null : state.queue[queueIndex] ?? null;
}

function identityOrder(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

function nextRepeat(mode: RepeatMode): RepeatMode {
  if (mode === 'off') return 'all';
  if (mode === 'all') return 'one';
  return 'off';
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      order: [],
      cursor: 0,
      isPlaying: false,
      position: 0,
      duration: 0,
      repeat: 'off',
      shuffle: false,
      recents: [],
      contextLabel: null,
      seekRequest: null,
      trackNonce: 0,

      playQueue: (tracks, startIndex = 0, label) => {
        const clean = tracks.filter(Boolean);
        if (clean.length === 0) return;
        const safeIndex = Math.min(Math.max(startIndex, 0), clean.length - 1);
        const { shuffle } = get();
        let order = identityOrder(clean.length);
        let cursor = safeIndex;

        if (shuffle) {
          const rest = shuffleArray(order.filter((index) => index !== safeIndex));
          order = [safeIndex, ...rest];
          cursor = 0;
        }

        const current = clean[safeIndex]!;
        const recents = [current, ...get().recents.filter((track) => track.id !== current.id)].slice(
          0,
          MAX_RECENTS
        );

        set({
          queue: clean,
          order,
          cursor,
          isPlaying: true,
          position: 0,
          duration: current.duration ?? 0,
          recents,
          contextLabel: label ?? null,
        });
      },

      playTrack: (track, context, label) => {
        const list = context && context.length > 0 ? context : [track];
        const index = list.findIndex((item) => item.id === track.id);
        get().playQueue(list, index >= 0 ? index : 0, label);
      },

      toggle: () => set((state) => ({ isPlaying: !state.isPlaying })),

      setPlaying: (playing) => set({ isPlaying: playing }),

      next: (auto = false) => {
        const { cursor, order, queue, repeat, position } = get();
        if (order.length === 0) return;

        if (auto && repeat === 'one') {
          set((state) => ({ position: 0, trackNonce: state.trackNonce + 1 }));
          return;
        }

        if (cursor < order.length - 1) {
          const nextIndex = order[cursor + 1]!;
          const track = queue[nextIndex];
          set({
            cursor: cursor + 1,
            position: 0,
            duration: track?.duration ?? 0,
          });
          return;
        }

        if (repeat === 'all') {
          const first = queue[order[0]!];
          set({ cursor: 0, position: 0, duration: first?.duration ?? 0, isPlaying: true });
          return;
        }

        const current = queue[order[cursor]!];
        set({ isPlaying: false, position: current?.duration ?? position });
      },

      previous: () => {
        const { cursor, order, queue, position, repeat } = get();
        if (order.length === 0) return;

        if (position > 3) {
          set({ position: 0, seekRequest: { id: Date.now(), seconds: 0 } });
          return;
        }

        if (cursor > 0) {
          const prevIndex = order[cursor - 1]!;
          const track = queue[prevIndex];
          set({ cursor: cursor - 1, position: 0, duration: track?.duration ?? 0 });
          return;
        }

        if (repeat === 'all') {
          const lastIndex = order[order.length - 1]!;
          const track = queue[lastIndex];
          set({ cursor: order.length - 1, position: 0, duration: track?.duration ?? 0 });
          return;
        }

        set({ position: 0, seekRequest: { id: Date.now(), seconds: 0 } });
      },

      seek: (seconds) => {
        const track = trackAt(get());
        if (!track) return;
        const max = get().duration || track.duration || seconds;
        const clamped = Math.min(Math.max(seconds, 0), max);
        set({ position: clamped, seekRequest: { id: Date.now(), seconds: clamped } });
      },

      jumpTo: (cursorPosition) => {
        const { order, queue } = get();
        if (cursorPosition < 0 || cursorPosition >= order.length) return;
        const queueIndex = order[cursorPosition]!;
        const track = queue[queueIndex];
        set({
          cursor: cursorPosition,
          position: 0,
          duration: track?.duration ?? 0,
          isPlaying: true,
        });
      },

      setPosition: (seconds) => set({ position: seconds }),

      setDuration: (seconds) => set({ duration: seconds }),

      cycleRepeat: () => set((state) => ({ repeat: nextRepeat(state.repeat) })),

      toggleShuffle: () => {
        const { shuffle, queue, order, cursor } = get();
        const nextShuffle = !shuffle;
        if (queue.length === 0) {
          set({ shuffle: nextShuffle });
          return;
        }

        const currentIndex = order[cursor] ?? 0;
        const rest = identityOrder(queue.length).filter((index) => index !== currentIndex);
        const orderedRest = nextShuffle ? shuffleArray(rest) : rest;

        set({
          shuffle: nextShuffle,
          order: [currentIndex, ...orderedRest],
          cursor: 0,
        });
      },

      enqueue: (track) => {
        const { queue, order } = get();
        set({
          queue: [...queue, track],
          order: [...order, queue.length],
        });
      },

      enqueueMany: (tracks) => {
        if (tracks.length === 0) return;
        const { queue, order } = get();
        set({
          queue: [...queue, ...tracks],
          order: [...order, ...tracks.map((_, index) => queue.length + index)],
        });
      },

      playNext: (track) => {
        const { queue, order, cursor } = get();
        const insertAt = cursor + 1;
        set({
          queue: [...queue, track],
          order: [...order.slice(0, insertAt), queue.length, ...order.slice(insertAt)],
        });
      },

      removeFromQueue: (queueIndex) => {
        const { queue, order, cursor } = get();
        if (queueIndex < 0 || queueIndex >= queue.length) return;

        const nextQueue = queue.filter((_, index) => index !== queueIndex);
        const removingCurrent = order[cursor] === queueIndex;
        let nextOrder = order
          .filter((index) => index !== queueIndex)
          .map((index) => (index > queueIndex ? index - 1 : index));

        let nextCursor = cursor;
        const currentOrderIndex = nextOrder.findIndex((index) => index === order[cursor]);

        if (removingCurrent) {
          nextCursor = Math.min(cursor, Math.max(nextOrder.length - 1, 0));
          if (nextOrder.length === 0) nextCursor = 0;
        } else if (currentOrderIndex >= 0) {
          nextCursor = currentOrderIndex;
        }

        const current = nextOrder[nextCursor] === undefined ? null : nextQueue[nextOrder[nextCursor]!];

        set({
          queue: nextQueue,
          order: nextOrder,
          cursor: nextCursor,
          position: removingCurrent ? 0 : get().position,
          duration: current?.duration ?? (removingCurrent ? 0 : get().duration),
          isPlaying: nextQueue.length === 0 ? false : get().isPlaying,
        });
      },

      clearQueue: () =>
        set({
          queue: [],
          order: [],
          cursor: 0,
          isPlaying: false,
          position: 0,
          duration: 0,
          contextLabel: null,
        }),

      forgetRecents: () => set({ recents: [] }),
    }),
    {
      name: 'nkfy-player',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        queue: state.queue,
        order: state.order,
        cursor: state.cursor,
        repeat: state.repeat,
        shuffle: state.shuffle,
        recents: state.recents,
        contextLabel: state.contextLabel,
        duration: state.duration,
      }),
    }
  )
);

export const useCurrentTrack = () => usePlayerStore((state) => trackAt(state));

export function recordRecent(track: Track) {
  const { recents } = usePlayerStore.getState();
  usePlayerStore.setState({
    recents: [track, ...recents.filter((item) => item.id !== track.id)].slice(0, MAX_RECENTS),
  });
}
