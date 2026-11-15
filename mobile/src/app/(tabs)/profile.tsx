import Constants from 'expo-constants';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { SettingRow, SettingSection } from '@/components/Cards';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { SongRow } from '@/components/SongRow';
import { usePlayCollection } from '@/hooks/usePlayback';
import { useAuthStore } from '@/stores/authStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, spacing } from '@/theme';
import type { Track } from '@/types/music';
import { initials } from '@/utils/format';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const signOut = useAuthStore((state) => state.signOut);
  const favorites = useLibraryStore((state) => state.favorites);
  const playlists = useLibraryStore((state) => state.playlists);
  const localTracks = useLibraryStore((state) => state.localTracks);
  const recents = usePlayerStore((state) => state.recents);
  const playCollection = usePlayCollection();
  const currentTrack = usePlayerStore((state) => {
    const index = state.order[state.cursor];
    return index === undefined ? null : state.queue[index] ?? null;
  });

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const signedIn = status === 'signedIn' && Boolean(user);

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Your on-device library and playlists stay on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void signOut();
          toast('Signed out');
        },
      },
    ]);
  };

  return (
    <Screen reserveMiniPlayer>
      <Header
        title="Profile"
        large
        eyebrow="Your account"
        right={
          <IconButton
            icon="settings"
            size={38}
            iconSize={19}
            color={colors.textSecondary}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Settings"
          />
        }
      />

      <View style={styles.identity}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            {user ? (
              <Text style={styles.avatarText}>{initials(user.displayName)}</Text>
            ) : (
              <Icon name="profile" size={30} color={colors.accentLight} />
            )}
          </View>
        </View>
        <Text style={styles.name}>{user?.displayName ?? 'Guest listener'}</Text>
        <Text style={styles.subtitle}>
          {user?.email ?? 'Sign in to back up your favorites and playlists'}
        </Text>
        <View style={styles.tag}>
          <Icon name={signedIn ? 'shield' : 'music'} size={11} color={colors.accentLight} />
          <Text style={styles.tagText}>{signedIn ? 'Synced account' : 'Local first · always yours'}</Text>
        </View>
      </View>

      {!signedIn ? (
        <View style={styles.signInCard}>
          <View style={styles.signInIcon}>
            <Icon name="lock" size={20} color={colors.accentLight} />
          </View>
          <View style={styles.signInCopy}>
            <Text style={styles.signInTitle}>Create your NKfy account</Text>
            <Text style={styles.signInText}>
              Keep playlists safe and pick up on another device. No ads, no noise.
            </Text>
          </View>
          <Button
            label="Sign in"
            size="sm"
            onPress={() => router.push('/auth')}
            style={styles.signInButton}
          />
        </View>
      ) : null}

      <View style={styles.stats}>
        <Pressable
          style={styles.stat}
          onPress={() => router.push('/favorites')}
          accessibilityRole="button"
        >
          <Text style={styles.statValue}>{favorites.length}</Text>
          <Text style={styles.statLabel}>Liked</Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable
          style={styles.stat}
          onPress={() => router.push('/playlists')}
          accessibilityRole="button"
        >
          <Text style={styles.statValue}>{playlists.length}</Text>
          <Text style={styles.statLabel}>Playlists</Text>
        </Pressable>
        <View style={styles.statDivider} />
        <Pressable
          style={styles.stat}
          onPress={() => router.push('/library')}
          accessibilityRole="button"
        >
          <Text style={styles.statValue}>{localTracks.length}</Text>
          <Text style={styles.statLabel}>On device</Text>
        </Pressable>
      </View>

      <View style={styles.quickGrid}>
        <Pressable
          onPress={() => router.push('/favorites')}
          style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
        >
          <View style={[styles.quickIcon, { backgroundColor: 'rgba(47,128,255,0.15)' }]}>
            <Icon name="heart" size={18} color={colors.accentLight} />
          </View>
          <Text style={styles.quickLabel}>Liked Songs</Text>
          <Text style={styles.quickMeta}>{favorites.length} songs</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/equalizer')}
          style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
        >
          <View style={[styles.quickIcon, { backgroundColor: 'rgba(139,92,246,0.14)' }]}>
            <Icon name="sliders" size={18} color="#B99CFF" />
          </View>
          <Text style={styles.quickLabel}>Equalizer</Text>
          <Text style={styles.quickMeta}>Tune your sound</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/discover')}
          style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
        >
          <View style={[styles.quickIcon, { backgroundColor: 'rgba(16,185,129,0.13)' }]}>
            <Icon name="globe" size={18} color="#5EEAD4" />
          </View>
          <Text style={styles.quickLabel}>Discover</Text>
          <Text style={styles.quickMeta}>Open music</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
        >
          <View style={[styles.quickIcon, { backgroundColor: 'rgba(245,165,36,0.12)' }]}>
            <Icon name="settings" size={18} color="#F5C15C" />
          </View>
          <Text style={styles.quickLabel}>Settings</Text>
          <Text style={styles.quickMeta}>Playback & storage</Text>
        </Pressable>
      </View>

      {recents.length > 0 ? (
        <>
          <Text style={styles.sectionHeading}>Recently played</Text>
          <View style={styles.recentList}>
            {recents.slice(0, 3).map((track: Track) => (
              <SongRow
                key={track.id}
                track={track}
                active={currentTrack?.id === track.id}
                onPress={() => playCollection(recents, 'Recently played', { startTrackId: track.id })}
                subtitle={track.artist}
              />
            ))}
          </View>
        </>
      ) : null}

      <SettingSection title="Library">
        <SettingRow
          icon="heart"
          label="Liked songs"
          description="Everything you have hearted"
          value={String(favorites.length)}
          onPress={() => router.push('/favorites')}
        />
        <SettingRow
          icon="playlist"
          label="Playlists"
          description="Your collections"
          value={String(playlists.length)}
          onPress={() => router.push('/playlists')}
        />
        <SettingRow
          icon="folder"
          label="Device music"
          description="Songs stored on this phone"
          value={String(localTracks.length)}
          onPress={() => router.push('/library')}
          last
        />
      </SettingSection>

      <SettingSection title="About">
        <SettingRow
          icon="logo"
          label="NKfy"
          description="Feel The Music"
          value={`v${version}`}
        />
        <SettingRow
          icon="shield"
          label="Music licensing"
          description="Streams come from Audius, Jamendo and official YouTube playback. Nothing is downloaded or extracted by NKfy."
        />
        <SettingRow
          icon="globe"
          label="Online discovery"
          description="Explore independent music on the open web"
          onPress={() => router.push('/discover')}
          last
        />
      </SettingSection>

      {signedIn ? (
        <Button
          label="Sign out"
          icon="logout"
          variant="danger"
          onPress={confirmSignOut}
          style={styles.signOut}
        />
      ) : null}

      <Text style={styles.footer}>NKfy · Feel The Music · {new Date().getFullYear()}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: 5,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentFaint,
    borderWidth: 1,
    borderColor: 'rgba(47,128,255,0.3)',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.accentLight,
    letterSpacing: -0.5,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 21,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.accentFaint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.2)',
  },
  tagText: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: colors.accentLight,
  },
  signInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.24)',
    marginTop: spacing.sm,
  },
  signInIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInCopy: {
    flex: 1,
    gap: 2,
  },
  signInTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  signInText: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  signInButton: {
    paddingHorizontal: spacing.md,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    letterSpacing: -0.4,
  },
  statLabel: {
    fontFamily: fonts.regular,
    fontSize: 10,
    letterSpacing: 0.3,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    backgroundColor: colors.border,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: spacing.lg,
  },
  quick: {
    width: '48%',
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    gap: 4,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  quickLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.text,
  },
  quickMeta: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  sectionHeading: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginTop: spacing.xxl,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  recentList: {
    marginTop: spacing.xs,
  },
  signOut: {
    marginTop: spacing.xxl,
  },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  pressed: {
    opacity: 0.72,
  },
});
