import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  normalizeAppThemeId,
  type AppThemeId,
} from '../design-system/themes/appThemeDefinitions';

const STORAGE_KEY = 'app.themeId';

export async function loadAppThemeId(): Promise<AppThemeId> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return normalizeAppThemeId(stored);
  } catch {
    return 'default';
  }
}

export async function saveAppThemeId(themeId: AppThemeId): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // Best-effort persistence.
  }
}
