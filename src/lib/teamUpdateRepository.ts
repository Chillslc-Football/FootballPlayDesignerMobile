import { supabase } from './supabase';
import { DEFAULT_TEAM_UPDATE_TYPE, type TeamUpdate } from '../types/teamUpdate';

type TeamUpdateRow = {
  id: string;
  team_id: string;
  title: string;
  body: string;
  update_type: string;
  is_pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  'id, team_id, title, body, update_type, is_pinned, created_by, created_at, updated_at';

function rowToUpdate(row: TeamUpdateRow): TeamUpdate {
  return {
    id: row.id,
    team_id: row.team_id,
    title: row.title,
    body: row.body,
    update_type: DEFAULT_TEAM_UPDATE_TYPE,
    is_pinned: row.is_pinned,
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
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as TeamUpdateRow[]).map(rowToUpdate);
}

export function subscribeTeamUpdatesByTeam(
  teamId: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(`team-updates:${teamId}`)
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

  return () => {
    void supabase.removeChannel(channel);
  };
}
