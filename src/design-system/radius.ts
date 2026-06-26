/**
 * Border radius tokens derived from existing screen patterns.
 */
export const radius = {
  /** Inputs, small buttons — 8 */
  sm: 8,
  /** Badges, compact controls — 10 */
  md: 10,
  /** Cards, modals — 12 */
  lg: 12,
  /** Large containers — 16 */
  xl: 16,
} as const;

export type Radius = typeof radius;
