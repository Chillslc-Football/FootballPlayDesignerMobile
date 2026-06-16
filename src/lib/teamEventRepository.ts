import { supabase } from './supabase';
import type { TeamEvent, TeamEventDraft } from '../types/teamEvent';

type TeamEventRow = {
  id: string;
  team_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  'id, team_id, title, starts_at, ends_at, location, description, created_by, created_at, updated_at';

const PERMISSION_ERROR_MESSAGE = 'You do not have permission to manage team events.';

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

function rowToEvent(row: TeamEventRow): TeamEvent {
  return {
    id: row.id,
    team_id: row.team_id,
    title: row.title,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    location: row.location,
    description: row.description,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeOptionalText(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function draftToInsertPayload(draft: TeamEventDraft, teamId: string) {
  return {
    id: draft.id,
    team_id: teamId,
    title: draft.title.trim(),
    starts_at: draft.starts_at,
    ends_at: draft.ends_at,
    location: normalizeOptionalText(draft.location),
    description: normalizeOptionalText(draft.description),
  };
}

function draftToUpdatePayload(draft: TeamEventDraft) {
  return {
    title: draft.title.trim(),
    starts_at: draft.starts_at,
    ends_at: draft.ends_at,
    location: normalizeOptionalText(draft.location),
    description: normalizeOptionalText(draft.description),
    updated_at: new Date().toISOString(),
  };
}

export async function fetchTeamEventsByTeam(teamId: string): Promise<TeamEvent[]> {
  const { data, error } = await supabase
    .from('team_events')
    .select(COLUMNS)
    .eq('team_id', teamId)
    .order('starts_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TeamEventRow[]).map(rowToEvent);
}

export async function createTeamEvent(teamId: string, draft: TeamEventDraft): Promise<TeamEvent> {
  const trimmedTitle = draft.title.trim();

  if (trimmedTitle.length === 0) {
    throw new Error('Title is required.');
  }

  const startsAt = new Date(draft.starts_at).getTime();
  const endsAt = new Date(draft.ends_at).getTime();

  if (Number.isNaN(startsAt) || Number.isNaN(endsAt)) {
    throw new Error('Enter valid start and end date/times.');
  }

  if (endsAt <= startsAt) {
    throw new Error('End time must be after start time.');
  }

  const { data, error } = await supabase
    .from('team_events')
    .insert(draftToInsertPayload(draft, teamId))
    .select(COLUMNS)
    .single();

  if (error) {
    throwRepositoryError(error);
  }

  return rowToEvent(data as TeamEventRow);
}

export async function updateTeamEvent(teamId: string, draft: TeamEventDraft): Promise<TeamEvent> {
  const trimmedTitle = draft.title.trim();

  if (trimmedTitle.length === 0) {
    throw new Error('Title is required.');
  }

  const startsAt = new Date(draft.starts_at).getTime();
  const endsAt = new Date(draft.ends_at).getTime();

  if (Number.isNaN(startsAt) || Number.isNaN(endsAt)) {
    throw new Error('Enter valid start and end date/times.');
  }

  if (endsAt <= startsAt) {
    throw new Error('End time must be after start time.');
  }

  const { data, error } = await supabase
    .from('team_events')
    .update(draftToUpdatePayload(draft))
    .eq('id', draft.id)
    .eq('team_id', teamId)
    .select(COLUMNS)
    .single();

  if (error) {
    throwRepositoryError(error);
  }

  return rowToEvent(data as TeamEventRow);
}

export async function deleteTeamEvent(teamId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from('team_events')
    .delete()
    .eq('team_id', teamId)
    .eq('id', eventId);

  if (error) {
    throwRepositoryError(error);
  }
}
