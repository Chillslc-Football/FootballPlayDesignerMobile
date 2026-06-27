import { supabase } from './supabase';
import type { ProfileNameFields } from '../types/profile';
import type { TeamEventRsvp, TeamEventRsvpStatus } from '../types/teamEventRsvp';
import { resolveProfileDisplayName } from '../utils/profileDisplay';

type TeamEventRsvpRow = {
  id: string;
  event_id: string;
  team_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type ProfileRow = ProfileNameFields & {
  id: string;
};

const COLUMNS = 'id, event_id, team_id, user_id, status, created_at, updated_at';

const PERMISSION_ERROR_MESSAGE = 'You do not have permission to update your RSVP.';

function isPermissionError(error: { code?: string; message?: string }): boolean {
  if (error.code === '42501') {
    return true;
  }

  const message = error.message?.toLowerCase() ?? '';

  return (
    message.includes('permission') ||
    message.includes('row-level security') ||
    message.includes('not authorized')
  );
}

function throwRepositoryError(error: { code?: string; message?: string }): never {
  if (isPermissionError(error)) {
    throw new Error(PERMISSION_ERROR_MESSAGE);
  }

  throw new Error(error.message);
}

function parseStatus(value: string): TeamEventRsvpStatus {
  if (value === 'accepted' || value === 'tentative' || value === 'declined') {
    return value;
  }

  throw new Error('Invalid RSVP status.');
}

async function fetchDisplayNamesByUserIds(
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

function rowToRsvp(row: TeamEventRsvpRow, displayName: string | null): TeamEventRsvp {
  return {
    id: row.id,
    event_id: row.event_id,
    team_id: row.team_id,
    user_id: row.user_id,
    status: parseStatus(row.status),
    created_at: row.created_at,
    updated_at: row.updated_at,
    display_name: displayName,
  };
}

export async function fetchRsvpsForEvent(
  teamId: string,
  eventId: string,
): Promise<TeamEventRsvp[]> {
  const { data, error } = await supabase
    .from('team_event_rsvps')
    .select(COLUMNS)
    .eq('team_id', teamId)
    .eq('event_id', eventId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as TeamEventRsvpRow[];
  const nameByUserId = await fetchDisplayNamesByUserIds(rows.map((row) => row.user_id));

  return rows.map((row) => rowToRsvp(row, nameByUserId.get(row.user_id) ?? null));
}

export async function upsertMyRsvp(
  teamId: string,
  eventId: string,
  status: TeamEventRsvpStatus,
): Promise<TeamEventRsvp> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to RSVP.');
  }

  const { data, error } = await supabase
    .from('team_event_rsvps')
    .upsert(
      {
        event_id: eventId,
        team_id: teamId,
        user_id: user.id,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'event_id,user_id' },
    )
    .select(COLUMNS)
    .single();

  if (error) {
    throwRepositoryError(error);
  }

  const nameByUserId = await fetchDisplayNamesByUserIds([user.id]);

  return rowToRsvp(data as TeamEventRsvpRow, nameByUserId.get(user.id) ?? null);
}
