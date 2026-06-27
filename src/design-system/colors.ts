/**
 * Canonical color palette — single source of truth for app styling.
 *
 * Static exports reflect the Default theme. Runtime theme switching uses
 * `useAppTheme()` from `AppThemeProvider`.
 */
import { buildLegacyColors } from './themes/buildLegacyColors';
import { defaultPalette } from './themes/defaultPalette';
import type { LegacyColors, Palette } from './themes/paletteTypes';

export { defaultPalette };
export { defaultPalette as palette };
export { buildLegacyColors };
export type { LegacyColors, Palette };

/** Static default legacy colors for modules not yet on useAppTheme(). */
export const legacyColors = buildLegacyColors(defaultPalette);
