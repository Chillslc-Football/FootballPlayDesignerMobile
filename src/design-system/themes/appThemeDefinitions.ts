import type { Palette } from './paletteTypes';
import { createThemedPalette } from './createThemedPalette';
import { defaultPalette } from './defaultPalette';

export const APP_THEME_IDS = [
  'default',
  'crimson',
  'royal_blue',
  'purple_black',
  'field_green',
  'orange_silver',
] as const;

export type AppThemeId = (typeof APP_THEME_IDS)[number];

export type AppThemeDefinition = {
  id: AppThemeId;
  label: string;
  description: string;
  swatches: [string, string, string];
  palette: Palette;
};

export const APP_THEME_DEFINITIONS: AppThemeDefinition[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'Current app colors',
    swatches: [defaultPalette.background.primary, defaultPalette.accent.default, '#FFFFFF'],
    palette: defaultPalette,
  },
  {
    id: 'crimson',
    label: 'Crimson',
    description: 'Red, black, and white',
    swatches: ['#0C0C0C', '#DC143C', '#FFFFFF'],
    palette: createThemedPalette({
      background: { primary: '#0C0C0C', secondary: '#171717', card: '#221818' },
      border: { default: '#3A2A2A', subtle: '#241818' },
      accent: { default: '#DC143C' },
      interactive: { primary: '#8B1A2E', primaryLight: '#A83244' },
      navigation: { tabBar: '#080808', tabActive: '#FFFFFF', tabInactive: '#8E8E93' },
      text: { label: '#F0A0A8' },
    }),
  },
  {
    id: 'royal_blue',
    label: 'Royal Blue',
    description: 'Blue, navy, and white',
    swatches: ['#08101E', '#2563EB', '#FFFFFF'],
    palette: createThemedPalette({
      background: { primary: '#08101E', secondary: '#101B30', card: '#152238' },
      border: { default: '#2A3A55', subtle: '#1A2840' },
      accent: { default: '#2563EB' },
      interactive: { primary: '#1E40AF', primaryLight: '#3B82F6' },
      navigation: { tabBar: '#060C16', tabActive: '#FFFFFF', tabInactive: '#8E8E93' },
      text: { label: '#93C5FD' },
    }),
  },
  {
    id: 'purple_black',
    label: 'Purple & Black',
    description: 'Purple, black, and white',
    swatches: ['#0C0812', '#9333EA', '#FFFFFF'],
    palette: createThemedPalette({
      background: { primary: '#0C0812', secondary: '#16101F', card: '#20162C' },
      border: { default: '#3A2A4A', subtle: '#241A30' },
      accent: { default: '#9333EA' },
      interactive: { primary: '#6B21A8', primaryLight: '#A855F7' },
      navigation: { tabBar: '#08060E', tabActive: '#FFFFFF', tabInactive: '#8E8E93' },
      text: { label: '#C4B5FD' },
    }),
  },
  {
    id: 'field_green',
    label: 'Field Green',
    description: 'Green, dark gray, and white',
    swatches: ['#08100C', '#22C55E', '#FFFFFF'],
    palette: createThemedPalette({
      background: { primary: '#08100C', secondary: '#101A14', card: '#152018' },
      border: { default: '#2A4034', subtle: '#1A2A20' },
      accent: { default: '#22C55E' },
      interactive: { primary: '#166534', primaryLight: '#34D399' },
      navigation: { tabBar: '#060E0A', tabActive: '#FFFFFF', tabInactive: '#8E8E93' },
      text: { label: '#86EFAC' },
    }),
  },
  {
    id: 'orange_silver',
    label: 'Orange & Silver',
    description: 'Orange, silver, and white',
    swatches: ['#121214', '#EA580C', '#C0C0C0'],
    palette: createThemedPalette({
      background: { primary: '#121214', secondary: '#1C1C1F', card: '#252528' },
      border: { default: '#3A3A3F', subtle: '#2A2A2E' },
      accent: { default: '#EA580C' },
      interactive: { primary: '#9A3412', primaryLight: '#F97316' },
      navigation: { tabBar: '#0E0E10', tabActive: '#F8FAFC', tabInactive: '#9CA3AF' },
      text: { label: '#C0C0C0' },
    }),
  },
];

export function getAppThemeDefinition(themeId: AppThemeId): AppThemeDefinition {
  return (
    APP_THEME_DEFINITIONS.find((definition) => definition.id === themeId) ??
    APP_THEME_DEFINITIONS[0]
  );
}

export function normalizeAppThemeId(value: string | null | undefined): AppThemeId {
  if (value && APP_THEME_IDS.includes(value as AppThemeId)) {
    return value as AppThemeId;
  }

  return 'default';
}
