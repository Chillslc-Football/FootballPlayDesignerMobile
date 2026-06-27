import type { InviteRole } from './teamRoster';

export type JoinLinkRole = InviteRole;

export type JoinLinkRecord = {
  role: JoinLinkRole;
  token: string;
  created_at: string;
  last_used_at: string | null;
};

export const JOIN_LINK_ROLE_HINTS: Record<JoinLinkRole, string> = {
  coach: 'For assistant coaches.',
  player: 'For players.',
  parent: 'For parents.',
};
