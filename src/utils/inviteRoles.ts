import type { InviteRole } from '../types/teamRoster';
import type { TeamRole } from '../types/team';

export const INVITE_ROLE_LABELS: Record<InviteRole, string> = {
  coach: 'Coach',
  player: 'Player',
  parent: 'Parent',
};

export function getInviteRolesForMemberRole(role: TeamRole | null): InviteRole[] {
  if (role === 'team_owner') {
    return ['coach', 'player', 'parent'];
  }

  if (role === 'coach') {
    return ['player', 'parent'];
  }

  return [];
}

export function formatInviteRoleLabel(role: InviteRole): string {
  return INVITE_ROLE_LABELS[role];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInviteEmail(email: string): string | null {
  const trimmed = email.trim();

  if (!trimmed) {
    return 'Email is required.';
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Enter a valid email address.';
  }

  return null;
}

export function validateInviteRole(
  role: InviteRole | null,
  allowedRoles: InviteRole[],
): string | null {
  if (!role) {
    return 'Choose a role for this invite.';
  }

  if (!allowedRoles.includes(role)) {
    return 'You do not have permission to invite this role.';
  }

  return null;
}
