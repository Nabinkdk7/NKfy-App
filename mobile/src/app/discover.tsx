import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { useHomeFeed, useTrending } from '@/api/hooks';
import { CoverCard } from '@/components/Cards';
import { Chip, ChipRow, EmptyState, SectionHeader } from '@/components/Chips';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { SongRow } from '@/components/SongRow';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { demoCurated, demoTracks } from '@/data/demoCatalog';
import { demoGenres } from '@/data/genres';
import { usePlayTrack } from '@/hooks/usePlayback';
import { useNetworkStatus } from '@/hooks/useNetwork';
import { usePlayerStore } from '@/stores/playerStore';
import { colors, fonts, radii, spacing } from '@/theme';
import type { Track } from '@/types/music';

const providerList = [
  { key: 'audius', label: 'Audius' },
  { key: 'jamendo', label: 'Jamendo' },
  { key: 'youtube', label: 'YouTube' },
];

export default function DiscoverScreen() {
  const [genre, setGenre] = useState<string | undefined>(undefined);
  const [actionTrack, setActionTrack] = useState<Track | null>(null);

  const feed = useHomeFeed();
  const trending = useTrending(genre);
  const playTrack = usePlayTrack();

  const currentTrack = usePlayerStore((state) => {
    const index = state.order[state.cursor];
    return index === undefined ? null : state.queue[index] ?? null;
  });

  const tracks = trending.data ?? [];
  const displayTracks = tracks.length > 0 ? tracks : trending.isError ? demoTracks : [];
  const providers = feed.data?.providers;

  const isOnline = useNetworkStatus().isOnline;

  const refresh = () => {
    void feed.refetch();
    void trending.refetch();
  };

  if (!isOnline) {
    return (
      <Screen showMiniPlayer>
        <Header title="Discover" large eyebrow="OPEN MUSIC" onBack={() => router.back()} />
        <EmptyState
          icon="globe"
          title="You're offline"
          message="Only songs saved on this device are available offline. Connect to the internet to discover new music."
        />
      </Screen>
    );
  }

  return (
    <Screen
      showMiniPlayer
      refreshControl={
        <RefreshControl
          refreshing={trending.isFetching && !trending.isLoading}
          onRefresh={refresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      <Header
        title="Discover"
        large
        eyebrow="OPEN MUSIC · LEGAL STREAMS"
        subtitle="Independent artists from Audius and Jamendo, plus YouTube discovery."
        onBack={() => router.back()}
      />

      <SearchField
        value=""
        onChangeText={() => undefined}
        onPress={() => router.push('/search')}
        placeholder="Search the whole catalogue"
      />

      <View style={styles.providers}>
        {providerList.map((provider) => {
          const available = providers?.[provider.key] !== false;
          return (
            <View key={provider.key} style={styles.provider}>
              <View
                style={[styles.providerDot, { backgroundColor: available ? colors.success : colors.textMuted }]}
              />
              <Text style={styles.providerLabel}>{provider.label}</Text>
              <Text style={styles.providerState}>{available ? 'Live' : 'Limited'}</Text>
            </View>
          );
        })}
      </View>

      <ChipRow contentContainerStyle={styles.genreRow}>
        <Chip label="All genres" active={!genre} onPress={() => setGenre(undefined)} />
        {demoGenres.map((item) => (
          <Chip
            key={item.name}
            label={item.name}
            active={genre === item.name}
            onPress={() => setGenre(genre === item.name ? undefined : item.name)}
          />
        ))}
      </ChipRow>

      <SectionHeader
        title={genre ? `${genre} picks` : 'Trending on the open web'}
        actionLabel="Refresh"
        onAction={() => void trending.refetch()}
      />

      {trending.isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loadingText}>Tuning into open music…</Text>
        </View>
      ) : null}

      {trending.isError ? (
        <View style={styles.notice}>
          <Icon name="info" size={13} color={colors.warning} />
          <Text style={styles.noticeText}>
            The online catalogue is unreachable right now. Showing NKfy Sessions instead.
          </Text>
        </View>
      ) : null}

      {displayTracks.length === 0 && !trending.isLoading ? (
        <EmptyState
          icon="globe"
          title="Nothing here yet"
          message="Try another genre, or check your connection to the NKfy service."
        />
      ) : (
        <View style={styles.list}>
          {displayTracks.map((track) => (
            <SongRow
              key={track.id}
              track={track}
              active={currentTrack?.id === track.id}
              onPress={() => playTrack(track, displayTracks, 'Discover')}
              onMore={() => setActionTrack(track)}
              showProvider
            />
          ))}
        </View>
      )}

      <SectionHeader
        title="Editor's mixes"
        actionLabel="Your playlists"
        onAction={() => router.push('/playlists')}
      />
      <View style={styles.horizontal}>
        {demoCurated.map((mix) => (
          <CoverCard
            key={mix.id}
            title={mix.name}
            subtitle={mix.description}
            artwork={mix.cover}
            width={136}
            onPress={() => router.push({ pathname: '/curated/[id]', params: { id: mix.id } })}
          />
        ))}
      </View>

      <View style={styles.legal}>
        <View style={styles.legalIcon}>
          <Icon name="shield" size={17} color={colors.accentLight} />
        </View>
        <View style={styles.legalCopy}>
          <Text style={styles.legalTitle}>Artist-first by design</Text>
          <Text style={styles.legalText}>
            NKfy plays streams provided by Audius and Jamendo and opens YouTube results in the
            official app. We never download, extract or re-host copyrighted audio.
          </Text>
        </View>
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
  providers: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  provider: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 1,
    paddingVertical: 8,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  providerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  providerLabel: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.text,
    flex: 1,
  },
  providerState: {
    fontFamily: fonts.regular,
    fontSize: 8.5,
    color: colors.textMuted,
  },
  genreRow: {
    marginTop: spacing.lg,
  },
  list: {
    marginTop: spacing.xs,
    gap: 1,
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
    padding: spacing.sm + 2,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(245,165,36,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245,165,36,0.22)',
    marginBottom: spacing.sm,
  },
  noticeText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSecondary,
    flex: 1,
  },
  horizontal: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: spacing.lg,
  },
  legal: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxxl,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  legalIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalCopy: {
    flex: 1,
    gap: 4,
  },
  legalTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.text,
  },
  legalText: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.textMuted,
  },
});
