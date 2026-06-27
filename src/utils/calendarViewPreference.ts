import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_CALENDAR_VIEW_MODE,
  normalizeCalendarViewMode,
  type CalendarViewMode,
} from '../types/calendarView';

const STORAGE_KEY = 'calendar.viewMode';

export async function loadCalendarViewMode(): Promise<CalendarViewMode> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const mode = normalizeCalendarViewMode(stored);

    if (stored && stored !== mode) {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    }

    return mode;
  } catch {
    // Fall through to default.
  }

  return DEFAULT_CALENDAR_VIEW_MODE;
}

export async function saveCalendarViewMode(mode: CalendarViewMode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Preference persistence is best-effort.
  }
}
