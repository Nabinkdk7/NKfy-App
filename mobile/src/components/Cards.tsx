import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Artwork } from '@/components/Artwork';
import { IconButton } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { colors, fonts, layout, radii, spacing } from '@/theme';
import type { ArtworkSource } from '@/types/music';

export function useGridWidth(columns = 2, gap = 12): number {
  const { width } = useWindowDimensions();
  const content = Math.min(width - layout.screenPadding * 2, layout.maxContentWidth);
  return (content - gap * (columns - 1)) / columns;
}

export function QuickTile({
  title,
  subtitle,
  artwork,
  onPress,
  onPlay,
}: {
  title: string;
  subtitle?: string;
  artwork?: ArtworkSource;
  onPress: () => void;
  onPlay?: () => void;
}) {
  return (
    <View style={styles.tile}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.tileInfo, pressed && styles.pressed]}
      >
        <Artwork source={artwork} size={52} radius={10} label={title} />
        <View style={styles.tileCopy}>
          <Text style={styles.tileTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.tileSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </Pressable>
      {onPlay ? (
        <IconButton
          icon="play"
          size={32}
          iconSize={14}
          background={colors.accent}
          color={colors.white}
          onPress={onPlay}
          accessibilityLabel={`Play ${title}`}
        />
      ) : null}
    </View>
  );
}

export function FeatureCard({
  title,
  description,
  artwork,
  eyebrow = 'Featured playlist',
  onPress,
  onPlay,
  isPlaying,
}: {
  title: string;
  description?: string;
  artwork?: ArtworkSource;
  eyebrow?: string;
  onPress: () => void;
  onPlay: () => void;
  isPlaying?: boolean;
}) {
  return (
    <View style={styles.feature}>
      <LinearGradient
        colors={['rgba(47,128,255,0.22)', 'rgba(20,24,32,0.2)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Pressable
        onPress={onPress}
        style={StyleSheet.absoluteFill}
        accessibilityRole="button"
        accessibilityLabel={`Open ${title}`}
      />
      <View style={styles.featureCopy} pointerEvents="box-none">
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowDot} />
          <Text style={styles.featureEyebrow}>{eyebrow}</Text>
        </View>
        <Text style={styles.featureTitle} numberOfLines={2}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.featureDescription} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
        <View style={styles.featureActions}>
          <IconButton
            icon={isPlaying ? 'pause' : 'play'}
            size={44}
            iconSize={19}
            background={colors.accent}
            color={colors.white}
            onPress={onPlay}
            accessibilityLabel={isPlaying ? `Pause ${title}` : `Play ${title}`}
          />
          <View style={styles.featureHint} pointerEvents="none">
            <Text style={styles.featureHintText}>Tap to open</Text>
            <Icon name="chevron-right" size={13} color={colors.textSecondary} />
          </View>
        </View>
      </View>
      <View style={styles.featureArt} pointerEvents="none">
        <Artwork source={artwork} size={112} radius={16} label={title} />
      </View>
    </View>
  );
}

export function CoverCard({
  title,
  subtitle,
  artwork,
  onPress,
  width = 142,
  onMore,
}: {
  title: string;
  subtitle?: string;
  artwork?: ArtworkSource;
  onPress: () => void;
  width?: number;
  onMore?: () => void;
}) {
  return (
    <View style={{ width }}>
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        <View style={styles.coverWrap}>
          <Artwork source={artwork} width={width} height={width} radius={14} label={title} />
        </View>
        <Text style={styles.coverTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.coverSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </Pressable>
      {onMore ? (
        <View style={styles.coverMore}>
          <IconButton
            icon="more"
            size={26}
            iconSize={15}
            color={colors.text}
            background="rgba(5,7,11,0.6)"
            onPress={onMore}
            accessibilityLabel={`More options for ${title}`}
          />
        </View>
      ) : null}
    </View>
  );
}

export function GridCard({
  title,
  subtitle,
  artwork,
  onPress,
  width,
  badge,
  onMore,
}: {
  title: string;
  subtitle?: string;
  artwork?: ArtworkSource;
  onPress: () => void;
  width: number;
  badge?: string;
  onMore?: () => void;
}) {
  return (
    <View style={{ width }}>
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        <View style={styles.coverWrap}>
          <Artwork source={artwork} width={width} height={width} radius={14} label={title} badge={badge} />
        </View>
        <Text style={styles.coverTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.coverSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </Pressable>
      {onMore ? (
        <View style={styles.coverMore}>
          <IconButton
            icon="more"
            size={26}
            iconSize={15}
            color={colors.text}
            background="rgba(5,7,11,0.62)"
            onPress={onMore}
            accessibilityLabel={`More options for ${title}`}
          />
        </View>
      ) : null}
    </View>
  );
}

export function GenreCard({
  name,
  accent = colors.accent,
  onPress,
}: {
  name: string;
  accent?: string;
  onPress: () => void;
}) {
  const width = useGridWidth(2, 12);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ width }, styles.genre, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[`${accent}E6`, `${accent}66`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.genreText} numberOfLines={2}>
        {name}
      </Text>
      <View style={styles.genreIcon}>
        <Icon name="music" size={14} color="rgba(255,255,255,0.9)" />
      </View>
    </Pressable>
  );
}

