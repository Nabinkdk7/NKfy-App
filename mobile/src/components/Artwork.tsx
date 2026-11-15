import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/Icon';
import { colors, fonts, radii } from '@/theme';
import type { ArtworkSource } from '@/types/music';
import { artworkSource } from '@/utils/artwork';

interface ArtworkProps {
  source?: ArtworkSource;
  size?: number;
  width?: number;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  label?: string;
  rounded?: boolean;
  badge?: string;
}

const fallbackGradients: [string, string][] = [
  ['#16233A', '#0C111B'],
  ['#1B1F3A', '#0B0E18'],
  ['#232033', '#0E0C14'],
  ['#122A2A', '#0A1114'],
];

export function Artwork({
  source,
  size = 52,
  width,
  height,
  radius,
  style,
  label,
  rounded,
  badge,
}: ArtworkProps) {
  const w = width ?? size;
  const h = height ?? size;
  const r = radius ?? (rounded ? Math.min(w, h) / 2 : radii.sm);
  const resolved = artworkSource(source);

  return (
    <View
      style={[
        styles.container,
        { width: w, height: h, borderRadius: r, backgroundColor: colors.surfaceAlt },
        style,
      ]}
    >
      {resolved ? (
        <Image
          source={resolved}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={180}
          cachePolicy="memory-disk"
        />
      ) : (
        <LinearGradient
          colors={fallbackGradients[hashSeed(label ?? 'nkfy') % fallbackGradients.length]!}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.fallbackInner}>
            <Icon name="music" size={Math.max(16, Math.min(w, h) * 0.34)} color={colors.accentLight} strokeWidth={1.5} />
          </View>
        </LinearGradient>
      )}
      <View
        pointerEvents="none"
        style={[styles.hairline, { borderRadius: r, borderColor: 'rgba(255,255,255,0.06)' }]}
      />
      {badge ? <ArtworkLabel>{badge}</ArtworkLabel> : null}
    </View>
  );
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 9973;
  }
  return hash;
}

export function ArtworkLabel({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  fallbackInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hairline: {
    ...StyleSheet.absoluteFill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    backgroundColor: 'rgba(5,7,10,0.78)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 0.5,
    color: colors.textSecondary,
  },
});
