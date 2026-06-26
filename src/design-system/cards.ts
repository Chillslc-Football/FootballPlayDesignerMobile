import type { TextStyle, ViewStyle } from 'react-native';

import { palette } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import { cardBorderStyle } from './shadows';
import { typography } from './typography';

type CardPreset = {
  container: ViewStyle;
  title: TextStyle;
  body: ViewStyle;
};

export const cardPresets = {
  default: {
    container: {
      backgroundColor: palette.background.card,
      borderRadius: radius.lg,
      ...cardBorderStyle,
      padding: spacing.lg,
      marginBottom: spacing.lg,
    },
    title: typography.label,
    body: {
      gap: spacing.xs,
    },
  },
  compact: {
    container: {
      backgroundColor: palette.background.card,
      borderRadius: radius.lg,
      ...cardBorderStyle,
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.label,
      marginBottom: spacing.sm,
    },
    body: {
      gap: spacing.xs,
    },
  },
} as const satisfies Record<string, CardPreset>;

export type CardPresets = typeof cardPresets;
