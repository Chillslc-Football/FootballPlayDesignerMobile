import { supabase } from './supabase';
import type { ProfileNameFields } from '../types/profile';
import {
  buildTeamMemberPlayerInfoDbPayload,
  type TeamMemberPlayerInfoUpdate,
} from '../types/playerPosition';
import type { Team, TeamMembership, TeamRole, TeamRosterMember } from '../types/team';
import {
  DEFAULT_TEAM_FORMAT,
  isTeamFormat,
  normalizeTeamFormat,
  type TeamFormat,
} from '../types/teamFormat';
import { resolveProfileDisplayName } from '../utils/profileDisplay';
import { mapRosterMemberPlayerInfo } from '../utils/rosterDisplay';

type TeamMemberMembershipRow = {
  team_id: string;
  role: TeamRole;
};

type TeamRow = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  team_format?: string | null;
};

function isMissingTeamFormatColumn(error: {
  message: string;
  code?: string;
}): boolean {
  return (
    error.message.includes('team_format') ||
    error.code === '42703' ||
    error.code === 'PGRST204'
  );
}

function mapTeamRow(row: TeamRow): Team {
  const rawFormat = row.team_format ?? null;

  return {
    id: row.id,
    name: row.name,
    created_by: row.created_by,
    created_at: row.created_at,
    team_format: isTeamFormat(rawFormat) ? rawFormat : null,
  };
}

