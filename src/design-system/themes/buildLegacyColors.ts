import type { LegacyColors, Palette } from './paletteTypes';

export function buildLegacyColors(palette: Palette): LegacyColors {
  return {
    background: palette.background.primary,
    surface: palette.background.secondary,
    card: palette.background.card,
    cardBorder: palette.border.default,
    primary: palette.interactive.primary,
    primaryLight: palette.interactive.primaryLight,
    accent: palette.accent.default,
    gold: palette.text.label,
    text: palette.text.primary,
    textSecondary: palette.text.secondary,
    textMuted: palette.text.muted,
    tabBar: palette.navigation.tabBar,
    tabBarActive: palette.navigation.tabActive,
    tabBarInactive: palette.navigation.tabInactive,
    divider: palette.divider,
  };
}
