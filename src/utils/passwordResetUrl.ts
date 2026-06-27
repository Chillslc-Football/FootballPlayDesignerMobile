import { getJoinLinkWebAppOrigin } from './joinLinkUrl';

export function getPasswordResetRedirectUrl(): string | null {
  const origin = getJoinLinkWebAppOrigin();

  if (!origin) {
    return null;
  }

  return `${origin}/login`;
}
