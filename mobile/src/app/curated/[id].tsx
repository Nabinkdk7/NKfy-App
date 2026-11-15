import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useCuratedPlaylist } from '@/api/hooks';
import { Artwork } from '@/components/Artwork';
import { Button, IconButton } from '@/components/Button';
import { EmptyState } from '@/components/Chips';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { SongRow } from '@/components/SongRow';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { demoCurated } from '@/data/demoCatalog';
import { usePlayCollection } from '@/hooks/usePlayback';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, spacing } from '@/theme';
import type { Track } from '@/types/music';
import { formatLongDuration } from '@/utils/format';

export default function CuratedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const playlistId = Array.isArray(id) ? id[0] : id;
  const query = useCuratedPlaylist(playlistId);
  const demo = useMemo(
    () => demoCurated.find((item) => item.id === playlistId),
    [playlistId]
  );

  const playlists = useLibraryStore((state) => state.playlists);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);
  const playCollection = usePlayCollection();
  const [actionTrack, setActionTrack] = useState<Track | null>(null);

  const currentTrack = usePlayerStore((state) => {
    const index = state.order[state.cursor];
    return index === undefined ? null : state.queue[index] ?? null;
  });
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const toggle = usePlayerStore((state) => state.toggle);

  const saved = playlists.find((playlist) => playlist.curatedId === playlistId);
  const tracks = query.data?.tracks?.length ? query.data.tracks : demo?.tracks ?? [];
  const name = query.data?.playlist.name ?? demo?.name ?? 'Curated mix';
  const description =
    query.data?.playlist.description ?? demo?.description ?? 'Handpicked by NKfy';
  const artwork = query.data?.playlist.coverUri ?? demo?.cover;
  const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
  const collectionPlaying =
    Boolean(currentTrack) && tracks.some((track) => track.id === currentTrack!.id);

  const save = () => {
    if (saved) {
      toast(`Already saved as “${saved.name}”`);
      return;
    }
    const playlist = createPlaylist(name, description, tracks, playlistId ?? undefined);
    toast(`Saved “${playlist.name}” to your playlist`);
  };

  return (
    <Screen showMiniPlayer>
      <Header title="Mix" onBack={() => router.back()} right={undefined} />

      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(47,128,255,0.24)', 'rgba(18,21,26,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Artwork source={artwork} size={152} radius={20} label={name} />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>NKFY MIX</Text>
          <Text style={styles.title} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
          <Text style={styles.meta}>
            {tracks.length} songs{tracks.length > 0 ? ` · ${formatLongDuration(totalDuration)}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <IconButton
          icon={collectionPlaying && isPlaying ? 'pause' : 'play'}
          size={52}
          iconSize={22}
          background={colors.accent}
          color={colors.white}
          onPress={() => {
            if (collectionPlaying) toggle();
            else playCollection(tracks, name);
          }}
          accessibilityLabel={collectionPlaying && isPlaying ? 'Pause mix' : 'Play mix'}
        />
        <Button
          label="Shuffle"
          icon="shuffle"
          size="sm"
          variant="secondary"
          onPress={() => playCollection(tracks, name, { shuffle: true })}
          disabled={tracks.length === 0}
        />
        <View style={styles.spacer} />
        <Button
          label={saved ? 'Saved' : 'Save'}
          icon={saved ? 'check' : 'plus'}
          size="sm"
          variant={saved ? 'soft' : 'ghost'}
          onPress={save}
          disabled={tracks.length === 0}
        />
      </View>

      {query.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Loading the mix…</Text>
        </View>
      ) : null}

      {query.isError && !demo ? (
        <View style={styles.notice}>
          <Icon name="info" size={13} color={colors.warning} />
          <Text style={styles.noticeText}>
            This mix could not be loaded. Check your connection and try again.
          </Text>
        </View>
      ) : null}

      {tracks.length === 0 && !query.isLoading ? (
        <EmptyState
          icon="sparkles"
          title="Mix is warming up"
          message="There are no tracks available for this mix right now. Try again in a moment."
          action={<Button label="Retry" icon="refresh" onPress={() => void query.refetch()} />}
        />
      ) : (
        <View style={styles.list}>
          {tracks.map((track, index) => (
            <SongRow
              key={track.id}
              track={track}
              index={index + 1}
              showArtwork={false}
              active={currentTrack?.id === track.id}
              onPress={() =>
                playCollection(tracks, name, { startTrackId: track.id })
              }
              onMore={() => setActionTrack(track)}
              showProvider
            />
          ))}
        </View>
      )}

      <View style={styles.source}>
        <Icon name="shield" size={13} color={colors.textMuted} />
        <Text style={styles.sourceText}>
          Streams are provided by the original artist platforms. Availability can change at any
          time.
        </Text>
      </View>

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
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.2)',
    overflow: 'hidden',
  },
  heroCopy: {
    alignItems: 'center',
    gap: 4,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.accentLight,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    letterSpacing: -0.6,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  spacer: {
    flex: 1,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    padding: spacing.sm + 2,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(245,165,36,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245,165,36,0.22)',
  },
  noticeText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    flex: 1,
  },
  list: {
    marginTop: spacing.lg,
    gap: 1,
  },
  source: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xs,
  },
  sourceText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    flex: 1,
  },
});
