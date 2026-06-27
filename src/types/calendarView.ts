export const CALENDAR_VIEW_MODES = ['month', 'schedule', 'list'] as const;

export type CalendarViewMode = (typeof CALENDAR_VIEW_MODES)[number];

export const DEFAULT_CALENDAR_VIEW_MODE: CalendarViewMode = 'month';

export const CALENDAR_VIEW_MODE_LABELS: Record<CalendarViewMode, string> = {
  month: 'Month',
  schedule: 'Schedule',
  list: 'List',
};

/** Legacy persisted values mapped to Schedule. */
export const LEGACY_CALENDAR_VIEW_MODES = ['week', 'day'] as const;

export type LegacyCalendarViewMode = (typeof LEGACY_CALENDAR_VIEW_MODES)[number];

export function normalizeCalendarViewMode(stored: string | null): CalendarViewMode {
  if (stored === 'week' || stored === 'day') {
    return 'schedule';
  }

  if (CALENDAR_VIEW_MODES.includes(stored as CalendarViewMode)) {
    return stored as CalendarViewMode;
  }

  return DEFAULT_CALENDAR_VIEW_MODE;
}
