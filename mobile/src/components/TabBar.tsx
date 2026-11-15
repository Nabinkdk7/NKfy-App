import type { BottomTabBarProps } from 'expo-router/js-tabs';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { MiniPlayer } from '@/components/MiniPlayer';
import { colors, fonts, layout, spacing } from '@/theme';

const iconMap: Record<string, IconName> = {
  index: 'home',
  search: 'search',
  library: 'library',
  playlists: 'playlist',
  profile: 'profile',
};

export function AppTabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const barHeight = layout.tabBarHeight + insets.bottom;

  return (
    <>
      <MiniPlayer bottomOffset={barHeight + 10} />
      <View style={[styles.bar, { height: barHeight, paddingBottom: insets.bottom }]}>
        <View style={styles.items}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const icon = iconMap[route.name] ?? 'music';
            const label =
              route.name === 'index'
                ? 'Home'
                : route.name.charAt(0).toUpperCase() + route.name.slice(1);

            const onPress = () => {
              if (focused) return;
              void Haptics.selectionAsync().catch(() => undefined);
              navigateToTab(route.key);
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.item}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={label}
              >
                <Icon
                  name={icon}
                  size={focused ? 23 : 22}
                  color={focused ? colors.accentLight : colors.textMuted}
                  strokeWidth={focused ? 2.1 : 1.8}
                />
                <Text style={[styles.label, focused && styles.activeLabel]}>{label}</Text>
                <View style={[styles.dot, focused && styles.activeDot]} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,9,11,0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    zIndex: 20,
  },
  items: {
    flexDirection: 'row',
    height: layout.tabBarHeight,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 9.5,
    letterSpacing: 0.1,
    color: colors.textMuted,
  },
  activeLabel: {
    color: colors.accentLight,
    fontFamily: fonts.semibold,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginTop: 1,
  },
  activeDot: {
    backgroundColor: colors.accent,
  },
});
