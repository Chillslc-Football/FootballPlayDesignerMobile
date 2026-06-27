import type {
  InviteDisplayStatus,
  TeamInviteRecord,
  TeamManagementMemberRecord,
  TeamManagementRosterRow,
} from '../types/teamRoster';
import type { TeamRole } from '../types/team';

export function getInviteDisplayStatus(invite: TeamInviteRecord): InviteDisplayStatus {
  if (invite.revoked_at) {
    return 'Revoked';
  }

  if (new Date(invite.expires_at) <= new Date()) {
    return 'Expired';
  }

  return 'Pending';
}

function memberSortKey(member: TeamManagementMemberRecord): string {
  const name = member.display_name?.trim();
  if (name) {
    return name.toLowerCase();
  }

  const email = member.email?.trim();
  if (email) {
    return email.toLowerCase();
  }

  return member.user_id;
}

export function buildTeamManagementRosterRows(
  members: TeamManagementMemberRecord[],
  invites: TeamInviteRecord[],
): TeamManagementRosterRow[] {
  const memberRows: TeamManagementRosterRow[] = members
    .slice()
    .sort((left, right) => memberSortKey(left).localeCompare(memberSortKey(right)))
    .map((member) => ({
      id: `member-${member.user_id}`,
      kind: 'member' as const,
      user_id: member.user_id,
      name: member.display_name?.trim() || null,
      email: member.email?.trim() || null,
      phone: member.phone?.trim() || null,
      avatar_url: member.avatar_url?.trim() || null,
      role: member.role,
      status: 'Active' as const,
    }));

  const inviteRows: TeamManagementRosterRow[] = invites
    .filter((invite) => !invite.accepted_at)
    .slice()
    .sort((left, right) => {
      const leftPending = getInviteDisplayStatus(left) === 'Pending';
      const rightPending = getInviteDisplayStatus(right) === 'Pending';
      if (leftPending !== rightPending) {
        return leftPending ? -1 : 1;
      }

      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    })
    .map((invite) => ({
      id: `invite-${invite.id}`,
      kind: 'invite' as const,
      name: null,
      email: invite.email.trim(),
      role: invite.role,
      status: getInviteDisplayStatus(invite),
    }));

  return [...memberRows, ...inviteRows];
}

/** Whether the signed-in user may remove a member from the current team. */
export function canRemoveTeamMember(
  actorRole: TeamRole | null,
  actorUserId: string | null,
  targetUserId: string,
  targetMemberRole: TeamRole,
): boolean {
  if (!actorRole || !actorUserId) {
    return false;
  }

  if (actorRole !== 'team_owner' && actorRole !== 'coach') {
    return false;
  }

  if (targetUserId === actorUserId) {
    return false;
  }

  if (targetMemberRole === 'team_owner') {
    return false;
  }

  if (actorRole === 'coach' && targetMemberRole === 'coach') {
    return false;
  }

  return (
    targetMemberRole === 'coach' ||
    targetMemberRole === 'player' ||
    targetMemberRole === 'parent'
  );
}

export function formatTeamManagementRoleLabel(
  role: TeamManagementRosterRow['role'],
): string {
  switch (role) {
    case 'team_owner':
      return 'Owner';
    case 'coach':
      return 'Coach';
    case 'player':
      return 'Player';
    case 'parent':
      return 'Parent';
    default:
      return role;
  }
}

export function getTeamManagementPrimaryLabel(row: TeamManagementRosterRow): string {
  if (row.kind === 'member') {
    return row.name || row.email || 'Unknown member';
  }

  return row.email || 'Unknown invite';
}

export function getTeamManagementSecondaryEmail(row: TeamManagementRosterRow): string | null {
  if (row.kind !== 'member' || !row.name || !row.email) {
    return null;
  }

  return row.email;
}

export function getTeamManagementRosterCounts(rows: TeamManagementRosterRow[]): {
  active: number;
  pending: number;
} {
  let active = 0;
  let pending = 0;

  for (const row of rows) {
    if (row.kind === 'member') {
      active += 1;
      continue;
    }

    if (row.status === 'Pending') {
      pending += 1;
    }
  }

  return { active, pending };
}

export function formatTeamManagementMemberSummary(
  rows: TeamManagementRosterRow[],
  loading: boolean,
): string {
  if (loading) {
    return 'Loading…';
  }

  const { active, pending } = getTeamManagementRosterCounts(rows);

  if (active === 0 && pending === 0) {
    return 'No members yet';
  }

  if (pending > 0) {
    return `${active} active • ${pending} pending`;
  }

  return `${active} ${active === 1 ? 'member' : 'members'}`;
}
