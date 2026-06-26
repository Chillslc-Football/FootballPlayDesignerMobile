import type { TextStyle } from 'react-native';

import { palette } from './colors';

/**
 * Typography scale — font sizes and weights used across the app.
 * Screens will migrate to these presets in later phases.
 */
export const fontSize = {
  caption: 11,
  small: 12,
  label: 13,
  body: 14,
  bodyLarge: 15,
  subheading: 16,
  heading: 20,
  display: 28,
} as const;

export const fontWeight = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const lineHeight = {
  tight: 18,
  normal: 20,
  relaxed: 22,
} as const;

export const letterSpacing = {
  tight: 0.3,
  label: 0.6,
  wide: 0.8,
} as const;

export const typography = {
  display: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: palette.text.primary,
    letterSpacing: letterSpacing.tight,
  },
  heading: {
    fontSize: fontSize.heading,
    fontWeight: fontWeight.bold,
    color: palette.text.primary,
  },
  subheading: {
    fontSize: fontSize.subheading,
    fontWeight: fontWeight.semibold,
    color: palette.text.primary,
  },
  body: {
    fontSize: fontSize.bodyLarge,
    fontWeight: fontWeight.regular,
    color: palette.text.primary,
    lineHeight: lineHeight.normal,
  },
  bodySmall: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.regular,
    color: palette.text.primary,
    lineHeight: lineHeight.normal,
  },
  caption: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.regular,
    color: palette.text.muted,
    lineHeight: lineHeight.tight,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    color: palette.text.label,
    textTransform: 'uppercase',
    letterSpacing: letterSpacing.wide,
  },
  button: {
    fontSize: fontSize.subheading,
    fontWeight: fontWeight.bold,
    color: palette.background.primary,
  },
} as const satisfies Record<string, TextStyle>;

export type Typography = typeof typography;
