import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { colors, fonts, radii, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  iconRight?: IconName;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  numberOfLines?: number;
}

const heights: Record<Size, number> = { sm: 34, md: 44, lg: 52 };

export function Button({
  label,
  onPress,
  icon,
  iconRight,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  fullWidth,
  style,
  numberOfLines = 1,
}: ButtonProps) {
  const palette = palettes[variant];
  const iconSize = size === 'sm' ? 15 : size === 'lg' ? 20 : 17;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          height: heights[size],
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.xl,
          borderRadius: size === 'lg' ? radii.pill : radii.pill,
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={iconSize} color={palette.text} strokeWidth={2} /> : null}
          <Text
            numberOfLines={numberOfLines}
            style={[
              styles.label,
              { color: palette.text, fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 14.5 },
            ]}
          >
            {label}
          </Text>
          {iconRight ? (
            <Icon name={iconRight} size={iconSize} color={palette.text} strokeWidth={2} />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const palettes: Record<Variant, { background: string; text: string; border: string }> = {
  primary: {
    background: colors.accent,
    text: colors.white,
    border: colors.accent,
  },
  secondary: {
    background: colors.surfaceHigh,
    text: colors.text,
    border: colors.border,
  },
  soft: {
    background: colors.accentSoft,
    text: colors.accentLight,
    border: 'rgba(47,128,255,0.28)',
  },
  ghost: {
    background: 'transparent',
    text: colors.text,
    border: colors.border,
  },
  danger: {
    background: 'rgba(255,92,92,0.12)',
    text: colors.danger,
    border: 'rgba(255,92,92,0.3)',
  },
};

export function IconButton({
  icon,
  onPress,
  size = 40,
  iconSize = 20,
  color = colors.text,
  background = 'transparent',
  border = false,
  disabled,
  accessibilityLabel,
  active,
  style,
}: {
  icon: IconName;
  onPress?: () => void;
  size?: number;
  iconSize?: number;
  color?: string;
  background?: string;
  border?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? colors.accentSoft : background,
          borderWidth: border ? StyleSheet.hairlineWidth : 0,
          borderColor: border ? colors.border : 'transparent',
          opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} size={iconSize} color={active ? colors.accentLight : color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    fontFamily: fonts.semibold,
    letterSpacing: -0.1,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
