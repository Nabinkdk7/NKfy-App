import React from 'react';
import { Platform, ScrollView, StyleSheet, View, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/MiniPlayer';
import { colors, layout } from '@/theme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  showMiniPlayer?: boolean;
  /**
   * Reserves scroll padding for a MiniPlayer rendered elsewhere (e.g. the tab
   * bar) without rendering a second copy of it.
   */
  reserveMiniPlayer?: boolean;
  glow?: boolean;
  bottomPadding?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  style?: StyleProp<ViewStyle>;
  safeTop?: boolean;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  showMiniPlayer = false,
  reserveMiniPlayer = false,
  glow = false,
  bottomPadding,
  contentContainerStyle,
  refreshControl,
  style,
  safeTop = true,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const paddingTop = safeTop ? Math.max(insets.top, Platform.OS === 'android' ? 18 : 8) + 6 : 0;
  const paddingBottom =
    bottomPadding ??
    layout.contentBottomPadding +
      (showMiniPlayer || reserveMiniPlayer ? layout.miniPlayerHeight + 26 : 0);

  const contentStyle: StyleProp<ViewStyle> = [
    {
      paddingTop,
      paddingBottom,
      paddingHorizontal: padded ? layout.screenPadding : 0,
      width: '100%',
      maxWidth: layout.maxContentWidth,
      alignSelf: 'center',
    },
    contentContainerStyle,
  ];

  return (
    <View style={[styles.root, style]}>
      {glow ? <BackgroundGlow /> : null}
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, contentStyle]}>{children}</View>
      )}
      {showMiniPlayer ? <MiniPlayer /> : null}
    </View>
  );
}

export function BackgroundGlow() {
  return (
    <View pointerEvents="none" style={styles.glowWrap}>
      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  glowWrap: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  glowOne: {
    position: 'absolute',
    top: -180,
    right: -120,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(47,128,255,0.13)',
  },
  glowTwo: {
    position: 'absolute',
    top: -90,
    left: -160,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(87,60,255,0.07)',
  },
});
