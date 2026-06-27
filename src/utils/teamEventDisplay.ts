import type { TeamEvent, TeamEventDraft } from '../types/teamEvent';

export function formatTeamEventTimestamp(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatTeamEventDateTimeRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startsAt} – ${endsAt}`;
  }

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
  const timeFormatter = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });

  if (sameDay) {
    return `${dateFormatter.format(start)} · ${timeFormatter.format(start)} – ${timeFormatter.format(end)}`;
  }

  return `${formatTeamEventTimestamp(startsAt)} – ${formatTeamEventTimestamp(endsAt)}`;
}

const listDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const listTimeFormatter = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' });

function areSameLocalDay(start: Date, end: Date): boolean {
  return (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  );
}

/** Primary date line for calendar list cards. */
export function formatTeamEventListDate(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return startsAt;
  }

  if (areSameLocalDay(start, end)) {
    return listDateFormatter.format(start);
  }

  return `${listDateFormatter.format(start)} – ${listDateFormatter.format(end)}`;
}

/** Date line for event detail screen. */
export function formatTeamEventDetailDate(startsAt: string, endsAt: string): string {
  return formatTeamEventListDate(startsAt, endsAt);
}

/** Time line for event detail screen. */
export function formatTeamEventDetailTimeRange(startsAt: string, endsAt: string): string {
  return formatTeamEventListTimeRange(startsAt, endsAt);
}

/** Secondary time line for calendar list cards. */
export function formatTeamEventListTimeRange(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startsAt} – ${endsAt}`;
  }

  if (areSameLocalDay(start, end)) {
    return `${listTimeFormatter.format(start)} – ${listTimeFormatter.format(end)}`;
  }

  return `${formatTeamEventTimestamp(startsAt)} – ${formatTeamEventTimestamp(endsAt)}`;
}

