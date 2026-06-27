import type { JoinLinkRecord, JoinLinkRole } from '../types/joinLink';
import { supabase } from './supabase';

type JoinLinkRow = {
  role: JoinLinkRole;
  token: string;
  created_at: string;
  last_used_at: string | null;
};

export async function fetchTeamJoinLinks(teamId: string): Promise<JoinLinkRecord[]> {
  const { data, error } = await supabase.rpc('get_team_join_links', {
    p_team_id: teamId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as JoinLinkRow[]).map((row) => ({
    role: row.role,
    token: row.token,
    created_at: row.created_at,
    last_used_at: row.last_used_at,
  }));
}

export async function regenerateTeamJoinLink(
  teamId: string,
  role: JoinLinkRole,
): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_team_join_link', {
    p_team_id: teamId,
    p_role: role,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (typeof data !== 'string' || data.trim().length === 0) {
    throw new Error('Join link was regenerated but no token was returned');
  }

  return data.trim();
}
