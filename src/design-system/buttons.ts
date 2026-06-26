import type { TextStyle, ViewStyle } from 'react-native';

import { palette } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import { typography } from './typography';

type ButtonPreset = {
  container: ViewStyle;
  text: TextStyle;
  pressed: ViewStyle;
  disabled: ViewStyle;
};

const baseContainer: ViewStyle = {
  borderRadius: radius.sm,
  paddingVertical: 14,
  paddingHorizontal: spacing.lg,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,
};

export const buttonPresets = {
  primary: {
    container: {
      ...baseContainer,
      backgroundColor: palette.navigation.tabActive,
    },
    text: {
      ...typography.button,
      color: palette.background.primary,
    },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.7 },
  },
  secondary: {
    container: {
      ...baseContainer,
      backgroundColor: palette.background.secondary,
      borderWidth: 1,
      borderColor: palette.border.default,
    },
    text: {
      ...typography.button,
      color: palette.text.primary,
      fontWeight: typography.subheading.fontWeight,
    },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.5 },
  },
  danger: {
    container: {
      ...baseContainer,
      backgroundColor: palette.status.error,
    },
    text: {
      ...typography.button,
      color: palette.text.primary,
    },
    pressed: { opacity: 0.85 },
    disabled: { opacity: 0.7 },
  },
} as const satisfies Record<string, ButtonPreset>;

export type ButtonPresets = typeof buttonPresets;