export function SettingRow({
  icon,
  label,
  description,
  value,
  onPress,
  right,
  danger,
  last,
}: {
  icon?: IconName;
  label: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  last?: boolean;
}) {
  const content = (
    <>
      {icon ? (
        <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
          <Icon name={icon} size={17} color={danger ? colors.danger : colors.accentLight} />
        </View>
      ) : null}
      <View style={styles.settingCopy}>
        <Text style={[styles.settingLabel, danger && { color: colors.danger }]} numberOfLines={1}>
          {label}
        </Text>
        {description ? (
          <Text style={styles.settingDescription} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
      {right}
      {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      {onPress && !right ? (
        <Icon name="chevron-right" size={16} color={colors.textMuted} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.settingRow, last && styles.settingLast]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        last && styles.settingLast,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function SettingSection({
  title,
  children,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Badge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'accent' }) {
  return (
    <View style={[styles.badge, tone === 'accent' && styles.badgeAccent]}>
      <Text style={[styles.badgeText, tone === 'accent' && styles.badgeTextAccent]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.72,
  },
  tile: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 6,
    paddingRight: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  tileCopy: {
    flex: 1,
    gap: 2,
  },
  tileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    borderRadius: 10,
  },
  tileTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.text,
    letterSpacing: -0.1,
  },
  tileSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 10.5,
    color: colors.textMuted,
  },
  feature: {
    borderRadius: radii.lg + 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(47,128,255,0.22)',
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    overflow: 'hidden',
    minHeight: 168,
  },
  featureCopy: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
  },
  featureEyebrow: {
    fontFamily: fonts.semibold,
    fontSize: 9.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.accentLight,
  },
  featureTitle: {
    fontFamily: fonts.bold,
    fontSize: 23,
    lineHeight: 27,
    letterSpacing: -0.6,
    color: colors.text,
  },
  featureDescription: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  featureActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  featureHintText: {
    fontFamily: fonts.medium,
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  featureArt: {
    justifyContent: 'center',
  },
  coverWrap: {
    position: 'relative',
    borderRadius: 14,
  },
  coverMore: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  coverTitle: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.text,
    marginTop: spacing.sm + 1,
    letterSpacing: -0.1,
  },
  coverSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  genre: {
    height: 74,
    borderRadius: radii.md,
    padding: spacing.md,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  genreText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.white,
    letterSpacing: -0.2,
    paddingRight: 24,
  },
  genreIcon: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(5,7,11,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    minHeight: 54,
  },
  settingLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconDanger: {
    backgroundColor: 'rgba(255,92,92,0.1)',
  },
  settingCopy: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  settingDescription: {
    fontFamily: fonts.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textMuted,
  },
  settingValue: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  section: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  sectionBody: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    padding: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  segment: {
    flex: 1,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surfaceHigh,
  },
  segmentLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  segmentLabelActive: {
    color: colors.text,
    fontFamily: fonts.semibold,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: colors.surfaceHigh,
  },
  badgeAccent: {
    backgroundColor: colors.accentSoft,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  badgeTextAccent: {
    color: colors.accentLight,
  },
});
