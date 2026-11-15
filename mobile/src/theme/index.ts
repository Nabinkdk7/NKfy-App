import { Platform, TextStyle } from 'react-native';

export const colors = {
  background: '#08090B',
  backgroundElevated: '#0C0E12',
  surface: '#12151A',
  surfaceAlt: '#171B21',
  surfaceHigh: '#1D222A',
  surfacePress: '#222833',
  border: '#242A34',
  borderSubtle: '#191E26',
  text: '#F5F7FA',
  textSecondary: '#A6AEBC',
  textMuted: '#707888',
  accent: '#2F80FF',
  accentLight: '#7EB2FF',
  accentPressed: '#2268D9',
  accentSoft: 'rgba(47,128,255,0.14)',
  accentFaint: 'rgba(47,128,255,0.07)',
  success: '#34D399',
  danger: '#FF5C5C',
  warning: '#F5A524',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(3,4,6,0.74)',
  scrim: 'rgba(5,6,9,0.55)',
  transparent: 'transparent',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radii = {
  xs: 8,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 999,
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const layout = {
  screenPadding: 20,
  tabBarHeight: 62,
  miniPlayerHeight: 64,
  contentBottomPadding: 168,
  maxContentWidth: 620,
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
} as const;

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    default: {},
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 18,
    },
    android: { elevation: 12 },
    default: {},
  }),
  accent: Platform.select({
    ios: {
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 18,
    },
    android: { elevation: 10 },
    default: {},
  }),
} as const;

type Variant =
  | 'display'
  | 'hero'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'micro';

export const type: Record<Variant, TextStyle> = {
  display: {
    fontFamily: fonts.extrabold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1,
    color: colors.text,
  },
  hero: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.7,
    color: colors.text,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.text,
  },
  heading: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: colors.text,
  },
  subheading: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  bodyStrong: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  micro: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.6,
    color: colors.textMuted,
  },
};
