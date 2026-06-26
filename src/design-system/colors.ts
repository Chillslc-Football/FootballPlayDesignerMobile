/**
 * Canonical color palette — single source of truth for app styling.
 *
 * Premium dark appearance with graphite backgrounds and charcoal surfaces.
 * Team-specific accent colors will be added in a later phase; accent.default
 * is a neutral placeholder until then.
 *
 * Existing screens import legacy `colors` from `src/theme/colors.ts`, which
 * maps to these values.
 */
export const palette = {
  background: {
    /** Primary app background — dark graphite */
    primary: '#121214',
    /** Elevated surfaces, input fields */
    secondary: '#1C1C1F',
    /** Cards and grouped content — charcoal */
    card: '#252528',
  },
  border: {
    default: '#3A3A3F',
    subtle: '#2A2A2E',
  },
  divider: '#3A3A3F',
  text: {
    primary: '#FFFFFF',
    secondary: '#C4C4C8',
    muted: '#8E8E93',
    disabled: '#6E6E73',
    /** Section label accent — muted silver (maps to colors.gold) */
    label: '#A8A8AD',
  },
  interactive: {
    primary: '#4A4A52',
    primaryLight: '#5C5C66',
  },
  /** Neutral default accent until team-specific colors are implemented. */
  accent: {
    default: '#9A9AA3',
  },
  navigation: {
    tabBar: '#0E0E10',
    tabActive: '#F0F0F2',
    tabInactive: '#6E6E73',
  },
  status: {
    success: '#5A9E7A',
    warning: '#B8956B',
    error: '#E07070',
    info: '#7BA3C9',
  },
} as const;

/**
 * Backward-compatible color names used by existing screens.
 */
export const legacyColors = {
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
} as const;

export type Palette = typeof palette;
export type LegacyColors = typeof legacyColors;
