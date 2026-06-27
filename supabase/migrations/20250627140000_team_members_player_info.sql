-- Roster Phase 2: team-specific player information on team_members.
-- Apply in Supabase SQL editor before testing mobile roster edits.
--
-- Prerequisites:
--   - public.team_members (team_id, user_id, role)
--   - public.can_edit_team(uuid)  — team_owner or coach
--   - public.is_team_member(uuid)
--
-- Adds nullable jersey_number, primary_position, secondary_position for role = player.

-- ---------------------------------------------------------------------------
-- UP
-- ---------------------------------------------------------------------------

alter table public.team_members
  add column if not exists jersey_number integer,
  add column if not exists primary_position text,
  add column if not exists secondary_position text;

comment on column public.team_members.jersey_number is
  'Team-specific jersey number (0–99) for player members only.';

comment on column public.team_members.primary_position is
  'Team-specific primary football position code for player members only.';

comment on column public.team_members.secondary_position is
  'Team-specific secondary football position code for player members only; nullable.';

alter table public.team_members
  drop constraint if exists team_members_jersey_number_check;

alter table public.team_members
  add constraint team_members_jersey_number_check
  check (jersey_number is null or (jersey_number >= 0 and jersey_number <= 99));

alter table public.team_members
  drop constraint if exists team_members_primary_position_check;

alter table public.team_members
  add constraint team_members_primary_position_check
  check (
    primary_position is null
    or primary_position in ('QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P', 'LS', 'ATH')
  );

alter table public.team_members
  drop constraint if exists team_members_secondary_position_check;

alter table public.team_members
  add constraint team_members_secondary_position_check
  check (
    secondary_position is null
    or secondary_position in ('QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P', 'LS', 'ATH')
  );

alter table public.team_members
  drop constraint if exists team_members_player_info_role_check;

alter table public.team_members
  add constraint team_members_player_info_role_check
  check (
    role = 'player'::public.team_role
    or (
      jersey_number is null
      and primary_position is null
      and secondary_position is null
    )
  );

-- Coaches and team owners may update player roster info on player rows.
drop policy if exists "team_members_update_player_info_editors"
  on public.team_members;

create policy "team_members_update_player_info_editors"
  on public.team_members
  for update
  to authenticated
  using (
    public.can_edit_team(team_id)
    and role = 'player'::public.team_role
  )
  with check (
    public.can_edit_team(team_id)
    and role = 'player'::public.team_role
  );

grant update on table public.team_members to authenticated;

-- ---------------------------------------------------------------------------
-- VERIFICATION (run manually after UP)
-- ---------------------------------------------------------------------------
--
-- 1) Columns exist
-- select column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'team_members'
--   and column_name in ('jersey_number', 'primary_position', 'secondary_position')
-- order by column_name;
--
-- 2) Jersey constraint rejects 100
-- update public.team_members
-- set jersey_number = 100
-- where team_id = '<team-id>' and user_id = '<player-user-id>';
-- -- Expect CHECK violation.
--
-- 3) Position constraint rejects invalid code
-- update public.team_members
-- set primary_position = 'XX'
-- where team_id = '<team-id>' and user_id = '<player-user-id>';
-- -- Expect CHECK violation.
--
-- 4) Non-player rows cannot store player info
-- update public.team_members
-- set jersey_number = 12
-- where team_id = '<team-id>' and user_id = '<coach-user-id>' and role = 'coach';
-- -- Expect CHECK violation on team_members_player_info_role_check.
--
-- 5) Coach can update a player row (replace UUIDs; login as coach/owner first)
-- update public.team_members
-- set jersey_number = 12, primary_position = 'QB', secondary_position = 'S'
-- where team_id = '<team-id>' and user_id = '<player-user-id>' and role = 'player'
-- returning user_id, jersey_number, primary_position, secondary_position;
--
-- 6) Player cannot update another player (login as player)
-- update public.team_members
-- set jersey_number = 99
-- where team_id = '<team-id>' and user_id = '<other-player-user-id>' and role = 'player';
-- -- Expect RLS violation or 0 rows.

-- ---------------------------------------------------------------------------
-- ROLLBACK (run manually to undo UP)
-- ---------------------------------------------------------------------------
--
-- drop policy if exists "team_members_update_player_info_editors"
--   on public.team_members;
--
-- alter table public.team_members
--   drop constraint if exists team_members_player_info_role_check,
--   drop constraint if exists team_members_secondary_position_check,
--   drop constraint if exists team_members_primary_position_check,
--   drop constraint if exists team_members_jersey_number_check;
--
-- alter table public.team_members
--   drop column if exists secondary_position,
--   drop column if exists primary_position,
--   drop column if exists jersey_number;
