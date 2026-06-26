import type { TextStyle, ViewStyle } from 'react-native';

import { palette } from './colors';
import { typography } from './typography';

type AvatarPreset = {
  container: ViewStyle;
  initials: TextStyle;
  fontSize: number;
  dimension: number;
};

function createAvatarPreset(dimension: number): AvatarPreset {
  return {
    dimension,
    container: {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
      backgroundColor: palette.background.secondary,
      borderWidth: 1,
      borderColor: palette.border.default,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    initials: {
      fontSize: dimension * 0.38,
      fontWeight: typography.subheading.fontWeight,
      color: palette.text.secondary,
    },
    fontSize: dimension * 0.38,
  };
}

export const avatarSizes = {
  /** 28 — compact lists */
  sm: createAvatarPreset(28),
  /** 36 — standard rows */
  md: createAvatarPreset(36),
  /** 48 — profile headers */
  lg: createAvatarPreset(48),
  /** 64 — detail views */
  xl: createAvatarPreset(64),
} as const;

export type AvatarSizes = typeof avatarSizes;
