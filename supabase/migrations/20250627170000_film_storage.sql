-- Film Phase 2A: private Supabase Storage bucket for uploaded team film.
-- Apply in Supabase SQL editor before mobile upload implementation.
--
-- Prerequisites:
--   - public.teams
--   - public.is_team_member(uuid)
--   - public.can_edit_team(uuid)
--   - public.team_films (video_source_type = 'upload', video_source = storage path)
--
-- Path convention (stored in team_films.video_source WITHOUT bucket prefix):
--   {team_id}/{film_id}/original.mp4
-- Example:
--   123e4567-e89b-12d3-a456-426614174000/223e4567-e89b-12d3-a456-426614174001/original.mp4
--
-- Allowed object names for MVP:
--   original.mp4 | original.mov | original.webm
-- (extension must match an allowed MIME type on the bucket)

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

-- Extract team_id from the first path segment; returns NULL on invalid UUID.
create or replace function public.film_storage_team_id(object_path text)
returns uuid
language plpgsql
immutable
as $$
declare
  team_id_text text;
begin
  team_id_text := split_part(object_path, '/', 1);

  if team_id_text is null or team_id_text = '' then
    return null;
  end if;

  return team_id_text::uuid;
exception
  when others then
    return null;
end;
$$;

comment on function public.film_storage_team_id(text) is
  'Returns team_id UUID from a film storage object path ({team_id}/{film_id}/original.ext).';

-- MVP path guard: {team_id}/{film_id}/original.{mp4|mov|webm}
create or replace function public.film_storage_path_is_valid(object_path text)
returns boolean
language sql
immutable
as $$
  select
    split_part(object_path, '/', 1) ~*
      '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and split_part(object_path, '/', 2) ~*
      '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and split_part(object_path, '/', 3) ~* '^original\.(mp4|mov|webm)$'
    and split_part(object_path, '/', 4) = '';
$$;

comment on function public.film_storage_path_is_valid(text) is
  'True when object path matches {team_id}/{film_id}/original.{mp4|mov|webm}.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'film',
  'film',
  false,
  524288000, -- 500 MB
  array['video/mp4', 'video/quicktime', 'video/webm']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- SELECT: any authenticated team member for the team in the path.
drop policy if exists "film_select_team_members" on storage.objects;

create policy "film_select_team_members"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'film'
    and public.film_storage_team_id(name) is not null
    and public.is_team_member(public.film_storage_team_id(name))
  );

-- INSERT: coaches and team owners; path must match convention.
drop policy if exists "film_insert_editors" on storage.objects;

create policy "film_insert_editors"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'film'
    and public.film_storage_path_is_valid(name)
    and public.film_storage_team_id(name) is not null
    and public.can_edit_team(public.film_storage_team_id(name))
  );

-- UPDATE: coaches and team owners (replace file at same path).
drop policy if exists "film_update_editors" on storage.objects;

create policy "film_update_editors"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'film'
    and public.film_storage_team_id(name) is not null
    and public.can_edit_team(public.film_storage_team_id(name))
  )
  with check (
    bucket_id = 'film'
    and public.film_storage_path_is_valid(name)
    and public.film_storage_team_id(name) is not null
    and public.can_edit_team(public.film_storage_team_id(name))
  );

-- DELETE: coaches and team owners.
drop policy if exists "film_delete_editors" on storage.objects;

create policy "film_delete_editors"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'film'
    and public.film_storage_team_id(name) is not null
    and public.can_edit_team(public.film_storage_team_id(name))
  );

-- ---------------------------------------------------------------------------
-- VERIFICATION (run manually after UP)
-- ---------------------------------------------------------------------------
--
-- 1) Bucket exists
-- select id, name, public, file_size_limit, allowed_mime_types
-- from storage.buckets
-- where id = 'film';
-- -- Expect: public = false, file_size_limit = 524288000,
-- -- allowed_mime_types = {video/mp4,video/quicktime,video/webm}
--
-- 2) Helper functions exist
-- select proname
-- from pg_proc
-- join pg_namespace n on n.oid = pg_proc.pronamespace
-- where n.nspname = 'public'
--   and proname in ('film_storage_team_id', 'film_storage_path_is_valid');
--
-- 3) Policies exist
-- select policyname, cmd, roles
-- from pg_policies
-- where schemaname = 'storage'
--   and tablename = 'objects'
--   and policyname like 'film_%'
-- order by policyname;
-- -- Expect 4 policies: film_select_team_members, film_insert_editors,
-- -- film_update_editors, film_delete_editors
--
-- 4) Path helper accepts valid MVP path
-- select public.film_storage_path_is_valid(
--   '123e4567-e89b-12d3-a456-426614174000/223e4567-e89b-12d3-a456-426614174001/original.mp4'
-- );
-- -- Expect: true
--
-- 5) Path helper rejects bad paths
-- select public.film_storage_path_is_valid(
--   '123e4567-e89b-12d3-a456-426614174000/wrong/original.txt'
-- );
-- -- Expect: false
--
-- 6) Coach upload smoke test (login as coach/owner; replace UUIDs)
-- -- Upload via Supabase dashboard or app once implemented to:
-- -- {team_id}/{film_id}/original.mp4
--
-- 7) Player read smoke test (login as player)
-- -- SELECT from storage via signed URL once app generates one;
-- -- direct INSERT should fail RLS for player role.

-- ---------------------------------------------------------------------------
-- ROLLBACK (run manually to undo UP)
-- ---------------------------------------------------------------------------
--
-- -- Remove all objects first (required before bucket delete).
-- delete from storage.objects
-- where bucket_id = 'film';
--
-- drop policy if exists "film_select_team_members" on storage.objects;
-- drop policy if exists "film_insert_editors" on storage.objects;
-- drop policy if exists "film_update_editors" on storage.objects;
-- drop policy if exists "film_delete_editors" on storage.objects;
--
-- delete from storage.buckets
-- where id = 'film';
--
-- drop function if exists public.film_storage_path_is_valid(text);
-- drop function if exists public.film_storage_team_id(text);
