import { supabase } from './supabase';
import type { ProfileNameFields } from '../types/profile';
import {
  buildTeamMemberPlayerInfoDbPayload,
  type TeamMemberPlayerInfoUpdate,
} from '../types/playerPosition';
import type { Team, TeamMembership, TeamRole, TeamRosterMember } from '../types/team';
import { resolveProfileDisplayName } from '../utils/profileDisplay';
import { mapRosterMemberPlayerInfo } from '../utils/rosterDisplay';

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

type TeamRosterMemberRow = {
  user_id: string;
  role: TeamRole;
  jersey_number: number | null;
  primary_position: string | null;
  secondary_position: string | null;
};

type ProfileRow = ProfileNameFields & { id: string };

async function fetchProfileNamesByUserIds(
  userIds: string[],
): Promise<Map<string, string | null>> {
  const nameByUserId = new Map<string, string | null>();

  if (userIds.length === 0) {
    return nameByUserId;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .in('id', userIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of (data ?? []) as ProfileRow[]) {
    nameByUserId.set(row.id, resolveProfileDisplayName(row));
  }

  return nameByUserId;
}

export async function fetchTeamRoster(teamId: string): Promise<TeamRosterMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('user_id, role, jersey_number, primary_position, secondary_position')
    .eq('team_id', teamId);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as TeamRosterMemberRow[];
  const nameByUserId = await fetchProfileNamesByUserIds(rows.map((row) => row.user_id));

  const roster: TeamRosterMember[] = rows.map((row) => ({
    user_id: row.user_id,
    role: row.role,
    display_name: nameByUserId.get(row.user_id) ?? null,
    ...mapRosterMemberPlayerInfo(row),
  }));

  roster.sort((left, right) => {
    const leftLabel = left.display_name ?? '';
    const rightLabel = right.display_name ?? '';
    return leftLabel.localeCompare(rightLabel, undefined, { sensitivity: 'base' });
  });

  return roster;
}

export async function updateTeamMemberPlayerInfo(
  teamId: string,
  userId: string,
  update: TeamMemberPlayerInfoUpdate,
): Promise<void> {
  const dbPayload = buildTeamMemberPlayerInfoDbPayload(update);

  const { data, error } = await supabase
    .from('team_members')
    .update(dbPayload)
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('role', 'player')
    .select('user_id, jersey_number, primary_position, secondary_position')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Player record was not updated.');
  }
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
