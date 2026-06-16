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
  const endsAt = combineLocalDateAndTime(input.date, input.endTime);

  if (!startsAt || !endsAt) {
    return 'Enter valid date and times.';
  }

  const startMs = new Date(startsAt).getTime();
  const endMs = new Date(endsAt).getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return 'Enter valid date and times.';
  }

  if (endMs <= startMs) {
    return 'End time must be after start time.';
  }

  return null;
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
  const endsAt = combineLocalDateAndTime(form.date, form.endTime);

  return {
    id: eventId,
    title: form.title.trim(),
    starts_at: startsAt,
    ends_at: endsAt,
    location: form.location.trim().length > 0 ? form.location.trim() : null,
    description: form.description.trim().length > 0 ? form.description.trim() : null,
  };
}
