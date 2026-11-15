import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { Artwork } from '@/components/Artwork';
import { Button, IconButton } from '@/components/Button';
import { CoverCard } from '@/components/Cards';
import { EmptyState, SectionHeader } from '@/components/Chips';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Sheet, SheetRow } from '@/components/Sheet';
import { SongRow } from '@/components/SongRow';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { usePlayCollection } from '@/hooks/usePlayback';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, spacing } from '@/theme';
import type { AlbumSummary, Track } from '@/types/music';
import { uniqueBy } from '@/utils/array';
import { artistKey, findAlbum, findArtist } from '@/utils/catalog';
import { formatLongDuration, songCountLabel } from '@/utils/format';

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rawId = Array.isArray(id) ? id[0] : id ?? '';
  const decodedId = decodeParam(rawId);

  const localTracks = useLibraryStore((state) => state.localTracks);
  const favorites = useLibraryStore((state) => state.favorites);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);
  const playCollection = usePlayCollection();

  const [menuOpen, setMenuOpen] = useState(false);
  const [actionTrack, setActionTrack] = useState<Track | null>(null);

  const pool = useMemo(
    () => uniqueBy([...localTracks, ...favorites], (track) => track.id),
    [favorites, localTracks]
  );

  const album = useMemo<AlbumSummary | undefined>(
    () => findAlbum(rawId, pool) ?? findAlbum(decodedId, pool),
    [decodedId, pool, rawId]
  );

  const artist = useMemo(
    () => (album ? findArtist(artistKey(album.artist), pool) : undefined),
    [album, pool]
  );

  const currentTrack = usePlayerStore((state) => {
    const index = state.order[state.cursor];
    return index === undefined ? null : state.queue[index] ?? null;
  });
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const toggle = usePlayerStore((state) => state.toggle);

  if (!album) {
    return (
      <Screen showMiniPlayer>
        <Header title="Album" onBack={() => router.back()} />
        <EmptyState
          icon="disc"
          title="Album not found"
          message="This album is not in your library yet. Scan your device or explore the open music web."
          action={
            <Button
              label="Explore music"
              icon="globe"
              onPress={() => router.push('/discover')}
            />
          }
        />
      </Screen>
    );
  }

  const tracks = album.tracks;
  const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
  const collectionPlaying =
    Boolean(currentTrack) && tracks.some((track) => track.id === currentTrack!.id);
  const moreAlbums = (artist?.albums ?? []).filter((item) => item.id !== album.id);

  const saveAlbum = () => {
    const playlist = createPlaylist(
      album.title,
      `${album.artist} · album`,
      tracks
    );
    toast(`Saved “${playlist.name}” to your playlists`, 'success');
  };

  const shareAlbum = async () => {
    setMenuOpen(false);
    try {
      await Share.share({
        message: `Listen to ${album.title} by ${album.artist} on NKfy — Feel The Music`,
      });
    } catch {
      toast('Could not open the share sheet', 'error');
    }
  };

  return (
    <Screen showMiniPlayer>
      <Header
        title="Album"
        onBack={() => router.back()}
        right={
          <IconButton
            icon="more"
            size={38}
            iconSize={20}
            onPress={() => setMenuOpen(true)}
            accessibilityLabel="Album options"
          />
        }
      />

      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(47,128,255,0.24)', 'rgba(18,21,26,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Artwork source={album.artwork} size={148} radius={18} label={album.title} />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>ALBUM</Text>
          <Text style={styles.title} numberOfLines={2}>
            {album.title}
          </Text>
          <Pressable
            onPress={() =>
              router.push({ pathname: '/artist/[id]', params: { id: artistKey(album.artist) } })
            }
            style={({ pressed }) => [styles.artistRow, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Open ${album.artist}`}
          >
            <View style={styles.artistDot}>
              <Icon name="profile" size={11} color={colors.accentLight} />
            </View>
            <Text style={styles.artist} numberOfLines={1}>
              {album.artist}
            </Text>
            <Icon name="chevron-right" size={13} color={colors.textMuted} />
          </Pressable>
          <Text style={styles.meta}>
            {album.year ? `${album.year} · ` : ''}
            {songCountLabel(tracks.length)} · {formatLongDuration(totalDuration)}
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
            else playCollection(tracks, album.title);
          }}
          accessibilityLabel={collectionPlaying && isPlaying ? 'Pause album' : 'Play album'}
        />
        <Button
          label="Shuffle"
          icon="shuffle"
          size="sm"
          variant="secondary"
          onPress={() => playCollection(tracks, album.title, { shuffle: true })}
          disabled={tracks.length === 0}
        />
        <View style={styles.spacer} />
        <Button
          label="Save"
          icon="plus"
          size="sm"
          variant="soft"
          onPress={saveAlbum}
          disabled={tracks.length === 0}
        />
      </View>

      <View style={styles.list}>
        {tracks.map((track, index) => (
          <SongRow
            key={track.id}
            track={track}
            index={index + 1}
            showArtwork={false}
            active={currentTrack?.id === track.id}
            onPress={() =>
              playCollection(tracks, album.title, { startTrackId: track.id })
            }
            onMore={() => setActionTrack(track)}
            showProvider
          />
        ))}
      </View>

      <Text style={styles.footer}>
        {album.year ? `${album.year} · ` : ''}
        {songCountLabel(tracks.length)} · {formatLongDuration(totalDuration)}
      </Text>

      {moreAlbums.length > 0 ? (
        <>
          <SectionHeader title={`More by ${album.artist}`} />
          <View style={styles.horizontal}>
            {moreAlbums.map((item) => (
              <CoverCard
                key={item.id}
                title={item.title}
                subtitle={`${item.tracks.length} songs`}
                artwork={item.artwork}
                width={132}
                onPress={() =>
                  router.push({ pathname: '/album/[id]', params: { id: item.id } })
                }
              />
            ))}
          </View>
        </>
      ) : null}

      <View style={styles.note}>
        <Icon name="shield" size={12} color={colors.textMuted} />
        <Text style={styles.noteText}>
          Album artwork and metadata come from your device or the original streaming provider. NKfy
          never downloads or extracts audio.
        </Text>
      </View>

      <Sheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={album.title}
        subtitle={album.artist}
      >
        <SheetRow
          label="Play album"
          icon={<Icon name="play" size={16} color={colors.text} />}
          onPress={() => {
            playCollection(tracks, album.title);
            setMenuOpen(false);
          }}
        />
        <SheetRow
          label="Shuffle play"
          icon={<Icon name="shuffle" size={16} color={colors.text} />}
          onPress={() => {
            playCollection(tracks, album.title, { shuffle: true });
            setMenuOpen(false);
          }}
        />
        <SheetRow
          label="Add to queue"
          icon={<Icon name="queue" size={16} color={colors.text} />}
          onPress={() => {
            usePlayerStore.getState().enqueueMany(tracks);
            toast(`${songCountLabel(tracks.length)} added to the queue`);
            setMenuOpen(false);
          }}
        />
        <SheetRow
          label="Save as playlist"
          icon={<Icon name="plus" size={16} color={colors.text} />}
          onPress={() => {
            saveAlbum();
            setMenuOpen(false);
          }}
        />
        <SheetRow
          label="Go to artist"
          icon={<Icon name="profile" size={16} color={colors.text} />}
          onPress={() => {
            setMenuOpen(false);
            router.push({ pathname: '/artist/[id]', params: { id: artistKey(album.artist) } });
          }}
        />
        <SheetRow
          label="Share album"
          icon={<Icon name="share" size={16} color={colors.text} />}
          onPress={shareAlbum}
        />
      </Sheet>

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
    gap: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.2)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 8.5,
    letterSpacing: 1.3,
    color: colors.accentLight,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.55,
    color: colors.text,
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  artistDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artist: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.textSecondary,
    maxWidth: 140,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
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
  horizontal: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xs,
  },
  noteText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