export async function fetchTeamById(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, created_by, created_at, team_format')
    .eq('id', teamId)
    .maybeSingle();

  if (error) {
    if (isMissingTeamFormatColumn(error)) {
      const fallback = await supabase
        .from('teams')
        .select('id, name, created_by, created_at')
        .eq('id', teamId)
        .maybeSingle();

      if (fallback.error) {
        throw new Error(fallback.error.message);
      }

      if (!fallback.data) {
        return null;
      }

      return {
        ...(fallback.data as Omit<TeamRow, 'team_format'>),
        team_format: DEFAULT_TEAM_FORMAT,
      };
    }

    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as TeamRow;

  return {
    ...mapTeamRow(row),
    team_format: isTeamFormat(row.team_format) ? row.team_format ?? null : DEFAULT_TEAM_FORMAT,
  };
}

async function fetchTeamsByIds(teamIds: string[]): Promise<Map<string, Team>> {
  const teamById = new Map<string, Team>();

  if (teamIds.length === 0) {
    return teamById;
  }

  const { data, error } = await supabase
    .from('teams')
    .select('id, name, created_by, created_at, team_format')
    .in('id', teamIds);

  if (error) {
    if (isMissingTeamFormatColumn(error)) {
      const fallback = await supabase
        .from('teams')
        .select('id, name, created_by, created_at')
        .in('id', teamIds);

      if (fallback.error) {
        throw new Error(fallback.error.message);
      }

      for (const row of (fallback.data ?? []) as TeamRow[]) {
        teamById.set(row.id, {
          ...mapTeamRow(row),
          team_format: DEFAULT_TEAM_FORMAT,
        });
      }

      return teamById;
    }

    throw new Error(error.message);
  }

  for (const row of (data ?? []) as TeamRow[]) {
    teamById.set(row.id, mapTeamRow(row));
  }

  return teamById;
}

export async function fetchUserTeamMemberships(userId: string): Promise<{
  memberships: TeamMembership[];
  lastTeamId: string | null;
}> {
  const [membershipResult, profileResult] = await Promise.all([
    supabase.from('team_members').select('team_id, role').eq('user_id', userId),
    supabase.from('profiles').select('last_team_id').eq('id', userId).maybeSingle(),
  ]);

  if (membershipResult.error) {
    throw new Error(membershipResult.error.message);
  }

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  const rows = (membershipResult.data ?? []) as TeamMemberMembershipRow[];
  const teamById = await fetchTeamsByIds([...new Set(rows.map((row) => row.team_id))]);
  const memberships: TeamMembership[] = [];

  for (const row of rows) {
    const team = teamById.get(row.team_id);

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

function formatSupabaseError(
  context: string,
  error: { message: string; code?: string; details?: string; hint?: string },
): string {
  const parts = [context, error.message];

  if (error.code) {
    parts.push(`code=${error.code}`);
  }

  if (error.details) {
    parts.push(`details=${error.details}`);
  }

  if (error.hint) {
    parts.push(`hint=${error.hint}`);
  }

  return parts.join(' | ');
}

function parseTeamId(data: unknown): string {
  if (typeof data === 'string' && data.trim().length > 0) {
    return data.trim();
  }

  throw new Error('create_team did not return a team id');
}

function stringifyDebugValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export type CreateTeamDebugResult = {
  verified: boolean;
  parsedTeamId: string | null;
  debugText: string;
};

export async function debugCreateTeamAttempt(
  name: string,
  format: TeamFormat,
): Promise<CreateTeamDebugResult> {
  const lines: string[] = ['Create started'];

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const authUserId = authData.user?.id ?? null;

  lines.push(`auth user id: ${authUserId ?? '(none)'}`);

  if (authError) {
    lines.push(`auth error: ${formatSupabaseError('auth.getUser', authError)}`);
  }

  const payload = {
    p_name: name.trim(),
    p_team_format: normalizeTeamFormat(format),
  };

  lines.push(`RPC payload: ${stringifyDebugValue(payload)}`);

  if (!authUserId) {
    lines.push('No authenticated Supabase user found');
    return {
      verified: false,
      parsedTeamId: null,
      debugText: lines.join('\n\n'),
    };
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc('create_team', payload);

  lines.push(`RPC data: ${stringifyDebugValue(rpcData)}`);
  lines.push(`RPC error: ${rpcError ? formatSupabaseError('create_team RPC', rpcError) : '(none)'}`);

  if (rpcData == null && !rpcError) {
    lines.push('RPC returned no data and no error');
  }

  let parsedTeamId: string | null = null;

  if (!rpcError && rpcData != null) {
    try {
      parsedTeamId = parseTeamId(rpcData);
    } catch (parseError) {
      lines.push(
        `RPC data is not a valid team id: ${
          parseError instanceof Error ? parseError.message : 'invalid response'
        }`,
      );
    }
  }

  let teamVerification = '(skipped — no parsed team id)';
  let memberVerification = '(skipped — no parsed team id)';
  let teamExists = false;
  let ownerVerified = false;

  if (parsedTeamId) {
    const teamResult = await supabase
      .from('teams')
      .select('id, name, created_by, team_format, created_at')
      .eq('id', parsedTeamId)
      .maybeSingle();

    if (teamResult.error) {
      teamVerification = formatSupabaseError(
        `public.teams SELECT (id=${parsedTeamId})`,
        teamResult.error,
      );
    } else if (teamResult.data) {
      teamVerification = stringifyDebugValue(teamResult.data);
      teamExists = true;
    } else {
      teamVerification = 'null (no row in public.teams)';
    }

    const memberResult = await supabase
      .from('team_members')
      .select('team_id, user_id, role')
      .eq('team_id', parsedTeamId)
      .eq('user_id', authUserId)
      .maybeSingle();

    if (memberResult.error) {
      memberVerification = formatSupabaseError(
        `public.team_members SELECT (team_id=${parsedTeamId}, user_id=${authUserId})`,
        memberResult.error,
      );
    } else if (memberResult.data) {
      memberVerification = stringifyDebugValue(memberResult.data);
      ownerVerified =
        memberResult.data.role === 'team_owner' && memberResult.data.user_id === authUserId;
    } else {
      memberVerification = 'null (no row in public.team_members)';
    }

    if (rpcData != null && (!teamExists || !ownerVerified)) {
      lines.push('RPC returned a team id, but verification failed');
    } else if (teamExists && ownerVerified) {
      lines.push('Verification passed: team row exists and current user is team_owner.');
    }
  }

  lines.push(`public.teams verification: ${teamVerification}`);
  lines.push(`public.team_members verification: ${memberVerification}`);

  return {
    verified: parsedTeamId != null && teamExists && ownerVerified,
    parsedTeamId,
    debugText: lines.join('\n\n'),
  };
}

export async function createTeam(
  userId: string,
  name: string,
  format: TeamFormat,
): Promise<TeamMembership> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Not signed in. Sign in again and retry.');
  }

  const payload = {
    p_name: name.trim(),
    p_team_format: normalizeTeamFormat(format),
  };

  const { data, error } = await supabase.rpc('create_team', payload);

  if (error) {
    throw new Error(formatSupabaseError('create_team RPC failed', error));
  }

  if (data === null || data === undefined) {
    throw new Error(
      `create_team RPC returned no team id. rpcData=${JSON.stringify(data)}`,
    );
  }

  const teamId = parseTeamId(data);

  const { data: teamRow, error: teamSelectError } = await supabase
    .from('teams')
    .select('id, name')
    .eq('id', teamId)
    .maybeSingle();

  if (teamSelectError) {
    throw new Error(
      formatSupabaseError(
        `public.teams SELECT after create_team (id=${teamId}, rpcData=${JSON.stringify(data)})`,
        teamSelectError,
      ),
    );
  }

  if (!teamRow) {
    throw new Error(
      `create_team RPC returned id "${teamId}" but public.teams has no matching row. rpcData=${JSON.stringify(data)}`,
    );
  }

  return loadActiveTeamAfterCreate(userId, teamId);
}

export async function loadActiveTeamAfterCreate(
  userId: string,
  teamId: string,
): Promise<TeamMembership> {
  const team = await fetchTeamById(teamId);

  if (!team) {
    throw new Error(
      `public.teams row missing for id "${teamId}" during post-create verification.`,
    );
  }

  const { data: membership, error: membershipError } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) {
    throw new Error(
      formatSupabaseError(
        `public.team_members SELECT after create (team_id=${teamId}, user_id=${userId})`,
        membershipError,
      ),
    );
  }

  if (!membership) {
    throw new Error(
      `public.team_members has no owner row for team_id="${teamId}" and user_id="${userId}".`,
    );
  }

  if (membership.role !== 'team_owner') {
    throw new Error(
      `public.team_members role is "${membership.role}"; expected "team_owner" for team_id="${teamId}".`,
    );
  }

  await updateLastTeamId(userId, teamId);

  return { role: membership.role, team };
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

export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  const { error } = await supabase.rpc('remove_team_member', {
    p_team_id: teamId,
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteTeam(
  teamId: string,
  _context?: { role?: string | null },
): Promise<void> {
  const { error } = await supabase.rpc('delete_team', { p_team_id: teamId });

  if (error) {
    const details = [
      error.message,
      error.code ? `code=${error.code}` : null,
      error.hint ? `hint=${error.hint}` : null,
    ]
      .filter(Boolean)
      .join(' — ');

    throw new Error(details);
  }

  const remainingTeam = await fetchTeamById(teamId);

  if (remainingTeam) {
    throw new Error(
      'Team was not deleted from the database. Contact support if this continues.',
    );
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
