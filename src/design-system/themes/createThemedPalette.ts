import type { Palette } from './paletteTypes';
import { defaultPalette } from './defaultPalette';

type ThemedPaletteOverrides = {
  background?: Partial<Palette['background']>;
  border?: Partial<Palette['border']>;
  accent?: Partial<Palette['accent']>;
  interactive?: Partial<Palette['interactive']>;
  navigation?: Partial<Palette['navigation']>;
  text?: Partial<Palette['text']>;
};

export function createThemedPalette(overrides: ThemedPaletteOverrides): Palette {
  return {
    ...defaultPalette,
    background: {
      ...defaultPalette.background,
      ...overrides.background,
    },
    border: {
      ...defaultPalette.border,
      ...overrides.border,
    },
    accent: {
      ...defaultPalette.accent,
      ...overrides.accent,
    },
    interactive: {
      ...defaultPalette.interactive,
      ...overrides.interactive,
    },
    navigation: {
      ...defaultPalette.navigation,
      ...overrides.navigation,
    },
    text: {
      ...defaultPalette.text,
      ...overrides.text,
    },
  };
}
