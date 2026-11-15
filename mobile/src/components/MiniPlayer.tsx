import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Artwork } from '@/components/Artwork';
import { IconButton } from '@/components/Button';
import { ProgressBar } from '@/components/SeekBar';
import { colors, fonts, layout, radii, shadows, spacing } from '@/theme';
import { usePlayerStore, useCurrentTrack } from '@/stores/playerStore';

export function MiniPlayer({ bottomOffset }: { bottomOffset?: number }) {
  const track = useCurrentTrack();
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const position = usePlayerStore((state) => state.position);
  const duration = usePlayerStore((state) => state.duration);
  const toggle = usePlayerStore((state) => state.toggle);
  const next = usePlayerStore((state) => state.next);
  const insets = useSafeAreaInsets();

  if (!track) return null;

  const ratio = duration > 0 ? position / duration : 0;

  return (
    <View
      style={[
        styles.wrap,
        { bottom: bottomOffset ?? Math.max(insets.bottom, 10) + 8 },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        <Pressable
          onPress={() => router.push('/player')}
          style={({ pressed }) => [styles.info, pressed && styles.infoPressed]}
          accessibilityRole="button"
          accessibilityLabel={`Now playing ${track.title} by ${track.artist}`}
        >
          <Artwork source={track.artwork} size={44} radius={11} label={track.title} />
          <View style={styles.copy}>
            <Text style={styles.title} numberOfLines={1}>
              {track.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {track.artist}
            </Text>
          </View>
        </Pressable>
        <IconButton
          icon="prev"
          size={32}
          iconSize={17}
          color={colors.textSecondary}
          onPress={() => usePlayerStore.getState().previous()}
          accessibilityLabel="Previous track"
        />
        <View style={styles.playButton}>
          <IconButton
            icon={isPlaying ? 'pause' : 'play'}
            size={38}
            iconSize={18}
            color={colors.white}
            background={colors.accent}
            onPress={toggle}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          />
        </View>
        <IconButton
          icon="next"
          size={32}
          iconSize={17}
          color={colors.textSecondary}
          onPress={() => next()}
          accessibilityLabel="Next track"
        />
        <View pointerEvents="none" style={styles.progress}>
          <ProgressBar ratio={ratio} height={2} color={colors.accent} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 30,
  },
  bar: {
    height: layout.miniPlayerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    borderRadius: radii.md + 2,
    backgroundColor: 'rgba(26,31,39,0.98)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.floating,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: '100%',
    borderRadius: radii.md,
  },
  infoPressed: {
    opacity: 0.7,
  },
  copy: {
    flex: 1,
    marginLeft: 2,
    gap: 2,
  },
  title: {
    fontFamily: fonts.semibold,
    fontSize: 13.5,
    color: colors.text,
    letterSpacing: -0.15,
  },
  artist: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  playButton: {
    marginHorizontal: 1,
  },
  progress: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
  },
});
