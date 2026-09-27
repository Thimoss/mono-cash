import { Platform } from 'react-native';

export const Palette = {
  black: '#000000',
  white: '#FFFFFF',
  darkGray: '#121212',
  gray900: '#171717',
  gray800: '#262626',
  gray700: '#333333',
  gray600: '#525252',
  gray500: '#737373',
  gray400: '#A3A3A3',
  gray300: '#D4D4D4',
  gray200: '#E5E5E5',
  gray100: '#F5F5F5',
} as const;

export const Colors = {
  dark: {
    text: Palette.white,
    textSecondary: Palette.gray400,
    textMuted: Palette.gray500,
    background: Palette.black,
    backgroundElement: Palette.darkGray,
    backgroundSelected: Palette.gray800,
    border: Palette.gray700,
    action: Palette.white,
    actionText: Palette.black,
    card: Palette.darkGray,
    cardBorder: Palette.gray700,
  },
  light: {
    text: Palette.black,
    textSecondary: Palette.gray600,
    textMuted: Palette.gray500,
    background: Palette.white,
    backgroundElement: Palette.gray100,
    backgroundSelected: Palette.gray200,
    border: Palette.gray300,
    action: Palette.black,
    actionText: Palette.white,
    card: Palette.white,
    cardBorder: Palette.gray300,
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

export const MonospaceFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  web: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  default: 'monospace',
}) as string;

export const Fonts = {
  sans: MonospaceFamily,
  serif: MonospaceFamily,
  rounded: MonospaceFamily,
  mono: MonospaceFamily,
} as const;

export const Typography = {
  family: MonospaceFamily,
  scale: {
    xs: {
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 0.5,
    },
    sm: {
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.25,
    },
    base: {
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
    },
    md: {
      fontSize: 16,
      lineHeight: 24,
      letterSpacing: -0.2,
    },
    lg: {
      fontSize: 18,
      lineHeight: 26,
      letterSpacing: -0.3,
    },
    xl: {
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: -0.4,
    },
    '2xl': {
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: -0.5,
    },
    '3xl': {
      fontSize: 30,
      lineHeight: 38,
      letterSpacing: -0.6,
    },
    '4xl': {
      fontSize: 36,
      lineHeight: 44,
      letterSpacing: -0.8,
    },
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
