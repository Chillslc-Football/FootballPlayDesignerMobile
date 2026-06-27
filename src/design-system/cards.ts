import { buildCardPresets } from './themes/buildCardPresets';
import { defaultPalette } from './themes/defaultPalette';

export { buildCardPresets, type CardPresets } from './themes/buildCardPresets';

/** Static default card presets for modules not yet on useAppTheme(). */
export const cardPresets = buildCardPresets(defaultPalette);
