import { create } from 'zustand';

export type ToastTone = 'default' | 'success' | 'error';

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
  showToast: (message: string, tone?: ToastTone) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  id: 0,
  message: '',
  tone: 'default',
  showToast: (message, tone = 'default') =>
    set((state) => ({ id: state.id + 1, message, tone })),
  hideToast: () => set({ message: '' }),
}));

export function toast(message: string, tone: ToastTone = 'default') {
  useToastStore.getState().showToast(message, tone);
}
