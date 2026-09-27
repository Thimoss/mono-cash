import { Platform } from 'react-native';

export const Palette = {
  // Neo-Fintech Background & Surfaces
  backgroundDark: '#121214', // Deep Charcoal
  backgroundLight: '#F9FAFB', // Soft Light Background
  surface: '#1A1A1E',        // Card / Container Surface
  surfaceLight: '#FFFFFF',
  surfaceElevated: '#222228', // Elevated Surface / Hover
  surfaceElevatedLight: '#F3F4F6',
  border: '#2A2A30',         // Subtle Slate Border
  borderLight: '#E5E7EB',
  borderFocus: '#6366F1',

  // Neo-Fintech Brand & Functional Colors
  indigo: '#6366F1',         // Accent / Brand
  indigoDark: '#4F46E5',
  indigoLight: '#818CF8',

  emerald: '#10B981',        // Success / Income / Paid
  emeraldDark: '#059669',
  emeraldLight: '#34D399',

  amber: '#F59E0B',          // Warning / Due Soon
  amberDark: '#D97706',
  amberLight: '#FBBF24',

  rose: '#EF4444',           // Danger / Expense / Overdue
  roseDark: '#DC2626',
  roseLight: '#F87171',

  // Neutrals (Soft Charcoal to Soft Off-White)
  black: '#121214',          // Primary Dark Background
  trueBlack: '#000000',
  white: '#F3F4F6',          // Primary Soft Off-White
  pureWhite: '#FFFFFF',
  darkGray: '#1A1A1E',
  gray900: '#16161A',
  gray800: '#222228',
  gray700: '#2A2A30',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',        // Secondary Muted Text
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
} as const;

export const Colors = {
  dark: {
    text: Palette.white,             // #F3F4F6
    textSecondary: Palette.gray400, // #9CA3AF
    textMuted: Palette.gray500,     // #6B7280
    background: Palette.backgroundDark, // #121214
    backgroundElement: Palette.surface,  // #1A1A1E
    backgroundSelected: Palette.surfaceElevated, // #222228
    border: Palette.border,         // #2A2A30
    action: Palette.indigo,         // #6366F1
    actionText: Palette.pureWhite,  // #FFFFFF
    card: Palette.surface,          // #1A1A1E
    cardElevated: Palette.surfaceElevated, // #222228
    cardBorder: Palette.border,     // #2A2A30
    accent: Palette.indigo,         // #6366F1
    success: Palette.emerald,       // #10B981
    warning: Palette.amber,         // #F59E0B
    danger: Palette.rose,           // #EF4444
  },
  light: {
    text: '#111827',                 // Text Primary
    textSecondary: '#6B7280',        // Text Secondary
    textMuted: '#9CA3AF',
    background: '#F9F9FB',           // Light Mode Background
    backgroundElement: '#FFFFFF',    // Surface Card
    backgroundSelected: '#F3F4F6',
    border: '#E5E7EB',               // Card Border
    action: Palette.indigo,          // #6366F1
    actionText: Palette.pureWhite,   // #FFFFFF
    card: '#FFFFFF',                 // Surface Card
    cardElevated: '#F9FAFB',
    cardBorder: '#E5E7EB',           // Card Border
    accent: '#6366F1',               // Accent
    success: '#10B981',              // Success
    warning: '#F59E0B',              // Warning
    danger: '#EF4444',               // Danger
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;
export type ColorTheme = Record<ThemeColor, string>;

export const SansFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  default: 'sans-serif',
}) as string;

export const MonospaceFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  web: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  default: 'monospace',
}) as string;

export const Fonts = {
  sans: SansFamily,
  serif: SansFamily,
  rounded: SansFamily,
  mono: MonospaceFamily,
} as const;

export const Typography = {
  sans: SansFamily,
  mono: MonospaceFamily,
  family: SansFamily,
  scale: {
    xs: {
      fontSize: 11,
      lineHeight: 15,
      letterSpacing: 0.3,
    },
    sm: {
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0.1,
    },
    base: {
      fontSize: 15,
      lineHeight: 22,
      letterSpacing: 0,
    },
    md: {
      fontSize: 17,
      lineHeight: 24,
      letterSpacing: -0.1,
    },
    lg: {
      fontSize: 19,
      lineHeight: 26,
      letterSpacing: -0.2,
    },
    xl: {
      fontSize: 22,
      lineHeight: 30,
      letterSpacing: -0.3,
    },
    '2xl': {
      fontSize: 26,
      lineHeight: 34,
      letterSpacing: -0.4,
    },
    '3xl': {
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    '4xl': {
      fontSize: 38,
      lineHeight: 46,
      letterSpacing: -0.6,
    },
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
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
