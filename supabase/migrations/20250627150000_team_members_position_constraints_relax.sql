-- Roster Phase 2 follow-up: allow team-specific position labels on team_members.
-- Apply in Supabase SQL editor after 20250627140000_team_members_player_info.sql.
--
-- Problem:
--   team_members_primary_position_check and team_members_secondary_position_check
--   only allow a fixed 13-code list (QB, RB, WR, ...). Play-derived labels such as
--   X, Y, Z, LT, CB1 fail the CHECK when saving roster player info.
--
-- Change:
--   Drop fixed-list CHECK constraints.
--   Keep nullable text columns; reject blank strings only.
--   Keep jersey_number 0–99 CHECK and player_info_role_check unchanged.

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

alter table public.team_members
  drop constraint if exists team_members_primary_position_check;

alter table public.team_members
  drop constraint if exists team_members_secondary_position_check;

alter table public.team_members
  drop constraint if exists team_members_primary_position_not_blank;

alter table public.team_members
  add constraint team_members_primary_position_not_blank
  check (primary_position is null or length(trim(primary_position)) > 0);

alter table public.team_members
  drop constraint if exists team_members_secondary_position_not_blank;

alter table public.team_members
  add constraint team_members_secondary_position_not_blank
  check (secondary_position is null or length(trim(secondary_position)) > 0);

comment on column public.team_members.primary_position is
  'Team-specific primary position label for player members only; nullable text.';

comment on column public.team_members.secondary_position is
  'Team-specific secondary position label for player members only; nullable text.';

-- ---------------------------------------------------------------------------
-- VERIFICATION (run manually after UP)
-- ---------------------------------------------------------------------------
--
-- 1) Fixed-list constraints removed
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.team_members'::regclass
--   and conname in (
--     'team_members_primary_position_check',
--     'team_members_secondary_position_check',
--     'team_members_primary_position_not_blank',
--     'team_members_secondary_position_not_blank'
--   )
-- order by conname;
-- -- Expect NOT to see team_members_primary_position_check or
-- -- team_members_secondary_position_check; expect the two *_not_blank constraints.
--
-- 2) Play-derived position saves (replace UUIDs; login as coach/owner)
-- update public.team_members
-- set primary_position = 'X', secondary_position = 'Z'
-- where team_id = '<team-id>' and user_id = '<player-user-id>' and role = 'player'
-- returning user_id, primary_position, secondary_position;
--
-- 3) Blank string rejected
-- update public.team_members
-- set primary_position = '   '
-- where team_id = '<team-id>' and user_id = '<player-user-id>' and role = 'player';
-- -- Expect CHECK violation on team_members_primary_position_not_blank.
--
-- 4) Jersey constraint still enforced
-- update public.team_members
-- set jersey_number = 100
-- where team_id = '<team-id>' and user_id = '<player-user-id>' and role = 'player';
-- -- Expect CHECK violation on team_members_jersey_number_check.

-- ---------------------------------------------------------------------------
-- ROLLBACK (run manually to undo UP)
-- ---------------------------------------------------------------------------
--
-- alter table public.team_members
--   drop constraint if exists team_members_secondary_position_not_blank;
--
-- alter table public.team_members
--   drop constraint if exists team_members_primary_position_not_blank;
--
-- alter table public.team_members
--   drop constraint if exists team_members_secondary_position_check;
--
-- alter table public.team_members
--   add constraint team_members_secondary_position_check
--   check (
--     secondary_position is null
--     or secondary_position in ('QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P', 'LS', 'ATH')
--   );
--
-- alter table public.team_members
--   drop constraint if exists team_members_primary_position_check;
--
-- alter table public.team_members
--   add constraint team_members_primary_position_check
--   check (
--     primary_position is null
--     or primary_position in ('QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P', 'LS', 'ATH')
--   );
