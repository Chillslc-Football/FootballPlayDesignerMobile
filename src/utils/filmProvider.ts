import type { TeamFilmVideoSourceType } from '../types/teamFilm';

export type FilmProvider = TeamFilmVideoSourceType;

const PROVIDER_LABELS: Record<FilmProvider, string> = {
  youtube: 'YouTube',
  hudl: 'Hudl',
  google_drive: 'Google Drive',
  dropbox: 'Dropbox',
  upload: 'Upload',
  external: 'External Link',
};

const PROVIDER_ICONS: Record<FilmProvider, string> = {
  youtube: '▶',
  hudl: '🏈',
  google_drive: '📁',
  dropbox: '📦',
  upload: '📤',
  external: '🔗',
};

export function getFilmProvider(url: string): FilmProvider {
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

export function resolveFilmProvider(
  videoSource: string,
  storedType?: TeamFilmVideoSourceType,
): FilmProvider {
  const fromUrl = getFilmProvider(videoSource);

  if (fromUrl !== 'external') {
    return fromUrl;
  }

  if (storedType === 'upload') {
    return 'upload';
  }

  if (storedType && storedType !== 'external') {
    return storedType;
  }

  return 'external';
}

export function getFilmProviderLabel(provider: FilmProvider): string {
  return PROVIDER_LABELS[provider] ?? PROVIDER_LABELS.external;
}

export function getFilmProviderIcon(provider: FilmProvider): string {
  return PROVIDER_ICONS[provider] ?? PROVIDER_ICONS.external;
}

export function formatFilmProviderBadge(provider: FilmProvider): string {
  return `${getFilmProviderIcon(provider)} ${getFilmProviderLabel(provider)}`;
}
