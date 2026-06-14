import { supabase } from './supabase';
import type { Team, TeamMembership, TeamRole } from '../types/team';

type TeamMemberJoinRow = {
  role: TeamRole;
  teams: Team | Team[] | null;
};

function normalizeTeam(value: Team | Team[] | null): Team | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function fetchUserTeamMemberships(userId: string): Promise<{
  memberships: TeamMembership[];
  lastTeamId: string | null;
}> {
  const [membershipResult, profileResult] = await Promise.all([
    supabase
      .from('team_members')
      .select('role, teams(id, name, created_by, created_at)')
      .eq('user_id', userId),
    supabase.from('profiles').select('last_team_id').eq('id', userId).maybeSingle(),
  ]);

  if (membershipResult.error) {
    throw new Error(membershipResult.error.message);
  }

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  const memberships: TeamMembership[] = [];

  for (const row of (membershipResult.data ?? []) as TeamMemberJoinRow[]) {
    const team = normalizeTeam(row.teams);

    if (!team) {
      continue;
    }

    memberships.push({
      role: row.role,
      team,
    });
  }

  memberships.sort((left, right) => left.team.name.localeCompare(right.team.name));

  return {
    memberships,
    lastTeamId: profileResult.data?.last_team_id ?? null,
  };
}

export async function updateLastTeamId(userId: string, teamId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ last_team_id: teamId })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}
