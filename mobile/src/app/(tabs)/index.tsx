import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useHomeFeed } from '@/api/hooks';
import { FeatureCard, CoverCard, QuickTile, useGridWidth } from '@/components/Cards';
import { SectionHeader } from '@/components/Chips';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { SongRow } from '@/components/SongRow';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { demoCurated, demoRecent } from '@/data/demoCatalog';
import { usePlayCollection } from '@/hooks/usePlayback';
import { useAuthStore } from '@/stores/authStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { colors, fonts, radii, spacing, type } from '@/theme';
import type { Track } from '@/types/music';
import { mentionGreeting, initials } from '@/utils/format';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const playlists = useLibraryStore((state) => state.playlists);
  const favorites = useLibraryStore((state) => state.favorites);
  const localTracks = useLibraryStore((state) => state.localTracks);
  const recents = usePlayerStore((state) => state.recents);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTrack = usePlayerStore((state) => {
    const index = state.order[state.cursor];
    return index === undefined ? null : state.queue[index] ?? null;
  });

  const feed = useHomeFeed();
  const playCollection = usePlayCollection();
  const tileWidth = useGridWidth(2, 10);
  const [actionTrack, setActionTrack] = useState<Track | null>(null);

  const curatedFeed = feed.data?.curated;
  const madeForYou = useMemo(() => {
    if (curatedFeed?.length) {
      return curatedFeed.map((playlist) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description ?? 'Curated for you',
        artwork: playlist.coverUri,
      }));
    }
    return demoCurated.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      artwork: item.cover,
    }));
  }, [curatedFeed]);

  const featured = feed.data?.featured
    ? {
        id: feed.data.featured.id,
        name: feed.data.featured.name,
        description: feed.data.featured.description ?? 'Handpicked for you',
        artwork: feed.data.featured.coverUri,
        tracks: [] as Track[],
      }
    : {
        id: demoCurated[0]!.id,
        name: demoCurated[0]!.name,
        description: demoCurated[0]!.description,
        artwork: demoCurated[0]!.cover,
        tracks: demoCurated[0]!.tracks ?? [],
      };

  const featuredPlaying =
    Boolean(currentTrack) &&
    isPlaying &&
    (featured.tracks.length === 0 || featured.tracks.some((track) => track.id === currentTrack!.id));

  const recentTracks = recents.length > 0 ? recents.slice(0, 8) : demoRecent;
  const trending = feed.data?.trending ?? [];
  const offline = feed.isError;

  const greeting = mentionGreeting(user?.displayName);

  return (
    <Screen
      reserveMiniPlayer
      refreshControl={
        <RefreshControl
          refreshing={feed.isFetching && !feed.isLoading}
          onRefresh={() => void feed.refetch()}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      <View style={styles.topRow}>
        <View style={styles.topCopy}>
          <Text style={styles.brand}>NKFY · FEEL THE MUSIC</Text>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/profile')}
          style={styles.avatar}
          accessibilityLabel="Open profile"
        >
          {user ? (
            <Text style={styles.avatarText}>{initials(user.displayName)}</Text>
          ) : (
            <Icon name="profile" size={18} color={colors.accentLight} />
          )}
        </Pressable>
      </View>
      <Text style={styles.tagline}>Your music, your mood, your moment.</Text>

      <SearchField
        value=""
        onChangeText={() => undefined}
        onPress={() => router.push('/search')}
        placeholder="Search songs, artists, albums"
        style={styles.search}
      />

      {offline ? (
        <View style={styles.offlinePill}>
          <Icon name="globe" size={12} color={colors.textMuted} />
          <Text style={styles.offlineText}>Offline preview · showing bundled sessions</Text>
        </View>
      ) : null}

      <SectionHeader title="Jump back in" />
      <View style={styles.grid}>
        <QuickTile
          title="Favorites"
          subtitle={`${favorites.length} liked`}
          artwork={favorites[0]?.artwork}
          onPress={() => router.push('/favorites')}
          onPlay={() => playCollection(favorites, 'Favorites')}
        />
        <QuickTile
          title="On this device"
          subtitle={`${localTracks.length} songs`}
          artwork={localTracks[0]?.artwork}
          onPress={() => router.push('/library')}
          onPlay={() => playCollection(localTracks, 'On this device')}
        />
        {playlists.slice(0, 2).map((playlist) => (
          <QuickTile
            key={playlist.id}
            title={playlist.name}
            subtitle={`${playlist.tracks.length} songs`}
            artwork={playlist.coverUri ?? playlist.tracks[0]?.artwork}
            onPress={() => router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } })}
            onPlay={() => playCollection(playlist.tracks, playlist.name)}
          />
        ))}
        {playlists.length === 0 ? (
          <QuickTile
            title="Create a playlist"
            subtitle="Build your first mix"
            artwork={undefined}
            onPress={() => router.push('/playlists')}
          />
        ) : null}
      </View>

      <View style={styles.featureWrap}>
        <FeatureCard
          title={featured.name}
          description={featured.description}
          artwork={featured.artwork}
          isPlaying={featuredPlaying}
          onPress={() =>
            router.push({ pathname: '/curated/[id]', params: { id: featured.id } })
          }
          onPlay={() => {
            if (featured.tracks.length > 0) {
              playCollection(featured.tracks, featured.name);
            } else {
              router.push({ pathname: '/curated/[id]', params: { id: featured.id } });
            }
          }}
        />
      </View>

      <SectionHeader
        title="Made for you"
        onAction={() => router.push('/discover')}
        actionLabel="Explore"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {madeForYou.slice(0, 6).map((item) => (
          <CoverCard
            key={item.id}
            title={item.name}
            subtitle={item.description}
            artwork={item.artwork}
            width={140}
            onPress={() => router.push({ pathname: '/curated/[id]', params: { id: item.id } })}
          />
        ))}
      </ScrollView>

      <SectionHeader
        title="Recently played"
        actionLabel="Library"
        onAction={() => router.push('/library')}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {recentTracks.map((track) => (
          <CoverCard
            key={track.id}
            title={track.title}
            subtitle={track.artist}
            artwork={track.artwork}
            width={tileWidth}
            onPress={() => playCollection(recentTracks, 'Recently played')}
          />
        ))}
      </ScrollView>

      {trending.length > 0 ? (
        <>
          <SectionHeader
            title="Trending online"
            actionLabel="See all"
            onAction={() => router.push('/discover')}
          />
          <View style={styles.list}>
            {trending.slice(0, 4).map((track) => (
              <SongRow
                key={track.id}
                track={track}
                active={currentTrack?.id === track.id}
                onPress={() => {
                  if (!track.isPlayable) {
                    setActionTrack(track);
                    return;
                  }
                  playCollection(trending, 'Trending online', { startTrackId: track.id });
                }}
                onMore={() => setActionTrack(track)}
                showProvider
              />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader
        title="Your playlists"
        actionLabel="See all"
        onAction={() => router.push('/playlists')}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontal}>
        {playlists.slice(0, 6).map((playlist) => (
          <CoverCard
            key={playlist.id}
            title={playlist.name}
            subtitle={`${playlist.tracks.length} songs`}
            artwork={playlist.coverUri ?? playlist.tracks[0]?.artwork}
            width={128}
            onPress={() => router.push({ pathname: '/playlist/[id]', params: { id: playlist.id } })}
          />
        ))}
        <Pressable
          onPress={() => router.push('/playlists')}
          style={({ pressed }) => [styles.newPlaylist, pressed && styles.pressed]}
        >
          <View style={styles.newIcon}>
            <Icon name="plus" size={22} color={colors.accentLight} />
          </View>
          <Text style={styles.newLabel}>New playlist</Text>
        </Pressable>
      </ScrollView>

      <TrackActionsSheet
        track={actionTrack}
        visible={Boolean(actionTrack)}
        onClose={() => setActionTrack(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  topCopy: {
    flex: 1,
    gap: 4,
  },
  brand: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.5,
    color: colors.accentLight,
  },
  greeting: {
    ...type.display,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceHigh,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.accentLight,
  },
  tagline: {
    ...type.caption,
    marginTop: 2,
    color: colors.textSecondary,
  },
  search: {
    marginTop: spacing.lg,
  },
  offlinePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  offlineText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  featureWrap: {
    marginTop: spacing.xl,
  },
  horizontal: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: spacing.lg,
  },
  list: {
    gap: 1,
  },
  pressed: {
    opacity: 0.72,
  },
  newPlaylist: {
    width: 128,
    height: 128,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(18,21,26,0.5)',
  },
  newIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newLabel: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
});
