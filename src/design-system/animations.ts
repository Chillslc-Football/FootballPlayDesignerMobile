/**
 * Centralized animation timing for consistent motion across the app.
 * Durations in milliseconds.
 */
export const animation = {
  duration: {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 350,
  },
  easing: {
    /** Standard ease-out curve label for Animated / Reanimated configs */
    standard: 'ease-out',
    /** Emphasized entrance */
    emphasized: 'ease-in-out',
  },
} as const;

export type Animation = typeof animation;
