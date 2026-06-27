const MISSING_WEB_APP_URL_MESSAGE =
  'EXPO_PUBLIC_WEB_APP_URL is not configured. Add it to your .env file and restart Expo.';

export function getJoinLinkWebAppOrigin(): string | null {
  const configured = process.env.EXPO_PUBLIC_WEB_APP_URL?.trim();

  if (!configured) {
    return null;
  }

  return configured.replace(/\/+$/, '');
}

export function buildJoinTeamUrl(token: string): string {
  const origin = getJoinLinkWebAppOrigin();

  if (!origin) {
    throw new Error(MISSING_WEB_APP_URL_MESSAGE);
  }

  return `${origin}/join-team?token=${encodeURIComponent(token)}`;
}

export function isFullJoinTeamUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export function formatJoinLinkDisplay(url: string): string {
  if (url.length <= 52) {
    return url;
  }

  return `${url.slice(0, 28)}…${url.slice(-20)}`;
}

export { MISSING_WEB_APP_URL_MESSAGE };
