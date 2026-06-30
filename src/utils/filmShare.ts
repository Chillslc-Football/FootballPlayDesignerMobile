import { buildPublicFilmShareUrl } from './filmLinkUrl';
import type { TeamFilm } from '../types/teamFilm';
import { enablePublicFilmShare } from '../lib/filmRepository';

const PUBLIC_SHARE_DISABLED_MESSAGE =
  'This film is not shared publicly yet. Ask a coach to share it.';

export function getPublicFilmShareClipboardText(publicUrl: string): string {
  return publicUrl.trim();
}

export function buildFilmSharePayload(publicUrl: string): {
  title: string;
  message: string;
} {
  const url = getPublicFilmShareClipboardText(publicUrl);

  return {
    title: 'Team film',
    message: `Watch this film: ${url}`,
  };
}

export function getPublicFilmShareUrl(film: Pick<TeamFilm, 'is_public_shared' | 'share_token'>): string | null {
  if (!film.is_public_shared || !film.share_token) {
    return null;
  }

  return buildPublicFilmShareUrl(film.share_token);
}

export async function resolvePublicFilmShareUrl(
  teamId: string,
  film: TeamFilm,
  canManageFilm: boolean,
): Promise<string> {
  const existingUrl = getPublicFilmShareUrl(film);

  if (existingUrl) {
    return existingUrl;
  }

  if (!canManageFilm) {
    throw new Error(PUBLIC_SHARE_DISABLED_MESSAGE);
  }

  const sharedFilm = await enablePublicFilmShare(teamId, film.id);
  const publicUrl = getPublicFilmShareUrl(sharedFilm);

  if (!publicUrl) {
    throw new Error('Could not create a public share link.');
  }

  return publicUrl;
}

export { PUBLIC_SHARE_DISABLED_MESSAGE };
