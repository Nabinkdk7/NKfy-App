import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Artwork } from '@/components/Artwork';
import { Button, IconButton } from '@/components/Button';
import { GridCard, SegmentedControl, useGridWidth } from '@/components/Cards';
import { EmptyState, SectionHeader } from '@/components/Chips';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { SongRow } from '@/components/SongRow';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { demoTracks } from '@/data/demoCatalog';
import { usePlayCollection } from '@/hooks/usePlayback';
import { localMusicAvailable, requestLocalMusicAccess, scanLocalMusic } from '@/native/localMusic';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, spacing } from '@/theme';
import type { Track } from '@/types/music';
import { formatLongDuration } from '@/utils/format';
import { folderGroups, groupAlbums, groupArtists } from '@/utils/catalog';

type Segment = 'songs' | 'albums' | 'artists' | 'folders';

export default function LibraryScreen() {
  const [segment, setSegment] = useState<Segment>('songs');
  const [actionTrack, setActionTrack] = useState<Track | null>(null);

  const localTracks = useLibraryStore((state) => state.localTracks);
  const favorites = useLibraryStore((state) => state.favorites);
  const scanStatus = useLibraryStore((state) => state.scanStatus);
  const scanError = useLibraryStore((state) => state.scanError);
  const setLocalTracks = useLibraryStore((state) => state.setLocalTracks);
  const setScanState = useLibraryStore((state) => state.setScanState);
  const playCollection = usePlayCollection();

  const currentTrack = usePlayerStore((state) => {
    const index = state.order[state.cursor];
    return index === undefined ? null : state.queue[index] ?? null;
  });

  const showingDemo = localTracks.length === 0;
  const tracks = showingDemo ? demoTracks : localTracks;
  const albums = useMemo(() => groupAlbums(tracks), [tracks]);
  const artists = useMemo(() => groupArtists(tracks), [tracks]);
  const folders = useMemo(() => folderGroups(tracks), [tracks]);
  const cardWidth = useGridWidth(2, 12);
  const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);

  const scan = async () => {
    if (!localMusicAvailable()) {
      setScanState(
        'unavailable',
        'Device music needs the native Android or iOS build. Expo Go cannot read your library.'
      );
      return;
    }
    setScanState('scanning');
    const access = await requestLocalMusicAccess();
    if (access === 'unavailable') {
      setScanState('unavailable', 'Local music is not available on this platform.');
      return;
    }
    if (access !== 'granted') {
      setScanState(
        'denied',
        access === 'restricted'
          ? 'Music access is restricted on this device.'
          : 'Music access was not granted. You can enable it in system settings.'
      );
      return;
    }
    try {
      const found = await scanLocalMusic();
      setLocalTracks(found);
      toast(
        found.length > 0 ? `Found ${found.length} songs on this device` : 'No songs found on this device',
        found.length > 0 ? 'success' : 'default'
      );
    } catch (error) {
      setScanState(
        'unavailable',
        error instanceof Error ? error.message : 'The device library could not be read.'
      );
    }
  };

  const scanBusy = scanStatus === 'scanning';

  return (
    <Screen reserveMiniPlayer>
      <Header
        title="Your Library"
        large
        eyebrow={`${tracks.length} songs · ${formatLongDuration(totalDuration)}`}
        right={
          <View style={styles.headerActions}>
            <IconButton
              icon={scanBusy ? 'refresh' : 'download'}
              size={36}
              iconSize={18}
              color={colors.textSecondary}
              onPress={scan}
              accessibilityLabel="Scan device music"
              disabled={scanBusy}
            />
            <IconButton
              icon="settings"
              size={36}
              iconSize={18}
              color={colors.textSecondary}
              onPress={() => router.push('/settings')}
              accessibilityLabel="Settings"
            />
          </View>
        }
      />

      <Pressable
        onPress={() => router.push('/favorites')}
        style={({ pressed }) => [styles.likedCard, pressed && styles.pressed]}
      >
        <View style={styles.likedIcon}>
          <Icon name="heart" size={22} color={colors.white} filled />
        </View>
        <View style={styles.likedCopy}>
          <Text style={styles.likedTitle}>Liked Songs</Text>
          <Text style={styles.likedMeta}>
            {favorites.length} {favorites.length === 1 ? 'song' : 'songs'} ·{' '}
            {formatLongDuration(favorites.reduce((sum, track) => sum + track.duration, 0))}
          </Text>
        </View>
        <IconButton
          icon="play"
          size={38}
          iconSize={16}
          background={colors.accent}
          color={colors.white}
          onPress={() => playCollection(favorites, 'Liked Songs')}
          accessibilityLabel="Play liked songs"
        />
      </Pressable>

      {scanStatus === 'denied' || scanStatus === 'unavailable' || scanStatus === 'idle' ? (
        <View style={styles.scanCard}>
          <View style={styles.scanIcon}>
            {scanBusy ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <Icon name="smartphone" size={20} color={colors.accentLight} />
            )}
          </View>
          <View style={styles.scanCopy}>
            <Text style={styles.scanTitle}>
              {scanStatus === 'denied'
                ? 'Music permission needed'
                : scanStatus === 'unavailable'
                  ? 'Device music unavailable'
                  : 'Bring your own music'}
            </Text>
            <Text style={styles.scanText}>
              {scanError ??
                'Scan this device to play the songs already saved in your music folders.'}
            </Text>
          </View>
          <Button
            label={scanStatus === 'denied' ? 'Retry' : 'Scan'}
            size="sm"
            variant="soft"
            onPress={scan}
            loading={scanBusy}
          />
        </View>
      ) : null}

      {showingDemo && scanStatus === 'ready' ? null : null}

      {showingDemo ? (
        <View style={styles.demoNotice}>
          <Icon name="sparkles" size={12} color={colors.accentLight} />
          <Text style={styles.demoText}>
            Showing the bundled NKfy Sessions. Scan your device to see your own songs.
          </Text>
        </View>
      ) : null}

      <View style={styles.segmentedWrap}>
        <SegmentedControl<Segment>
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'songs', label: 'Songs' },
            { value: 'albums', label: 'Albums' },
            { value: 'artists', label: 'Artists' },
            { value: 'folders', label: 'Folders' },
          ]}
        />
      </View>

      {segment === 'songs' ? (
        <>
          <SectionHeader
            title={showingDemo ? 'Included sessions' : 'On this device'}
            actionLabel="Shuffle"
            onAction={() => playCollection(tracks, 'Library', { shuffle: true })}
            style={styles.listHeader}
          />
          <View style={styles.list}>
            {tracks.map((track, index) => (
              <SongRow
                key={track.id}
                track={track}
                index={index + 1}
                showArtwork={false}
                active={currentTrack?.id === track.id}
                onPress={() => playCollection(tracks, 'Library', { startTrackId: track.id })}
                onMore={() => setActionTrack(track)}
                subtitle={`${track.artist}${track.album ? ` · ${track.album}` : ''}`}
              />
            ))}
          </View>
          <Text style={styles.footer}>
            {tracks.length} songs · {formatLongDuration(totalDuration)}
          </Text>
        </>
      ) : null}

      {segment === 'albums' ? (
        albums.length > 0 ? (
          <View style={styles.grid}>
            {albums.map((album) => (
              <GridCard
                key={album.id}
                title={album.title}
                subtitle={`${album.artist} · ${album.tracks.length} songs`}
                artwork={album.artwork}
                width={cardWidth}
                onPress={() =>
                  router.push({ pathname: '/album/[id]', params: { id: album.id } })
                }
              />
            ))}
          </View>
        ) : (
          <EmptyState icon="disc" title="No albums yet" message="Scan your device to add albums." />
        )
      ) : null}

      {segment === 'artists' ? (
        artists.length > 0 ? (
          <View style={styles.list}>
            {artists.map((artist) => (
              <Pressable
                key={artist.id}
                onPress={() =>
                  router.push({ pathname: '/artist/[id]', params: { id: artist.id } })
                }
                style={({ pressed }) => [styles.artistRow, pressed && styles.pressed]}
              >
                <Artwork source={artist.artwork} size={52} radius={26} label={artist.name} />
                <View style={styles.artistCopy}>
                  <Text style={styles.artistName} numberOfLines={1}>
                    {artist.name}
                  </Text>
                  <Text style={styles.artistMeta}>
                    {artist.tracks.length} songs · {artist.albums.length} albums
                  </Text>
                </View>
                <Icon name="chevron-right" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState icon="profile" title="No artists yet" message="Your artists appear after a scan." />
        )
      ) : null}

      {segment === 'folders' ? (
        folders.length > 0 ? (
          <View style={styles.list}>
            {folders.map((folder) => (
              <Pressable
                key={folder.path}
                onPress={() => playCollection(folder.tracks, folder.name)}
                style={({ pressed }) => [styles.folderRow, pressed && styles.pressed]}
              >
                <View style={styles.folderIcon}>
                  <Icon name="folder" size={20} color={colors.accentLight} />
                </View>
                <View style={styles.artistCopy}>
                  <Text style={styles.artistName} numberOfLines={1}>
                    {folder.name}
                  </Text>
                  <Text style={styles.artistMeta} numberOfLines={1}>
                    {folder.trackCount} songs · {folder.path}
                  </Text>
                </View>
                <Icon name="play" size={14} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState icon="folder" title="No folders yet" message="Folders show up after scanning device music." />
        )
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
  headerActions: {
    flexDirection: 'row',
    gap: 2,
  },
  likedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    marginTop: spacing.xs,
  },
  likedIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likedCopy: {
    flex: 1,
    gap: 3,
  },
  likedTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
    letterSpacing: -0.2,
  },
  likedMeta: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.accentFaint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.22)',
  },
  scanIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanCopy: {
    flex: 1,
    gap: 2,
  },
  scanTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.text,
  },
  scanText: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    lineHeight: 15,
    color: colors.textSecondary,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.sm,
    paddingHorizontal: 2,
  },
  demoText: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textMuted,
    flex: 1,
  },
  segmentedWrap: {
    marginTop: spacing.lg,
  },
  listHeader: {
    marginTop: spacing.lg,
  },
  list: {
    gap: 1,
  },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: spacing.lg,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  artistCopy: {
    flex: 1,
    gap: 3,
  },
  artistName: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: colors.text,
  },
  artistMeta: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  folderIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
