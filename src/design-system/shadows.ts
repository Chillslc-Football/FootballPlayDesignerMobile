import type { ViewStyle } from 'react-native';

import { palette } from './colors';

/**
 * Reusable elevation styles for cards and floating elements.
 * Subtle shadows suited to the premium dark theme.
 */
export const shadows = {
  none: {},
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
} as const satisfies Record<string, ViewStyle>;

export type Shadows = typeof shadows;

/** Card border used instead of heavy shadows on dark backgrounds */
export const cardBorderStyle: ViewStyle = {
  borderWidth: 1,
  borderColor: palette.border.default,
};

export type ShadowPresets = typeof shadows;
