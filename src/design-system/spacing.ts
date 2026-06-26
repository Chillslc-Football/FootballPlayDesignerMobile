/**
 * Consistent spacing scale for padding, margin, and gap.
 * Based on values already used across existing screens.
 */
export const spacing = {
  /** 4 */
  xs: 4,
  /** 8 */
  sm: 8,
  /** 12 */
  md: 12,
  /** 16 */
  lg: 16,
  /** 20 — common horizontal screen padding */
  xl: 20,
  /** 24 */
  xxl: 24,
  /** 32 — large section gaps */
  xxxl: 32,
} as const;

/** Standard horizontal padding for screen content */
export const screenPaddingHorizontal = spacing.xl;

/** Standard bottom padding for scroll content */
export const screenPaddingBottom = spacing.xxl;

export type Spacing = typeof spacing;
