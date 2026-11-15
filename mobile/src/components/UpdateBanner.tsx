import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, fonts, radii } from '@/theme';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://nkfy-server.vercel.app').replace(/\/+$/, '');
const ANDROID_APK_URL = 'https://github.com/Nabinkdk7/NKfy-App/releases/download/v1.0.0/app-debug.apk';

function versionGreater(latest: string, current: string): boolean {
  const toParts = (value: string) =>
    value
      .split('.')
      .map((part) => Number(part.replace(/[^\d].*/, '')) || 0);
  const [a, b, c] = toParts(latest);
  const [x, y, z] = toParts(current);
  if (a !== x) return a > x;
  if (b !== y) return b > y;
  return c > z;
}

function CloseIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M6 18L18 6" stroke={colors.white} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function UpdateBanner() {
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const [latest, setLatest] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    void (async () => {
      try {
        const response = await fetch(`${API_URL}/api/version`, { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (active && typeof data?.version === 'string' && versionGreater(data.version, appVersion)) {
          setLatest(data.version);
        }
      } catch {
        // Silent: no banner when the update check fails.
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [appVersion]);

  const toastMessage = 'Downloading NKfy update…';

  if (dismissed || !latest) return null;

  const onUpdate = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ua = String(window.navigator?.userAgent || '').toLowerCase();
      if (/android/.test(ua)) {
        window.location.href = ANDROID_APK_URL;
      } else if (/iphone|ipad|ipod/.test(ua)) {
        window.location.href = 'https://nkfymusic.vercel.app/download';
      } else {
        window.location.href = 'https://github.com/Nabinkdk7/NKfy-App/releases/download/v1.0.0/app-debug.apk';
      }
      return;
    }

    // Native: jump to the browser so the browser can install the latest PWA/APK.
    Linking.openURL?.('https://nkfymusic.vercel.app/download').catch(() => undefined);
  };

  return (
    <View
      pointerEvents="box-none"
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLabel={`NKfy ${latest} is available`}
    >
      <View style={styles.card}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>UPDATE AVAILABLE</Text>
          <Text style={styles.title}>NKfy {latest} is ready</Text>
        </View>
        <Pressable onPress={onUpdate} accessibilityRole="button" style={styles.updateButton}>
          <Text style={styles.updateText}>Update</Text>
        </Pressable>
        <Pressable
          onPress={() => setDismissed(true)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss update banner"
          hitSlop={10}
          style={styles.close}
        >
          <CloseIcon />
        </Pressable>
      </View>
      {process.env.NODE_ENV === 'development' && <Text style={{ display: 'none' }}>{toastMessage}</Text>}
    </View>
  );
}

const styles = {
  container: {
    position: 'absolute' as const,
    bottom: 108,
    left: 12,
    right: 12,
    zIndex: 80,
  },
  card: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    backgroundColor: '#141B27',
    borderWidth: 1,
    borderColor: 'rgba(47, 128, 255, 0.35)',
    borderRadius: radii?.lg ?? 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: colors.accentLight,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.semibold,
    fontSize: 13,
    letterSpacing: -0.1,
  },
  updateButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  updateText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  close: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
};
