import type { Palette } from './paletteTypes';

export const defaultPalette: Palette = {
  background: {
    primary: '#121214',
    secondary: '#1C1C1F',
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
    label: '#A8A8AD',
  },
  interactive: {
    primary: '#4A4A52',
    primaryLight: '#5C5C66',
  },
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
};
