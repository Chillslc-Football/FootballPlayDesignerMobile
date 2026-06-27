import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_NOTIFICATION_CATEGORY_PREFERENCES,
  NOTIFICATION_CATEGORY_KEYS,
  type NotificationCategoryKey,
  type NotificationCategoryPreferences,
} from '../types/notificationPreference';

/** Legacy device-local prefs migrated once into Supabase per team. */
const STORAGE_KEY = 'notifications.categories.preferences';

function normalizeStoredPreferences(
  stored: Partial<Record<string, unknown>> | null,
): NotificationCategoryPreferences {
  const normalized = { ...DEFAULT_NOTIFICATION_CATEGORY_PREFERENCES };

  if (!stored) {
    return normalized;
  }

  for (const key of NOTIFICATION_CATEGORY_KEYS) {
    const value = stored[key];

    if (typeof value === 'boolean') {
      normalized[key] = value;
    }
  }

  return normalized;
}

export async function loadNotificationCategoryPreferences(): Promise<NotificationCategoryPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { ...DEFAULT_NOTIFICATION_CATEGORY_PREFERENCES };
    }

    const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;
    return normalizeStoredPreferences(parsed);
  } catch {
    return { ...DEFAULT_NOTIFICATION_CATEGORY_PREFERENCES };
  }
}

export async function saveNotificationCategoryPreference(
  category: NotificationCategoryKey,
  enabled: boolean,
): Promise<NotificationCategoryPreferences> {
  const current = await loadNotificationCategoryPreferences();
  const next = {
    ...current,
    [category]: enabled,
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Best-effort persistence.
  }

  return next;
}

export async function clearNotificationCategoryPreferences(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort persistence.
  }
}
