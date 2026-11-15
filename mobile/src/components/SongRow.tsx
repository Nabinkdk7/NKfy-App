import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Artwork } from '@/components/Artwork';
import { IconButton } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { colors, fonts, spacing } from '@/theme';
import { useLibraryStore } from '@/stores/libraryStore';
import type { Track } from '@/types/music';
import { formatTime } from '@/utils/format';

interface SongRowProps {
  track: Track;
  onPress: () => void;
  onMore?: () => void;
  active?: boolean;
  showArtwork?: boolean;
  index?: number;
  subtitle?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  showProvider?: boolean;
}

export function SongRow({
  track,
  onPress,
  onMore,
  active,
  showArtwork = true,
  index,
  subtitle,
  right,
  style,
  showProvider,
}: SongRowProps) {
  const favorite = useLibraryStore((state) =>
    state.favorites.some((item) => item.id === track.id)
  );

  return (
    <View style={[styles.row, active && styles.activeRow, style]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.rowPress, pressed && styles.rowActive]}
        accessibilityRole="button"
        accessibilityLabel={`${track.title} by ${track.artist}`}
      >
        {showArtwork ? (
          <View style={styles.artWrap}>
            <Artwork source={track.artwork} size={50} radius={10} label={track.title} />
            {active ? (
              <View style={styles.playingOverlay}>
                <Icon name="waveform" size={20} color={colors.white} strokeWidth={2.4} />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.indexWrap}>
            {active ? (
              <Icon name="waveform" size={18} color={colors.accent} strokeWidth={2.4} />
            ) : (
              <Text style={styles.index}>{index ?? ''}</Text>
            )}
          </View>
        )}

        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, active && styles.activeTitle]} numberOfLines={1}>
              {track.title}
            </Text>
            {favorite ? <Icon name="heart" size={11} color={colors.accentLight} filled /> : null}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.artist} numberOfLines={1}>
              {subtitle ?? track.artist}
              {track.album && subtitle === undefined ? `  ·  ${track.album}` : ''}
            </Text>
            {showProvider && !track.isPlayable ? (
              <View style={styles.sourceTag}>
                <Icon name="youtube" size={11} color={colors.textMuted} />
                <Text style={styles.sourceText}>YouTube</Text>
              </View>
            ) : null}
          </View>
        </View>

        {right !== undefined ? (
          right
        ) : (
          <>
            <Text style={styles.duration}>{formatTime(track.duration)}</Text>
            {track.source === 'youtube' ? (
              <Icon name="external" size={14} color={colors.textMuted} />
            ) : null}
          </>
        )}
      </Pressable>

      {onMore ? (
        <IconButton
          icon="more"
          size={30}
          iconSize={18}
          color={colors.textMuted}
          onPress={onMore}
          accessibilityLabel={`More options for ${track.title}`}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 62,
    paddingVertical: spacing.sm - 1,
    paddingHorizontal: 2,
    borderRadius: 12,
  },
  rowPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 12,
    paddingHorizontal: 4,
    outlineWidth: 0,
  },
  rowActive: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  activeRow: {
    backgroundColor: 'rgba(47,128,255,0.055)',
  },
  pressed: {
    opacity: 0.72,
  },
  artWrap: {
    position: 'relative',
  },
  playingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5,8,14,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  indexWrap: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  index: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 14.5,
    color: colors.text,
    letterSpacing: -0.15,
    flexShrink: 1,
  },
  activeTitle: {
    color: colors.accentLight,
    fontFamily: fonts.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  artist: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
  },
  sourceText: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: colors.textMuted,
  },
  duration: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textMuted,
    marginLeft: 2,
    minWidth: 32,
    textAlign: 'right',
  },
});
