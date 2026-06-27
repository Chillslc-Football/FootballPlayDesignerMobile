import type { ProfileNameFields } from '../types/profile';
import type {
  TeamInviteRecord,
  TeamManagementMemberRecord,
  TeamManagementRosterRow,
} from '../types/teamRoster';
import type { TeamRole } from '../types/team';
import { buildTeamManagementRosterRows } from '../utils/teamManagementRoster';
import { supabase } from './supabase';

type TeamMemberRow = {
  user_id: string;
  role: TeamRole;
};

type ProfileRow = ProfileNameFields & {
  id: string;
  email: string | null;
};

async function fetchMemberProfilesByUserIds(
  userIds: string[],
): Promise<Map<string, { display_name: string | null; email: string | null }>> {
  const profileByUserId = new Map<string, { display_name: string | null; email: string | null }>();

  if (userIds.length === 0) {
    return profileByUserId;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .in('id', userIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of (data ?? []) as ProfileRow[]) {
    const displayName = typeof row.display_name === 'string' ? row.display_name.trim() : '';
    const email = typeof row.email === 'string' ? row.email.trim() : '';

    profileByUserId.set(row.id, {
      display_name: displayName || null,
      email: email || null,
    });
  }

  return profileByUserId;
}

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
  const profileByUserId = await fetchMemberProfilesByUserIds(rows.map((row) => row.user_id));

  return rows.map((row) => {
    const profile = profileByUserId.get(row.user_id);

    return {
      user_id: row.user_id,
      role: row.role,
      display_name: profile?.display_name ?? null,
      email: profile?.email ?? null,
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
