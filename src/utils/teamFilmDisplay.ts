import type { TeamFilm, TeamFilmVideoSourceType } from '../types/teamFilm';
import {
  getFilmProviderLabel,
  resolveFilmProvider,
  type FilmProvider,
} from './filmProvider';

export { getFilmProvider as detectVideoSourceType } from './filmProvider';
export {
  formatFilmProviderBadge,
  getFilmProvider,
  getFilmProviderIcon,
  getFilmProviderLabel,
  resolveFilmProvider,
} from './filmProvider';
export type { FilmProvider } from './filmProvider';

export function formatTeamFilmDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatTeamFilmAddedDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleDateString(undefined, {
    dateStyle: 'medium',
  });
}

export function formatTeamFilmRelativeAddedDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfAddedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfAddedDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDiff === 0) {
    return 'Today';
  }

  if (dayDiff === 1) {
    return 'Yesterday';
  }

  if (dayDiff > 1 && dayDiff < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }

  return formatTeamFilmAddedDate(iso);
}

export function previewTeamFilmNotes(notes: string | null, maxLength = 80): string | null {
  if (!notes) {
    return null;
  }

  const trimmed = notes.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

export function formatTeamFilmVideoSourceType(
  sourceType: TeamFilmVideoSourceType,
  videoSource?: string,
): string {
  const provider = videoSource
    ? resolveFilmProvider(videoSource, sourceType)
    : sourceType;

  return getFilmProviderLabel(provider as FilmProvider);
}

export function isValidExternalVideoUrl(url: string): boolean {
  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return /^https?:\/\/.+/i.test(trimmed);
}

export function areRequiredTeamFilmFormFieldsComplete(input: {
  title: string;
  videoSource: string;
}): boolean {
  return input.title.trim().length > 0 && isValidExternalVideoUrl(input.videoSource);
}

export function validateTeamFilmForm(input: {
  title: string;
  videoSource: string;
}): string | null {
  if (input.title.trim().length === 0) {
    return 'Title is required.';
  }

  if (!isValidExternalVideoUrl(input.videoSource)) {
    return 'Enter a valid video link starting with http:// or https://.';
  }

  return null;
}

export function buildFilmSharePayload(film: TeamFilm): {
  title: string;
  message: string;
  url?: string;
} {
  if (film.video_source_type === 'upload') {
    return {
      title: film.title,
      message: `${film.title} — team film in Winner's Choice`,
    };
  }

  return {
    title: film.title,
    message: `${film.title}\n${film.video_source}`,
    url: film.video_source,
  };
}

export function getBrowserOpenHint(provider: FilmProvider): string | null {
  switch (provider) {
    case 'upload':
      return 'Uploaded team film plays inside Winner\'s Choice.';
    case 'youtube':
      return 'YouTube opens in the YouTube app or your browser.';
    case 'hudl':
      return 'Hudl opens in your browser. You may need to sign in to Hudl first.';
    case 'google_drive':
      return 'Google Drive opens in your browser. You may need to sign in to Google first.';
    case 'dropbox':
      return 'Dropbox opens in your browser. You may need to sign in to Dropbox first.';
    case 'external':
      return 'This link opens in your browser.';
    default:
      return 'Video opens in the provider app or browser.';
  }
}