export function previewTeamEventDescription(description: string | null, maxLength = 120): string | null {
  if (!description) {
    return null;
  }

  const trimmed = description.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

export function isPastTeamEvent(event: TeamEvent, now = Date.now()): boolean {
  const endsAt = new Date(event.ends_at).getTime();

  if (Number.isNaN(endsAt)) {
    return false;
  }

  return endsAt < now;
}

export function partitionTeamEventsByUpcomingPast(
  events: TeamEvent[],
  now = Date.now(),
): { upcoming: TeamEvent[]; past: TeamEvent[] } {
  const upcoming: TeamEvent[] = [];
  const past: TeamEvent[] = [];

  for (const event of events) {
    if (isPastTeamEvent(event, now)) {
      past.push(event);
    } else {
      upcoming.push(event);
    }
  }

  past.sort(
    (left, right) => new Date(right.starts_at).getTime() - new Date(left.starts_at).getTime(),
  );

  return { upcoming, past };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatLocalTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function splitIsoToLocalDateAndTime(iso: string): { date: string; time: string } {
  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return { date: '', time: '' };
  }

  return {
    date: formatLocalDate(parsed),
    time: formatLocalTime(parsed),
  };
}

export function combineLocalDateAndTime(date: string, time: string): string {
  const trimmedDate = date.trim();
  const trimmedTime = time.trim();

  if (!trimmedDate || !trimmedTime) {
    return '';
  }

  const parsed = new Date(`${trimmedDate}T${trimmedTime}:00`);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString();
}

export function dateFromLocalDateString(date: string): Date | null {
  const trimmed = date.trim();

  if (!trimmed) {
    return null;
  }

  const parsed = new Date(`${trimmed}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function dateFromLocalDateAndTime(date: string, time: string): Date | null {
  const iso = combineLocalDateAndTime(date, time);

  if (!iso) {
    return null;
  }

  const parsed = new Date(iso);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

/** User-facing date label for event forms (MM/DD/YYYY). */
export function formatFormDateDisplay(date: string): string {
  const parsed = dateFromLocalDateString(date);

  if (!parsed) {
    return '';
  }

  return `${pad(parsed.getMonth() + 1)}/${pad(parsed.getDate())}/${parsed.getFullYear()}`;
}

/** User-facing 12-hour time label for event forms. */
export function formatFormTimeDisplay(time: string): string {
  const trimmed = time.trim();

  if (!trimmed) {
    return '';
  }

  const [hoursValue, minutesValue] = trimmed.split(':');
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return '';
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  return `${hour12}:${pad(minutes)} ${period}`;
}

/** When end time is blank, default to one hour after start for required ends_at. */
export function resolveFormEndTime(date: string, startTime: string, endTime: string): string {
  const trimmedEndTime = endTime.trim();

  if (trimmedEndTime) {
    return trimmedEndTime;
  }

  const startsAt = combineLocalDateAndTime(date, startTime);

  if (!startsAt) {
    return '';
  }

  const fallbackEnd = new Date(startsAt);
  fallbackEnd.setHours(fallbackEnd.getHours() + 1);

  return formatLocalTime(fallbackEnd);
}

export function defaultEventFormValues(): { date: string; startTime: string; endTime: string } {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  const end = new Date(start);
  end.setHours(end.getHours() + 2);

  return {
    date: formatLocalDate(start),
    startTime: formatLocalTime(start),
    endTime: formatLocalTime(end),
  };
}

export function draftToFormValues(draft: TeamEventDraft): {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
} {
  const startParts = splitIsoToLocalDateAndTime(draft.starts_at);
  const endParts = splitIsoToLocalDateAndTime(draft.ends_at);

  return {
    title: draft.title,
    date: startParts.date,
    startTime: startParts.time,
    endTime: endParts.time,
    location: draft.location ?? '',
    description: draft.description ?? '',
  };
}

export function validateTeamEventForm(input: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}): string | null {
  if (!input.title.trim()) {
    return 'Title is required.';
  }

  const startsAt = combineLocalDateAndTime(input.date, input.startTime);
  const resolvedEndTime = resolveFormEndTime(input.date, input.startTime, input.endTime);
  const endsAt = combineLocalDateAndTime(input.date, resolvedEndTime);

  if (!startsAt) {
    return 'Select a valid date and start time.';
  }

  if (!endsAt) {
    return 'Select a valid date and start time.';
  }

  const startMs = new Date(startsAt).getTime();
  const endMs = new Date(endsAt).getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return 'Select a valid date and start time.';
  }

  if (endMs <= startMs) {
    return 'End time must be after start time.';
  }

  return null;
}

export type EventFormFieldErrors = {
  title: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
};

export function getEventFormFieldErrors(input: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
}): EventFormFieldErrors {
  const errors: EventFormFieldErrors = {
    title: null,
    date: null,
    startTime: null,
    endTime: null,
  };

  if (!input.title.trim()) {
    errors.title = 'Event title is required.';
  }

  if (!dateFromLocalDateString(input.date)) {
    errors.date = 'Date is required.';
  }

  if (!combineLocalDateAndTime(input.date, input.startTime)) {
    errors.startTime = 'Start time is required.';
  }

  if (input.endTime.trim()) {
    const formError = validateTeamEventForm(input);
    if (formError === 'End time must be after start time.') {
      errors.endTime = formError;
    }
  }

  return errors;
}

export function areRequiredEventFormFieldsComplete(input: {
  title: string;
  date: string;
  startTime: string;
}): boolean {
  return (
    input.title.trim().length > 0 &&
    dateFromLocalDateString(input.date) !== null &&
    combineLocalDateAndTime(input.date, input.startTime) !== ''
  );
}

export function formValuesToDraft(
  eventId: string,
  form: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
  },
): TeamEventDraft {
  const startsAt = combineLocalDateAndTime(form.date, form.startTime);
  const resolvedEndTime = resolveFormEndTime(form.date, form.startTime, form.endTime);
  const endsAt = combineLocalDateAndTime(form.date, resolvedEndTime);

  return {
    id: eventId,
    title: form.title.trim(),
    starts_at: startsAt,
    ends_at: endsAt,
    location: form.location.trim().length > 0 ? form.location.trim() : null,
    description: form.description.trim().length > 0 ? form.description.trim() : null,
  };
}
