-- Calendar RSVP Phase 1: one RSVP per user per team event.

create table public.team_event_rsvps (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.team_events (id) on delete cascade,
  team_id    uuid not null references public.teams (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  status     text not null check (status in ('accepted', 'tentative', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint team_event_rsvps_one_per_user unique (event_id, user_id)
);

create index team_event_rsvps_event_id_idx on public.team_event_rsvps (event_id);
create index team_event_rsvps_team_event_idx on public.team_event_rsvps (team_id, event_id);

create or replace function public.team_event_rsvps_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger team_event_rsvps_updated_at
  before update on public.team_event_rsvps
  for each row
  execute function public.team_event_rsvps_set_updated_at();

create or replace function public.team_event_rsvps_team_id_matches_event()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1
    from public.team_events e
    where e.id = new.event_id
      and e.team_id = new.team_id
  ) then
    raise exception 'team_id must match the event team_id';
  end if;

  return new;
end;
$$;

create trigger team_event_rsvps_team_id_check
  before insert or update on public.team_event_rsvps
  for each row
  execute function public.team_event_rsvps_team_id_matches_event();

alter table public.team_event_rsvps enable row level security;

create policy "team_event_rsvps_select_team_members"
  on public.team_event_rsvps
  for select
  using (
    exists (
      select 1
      from public.team_members tm
      where tm.team_id = team_event_rsvps.team_id
        and tm.user_id = auth.uid()
    )
  );

create policy "team_event_rsvps_insert_own"
  on public.team_event_rsvps
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.team_members tm
      where tm.team_id = team_event_rsvps.team_id
        and tm.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.team_events e
      where e.id = event_id
        and e.team_id = team_event_rsvps.team_id
    )
  );

create policy "team_event_rsvps_update_own"
  on public.team_event_rsvps
  for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.team_members tm
      where tm.team_id = team_event_rsvps.team_id
        and tm.user_id = auth.uid()
    )
    and exists (
      select 1
      from public.team_events e
      where e.id = event_id
        and e.team_id = team_event_rsvps.team_id
    )
  );
