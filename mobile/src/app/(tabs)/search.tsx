import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSearchResults } from '@/api/hooks';
import { GenreCard, useGridWidth } from '@/components/Cards';
import { Chip, ChipRow, EmptyState, SectionHeader } from '@/components/Chips';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { SongRow } from '@/components/SongRow';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { demoGenres } from '@/data/genres';
import { demoTracks } from '@/data/demoCatalog';
import { usePlayCollection, usePlayTrack } from '@/hooks/usePlayback';
import { useNetworkStatus } from '@/hooks/useNetwork';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { colors, fonts, radii, spacing, type } from '@/theme';
import type { Track } from '@/types/music';
import { uniqueBy } from '@/utils/array';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [actionTrack, setActionTrack] = useState<Track | null>(null);

  const recentSearches = useLibraryStore((state) => state.recentSearches);
  const localTracks = useLibraryStore((state) => state.localTracks);
  const favorites = useLibraryStore((state) => state.favorites);
  const playlists = useLibraryStore((state) => state.playlists);
  const clearRecentSearches = useLibraryStore((state) => state.clearRecentSearches);
  const addRecentSearch = useLibraryStore((state) => state.addRecentSearch);

  const currentTrack = usePlayerStore((state) => {
    const index = state.order[state.cursor];
    return index === undefined ? null : state.queue[index] ?? null;
  });
  const playCollection = usePlayCollection();
  const playTrack = usePlayTrack();

  const results = useSearchResults(query);
  const trimmed = query.trim();

  const localResults = useMemo(() => {
    const terms = trimmed
      .toLowerCase()
      .split(/\\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length > 1);
    if (terms.length === 0) return [];
    const source = [...favorites, ...localTracks, ...demoTracks];
    return uniqueBy(
      source.filter((track) => {
        const haystack = [track.title, track.artist, track.album, track.genre]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return terms.every((term) => haystack.includes(term));
      }),
      (track) => track.id
    ).slice(0, 8);
  }, [favorites, localTracks, trimmed]);

  const matchingPlaylists = useMemo(() => {
    const needle = trimmed.toLowerCase();
    if (needle.length < 2) return [];
    return playlists.filter(
      (playlist) =>
        playlist.name.toLowerCase().includes(needle) ||
        playlist.description?.toLowerCase().includes(needle)
    );
  }, [playlists, trimmed]);

  const onlineTracks = results.data?.tracks ?? [];
  const youtubeTracks = results.data?.youtube ?? [];
  const hasOnline = onlineTracks.length > 0 || youtubeTracks.length > 0;
  const loading = results.isFetching && trimmed.length > 1;
  const genreWidth = useGridWidth(2, 10);
  const isOnline = useNetworkStatus().isOnline;

  const submit = () => {
    if (trimmed.length > 0) addRecentSearch(trimmed);
  };

  return (
    <Screen reserveMiniPlayer>
      <Header title="Search" large eyebrow="Find your sound" />

      <SearchField
        value={query}
        onChangeText={setQuery}
        onSubmit={submit}
        placeholder="Search songs, artists, albums"
      />

      {!isOnline ? (
        <EmptyState
          icon="globe"
          title="You're offline"
          message="Online search is unavailable. You can still search your device library and play saved songs."
        />
      ) : null}

      {trimmed.length < 2 ? (
        <>
          {recentSearches.length > 0 ? (
            <View style={styles.block}>
              <SectionHeader
                title="Recent searches"
                actionLabel="Clear"
                onAction={clearRecentSearches}
                style={styles.section}
              />
              <View style={styles.chips}>
                {recentSearches.map((item) => (
                  <Chip key={item} label={item} icon="clock" onPress={() => setQuery(item)} />
                ))}
              </View>
            </View>
          ) : null}

          <Pressable
            onPress={() => router.push('/discover')}
            style={({ pressed }) => [styles.promo, pressed && styles.pressed]}
          >
            <View style={styles.promoIcon}>
              <Icon name="globe" size={20} color={colors.accentLight} />
            </View>
            <View style={styles.promoCopy}>
              <Text style={styles.promoTitle}>Discover online music</Text>
              <Text style={styles.promoText}>
                Independent tracks from Audius, Jamendo and YouTube discovery.
              </Text>
            </View>
            <Icon name="chevron-right" size={17} color={colors.textMuted} />
          </Pressable>

          <SectionHeader title="Browse all" />
          <View style={styles.genres}>
            {demoGenres.map((genre) => (
              <GenreCard
                key={genre.name}
                name={genre.name}
                accent={genre.accent}
                onPress={() => {
                  setQuery(genre.name);
                  addRecentSearch(genre.name);
                }}
              />
            ))}
          </View>
          <View style={{ height: genreWidth > 0 ? spacing.lg : 0 }} />
        </>
      ) : (
        <>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingText}>Searching NKfy and the open web…</Text>
            </View>
          ) : null}

          {!loading && results.isError ? (
            <View style={styles.notice}>
              <Icon name="info" size={13} color={colors.warning} />
              <Text style={styles.noticeText}>
                Online search is offline. Showing matches from your library.
              </Text>
            </View>
          ) : null}

          {matchingPlaylists.length > 0 ? (
            <View style={styles.block}>
              <SectionHeader title="Playlists" style={styles.section} />
              {matchingPlaylists.slice(0, 3).map((playlist) => (
                <Pressable
                  key={playlist.id}
                  onPress={() =>
                    router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } })
                  }
                  style={({ pressed }) => [styles.playlistRow, pressed && styles.pressed]}
                >
                  <View style={styles.playlistIcon}>
                    <Icon name="playlist" size={18} color={colors.accentLight} />
                  </View>
                  <View style={styles.playlistCopy}>
                    <Text style={styles.playlistName} numberOfLines={1}>
                      {playlist.name}
                    </Text>
                    <Text style={styles.playlistMeta}>{playlist.tracks.length} songs</Text>
                  </View>
                  <Icon name="chevron-right" size={15} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          ) : null}

          {localResults.length > 0 ? (
            <View style={styles.block}>
              <SectionHeader title="From your library" style={styles.section} />
              {localResults.map((track) => (
                <SongRow
                  key={track.id}
                  track={track}
                  active={currentTrack?.id === track.id}
                  onPress={() => playCollection(localResults, `Search · ${trimmed}`, { startTrackId: track.id })}
                  onMore={() => setActionTrack(track)}
                />
              ))}
            </View>
          ) : null}

          {onlineTracks.length > 0 ? (
            <View style={styles.block}>
              <SectionHeader title="Tracks" style={styles.section} />
              {onlineTracks.map((track) => (
                <SongRow
                  key={track.id}
                  track={track}
                  active={currentTrack?.id === track.id}
                  onPress={() => playCollection(onlineTracks, `Search · ${trimmed}`, { startTrackId: track.id })}
                  onMore={() => setActionTrack(track)}
                  showProvider
                />
              ))}
            </View>
          ) : null}

          {youtubeTracks.length > 0 ? (
            <View style={styles.block}>
              <View style={styles.youtubeHeader}>
                <Icon name="youtube" size={17} color={colors.text} />
                <Text style={styles.youtubeTitle}>From YouTube</Text>
                <Text style={styles.youtubeHint}>Opens official app</Text>
              </View>
              {youtubeTracks.map((track) => (
                <SongRow
                  key={track.id}
                  track={track}
                  onPress={() => playTrack(track)}
                  onMore={() => setActionTrack(track)}
                  showProvider
                />
              ))}
            </View>
          ) : null}

          {!loading && !hasOnline && localResults.length === 0 && matchingPlaylists.length === 0 ? (
            <EmptyState
              icon="search"
              title="No matches yet"
              message={`Nothing found for “${trimmed}”. Try a different spelling, artist or genre.`}
            />
          ) : null}

          {trimmed.length > 1 && onlineTracks.length > 0 ? (
            <ChipRow contentContainerStyle={styles.suggestions}>
              <Chip
                label="Explore more online"
                icon="globe"
                onPress={() => router.push('/discover')}
              />
              <Chip
                label="Search YouTube"
                icon="youtube"
                onPress={() => setQuery(`${trimmed} official`)}
              />
            </ChipRow>
          ) : null}
        </>
      )}

      <TrackActionsSheet
        track={actionTrack}
        visible={Boolean(actionTrack)}
        onClose={() => setActionTrack(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: spacing.xl,
  },
  section: {
    marginTop: 0,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.24)',
  },
  promoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoCopy: {
    flex: 1,
    gap: 3,
  },
  promoTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
  },
  promoText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 12.5,
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
    fontSize: 11.5,
    color: colors.textSecondary,
    flex: 1,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 9,
  },
  playlistIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistCopy: {
    flex: 1,
    gap: 2,
  },
  playlistName: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  playlistMeta: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  youtubeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  youtubeTitle: {
    ...type.subheading,
    fontSize: 14,
  },
  youtubeHint: {
    marginLeft: 'auto',
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  suggestions: {
    marginTop: spacing.xl,
  },
  pressed: {
    opacity: 0.7,
  },
});
