import { deleteFilmFile } from './filmStorageRepository';
import { supabase } from './supabase';
import type { TeamFilm, TeamFilmDraft, TeamFilmVideoSourceType } from '../types/teamFilm';
import { detectVideoSourceType } from '../utils/teamFilmDisplay';

type TeamFilmRow = {
  id: string;
  team_id: string;
  title: string;
  notes: string | null;
  video_source_type: string;
  video_source: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  'id, team_id, title, notes, video_source_type, video_source, created_by, created_at, updated_at';

const PERMISSION_ERROR_MESSAGE = 'You do not have permission to manage team film.';

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

function normalizeOptionalText(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function rowToFilm(row: TeamFilmRow): TeamFilm {
  return {
    id: row.id,
    team_id: row.team_id,
    title: row.title,
    notes: row.notes,
    video_source_type: row.video_source_type as TeamFilmVideoSourceType,
    video_source: row.video_source,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function inferVideoSourceType(videoSource: string): TeamFilmVideoSourceType {
  const trimmed = videoSource.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return detectVideoSourceType(trimmed);
  }

  return 'upload';
}

function draftToPayload(draft: TeamFilmDraft) {
  const trimmedSource = draft.video_source.trim();

  return {
    title: draft.title.trim(),
    notes: normalizeOptionalText(draft.notes),
    video_source: trimmedSource,
    video_source_type: inferVideoSourceType(trimmedSource),
  };
}

export async function fetchTeamFilmsByTeam(teamId: string): Promise<TeamFilm[]> {
  const { data, error } = await supabase
    .from('team_films')
    .select(COLUMNS)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TeamFilmRow[]).map(rowToFilm);
}

export async function createTeamFilm(
  teamId: string,
  createdBy: string,
  draft: TeamFilmDraft,
): Promise<TeamFilm> {
  const { data, error } = await supabase
    .from('team_films')
    .insert({
      team_id: teamId,
      created_by: createdBy,
      ...draftToPayload(draft),
    })
    .select(COLUMNS)
    .single();

  if (error) {
    throwRepositoryError(error);
  }

  return rowToFilm(data as TeamFilmRow);
}

export async function updateTeamFilm(teamId: string, draft: TeamFilmDraft): Promise<TeamFilm> {
  const { data, error } = await supabase
    .from('team_films')
    .update(draftToPayload(draft))
    .eq('id', draft.id)
    .eq('team_id', teamId)
    .select(COLUMNS)
    .single();

  if (error) {
    throwRepositoryError(error);
  }

  return rowToFilm(data as TeamFilmRow);
}

export async function deleteTeamFilm(teamId: string, film: TeamFilm): Promise<void> {
  if (film.video_source_type === 'upload') {
    await deleteFilmFile(film.video_source);
  }

  const { error } = await supabase.from('team_films').delete().eq('team_id', teamId).eq('id', film.id);

  if (error) {
    throwRepositoryError(error);
  }
}
