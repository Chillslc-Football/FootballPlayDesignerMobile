import type { InviteRole } from '../types/teamRoster';
import { supabase } from './supabase';

export type TeamInviteToken = {
  token: string;
};

type SendInviteEmailResponse = {
  ok?: boolean;
  error?: string;
};

async function getInvokeErrorMessage(error: unknown): Promise<string> {
  if (!error || typeof error !== 'object') {
    return 'Could not send invite email';
  }

  const invokeError = error as {
    name?: string;
    message?: string;
    context?: Response;
  };

  if (invokeError.name === 'FunctionsHttpError' && invokeError.context instanceof Response) {
    try {
      const body = (await invokeError.context.json()) as SendInviteEmailResponse;
      if (body.error) {
        return body.error;
      }
    } catch {
      // Fall through to generic message below.
    }
  }

  if (typeof invokeError.message === 'string' && invokeError.message.length > 0) {
    return invokeError.message;
  }

  return 'Could not send invite email';
}

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
    throw new Error(await getInvokeErrorMessage(error));
  }

  const response = data as SendInviteEmailResponse | null;

  if (response?.error) {
    throw new Error(response.error);
  }

  if (!response?.ok) {
    throw new Error('Failed to send invite email');
  }
}
