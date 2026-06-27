import { listDmEligibleMembers } from './teamMessageRepository';
import { supabase } from './supabase';
import type { ProfileNameFields } from '../types/profile';
import type { Team, TeamMembership, TeamRole, TeamRosterMember } from '../types/team';
import { resolveProfileDisplayName } from '../utils/profileDisplay';

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

type TeamRosterJoinRow = {
  user_id: string;
  role: TeamRole;
  profiles: (ProfileNameFields & { id: string }) | (ProfileNameFields & { id: string })[] | null;
};

function normalizeProfile(
  value: TeamRosterJoinRow['profiles'],
): (ProfileNameFields & { id: string }) | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function fetchTeamRoster(teamId: string): Promise<TeamRosterMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('user_id, role, profiles(display_name, email)')
    .eq('team_id', teamId);

  if (error) {
    const members = await listDmEligibleMembers(teamId);

    return members.map((member) => ({
      user_id: member.user_id,
      role: member.role as TeamRole,
      display_name: member.display_name,
    }));
  }

  const roster: TeamRosterMember[] = [];

  for (const row of (data ?? []) as TeamRosterJoinRow[]) {
    const profile = normalizeProfile(row.profiles);

    roster.push({
      user_id: row.user_id,
      role: row.role,
      display_name: resolveProfileDisplayName(profile),
    });
  }

  roster.sort((left, right) => {
    const leftLabel = left.display_name ?? '';
    const rightLabel = right.display_name ?? '';
    return leftLabel.localeCompare(rightLabel, undefined, { sensitivity: 'base' });
  });

  return roster;
}

export async function fetchProfileDisplayName(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return resolveProfileDisplayName(data);
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
