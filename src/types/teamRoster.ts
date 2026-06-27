import type { TeamRole } from './team';

export type InviteRole = 'coach' | 'player' | 'parent';

export type TeamInviteRecord = {
  id: string;
  team_id: string;
  role: InviteRole;
  email: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

export type InviteDisplayStatus = 'Pending' | 'Expired' | 'Revoked';

export type TeamManagementMemberRecord = {
  user_id: string;
  role: TeamRole;
  display_name: string | null;
  email: string | null;
};

export type TeamManagementRosterStatus = 'Active' | InviteDisplayStatus;

type TeamManagementRosterRowBase = {
  id: string;
  name: string | null;
  email: string | null;
};

export type TeamManagementMemberRosterRow = TeamManagementRosterRowBase & {
  kind: 'member';
  user_id: string;
  role: TeamRole;
  status: 'Active';
};

export type TeamManagementInviteRosterRow = TeamManagementRosterRowBase & {
  kind: 'invite';
  role: InviteRole;
  status: InviteDisplayStatus;
};

export type TeamManagementRosterRow =
  | TeamManagementMemberRosterRow
  | TeamManagementInviteRosterRow;
