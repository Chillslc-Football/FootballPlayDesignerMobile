import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { loadAppThemeId, saveAppThemeId } from '../utils/appThemePreference';
import type { LegacyColors, Palette } from './themes/paletteTypes';
import {
  APP_THEME_DEFINITIONS,
  getAppThemeDefinition,
  type AppThemeId,
} from './themes/appThemeDefinitions';
import { buildCardPresets, type CardPresets } from './themes/buildCardPresets';
import { buildLegacyColors } from './themes/buildLegacyColors';
import { defaultPalette } from './themes/defaultPalette';

export type AppThemeContextValue = {
  themeId: AppThemeId;
  palette: Palette;
  colors: LegacyColors;
  cardPresets: CardPresets;
  setThemeId: (themeId: AppThemeId) => Promise<void>;
  themeDefinitions: typeof APP_THEME_DEFINITIONS;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

type AppThemeProviderProps = {
  children: ReactNode;
};

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const [themeId, setThemeIdState] = useState<AppThemeId>('default');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void loadAppThemeId().then((loadedThemeId) => {
      setThemeIdState(loadedThemeId);
      setReady(true);
    });
  }, []);

  const definition = useMemo(() => getAppThemeDefinition(themeId), [themeId]);
  const palette = definition.palette;
  const colors = useMemo(() => buildLegacyColors(palette), [palette]);
  const cardPresets = useMemo(() => buildCardPresets(palette), [palette]);

  const setThemeId = useCallback(async (nextThemeId: AppThemeId) => {
    setThemeIdState(nextThemeId);
    await saveAppThemeId(nextThemeId);
  }, []);

  const value = useMemo(
    (): AppThemeContextValue => ({
      themeId,
      palette,
      colors,
      cardPresets,
      setThemeId,
      themeDefinitions: APP_THEME_DEFINITIONS,
    }),
    [cardPresets, colors, palette, setThemeId, themeId],
  );

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={defaultPalette.accent.default} />
      </View>
    );
  }

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return context;
}

export function useStackScreenOptions() {
  const { colors } = useAppTheme();

  return useMemo(
    () => ({
      headerStyle: {
        backgroundColor: colors.tabBar,
      },
      headerTintColor: colors.accent,
      headerTitleStyle: {
        fontWeight: '600' as const,
      },
      headerShadowVisible: false,
      contentStyle: {
        backgroundColor: colors.background,
      },
    }),
    [colors],
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: defaultPalette.background.primary,
  },
});
