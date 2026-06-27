import type {
  TeamInviteRecord,
  TeamManagementMemberRecord,
  TeamManagementRosterRow,
} from '../types/teamRoster';
import type { TeamRole } from '../types/team';
import { buildTeamManagementRosterRows } from '../utils/teamManagementRoster';
import { fetchProfileMembersByUserIds } from './profileRepository';
import { supabase } from './supabase';

type TeamMemberRow = {
  user_id: string;
  role: TeamRole;
};

async function fetchTeamManagementMembers(
  teamId: string,
): Promise<TeamManagementMemberRecord[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('user_id, role')
    .eq('team_id', teamId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as TeamMemberRow[];
  const profileByUserId = await fetchProfileMembersByUserIds(rows.map((row) => row.user_id));

  return rows.map((row) => {
    const profile = profileByUserId.get(row.user_id);

    return {
      user_id: row.user_id,
      role: row.role,
      display_name: profile?.display_name ?? null,
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      avatar_url: profile?.avatar_url ?? null,
    };
  });
}

async function fetchTeamManagementInvites(teamId: string): Promise<TeamInviteRecord[]> {
  const { data, error } = await supabase.rpc('get_team_invite_roster', {
    p_team_id: teamId,
  });

  if (error) {
    return [];
  }

  return (data ?? []) as TeamInviteRecord[];
}

export async function fetchTeamManagementRoster(
  teamId: string,
): Promise<TeamManagementRosterRow[]> {
  const [members, invites] = await Promise.all([
    fetchTeamManagementMembers(teamId),
    fetchTeamManagementInvites(teamId),
  ]);

  return buildTeamManagementRosterRows(members, invites);
}
