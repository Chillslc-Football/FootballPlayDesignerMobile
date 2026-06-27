-- Phase 1: calendar event reminder fields on team_events.
-- Apply in Supabase SQL editor before mobile reminder UI.

alter table public.team_events
  add column if not exists reminder_enabled boolean not null default true,
  add column if not exists reminder_minutes_before integer not null default 60,
  add column if not exists reminder_sent_at timestamptz null;

alter table public.team_events
  drop constraint if exists team_events_reminder_minutes_before_check;

alter table public.team_events
  add constraint team_events_reminder_minutes_before_check
  check (reminder_minutes_before >= 0);

comment on column public.team_events.reminder_enabled is
  'When true, a push reminder should fire reminder_minutes_before starts_at.';

comment on column public.team_events.reminder_minutes_before is
  'Minutes before starts_at to send reminder. 0 = at event time.';

comment on column public.team_events.reminder_sent_at is
  'Set when reminder push is sent. Reset when schedule/reminder settings change.';

create index if not exists team_events_due_reminders_idx
  on public.team_events (starts_at)
  where reminder_enabled = true and reminder_sent_at is null;

create or replace function public.team_events_reset_reminder_sent_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.starts_at is distinct from old.starts_at
      or new.reminder_enabled is distinct from old.reminder_enabled
      or new.reminder_minutes_before is distinct from old.reminder_minutes_before
    then
      new.reminder_sent_at := null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists team_events_reset_reminder_sent_at on public.team_events;

create trigger team_events_reset_reminder_sent_at
  before update on public.team_events
  for each row
  execute function public.team_events_reset_reminder_sent_at();

-- Verification:
-- select column_name, data_type, column_default, is_nullable
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'team_events'
--   and column_name like 'reminder%'
-- order by column_name;

-- Rollback:
-- drop trigger if exists team_events_reset_reminder_sent_at on public.team_events;
-- drop function if exists public.team_events_reset_reminder_sent_at();
-- drop index if exists team_events_due_reminders_idx;
-- alter table public.team_events drop constraint if exists team_events_reminder_minutes_before_check;
-- alter table public.team_events
--   drop column if exists reminder_sent_at,
--   drop column if exists reminder_minutes_before,
--   drop column if exists reminder_enabled;
