import type { TextStyle, ViewStyle } from 'react-native';

import type { Palette } from './paletteTypes';
import { radius } from '../radius';
import { spacing } from '../spacing';
import { cardBorderStyle } from '../shadows';
import { typography } from '../typography';

type CardPreset = {
  container: ViewStyle;
  title: TextStyle;
  body: ViewStyle;
};

export type CardPresets = {
  default: CardPreset;
  compact: CardPreset;
};

export function buildCardPresets(palette: Palette): CardPresets {
  return {
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
  };
}
