-- Film public sharing: opaque share token + opt-in flag.
-- Apply in Supabase SQL editor before enabling public film share links.
--
-- Public viewer loads film by share_token via Edge Function (service role).
-- No anonymous SELECT policy on team_films.

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

alter table public.team_films
  add column if not exists is_public_shared boolean not null default false,
  add column if not exists share_token uuid unique;

comment on column public.team_films.is_public_shared is
  'When true and share_token is set, the film is viewable via /film/share/{share_token}.';

comment on column public.team_films.share_token is
  'Opaque public share token. Generated when a coach enables public sharing.';

create index if not exists team_films_public_share_token_idx
  on public.team_films (share_token)
  where share_token is not null and is_public_shared = true;

-- Existing team_films_update_editors policy allows coaches/owners to set share fields.

-- ---------------------------------------------------------------------------
-- ROLLBACK (run manually to undo UP)
-- ---------------------------------------------------------------------------
--
-- drop index if exists team_films_public_share_token_idx;
--
-- alter table public.team_films
--   drop column if exists share_token,
--   drop column if exists is_public_shared;
