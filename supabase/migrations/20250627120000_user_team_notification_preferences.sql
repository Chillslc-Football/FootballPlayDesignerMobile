-- Phase 0: per-user, per-team notification category preferences.
-- Apply in Supabase SQL editor before mobile Settings persistence.
--
-- Prerequisites:
--   - public.teams
--   - public.is_team_member(uuid) helper
--
-- Categories stored (UI may hide some until implemented):
--   direct_messages, team_channels, team_updates, calendar_events, rsvp_updates
--
-- Defaults: enabled = true (column default; app seeds rows on first Settings load)

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

create table if not exists public.user_team_notification_preferences (
  user_id    uuid not null references auth.users (id) on delete cascade,
  team_id    uuid not null references public.teams (id) on delete cascade,
  category   text not null,
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  primary key (user_id, team_id, category),

  constraint user_team_notification_preferences_category_check check (
    category in (
      'direct_messages',
      'team_channels',
      'team_updates',
      'calendar_events',
      'rsvp_updates'
    )
  )
);

comment on table public.user_team_notification_preferences is
  'Per-user, per-team notification category opt-out preferences.';

comment on column public.user_team_notification_preferences.enabled is
  'When false, push delivery for this category should be suppressed for this user on this team.';

-- Settings load: user_id + team_id
create index if not exists user_team_notification_preferences_team_user_idx
  on public.user_team_notification_preferences (team_id, user_id);

-- Edge Function recipient filtering: team_id + category (+ enabled)
create index if not exists user_team_notification_preferences_team_category_idx
  on public.user_team_notification_preferences (team_id, category, enabled);

create or replace function public.user_team_notification_preferences_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_team_notification_preferences_updated_at
  on public.user_team_notification_preferences;

create trigger user_team_notification_preferences_updated_at
  before update on public.user_team_notification_preferences
  for each row
  execute function public.user_team_notification_preferences_set_updated_at();

alter table public.user_team_notification_preferences enable row level security;

drop policy if exists "user_team_notification_preferences_select_own"
  on public.user_team_notification_preferences;

create policy "user_team_notification_preferences_select_own"
  on public.user_team_notification_preferences
  for select
  to authenticated
  using (
    user_id = auth.uid()
    and public.is_team_member(team_id)
  );

drop policy if exists "user_team_notification_preferences_insert_own"
  on public.user_team_notification_preferences;

create policy "user_team_notification_preferences_insert_own"
  on public.user_team_notification_preferences
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_team_member(team_id)
  );

drop policy if exists "user_team_notification_preferences_update_own"
  on public.user_team_notification_preferences;

create policy "user_team_notification_preferences_update_own"
  on public.user_team_notification_preferences
  for update
  to authenticated
  using (
    user_id = auth.uid()
    and public.is_team_member(team_id)
  )
  with check (
    user_id = auth.uid()
    and public.is_team_member(team_id)
  );

grant select, insert, update on table public.user_team_notification_preferences to authenticated;
grant select on table public.user_team_notification_preferences to service_role;

-- ---------------------------------------------------------------------------
-- VERIFICATION (run manually after UP)
-- ---------------------------------------------------------------------------
--
-- 1) Table exists
-- select table_name
-- from information_schema.tables
-- where table_schema = 'public'
--   and table_name = 'user_team_notification_preferences';
--
-- 2) RLS enabled
-- select relname, relrowsecurity
-- from pg_class
-- where relname = 'user_team_notification_preferences';
--
-- 3) Policies
-- select policyname, cmd, roles
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'user_team_notification_preferences'
-- order by policyname;
--
-- 4) Indexes
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'user_team_notification_preferences'
-- order by indexname;
--
-- 5) Grants (service_role must have SELECT)
-- select grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name = 'user_team_notification_preferences'
-- order by grantee, privilege_type;
--
-- 6) Default enabled = true
-- insert into public.user_team_notification_preferences (user_id, team_id, category)
-- values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'calendar_events');
-- -- Expect enabled = true; delete test row afterward if FK allows or use real UUIDs.
--
-- 7) Category constraint rejects unknown values
-- insert into public.user_team_notification_preferences (user_id, team_id, category, enabled)
-- values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'invalid_category', true);
-- -- Expect CHECK violation.
--
-- 8) Authenticated app smoke test (after login, replace UUIDs):
-- select *
-- from public.user_team_notification_preferences
-- where user_id = auth.uid()
--   and team_id = '<your-team-id>';
--
-- insert into public.user_team_notification_preferences (user_id, team_id, category, enabled)
-- values (auth.uid(), '<your-team-id>', 'calendar_events', false)
-- on conflict (user_id, team_id, category)
-- do update set enabled = excluded.enabled, updated_at = now()
-- returning *;

-- ---------------------------------------------------------------------------
-- ROLLBACK (run manually to undo UP)
-- ---------------------------------------------------------------------------
--
-- drop trigger if exists user_team_notification_preferences_updated_at
--   on public.user_team_notification_preferences;
--
-- drop function if exists public.user_team_notification_preferences_set_updated_at();
--
-- drop policy if exists "user_team_notification_preferences_select_own"
--   on public.user_team_notification_preferences;
-- drop policy if exists "user_team_notification_preferences_insert_own"
--   on public.user_team_notification_preferences;
-- drop policy if exists "user_team_notification_preferences_update_own"
--   on public.user_team_notification_preferences;
--
-- drop table if exists public.user_team_notification_preferences;
