import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Artwork } from '@/components/Artwork';
import { Button, IconButton } from '@/components/Button';
import { EmptyState } from '@/components/Chips';
import { Icon } from '@/components/Icon';
import { SeekBar } from '@/components/SeekBar';
import { Sheet } from '@/components/Sheet';
import { TrackActionsSheet } from '@/components/TrackActionsSheet';
import { demoLyrics } from '@/data/demoCatalog';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/uiStore';
import { colors, fonts, radii, shadows, spacing } from '@/theme';
import { formatTime } from '@/utils/format';
import { resolveArtworkUri } from '@/utils/artwork';

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const queue = usePlayerStore((state) => state.queue);
  const order = usePlayerStore((state) => state.order);
  const cursor = usePlayerStore((state) => state.cursor);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const position = usePlayerStore((state) => state.position);
  const duration = usePlayerStore((state) => state.duration);
  const repeat = usePlayerStore((state) => state.repeat);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const toggle = usePlayerStore((state) => state.toggle);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const seek = usePlayerStore((state) => state.seek);
  const cycleRepeat = usePlayerStore((state) => state.cycleRepeat);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  const track = order[cursor] !== undefined ? queue[order[cursor]!] : null;
  const isFavorite = useLibraryStore((state) =>
    track ? state.favorites.some((item) => item.id === track.id) : false
  );

  const [actionsOpen, setActionsOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);

  const artworkSize = Math.min(width - spacing.xxxl - 8, height * 0.36, 380);
  const lyrics = track ? demoLyrics[track.id] : undefined;
  const nextIndex = cursor + 1 < order.length ? order[cursor + 1]! : null;
  const upNext = nextIndex !== null ? queue[nextIndex] : null;

  const artworkUri = resolveArtworkUri(track?.artwork);
  const backgroundArtwork = artworkUri ? { uri: artworkUri } : track?.artwork;

  const handleShare = async () => {
    if (!track) return;
    try {
      await Share.share({
        message: `${track.title} — ${track.artist}\nListening on NKfy · Feel The Music${
          track.externalUrl ? `\n${track.externalUrl}` : ''
        }`,
      });
    } catch {
      toast('Sharing is not available right now', 'error');
    }
  };

  if (!track) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.topBar}>
          <IconButton icon="chevron-down" onPress={() => router.back()} size={38} />
          <Text style={styles.topLabel}>NOW PLAYING</Text>
          <View style={styles.topSpacer} />
        </View>
        <View style={styles.empty}>
          <EmptyState
            icon="headphones"
            title="Nothing playing yet"
            message="Pick a song from your library or explore something new."
            action={<Button label="Browse music" icon="play" onPress={() => router.back()} />}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill}>
        {backgroundArtwork ? (
          <Image
            source={backgroundArtwork}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={70}
            transition={300}
          />
        ) : null}
        <View style={styles.backgroundDim} />
        <LinearGradient
          colors={['rgba(8,9,11,0.35)', 'rgba(8,9,11,0.9)', '#08090B']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + 6, paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        <View style={styles.topBar}>
          <IconButton
            icon="chevron-down"
            onPress={() => router.back()}
            size={38}
            iconSize={22}
            accessibilityLabel="Close player"
          />
          <View style={styles.topCenter}>
            <Text style={styles.topLabel}>NOW PLAYING</Text>
            <Text style={styles.topSource}>{track.providerLabel}</Text>
          </View>
          <IconButton
            icon="more"
            onPress={() => setActionsOpen(true)}
            size={38}
            iconSize={20}
            accessibilityLabel="Track options"
          />
        </View>

        <View style={styles.artWrap}>
          <Artwork
            source={track.artwork}
            size={artworkSize}
            radius={24}
            label={track.title}
            style={styles.art}
          />
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.title} numberOfLines={2}>
              {track.title}
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/artist/[id]',
                  params: { id: encodeURIComponent(track.artist) },
                })
              }
            >
              <Text style={styles.artist} numberOfLines={1}>
                {track.artist}
              </Text>
            </Pressable>
          </View>
          <IconButton
            icon="heart"
            size={42}
            iconSize={22}
            color={isFavorite ? colors.accent : colors.textSecondary}
            onPress={() => {
              const added = useLibraryStore.getState().toggleFavorite(track);
              toast(added ? 'Added to your favorites' : 'Removed from favorites');
            }}
            active={isFavorite}
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          />
        </View>

        <View style={styles.seekWrap}>
          <SeekBar
            value={position}
            max={duration || track.duration || 1}
            onSeek={seek}
          />
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatTime(position)}</Text>
            <Text style={styles.time}>{formatTime(duration || track.duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <IconButton
            icon="shuffle"
            size={40}
            iconSize={19}
            color={shuffle ? colors.accent : colors.textSecondary}
            onPress={toggleShuffle}
            accessibilityLabel={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
          />
          <IconButton
            icon="prev"
            size={46}
            iconSize={24}
            color={colors.text}
            onPress={previous}
            accessibilityLabel="Previous track"
          />
          <Pressable
            onPress={toggle}
            style={({ pressed }) => [styles.playButton, pressed && styles.playPressed]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          >
            <Icon
              name={isPlaying ? 'pause' : 'play'}
              size={30}
              color={colors.white}
            />
          </Pressable>
          <IconButton
            icon="next"
            size={46}
            iconSize={24}
            color={colors.text}
            onPress={() => next()}
            accessibilityLabel="Next track"
          />
          <IconButton
            icon={repeat === 'one' ? 'repeat-one' : 'repeat'}
            size={40}
            iconSize={19}
            color={repeat !== 'off' ? colors.accent : colors.textSecondary}
            onPress={cycleRepeat}
            accessibilityLabel={`Repeat ${repeat}`}
          />
        </View>

        <View style={styles.utility}>
          <Pressable
            onPress={() => router.push('/queue')}
            style={({ pressed }) => [styles.utilityButton, pressed && styles.pressed]}
          >
            <Icon name="queue" size={17} color={colors.textSecondary} />
            <Text style={styles.utilityLabel}>Queue</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{queue.length}</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/equalizer')}
            style={({ pressed }) => [styles.utilityButton, pressed && styles.pressed]}
          >
            <Icon name="sliders" size={17} color={colors.textSecondary} />
            <Text style={styles.utilityLabel}>Equalizer</Text>
          </Pressable>
          {lyrics ? (
            <Pressable
              onPress={() => setLyricsOpen(true)}
              style={({ pressed }) => [styles.utilityButton, pressed && styles.pressed]}
            >
              <Icon name="mic" size={17} color={colors.textSecondary} />
              <Text style={styles.utilityLabel}>Lyrics</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => void handleShare()}
            style={({ pressed }) => [styles.utilityButton, pressed && styles.pressed]}
          >
            <Icon name="share" size={17} color={colors.textSecondary} />
            <Text style={styles.utilityLabel}>Share</Text>
          </Pressable>
        </View>

        {upNext ? (
          <Pressable
            onPress={() => router.push('/queue')}
            style={({ pressed }) => [styles.upNext, pressed && styles.pressed]}
          >
            <Text style={styles.upNextLabel}>UP NEXT</Text>
            <Artwork source={upNext.artwork} size={32} radius={7} label={upNext.title} />
            <View style={styles.upNextCopy}>
              <Text style={styles.upNextTitle} numberOfLines={1}>
                {upNext.title}
              </Text>
              <Text style={styles.upNextArtist} numberOfLines={1}>
                {upNext.artist}
              </Text>
            </View>
            <Icon name="chevron-right" size={15} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <TrackActionsSheet
        track={track}
        visible={actionsOpen}
        onClose={() => setActionsOpen(false)}
      />

      <Sheet
        visible={lyricsOpen}
        onClose={() => setLyricsOpen(false)}
        title={track.title}
        subtitle={`${track.artist} · Lyrics`}
      >
        <View style={styles.lyrics}>
          {lyrics?.map((line, index) => (
            <Text key={`${line}-${index}`} style={styles.lyricLine}>
              {line}
            </Text>
          ))}
          <Text style={styles.lyricsNote}>Original NKfy demo session · no external lyrics</Text>
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundDim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8,9,11,0.62)',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  topCenter: {
    alignItems: 'center',
    gap: 2,
  },
  topLabel: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.8,
    color: colors.textSecondary,
  },
  topSource: {
    fontFamily: fonts.regular,
    fontSize: 9.5,
    color: colors.textMuted,
  },
  topSpacer: {
    width: 38,
  },
  artWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  art: {
    ...shadows.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  titleCopy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.7,
    color: colors.text,
  },
  artist: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  seekWrap: {
    marginTop: spacing.lg,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -2,
    paddingHorizontal: 2,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.accent,
  },
  playPressed: {
    transform: [{ scale: 0.96 }],
    backgroundColor: colors.accentPressed,
  },
  utility: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  utilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  utilityLabel: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  badge: {
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: colors.accentLight,
  },
  upNext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: 'rgba(18,21,26,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  upNextLabel: {
    fontFamily: fonts.semibold,
    fontSize: 8.5,
    letterSpacing: 1,
    color: colors.accentLight,
  },
  upNextCopy: {
    flex: 1,
    gap: 1,
  },
  upNextTitle: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
    color: colors.text,
  },
  upNextArtist: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
  },
  lyrics: {
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  lyricLine: {
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 25,
    color: colors.textSecondary,
    letterSpacing: -0.2,
  },
  lyricsNote: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
