import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button, IconButton } from '@/components/Button';
import { EmptyState } from '@/components/Chips';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { SongRow } from '@/components/SongRow';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { usePlayCollection } from '@/hooks/usePlayback';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, spacing, type } from '@/theme';
import type { Track } from '@/types/music';
import { formatLongDuration, songCountLabel } from '@/utils/format';

export default function FavoritesScreen() {
  const favorites = useLibraryStore((state) => state.favorites);
  const playCollection = usePlayCollection();
  const [actionTrack, setActionTrack] = useState<Track | null>(null);

  const currentTrack = usePlayerStore((state) => {
    const index = state.order[state.cursor];
    return index === undefined ? null : state.queue[index] ?? null;
  });
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const toggle = usePlayerStore((state) => state.toggle);

  const totalDuration = favorites.reduce((sum, track) => sum + track.duration, 0);
  const collectionPlaying =
    Boolean(currentTrack) && favorites.some((track) => track.id === currentTrack!.id);
  const isThisPlaying = collectionPlaying && isPlaying;

  const clearAll = () => {
    if (favorites.length === 0) return;
    Alert.alert('Clear liked songs?', 'This removes every song from your favorites.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          useLibraryStore.getState().replaceFavorites([]);
          toast('Favorites cleared');
        },
      },
    ]);
  };

  return (
    <Screen showMiniPlayer>
      <Header
        title="Liked Songs"
        onBack={() => router.back()}
        right={
          favorites.length > 0 ? (
            <Button label="Clear" size="sm" variant="ghost" onPress={clearAll} />
          ) : null
        }
      />

      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(47,128,255,0.35)', 'rgba(47,128,255,0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroIcon}>
          <Icon name="heart" size={34} color={colors.white} filled />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>YOUR COLLECTION</Text>
          <Text style={styles.heroTitle}>Liked Songs</Text>
          <Text style={styles.heroMeta}>
            {songCountLabel(favorites.length)}
            {favorites.length > 0 ? ` · ${formatLongDuration(totalDuration)}` : ''}
          </Text>
        </View>
      </View>

      {favorites.length > 0 ? (
        <View style={styles.actions}>
          <View style={styles.playButton}>
            <IconButton
              icon={isThisPlaying ? 'pause' : 'play'}
              size={52}
              iconSize={22}
              background={colors.accent}
              color={colors.white}
              onPress={() => {
                if (collectionPlaying) toggle();
                else playCollection(favorites, 'Liked Songs');
              }}
              accessibilityLabel={isThisPlaying ? 'Pause liked songs' : 'Play liked songs'}
            />
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionLabel}>Play all</Text>
            <Text style={styles.actionMeta}>{songCountLabel(favorites.length)} in order</Text>
          </View>
          <Button
            label="Shuffle"
            icon="shuffle"
            size="sm"
            variant="secondary"
            onPress={() => playCollection(favorites, 'Liked Songs', { shuffle: true })}
          />
        </View>
      ) : null}

      {favorites.length === 0 ? (
        <EmptyState
          icon="heart"
          title="No liked songs yet"
          message="Tap the heart on any song and it will wait for you here."
          action={
            <Button label="Find music" icon="search" onPress={() => router.push('/search')} />
          }
        />
      ) : (
        <View style={styles.list}>
          {favorites.map((track, index) => (
            <SongRow
              key={track.id}
              track={track}
              index={index + 1}
              showArtwork={false}
              active={currentTrack?.id === track.id}
              onPress={() =>
                playCollection(favorites, 'Liked Songs', { startTrackId: track.id })
              }
              onMore={() => setActionTrack(track)}
            />
          ))}
        </View>
      )}

      {favorites.length > 0 ? (
        <Text style={styles.footer}>
          Liked songs live on this device first. Sign in to back them up.
        </Text>
      ) : null}

      <TrackActionsSheet
        track={actionTrack}
        visible={Boolean(actionTrack)}
        onClose={() => setActionTrack(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.25)',
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 3,
  },
  heroEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 1.3,
    color: colors.accentLight,
  },
  heroTitle: {
    fontFamily: fonts.bold,
    fontSize: 25,
    letterSpacing: -0.6,
    color: colors.text,
  },
  heroMeta: {
    ...type.caption,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  playButton: {
    marginLeft: 2,
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  actionMeta: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  list: {
    marginTop: spacing.lg,
    gap: 1,
  },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
