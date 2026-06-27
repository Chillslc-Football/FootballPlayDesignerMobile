-- Film Module Phase 1: team-scoped film library (external links MVP; upload-ready schema).
-- Apply in Supabase SQL editor before mobile Film tab implementation.
--
-- Prerequisites:
--   - public.teams
--   - public.is_team_member(uuid) helper
--   - public.can_edit_team(uuid) helper — team_owner or coach
--
-- MVP uses video_source_type values for external providers only.
-- Future uploads set video_source_type = 'upload' and video_source = storage path.

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

create table if not exists public.team_films (
  id                 uuid primary key default gen_random_uuid(),
  team_id            uuid not null references public.teams (id) on delete cascade,
  title              text not null,
  notes              text,
  video_source_type  text not null,
  video_source       text not null,
  created_by         uuid not null references auth.users (id) on delete restrict,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint team_films_title_nonempty check (
    length(trim(title)) > 0
  ),

  constraint team_films_video_source_nonempty check (
    length(trim(video_source)) > 0
  ),

  constraint team_films_video_source_type_check check (
    video_source_type in (
      'youtube',
      'hudl',
      'google_drive',
      'dropbox',
      'upload',
      'external'
    )
  ),

  constraint team_films_external_source_url_check check (
    video_source_type = 'upload'
    or video_source ~* '^https?://'
  )
);

comment on table public.team_films is
  'Team film library entries. video_source holds an external URL or a storage path for uploads.';

comment on column public.team_films.video_source_type is
  'Provider hint for playback UX: youtube, hudl, google_drive, dropbox, upload, or external.';

comment on column public.team_films.video_source is
  'External video URL (https) or Supabase storage path when video_source_type = upload.';

comment on column public.team_films.notes is
  'Optional coach notes shown on film detail; not required for MVP.';

-- Film library: newest first per team
create index if not exists team_films_team_created_at_idx
  on public.team_films (team_id, created_at desc);

create or replace function public.team_films_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists team_films_updated_at on public.team_films;

create trigger team_films_updated_at
  before update on public.team_films
  for each row
  execute function public.team_films_set_updated_at();

alter table public.team_films enable row level security;

drop policy if exists "team_films_select_team_members"
  on public.team_films;

create policy "team_films_select_team_members"
  on public.team_films
  for select
  to authenticated
  using (
    public.is_team_member(team_id)
  );

drop policy if exists "team_films_insert_editors"
  on public.team_films;

create policy "team_films_insert_editors"
  on public.team_films
  for insert
  to authenticated
  with check (
    public.can_edit_team(team_id)
    and created_by = auth.uid()
  );

drop policy if exists "team_films_update_editors"
  on public.team_films;

create policy "team_films_update_editors"
  on public.team_films
  for update
  to authenticated
  using (
    public.can_edit_team(team_id)
  )
  with check (
    public.can_edit_team(team_id)
  );

drop policy if exists "team_films_delete_editors"
  on public.team_films;

create policy "team_films_delete_editors"
  on public.team_films
  for delete
  to authenticated
  using (
    public.can_edit_team(team_id)
  );

grant select, insert, update, delete on table public.team_films to authenticated;
grant select on table public.team_films to service_role;

-- ---------------------------------------------------------------------------
-- VERIFICATION (run manually after UP)
-- ---------------------------------------------------------------------------
--
-- 1) Table exists
-- select table_name
-- from information_schema.tables
-- where table_schema = 'public'
--   and table_name = 'team_films';
--
-- 2) RLS enabled
-- select relname, relrowsecurity
-- from pg_class
-- where relname = 'team_films';
--
-- 3) Policies
-- select policyname, cmd, roles
-- from pg_policies
-- where schemaname = 'public'
--   and tablename = 'team_films'
-- order by policyname;
--
-- 4) Index
-- select indexname, indexdef
-- from pg_indexes
-- where schemaname = 'public'
--   and tablename = 'team_films'
-- order by indexname;
--
-- 5) Title constraint rejects blank title
-- insert into public.team_films (team_id, title, video_source_type, video_source, created_by)
-- values ('00000000-0000-0000-0000-000000000001', '   ', 'external', 'https://example.com', '00000000-0000-0000-0000-000000000002');
-- -- Expect CHECK violation on team_films_title_nonempty.
--
-- 6) External source must be http(s)
-- insert into public.team_films (team_id, title, video_source_type, video_source, created_by)
-- values ('00000000-0000-0000-0000-000000000001', 'Test', 'youtube', 'not-a-url', auth.uid());
-- -- Expect CHECK violation on team_films_external_source_url_check.
--
-- 7) Coach can insert (login as coach/owner; replace team id)
-- insert into public.team_films (team_id, title, notes, video_source_type, video_source, created_by)
-- values (
--   '<your-team-id>',
--   'Friday vs Lincoln',
--   'Red zone focus',
--   'youtube',
--   'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
--   auth.uid()
-- )
-- returning id, title, video_source_type, created_at;
--
-- 8) Player can select but not insert (login as player)
-- select id, title from public.team_films where team_id = '<your-team-id>';
-- insert into public.team_films (team_id, title, video_source_type, video_source, created_by)
-- values ('<your-team-id>', 'Blocked', 'external', 'https://example.com', auth.uid());
-- -- Expect RLS violation on insert.
--
-- 9) Coach can update and delete
-- update public.team_films
-- set title = 'Updated title'
-- where id = '<film-id>'
-- returning id, title, updated_at;
--
-- delete from public.team_films where id = '<film-id>' returning id;

-- ---------------------------------------------------------------------------
-- ROLLBACK (run manually to undo UP)
-- ---------------------------------------------------------------------------
--
-- drop trigger if exists team_films_updated_at on public.team_films;
--
-- drop function if exists public.team_films_set_updated_at();
--
-- drop policy if exists "team_films_select_team_members" on public.team_films;
-- drop policy if exists "team_films_insert_editors" on public.team_films;
-- drop policy if exists "team_films_update_editors" on public.team_films;
-- drop policy if exists "team_films_delete_editors" on public.team_films;
--
-- drop index if exists team_films_team_created_at_idx;
--
-- drop table if exists public.team_films;
