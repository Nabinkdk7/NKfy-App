import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { EqualizerSettings } from '@/types/music';

export interface EqPreset {
  id: string;
  name: string;
  bands: number[];
  bassBoost: number;
  vocal: number;
  treble: number;
}

export const eqFrequencies = [60, 230, 910, 3600, 14000] as const;
export const eqLabels = ['60', '230', '910', '3.6k', '14k'] as const;

export const eqPresets: EqPreset[] = [
  { id: 'normal', name: 'Normal', bands: [0, 0, 0, 0, 0], bassBoost: 0, vocal: 0, treble: 0 },
  { id: 'rock', name: 'Rock', bands: [5, 3, -1, 2, 4], bassBoost: 2, vocal: 0, treble: 1 },
  { id: 'pop', name: 'Pop', bands: [-1, 2, 3, 2, -1], bassBoost: 0, vocal: 2, treble: 0 },
  { id: 'classical', name: 'Classical', bands: [3, 2, 0, 2, 3], bassBoost: 0, vocal: 0, treble: 2 },
  { id: 'jazz', name: 'Jazz', bands: [3, 1, 1, 2, 2], bassBoost: 0, vocal: 1, treble: 0 },
  { id: 'electronic', name: 'Electronic', bands: [4, 2, -1, 2, 5], bassBoost: 3, vocal: 0, treble: 1 },
  { id: 'bass', name: 'Bass Boost', bands: [8, 5, 0, -1, -2], bassBoost: 6, vocal: 0, treble: 0 },
  { id: 'vocal', name: 'Vocal', bands: [-2, -1, 2, 4, 2], bassBoost: 0, vocal: 5, treble: 0 },
];

export const MAX_GAIN = 10;

interface EqualizerState extends EqualizerSettings {
  setEnabled: (enabled: boolean) => void;
  setBand: (index: number, gain: number) => void;
  setBassBoost: (gain: number) => void;
  setVocal: (gain: number) => void;
  setTreble: (gain: number) => void;
  applyPreset: (presetId: string) => void;
  reset: () => void;
}

const initial: EqualizerSettings = {
  enabled: false,
  presetId: 'normal',
  bands: [0, 0, 0, 0, 0],
  bassBoost: 0,
  vocal: 0,
  treble: 0,
};

function clampGain(value: number): number {
  return Math.min(MAX_GAIN, Math.max(-MAX_GAIN, Math.round(value * 10) / 10));
}

export const useEqualizerStore = create<EqualizerState>()(
  persist(
    (set) => ({
      ...initial,

      setEnabled: (enabled) => set({ enabled }),

      setBand: (index, gain) =>
        set((state) => {
          if (index < 0 || index >= state.bands.length) return state;
          const bands = [...state.bands];
          bands[index] = clampGain(gain);
          return { bands, presetId: 'custom' };
        }),

      setBassBoost: (gain) => set({ bassBoost: clampGain(gain), presetId: 'custom' }),
      setVocal: (gain) => set({ vocal: clampGain(gain), presetId: 'custom' }),
      setTreble: (gain) => set({ treble: clampGain(gain), presetId: 'custom' }),

      applyPreset: (presetId) => {
        const preset = eqPresets.find((item) => item.id === presetId);
        if (!preset) return;
        set({
          presetId: preset.id,
          bands: [...preset.bands],
          bassBoost: preset.bassBoost,
          vocal: preset.vocal,
          treble: preset.treble,
        });
      },

      reset: () =>
        set({
          presetId: 'normal',
          bands: [...initial.bands],
          bassBoost: 0,
          vocal: 0,
          treble: 0,
        }),
    }),
    {
      name: 'nkfy-equalizer',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        enabled: state.enabled,
        presetId: state.presetId,
        bands: state.bands,
        bassBoost: state.bassBoost,
        vocal: state.vocal,
        treble: state.treble,
      }),
    }
  )
);
