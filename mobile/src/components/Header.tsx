import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/Button';
import { colors, fonts, spacing, type } from '@/theme';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  onBack?: () => void;
  backIcon?: 'chevron-left' | 'arrow-left' | 'chevron-down' | 'close';
  right?: React.ReactNode;
  large?: boolean;
  transparent?: boolean;
}

export function Header({
  title,
  subtitle,
  eyebrow,
  onBack,
  backIcon = 'chevron-left',
  right,
  large,
  transparent,
}: HeaderProps) {
  const showBack = Boolean(onBack);

  return (
    <View style={[styles.wrap, transparent && styles.transparent]}>
      <View style={styles.row}>
        {showBack ? (
          <IconButton
            icon={backIcon}
            onPress={onBack ?? (() => router.back())}
            size={38}
            iconSize={22}
            color={colors.text}
            accessibilityLabel="Go back"
            style={styles.back}
          />
        ) : null}
        {!large && title ? (
          <Text style={styles.inlineTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
        <View style={styles.spacer} />
        {right}
      </View>
      {large && title ? (
        <View style={styles.largeWrap}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.largeTitle}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : subtitle ? (
        <Text style={styles.subtitle}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  transparent: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
  },
  back: {
    marginLeft: -8,
    marginRight: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
  inlineTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
    letterSpacing: -0.2,
  },
  largeWrap: {
    marginTop: spacing.sm,
    gap: 4,
  },
  eyebrow: {
    ...type.micro,
    textTransform: 'uppercase',
    color: colors.accentLight,
    letterSpacing: 1.2,
  },
  largeTitle: {
    ...type.display,
  },
  subtitle: {
    ...type.caption,
    marginTop: 2,
    color: colors.textSecondary,
  },
});
