/**
 * Standard icon sizes for emoji, tab bar, and inline icons.
 */
export const iconSizes = {
  /** Tab bar, small inline — 11 */
  xs: 11,
  /** Badge, chevron — 12–14 range */
  sm: 14,
  /** List row icons — 20 */
  md: 20,
  /** Section headers — 22 */
  lg: 22,
  /** Large decorative — 28 */
  xl: 28,
} as const;

export type IconSizes = typeof iconSizes;
