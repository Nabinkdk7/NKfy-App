import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { colors, fonts, radii, shadows, spacing } from '@/theme';
import { useToastStore } from '@/stores/uiStore';

export function ToastHost() {
  const message = useToastStore((state) => state.message);
  const tone = useToastStore((state) => state.tone);
  const id = useToastStore((state) => state.id);
  const hideToast = useToastStore((state) => state.hideToast);
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(10)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translate, { toValue: 8, duration: 180, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) hideToast();
      });
    }, 2400);

    return () => clearTimeout(timer);
  }, [hideToast, id, message, opacity, translate]);

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { bottom: Math.max(insets.bottom, 12) + 84, opacity, transform: [{ translateY: translate }] },
      ]}
    >
      <View style={styles.toast}>
        <Icon
          name={tone === 'error' ? 'info' : tone === 'success' ? 'check' : 'sparkles'}
          size={15}
          color={tone === 'error' ? colors.danger : colors.accentLight}
        />
        <Text style={styles.text} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: 200,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(29,34,42,0.98)',
    borderRadius: radii.pill,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    maxWidth: 420,
    ...shadows.floating,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 12.5,
    color: colors.text,
    flexShrink: 1,
  },
});
