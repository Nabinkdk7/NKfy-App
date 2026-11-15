import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import { Artwork } from '@/components/Artwork';
import { Button, IconButton } from '@/components/Button';
import { CoverCard } from '@/components/Cards';
import { EmptyState, SectionHeader } from '@/components/Chips';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { SongRow } from '@/components/SongRow';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { usePlayCollection } from '@/hooks/usePlayback';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, spacing } from '@/theme';
import type { ArtistSummary, Track } from '@/types/music';
import { uniqueBy } from '@/utils/array';
import { findArtist } from '@/utils/catalog';
import { formatFollowers, formatLongDuration, songCountLabel } from '@/utils/format';

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rawId = Array.isArray(id) ? id[0] : id ?? '';
  const name = decodeParam(rawId);

  const localTracks = useLibraryStore((state) => state.localTracks);
  const favorites = useLibraryStore((state) => state.favorites);
  const playCollection = usePlayCollection();
  const [actionTrack, setActionTrack] = useState<Track | null>(null);
  const [following, setFollowing] = useState(false);

  const artist = useMemo<ArtistSummary | undefined>(() => {
    const pool = uniqueBy([...localTracks, ...favorites], (track) => track.id);
    return (
      findArtist(rawId, pool) ??
      findArtist(name, pool) ??
      findArtist(encodeURIComponent(name), pool)
    );
  }, [favorites, localTracks, name, rawId]);

  const currentTrack = usePlayerStore((state) => {
    const index = state.order[state.cursor];
    return index === undefined ? null : state.queue[index] ?? null;
  });
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const toggle = usePlayerStore((state) => state.toggle);

  if (!artist) {
    return (
      <Screen showMiniPlayer>
        <Header title="Artist" onBack={() => router.back()} />
        <EmptyState
          icon="profile"
          title="Artist not found"
          message={`We could not find “${name}” in your library. Scan your music or explore online artists.`}
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

  const tracks = artist.tracks;
  const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
  const collectionPlaying =
    Boolean(currentTrack) && tracks.some((track) => track.id === currentTrack!.id);

  const shareArtist = async () => {
    try {
      await Share.share({
        message: `Listen to ${artist.name} on NKfy — Feel The Music`,
      });
    } catch {
      toast('Could not open the share sheet', 'error');
    }
  };

  const toggleFollow = () => {
    const next = !following;
    setFollowing(next);
    toast(next ? `Following ${artist.name}` : `Unfollowed ${artist.name}`);
  };

  return (
    <Screen showMiniPlayer>
      <Header
        title="Artist"
        onBack={() => router.back()}
        right={
          <IconButton
            icon="share"
            size={38}
            iconSize={19}
            color={colors.textSecondary}
            onPress={shareArtist}
            accessibilityLabel={`Share ${artist.name}`}
          />
        }
      />

      <View style={styles.hero}>
        <LinearGradient
          colors={['rgba(47,128,255,0.26)', 'rgba(18,21,26,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.avatarRing}>
          <Artwork source={artist.artwork} size={128} radius={64} label={artist.name} />
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>
            {artist.name}
          </Text>
          {artist.verified ? (
            <View style={styles.verified}>
              <Icon name="check" size={11} color={colors.white} strokeWidth={2.6} />
            </View>
          ) : null}
        </View>
        <Text style={styles.meta}>
          {formatFollowers(artist.followers)} · {songCountLabel(tracks.length)}
          {artist.albums.length > 0 ? ` · ${artist.albums.length} albums` : ''}
        </Text>
        <Text style={styles.about}>
          Independent artist on NKfy. Play their songs from your device and the open music web.
        </Text>
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
            else playCollection(tracks, artist.name);
          }}
          accessibilityLabel={collectionPlaying && isPlaying ? 'Pause artist' : 'Play artist'}
        />
        <Button
          label="Shuffle"
          icon="shuffle"
          size="sm"
          variant="secondary"
          onPress={() => playCollection(tracks, artist.name, { shuffle: true })}
          disabled={tracks.length === 0}
        />
        <Button
          label={following ? 'Following' : 'Follow'}
          icon={following ? 'check' : 'plus'}
          size="sm"
          variant={following ? 'soft' : 'ghost'}
          onPress={toggleFollow}
        />
      </View>

      <SectionHeader
        title="Popular"
        actionLabel="Play all"
        onAction={() => playCollection(tracks, artist.name)}
      />
      {tracks.length === 0 ? (
        <EmptyState
          icon="music"
          title="No songs here yet"
          message="This artist has no tracks in your library right now."
        />
      ) : (
        <View style={styles.list}>
          {tracks.slice(0, 5).map((track, index) => (
            <SongRow
              key={track.id}
              track={track}
              index={index + 1}
              showArtwork={false}
              active={currentTrack?.id === track.id}
              onPress={() =>
                playCollection(tracks, artist.name, { startTrackId: track.id })
              }
              onMore={() => setActionTrack(track)}
              showProvider
            />
          ))}
        </View>
      )}

      {artist.albums.length > 0 ? (
        <>
          <SectionHeader title="Albums" />
          <View style={styles.horizontal}>
            {artist.albums.map((album) => (
              <CoverCard
                key={album.id}
                title={album.title}
                subtitle={
                  album.year ? `${album.year} · ${album.tracks.length} songs` : `${album.tracks.length} songs`
                }
                artwork={album.artwork}
                width={132}
                onPress={() =>
                  router.push({ pathname: '/album/[id]', params: { id: album.id } })
                }
              />
            ))}
          </View>
        </>
      ) : null}

      <SectionHeader title="About" />
      <View style={styles.aboutCard}>
        <View style={styles.aboutIcon}>
          <Icon name="mic" size={18} color={colors.accentLight} />
        </View>
        <View style={styles.aboutCopy}>
          <Text style={styles.aboutTitle}>{artist.name}</Text>
          <Text style={styles.aboutText}>
            {songCountLabel(tracks.length)} · {formatLongDuration(totalDuration)} of music.
            NKfy streams from the artist&apos;s original platform, so availability can change at any
            time.
          </Text>
        </View>
      </View>

      <View style={styles.footerNote}>
        <Icon name="shield" size={12} color={colors.textMuted} />
        <Text style={styles.footerText}>
          Artist pages are built from your library and the open music web. Nothing is downloaded
          or re-uploaded.
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
    gap: 5,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.2)',
    overflow: 'hidden',
  },
  avatarRing: {
    padding: 4,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(47,128,255,0.28)',
    backgroundColor: 'rgba(47,128,255,0.06)',
    marginBottom: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 25,
    letterSpacing: -0.7,
    color: colors.text,
    textAlign: 'center',
  },
  verified: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  about: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 3,
    maxWidth: 320,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  list: {
    gap: 1,
  },
  horizontal: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  aboutCard: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  aboutIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutCopy: {
    flex: 1,
    gap: 3,
  },
  aboutTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.text,
  },
  aboutText: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xs,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textMuted,
    flex: 1,
  },
});
