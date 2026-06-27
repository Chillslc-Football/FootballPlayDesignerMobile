import type { TeamFilmVideoSourceType } from '../types/teamFilm';

const VIDEO_SOURCE_TYPE_LABELS: Record<TeamFilmVideoSourceType, string> = {
  youtube: 'YouTube',
  hudl: 'Hudl',
  google_drive: 'Google Drive',
  dropbox: 'Dropbox',
  upload: 'Upload',
  external: 'External link',
};

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

export function formatTeamFilmVideoSourceType(sourceType: TeamFilmVideoSourceType): string {
  return VIDEO_SOURCE_TYPE_LABELS[sourceType] ?? VIDEO_SOURCE_TYPE_LABELS.external;
}

export function detectVideoSourceType(url: string): TeamFilmVideoSourceType {
  const lower = url.trim().toLowerCase();

  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return 'youtube';
  }

  if (lower.includes('hudl.com')) {
    return 'hudl';
  }

  if (lower.includes('drive.google.com') || lower.includes('docs.google.com')) {
    return 'google_drive';
  }

  if (lower.includes('dropbox.com')) {
    return 'dropbox';
  }

  return 'external';
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

export function getBrowserOpenHint(sourceType: TeamFilmVideoSourceType): string | null {
  switch (sourceType) {
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
