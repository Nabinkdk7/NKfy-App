import React from 'react';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from '@/components/Icon';
import { colors, fonts, radii, spacing } from '@/theme';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  editable?: boolean;
  onPress?: () => void;
}

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Songs, artists, albums',
  onSubmit,
  autoFocus,
  style,
  editable = true,
  onPress,
}: SearchFieldProps) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.container, style]}>
        <Icon name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          editable={false}
          pointerEvents="none"
          style={styles.input}
        />
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Icon name="search" size={18} color={value ? colors.accentLight : colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoFocus={autoFocus}
        editable={editable}
        autoCapitalize="none"
        autoCorrect={false}
          spellCheck={false}
          autoComplete="off"
        selectionColor={colors.accent}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Clear search">
          <Icon name="close" size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 46,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    outlineWidth: 0,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.text,
  },
});
