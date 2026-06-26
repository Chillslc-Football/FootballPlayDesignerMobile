/**
 * Canonical color palette — single source of truth for app styling.
 *
 * Premium dark appearance. Team-specific accent colors will be added in a
 * later phase; accent.default is a neutral placeholder until then.
 *
 * Existing screens still import legacy `colors` from `src/theme/colors.ts`,
 * which maps to these values without changing rendered output.
 */
export const palette = {
  background: {
    /** Primary app background */
    primary: '#0A1F14',
    /** Elevated surfaces, input fields */
    secondary: '#14352A',
    /** Cards and grouped content */
    card: '#1B4332',
  },
  border: {
    default: '#2D6A4F',
    subtle: '#1B4332',
  },
  divider: '#2D6A4F',
  text: {
    primary: '#FFFFFF',
    secondary: '#B7E4C7',
    muted: '#74A892',
    disabled: '#52796F',
    /** Legacy label accent used on section headings (maps to colors.gold) */
    label: '#D4AF37',
  },
  interactive: {
    primary: '#2D6A4F',
    primaryLight: '#40916C',
  },
  /**
   * Neutral default accent until team-specific colors are implemented.
   * Not wired into legacy `colors.accent` yet — screens still use legacy mint.
   */
  accent: {
    default: '#8FA99E',
  },
  navigation: {
    tabBar: '#0D2818',
    tabActive: '#95D5B2',
    tabInactive: '#52796F',
  },
  status: {
    success: '#40916C',
    warning: '#B8956B',
    error: '#F87171',
    info: '#7BA3C9',
  },
} as const;

/**
 * Backward-compatible color names used by existing screens.
 * Values must remain identical to the pre-design-system palette.
 */
export const legacyColors = {
  background: palette.background.primary,
  surface: palette.background.secondary,
  card: palette.background.card,
  cardBorder: palette.border.default,
  primary: palette.interactive.primary,
  primaryLight: palette.interactive.primaryLight,
  accent: palette.navigation.tabActive,
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
