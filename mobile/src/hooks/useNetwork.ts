import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import * as Network from 'expo-network';

export interface NetworkState {
  isOnline: boolean;
  isChecking: boolean;
}

/**
 * Cross-platform connectivity hook. On web it tracks `navigator.onLine`;
 * on native it polls `expo-network` (which is the recommended Expo module).
 */
export function useNetworkStatus(): NetworkState {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const update = async () => {
      try {
        if (Platform.OS === 'web') {
          setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
        } else {
          const state = await Network.getNetworkStateAsync();
          setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
        }
      } catch {
        setIsOnline(true);
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    };

    void update();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onOnline = () => setIsOnline(true);
      const onOffline = () => setIsOnline(false);
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
      return () => {
        cancelled = true;
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    }

    const interval = setInterval(() => void update(), 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { isOnline, isChecking };
}

export function useIsOnline(): boolean {
  return useNetworkStatus().isOnline;
}
