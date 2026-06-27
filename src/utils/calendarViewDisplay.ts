import type { TeamEvent } from '../types/teamEvent';
import { formatLocalDate } from './teamEventDisplay';

export type CalendarMonthCell = {
  date: Date;
  inCurrentMonth: boolean;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function getWeekdayLabels(): readonly string[] {
  return WEEKDAY_LABELS;
}

export function getLocalDateKey(date: Date): string {
  return formatLocalDate(date);
}

export function getEventDateKey(event: TeamEvent): string {
  return getLocalDateKey(new Date(event.starts_at));
}

export function buildEventsByDateKey(events: TeamEvent[]): Map<string, TeamEvent[]> {
  const grouped = new Map<string, TeamEvent[]>();

  for (const event of events) {
    const key = getEventDateKey(event);
    const dayEvents = grouped.get(key) ?? [];
    dayEvents.push(event);
    grouped.set(key, dayEvents);
  }

  for (const dayEvents of grouped.values()) {
    dayEvents.sort(
      (left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
    );
  }

  return grouped;
}

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return startOfDay(next);
}

export function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  return startOfDay(next);
}

export function isSameLocalDay(left: Date, right: Date): boolean {
  return getLocalDateKey(left) === getLocalDateKey(right);
}

export function isToday(date: Date, now = new Date()): boolean {
  return isSameLocalDay(date, now);
}

export function getMonthGridCells(year: number, month: number): CalendarMonthCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = addDays(firstOfMonth, -startOffset);
  const cells: CalendarMonthCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(gridStart, index);
    cells.push({
      date,
      inCurrentMonth: date.getMonth() === month,
    });
  }

  return cells;
}

export function getWeekDates(anchor: Date): Date[] {
  const start = addDays(anchor, -anchor.getDay());
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);
}

export function formatWeekRangeLabel(dates: Date[]): string {
  const [first, last] = [dates[0], dates[dates.length - 1]];

  if (!first || !last) {
    return '';
  }

  const sameMonth = first.getMonth() === last.getMonth();
  const sameYear = first.getFullYear() === last.getFullYear();

  if (sameMonth && sameYear) {
    const month = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(first);
    return `${month} ${first.getDate()} – ${last.getDate()}, ${first.getFullYear()}`;
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return `${formatter.format(first)} – ${formatter.format(last)}, ${last.getFullYear()}`;
}

export function formatDayHeading(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatSelectedDayLabel(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function getEventsForDate(eventsByDate: Map<string, TeamEvent[]>, date: Date): TeamEvent[] {
  return eventsByDate.get(getLocalDateKey(date)) ?? [];
}

export function hasEventsOnDate(eventsByDate: Map<string, TeamEvent[]>, date: Date): boolean {
  return getEventsForDate(eventsByDate, date).length > 0;
}

export const MONTH_CELL_MAX_VISIBLE_EVENTS = 2;

export type MonthCellEventPreview = {
  visible: TeamEvent[];
  remainingCount: number;
};

export function getMonthCellEventPreview(events: TeamEvent[]): MonthCellEventPreview {
  const visible = events.slice(0, MONTH_CELL_MAX_VISIBLE_EVENTS);
  const remainingCount = Math.max(0, events.length - MONTH_CELL_MAX_VISIBLE_EVENTS);

  return { visible, remainingCount };
}
