export { palette, legacyColors, type Palette, type LegacyColors } from './colors';
export { spacing, screenPaddingHorizontal, screenPaddingBottom, type Spacing } from './spacing';
export { radius, type Radius } from './radius';
export {
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  typography,
  type Typography,
} from './typography';
export { shadows, cardBorderStyle, type Shadows, type ShadowPresets } from './shadows';
export { buttonPresets, type ButtonPresets } from './buttons';
export { cardPresets, type CardPresets } from './cards';
export { inputPresets, type InputPresets } from './inputs';
export { avatarSizes, type AvatarSizes } from './avatars';
export { iconSizes, type IconSizes } from './icons';
export { animation, type Animation } from './animations';

import { palette, legacyColors } from './colors';
import { spacing, screenPaddingHorizontal, screenPaddingBottom } from './spacing';
import { radius } from './radius';
import { typography, fontSize, fontWeight } from './typography';
import { shadows, cardBorderStyle } from './shadows';
import { buttonPresets } from './buttons';
import { cardPresets } from './cards';
import { inputPresets } from './inputs';
import { avatarSizes } from './avatars';
import { iconSizes } from './icons';
import { animation } from './animations';

/**
 * Unified design system object for convenient imports in future migrations.
 *
 * @example
 * import { designSystem } from '../design-system';
 * designSystem.colors.palette.text.primary
 */
export const designSystem = {
  colors: { palette, legacy: legacyColors },
  spacing: { scale: spacing, screenPaddingHorizontal, screenPaddingBottom },
  radius,
  typography: { presets: typography, fontSize, fontWeight },
  shadows: { presets: shadows, cardBorder: cardBorderStyle },
  buttons: buttonPresets,
  cards: cardPresets,
  inputs: inputPresets,
  avatars: avatarSizes,
  icons: iconSizes,
  animation,
} as const;

export type DesignSystem = typeof designSystem;
