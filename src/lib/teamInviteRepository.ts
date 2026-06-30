import type { InviteRole } from '../types/teamRoster';
import { getInvokeErrorMessage } from './supabaseInvoke';
import { supabase } from './supabase';

export type TeamInviteToken = {
  token: string;
};

type SendInviteEmailResponse = {
  ok?: boolean;
  error?: string;
};

export async function createTeamInvite(
  teamId: string,
  email: string,
  role: InviteRole,
): Promise<TeamInviteToken> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error('Not signed in');
  }

  const { data, error } = await supabase
    .from('team_invites')
    .insert({
      team_id: teamId,
      role,
      email: email.trim().toLowerCase(),
      created_by: user.id,
    })
    .select('token')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || typeof data.token !== 'string' || data.token.length === 0) {
    throw new Error('Invite was created but no token was returned');
  }

  return { token: data.token };
}

export async function sendTeamInviteEmail(token: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-team-invite-email', {
    body: { token },
  });

  if (error) {
    throw new Error(await getInvokeErrorMessage(error, 'Could not send invite email'));
  }

  const response = data as SendInviteEmailResponse | null;

  if (response?.error) {
    throw new Error(response.error);
  }

  if (!response?.ok) {
    throw new Error('Failed to send invite email');
  }
}
