import { supabase } from './supabase';
import { createSafeRealtimeUnsubscribe } from './realtimeChannelCleanup';
import {
  DEFAULT_TEAM_UPDATE_TYPE,
  type CreateTeamUpdateInput,
  type TeamUpdate,
  type TeamUpdateType,
} from '../types/teamUpdate';
import { deriveTeamUpdateTitle } from '../utils/teamUpdateDisplay';

type TeamUpdateRow = {
  id: string;
  team_id: string;
  title: string;
  body: string;
  update_type: string;
  is_pinned: boolean;
  show_on_home: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  'id, team_id, title, body, update_type, is_pinned, show_on_home, created_by, created_at, updated_at';

const PERMISSION_ERROR_MESSAGE = 'You do not have permission to post updates.';

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

function rowToUpdate(row: TeamUpdateRow): TeamUpdate {
  return {
    id: row.id,
    team_id: row.team_id,
    title: row.title,
    body: row.body,
    update_type: (row.update_type as TeamUpdateType) || DEFAULT_TEAM_UPDATE_TYPE,
    is_pinned: row.is_pinned,
    show_on_home: row.show_on_home,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}


export async function fetchTeamUpdatesByTeam(teamId: string): Promise<TeamUpdate[]> {
  const { data, error } = await supabase
    .from('team_updates')
    .select(COLUMNS)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TeamUpdateRow[]).map(rowToUpdate);
}

export async function fetchLatestTeamUpdate(teamId: string): Promise<TeamUpdate | null> {
  const { data, error } = await supabase
    .from('team_updates')
    .select(COLUMNS)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return rowToUpdate(data as TeamUpdateRow);
}

/** @deprecated Use fetchLatestTeamUpdate */
export const fetchFeaturedTeamUpdate = fetchLatestTeamUpdate;

export async function createTeamUpdate(input: CreateTeamUpdateInput): Promise<TeamUpdate> {
  const trimmedBody = input.body.trim();

  if (trimmedBody.length === 0) {
    throw new Error('Update is required.');
  }

  const trimmedTitle = input.title?.trim() || deriveTeamUpdateTitle(trimmedBody);

  const { data, error } = await supabase
    .from('team_updates')
    .insert({
      team_id: input.teamId,
      title: trimmedTitle,
      body: trimmedBody,
      update_type: input.update_type ?? DEFAULT_TEAM_UPDATE_TYPE,
      is_pinned: input.is_pinned ?? false,
      created_by: input.createdBy,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    throwRepositoryError(error);
  }

  return rowToUpdate(data as TeamUpdateRow);
}

export async function setShowOnHome(updateId: string, showOnHome: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_team_update_show_on_home', {
    p_update_id: updateId,
    p_show_on_home: showOnHome,
  });

  if (error) {
    throwRepositoryError(error);
  }
}

export type TeamUpdatesSubscriptionOptions = {
  channelName?: string;
};

export function subscribeTeamUpdatesByTeam(
  teamId: string,
  onChange: () => void,
  options?: TeamUpdatesSubscriptionOptions,
): () => void {
  const channelName = options?.channelName ?? `team-updates:${teamId}`;

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'team_updates',
        filter: `team_id=eq.${teamId}`,
      },
      () => {
        onChange();
      },
    )
    .subscribe();

  return createSafeRealtimeUnsubscribe(channel);
}
