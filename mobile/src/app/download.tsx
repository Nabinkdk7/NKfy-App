import { Linking } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { colors, fonts, spacing } from '@/theme';
import { toast } from '@/stores/uiStore';

const ANDROID_URL = process.env.EXPO_PUBLIC_ANDROID_DOWNLOAD_URL || '';
const IOS_URL = process.env.EXPO_PUBLIC_IOS_DOWNLOAD_URL || '';
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || '';

export default function DownloadScreen() {
  const open = async (url: string, label: string) => {
    if (!url) {
      toast(`${label} download is not configured yet`, 'error');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      toast(`Could not open the ${label} download`, 'error');
    }
  };

  return (
    <Screen showMiniPlayer={false}>
      <Header title="Download NKfy" onBack={() => router.back()} />
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Icon name="logo" size={40} color={colors.accentLight} />
        </View>
        <Text style={styles.title}>NKfy — Feel The Music</Text>
        <Text style={styles.subtitle}>
          Install the full app for background playback, lock-screen controls, the
          equalizer and offline listening.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Android</Text>
        <Text style={styles.cardBody}>
          Download the APK and install it on your device. You may need to allow
          installs from your browser.
        </Text>
        <Button
          label="Download for Android"
          icon="download"
          onPress={() => open(ANDROID_URL, 'Android')}
          disabled={!ANDROID_URL}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>iPhone / iPad</Text>
        <Text style={styles.cardBody}>
          Open the TestFlight or App Store link to install NKfy on iOS.
        </Text>
        <Button
          label="Download for iOS"
          icon="download"
          onPress={() => open(IOS_URL, 'iOS')}
          disabled={!IOS_URL}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Web (this device)</Text>
        <Text style={styles.cardBody}>
          You are already using NKfy on the web. Add it to your home screen for
          an app-like experience.
        </Text>
        {Platform.OS === 'web' ? (
          <Button
            label="Open web app"
            icon="globe"
            onPress={() => {
              if (WEB_URL) void open(WEB_URL, 'Web');
              else toast('You are already here');
            }}
          />
        ) : null}
      </View>

      <Text style={styles.footnote}>
        Version {Constants.expoConfig?.version ?? '1.0.0'} · Built for Nepal ·
        Legal streams only.
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
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cardTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
  },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  footnote: {
    marginTop: spacing.xl,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
