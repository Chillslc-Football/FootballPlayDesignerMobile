import type { TextStyle, ViewStyle } from 'react-native';

import { palette } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import { fontSize, typography } from './typography';

type InputPreset = {
  container: ViewStyle;
  field: TextStyle;
  label: TextStyle;
  placeholderColor: string;
  error: TextStyle;
};

export const inputPresets = {
  default: {
    container: {
      marginBottom: spacing.lg,
    },
    field: {
      backgroundColor: palette.background.secondary,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: palette.border.default,
      paddingHorizontal: 14,
      paddingVertical: spacing.md,
      fontSize: fontSize.subheading,
      color: palette.text.primary,
      minHeight: 44,
    },
    label: {
      fontSize: typography.bodySmall.fontSize,
      fontWeight: typography.label.fontWeight,
      color: palette.text.label,
      marginBottom: spacing.sm,
    },
    placeholderColor: palette.text.muted,
    error: {
      fontSize: typography.bodySmall.fontSize,
      color: palette.status.error,
      marginTop: spacing.sm,
    },
  },
  multiline: {
    container: {
      marginBottom: spacing.lg,
    },
    field: {
      backgroundColor: palette.background.secondary,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: palette.border.default,
      paddingHorizontal: 14,
      paddingVertical: spacing.md,
      fontSize: fontSize.bodyLarge,
      color: palette.text.primary,
      minHeight: 88,
      textAlignVertical: 'top',
    },
    label: {
      fontSize: typography.bodySmall.fontSize,
      fontWeight: typography.label.fontWeight,
      color: palette.text.label,
      marginBottom: spacing.sm,
    },
    placeholderColor: palette.text.muted,
    error: {
      fontSize: typography.bodySmall.fontSize,
      color: palette.status.error,
      marginTop: spacing.sm,
    },
  },
} as const satisfies Record<string, InputPreset>;

export type InputPresets = typeof inputPresets;
