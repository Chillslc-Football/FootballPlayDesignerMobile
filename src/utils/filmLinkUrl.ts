import { getJoinLinkWebAppOrigin, MISSING_WEB_APP_URL_MESSAGE } from './joinLinkUrl';

const PUBLIC_FILM_SHARE_PATH = '/film/share';

const SHARE_TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractShareTokenFromPath(pathname: string): string | null {
  const normalized = pathname.trim().replace(/\/+$/, '');
  const match = normalized.match(/\/film\/share\/([^/]+)$/i);

  if (!match?.[1]) {
    return null;
  }

  const shareToken = decodeURIComponent(match[1]).trim();

  if (!SHARE_TOKEN_PATTERN.test(shareToken)) {
    return null;
  }

  return shareToken;
}

export function parsePublicFilmSharePathname(pathname: string): string | null {
  return extractShareTokenFromPath(pathname);
}

export function getWebPublicFilmShareToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return parsePublicFilmSharePathname(window.location.pathname);
}

export function buildPublicFilmShareUrl(shareToken: string): string {
  const origin = getJoinLinkWebAppOrigin();

  if (!origin) {
    throw new Error(MISSING_WEB_APP_URL_MESSAGE);
  }

  return `${origin}${PUBLIC_FILM_SHARE_PATH}/${encodeURIComponent(shareToken)}`;
}

export function parsePublicFilmShareUrl(url: string): string | null {
  const trimmed = url.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    return extractShareTokenFromPath(parsed.pathname);
  } catch {
    return null;
  }
}

export { MISSING_WEB_APP_URL_MESSAGE as MISSING_FILM_LINK_WEB_APP_URL_MESSAGE };
