import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { colors, fonts, spacing } from '@/theme';
import { toast } from '@/stores/uiStore';

const ANDROID_URL = (process.env.EXPO_PUBLIC_ANDROID_DOWNLOAD_URL || '').trim();
const IOS_URL = (process.env.EXPO_PUBLIC_IOS_DOWNLOAD_URL || '').trim();
const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL || '').trim();

function isDirectAppUrl(url: string) {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.endsWith('.apk') ||
    u.includes('play.google.com') ||
    u.includes('apps.apple.com') ||
    u.includes('testflight.apple.com') ||
    u.includes('expo.dev') ||
    u.includes('github.com/') && u.includes('/releases/')
  );
}

export default function DownloadScreen() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const standalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    const handler = (e: any) => {
      e.preventDefault?.();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  const open = async (url: string, label: string) => {
    if (!url) {
      toast(`${label} download is not available yet`, 'error');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      toast(`Could not open the ${label} link`, 'error');
    }
  };

  const installPwa = async () => {
    if (isStandalone) {
      toast('NKfy is already installed on this device');
      return;
    }
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        return;
      } catch {
        // fall through to instructions
      }
    }
    toast('Use your browser menu → "Add to Home screen" / "Install app"');
  };

  const androidIsDirect = isDirectAppUrl(ANDROID_URL);
  const iosIsDirect = isDirectAppUrl(IOS_URL);

  return (
    <Screen showMiniPlayer={false}>
      <Header title="Download NKfy" onBack={() => router.back()} />
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Icon name="logo" size={40} color={colors.accentLight} />
        </View>
        <Text style={styles.title}>NKfy – Feel The Music</Text>
        <Text style={styles.subtitle}>
          Install NKfy on your phone for the best experience. On mobile web you
          can add it to your Home Screen (PWA). Native APK/TestFlight builds can
          be linked here when published.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Install on this device (recommended)</Text>
        <Text style={styles.cardBody}>
          {isStandalone
            ? 'NKfy is already installed as an app on this device.'
            : 'Add NKfy to your Home Screen for an app-like, full-screen experience with quick access.'}
        </Text>
        <Button
          label={isStandalone ? 'Already installed' : 'Add to Home Screen / Install'}
          icon="download"
          onPress={installPwa}
          disabled={isStandalone}
        />
        {!isStandalone ? (
          <Text style={styles.hint}>
            iPhone (Safari): Share → Add to Home Screen. Android (Chrome): Menu → Install app / Add to Home screen.
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Android (APK / Play Store)</Text>
        <Text style={styles.cardBody}>
          {androidIsDirect
            ? 'Download and install the Android app package.'
            : 'Native Android build is not published yet. Use “Add to Home Screen” above to install the web app now. When an APK or Play Store link is available, it will appear here.'}
        </Text>
        <Button
          label={androidIsDirect ? 'Download for Android' : 'Android build not available yet'}
          icon="download"
          onPress={() => open(ANDROID_URL, 'Android')}
          disabled={!androidIsDirect}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>iPhone / iPad (App Store / TestFlight)</Text>
        <Text style={styles.cardBody}>
          {iosIsDirect
            ? 'Open the App Store or TestFlight link to install NKfy on iOS.'
            : 'Native iOS build is not published yet. On iPhone/iPad, use Safari → Share → “Add to Home Screen” to install NKfy now.'}
        </Text>
        <Button
          label={iosIsDirect ? 'Download for iOS' : 'iOS build not available yet'}
          icon="download"
          onPress={() => open(IOS_URL, 'iOS')}
          disabled={!iosIsDirect}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Open web app</Text>
        <Text style={styles.cardBody}>Use NKfy directly in your browser.</Text>
        <Button
          label="Open NKfy Web"
          icon="globe"
          onPress={() => {
            if (WEB_URL) void open(WEB_URL, 'Web');
            else toast('You are already using NKfy on the web');
          }}
        />
      </View>

      <Text style={styles.footnote}>
        Version {Constants.expoConfig?.version ?? '1.0.0'} · Built for Nepal · Legal streams only.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 460,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.semi,
    fontSize: 16,
    color: colors.text,
  },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textDim,
    lineHeight: 17,
  },
  footnote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
