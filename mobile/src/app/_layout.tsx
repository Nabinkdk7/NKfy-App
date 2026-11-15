import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AudioHost } from '@/audio/AudioHost';
import { ToastHost } from '@/components/Toast';
import { UpdateBanner } from '@/components/UpdateBanner';
import { useAuthStore } from '@/stores/authStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { pruneLocalCache } from '@/native/localMusic';
import { colors } from '@/theme';

if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync().catch(() => undefined);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void useAuthStore.getState().restore();
    // Touch persisted stores so they hydrate before the first frame settles.
    useLibraryStore.getState();
    pruneLocalCache();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setReady(true);
      if (Platform.OS !== 'web') {
        void SplashScreen.hideAsync().catch(() => undefined);
      }
    }
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'nkfy-web-reset';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        *:focus, *:focus-visible { outline: none !important; }
        button, [role="button"], a { outline: none !important; box-shadow: none !important; }
        button:hover, [role="button"]:hover { background-color: rgba(255,255,255,0.04); }
        input, textarea { outline: none !important; }
      `;
      document.head.appendChild(style);
    }

    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = '/apple-touch-icon.png';
      document.head.appendChild(link);
    }
    const metaDefs = [
      { name: 'theme-color', content: '#08090B' },
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'NKfy' },
    ] as const;
    for (const def of metaDefs) {
      if (!document.querySelector(`meta[name="${def.name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = def.name;
        meta.content = def.content;
        document.head.appendChild(meta);
      }
    }

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="player"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="queue"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="auth"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
        <AudioHost />
        <ToastHost />
        <UpdateBanner />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
