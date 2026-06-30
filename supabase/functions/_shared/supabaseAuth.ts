import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TEAM_EDITOR_ROLES = new Set(['team_owner', 'coach']);

type TeamMembershipRow = {
  role: string;
};

export function createUserClient(authHeader: string | null): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  if (!authHeader) {
    throw new Error('Missing authorization header.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration.');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

export async function requireAuthenticatedUser(
  supabase: SupabaseClient,
): Promise<{ id: string }> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized.');
  }

  return { id: user.id };
}

async function requireAuthenticatedMembership(
  supabase: SupabaseClient,
  teamId: string,
): Promise<TeamMembershipRow> {
  const user = await requireAuthenticatedUser(supabase);

  const { data, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('You do not have permission to access team film.');
  }

  return data;
}

export async function requireTeamMember(
  supabase: SupabaseClient,
  teamId: string,
): Promise<void> {
  await requireAuthenticatedMembership(supabase, teamId);
}

export async function requireTeamEditor(
  supabase: SupabaseClient,
  teamId: string,
): Promise<void> {
  const membership = await requireAuthenticatedMembership(supabase, teamId);

  if (!TEAM_EDITOR_ROLES.has(membership.role)) {
    throw new Error('You do not have permission to manage team film.');
  }
}
