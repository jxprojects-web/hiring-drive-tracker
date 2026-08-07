-- ============================================================================
-- Walk-In Hiring Drive Candidate Tracker — Core Schema
-- Run this ONCE in the Supabase SQL Editor on a fresh project.
-- Safe to re-run only after a full `drop schema public cascade` — it is not
-- idempotent by design, so you get clear errors instead of silent partial state.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------

create type public.app_role as enum (
  'admin',
  'reception',
  'hr',
  'cabin_1',
  'cabin_2',
  'cabin_3',
  'cabin_4',
  'loi_desk',
  'viewer'
);

create type public.candidate_stage as enum (
  'reception',
  'hr_screening',
  'cabin_1',
  'cabin_2',
  'cabin_3',
  'cabin_4',
  'loi',
  'completed',
  'rejected'
);

-- ----------------------------------------------------------------------------
-- 2. PROFILES  (one row per Supabase Auth user, holds their role)
-- ----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'reception',
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Maps each auth.users row to an app_role. Row is auto-created by the on_auth_user_created trigger below.';

-- Auto-create a profile row whenever a new auth user signs up / is invited.
-- Default role is 'reception' — an admin must promote real staff afterward
-- (see README "Add staff logins" section).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'role')::public.app_role, 'reception')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 3. CANDIDATES
-- ----------------------------------------------------------------------------

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  candidate_code text not null unique, -- human-facing token/ID, e.g. printed on a badge
  full_name text not null,
  phone text not null unique,
  email text,
  position_applied text not null,
  experience_years numeric(4,1) not null default 0,
  is_experienced boolean generated always as (experience_years > 0) stored,

  resume_received boolean not null default false,
  registration_complete boolean not null default false,

  stage public.candidate_stage not null default 'reception',

  hr_feedback text,
  hr_started_at timestamptz,
  hr_completed_at timestamptz,

  cabin_number smallint, -- 1..4, set when routed to a cabin
  cabin_started_at timestamptz,
  cabin_completed_at timestamptz,
  interview_rating smallint check (interview_rating between 1 and 5),
  interview_recommendation text check (interview_recommendation in ('select','hold','reject')),

  loi_issued boolean not null default false,
  aadhaar_received boolean not null default false,
  exit_time timestamptz,

  rejected_at_stage public.candidate_stage,
  rejection_reason text,

  registered_at timestamptz not null default now(),
  completed_at timestamptz,

  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),

  -- Business rule: Cabin 4 is experienced candidates only. Enforced at the DB
  -- level so no client can bypass it, not just hidden in the UI.
  constraint cabin_4_requires_experience check (
    cabin_number is distinct from 4 or is_experienced
  ),
  constraint cabin_number_range check (cabin_number is null or cabin_number between 1 and 4),
  constraint stage_cabin_consistency check (
    (stage = 'cabin_1' and cabin_number = 1) or
    (stage = 'cabin_2' and cabin_number = 2) or
    (stage = 'cabin_3' and cabin_number = 3) or
    (stage = 'cabin_4' and cabin_number = 4) or
    (stage not in ('cabin_1','cabin_2','cabin_3','cabin_4'))
  )
);

comment on column public.candidates.is_experienced is 'Generated column: true when experience_years > 0. Drives the Cabin-4-experienced-only rule.';

create index idx_candidates_stage on public.candidates(stage);
create index idx_candidates_phone on public.candidates(phone);
create index idx_candidates_code on public.candidates(candidate_code);
create index idx_candidates_registered_at on public.candidates(registered_at);
create index idx_candidates_position on public.candidates(position_applied);
create index idx_candidates_cabin on public.candidates(cabin_number) where cabin_number is not null;

-- Extra belt-and-braces trigger version of the Cabin-4 rule, in case a future
-- migration changes cabin_number without going through stage_cabin_consistency.
create or replace function public.enforce_cabin4_experience()
returns trigger
language plpgsql
as $$
begin
  if new.cabin_number = 4 and not new.is_experienced then
    raise exception 'Cabin 4 is reserved for experienced candidates only (experience_years must be > 0).';
  end if;
  return new;
end;
$$;

create trigger trg_enforce_cabin4_experience
  before insert or update on public.candidates
  for each row execute function public.enforce_cabin4_experience();

-- Keep updated_at fresh on every write.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_candidates_updated_at
  before update on public.candidates
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. ACTIVITY LOG  (immutable audit trail, populated only by trigger)
-- ----------------------------------------------------------------------------

create table public.activity_log (
  id bigint generated always as identity primary key,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  from_stage public.candidate_stage,
  to_stage public.candidate_stage not null,
  changed_by uuid references public.profiles(id),
  changed_by_email text,
  changed_at timestamptz not null default now(),
  note text
);

create index idx_activity_log_candidate on public.activity_log(candidate_id);
create index idx_activity_log_changed_at on public.activity_log(changed_at);

-- No UPDATE/DELETE grants are ever given on this table (see RLS section) —
-- it is append-only from the trigger's perspective.

create or replace function public.log_candidate_stage_change()
returns trigger
security definer
set search_path = public
language plpgsql as $$
declare
  actor_email text;
begin
  if (tg_op = 'INSERT') then
    select email into actor_email from public.profiles where id = new.created_by;
    insert into public.activity_log (candidate_id, from_stage, to_stage, changed_by, changed_by_email, note)
    values (new.id, null, new.stage, new.created_by, actor_email, 'Candidate registered');
    return new;
  end if;

  if (tg_op = 'UPDATE') and (old.stage is distinct from new.stage) then
    select email into actor_email from public.profiles where id = auth.uid();
    insert into public.activity_log (candidate_id, from_stage, to_stage, changed_by, changed_by_email, note)
    values (
      new.id, old.stage, new.stage, auth.uid(), actor_email,
      case when new.stage = 'rejected' then new.rejection_reason else null end
    );
  end if;

  return new;
end;
$$;

create trigger trg_log_candidate_stage_change
  after insert or update on public.candidates
  for each row execute function public.log_candidate_stage_change();

-- ----------------------------------------------------------------------------
-- 5. SETTINGS  (single-row config table for alert thresholds)
-- ----------------------------------------------------------------------------

create table public.settings (
  id smallint primary key default 1 check (id = 1), -- enforce a single row
  hr_wait_threshold_minutes int not null default 15,
  interview_duration_threshold_minutes int not null default 20,
  event_name text not null default 'Walk-In Hiring Drive',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

insert into public.settings (id) values (1);

create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. HELPER FUNCTIONS FOR RLS
-- ----------------------------------------------------------------------------

create or replace function public.current_role()
returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- Which candidate_stage does a given app_role own? (null = not a stage-owning role)
create or replace function public.role_owns_stage(r public.app_role)
returns public.candidate_stage
language sql immutable as $$
  select case r
    when 'reception' then 'reception'::public.candidate_stage
    when 'hr' then 'hr_screening'::public.candidate_stage
    when 'cabin_1' then 'cabin_1'::public.candidate_stage
    when 'cabin_2' then 'cabin_2'::public.candidate_stage
    when 'cabin_3' then 'cabin_3'::public.candidate_stage
    when 'cabin_4' then 'cabin_4'::public.candidate_stage
    when 'loi_desk' then 'loi'::public.candidate_stage
    else null
  end;
$$;

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.candidates enable row level security;
alter table public.activity_log enable row level security;
alter table public.settings enable row level security;

-- PROFILES: everyone signed in can read all profiles (needed to show "changed
-- by" names and staff lists); only admins or the user themself can update;
-- only admins can change roles.
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_self_or_admin" on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (
    auth.uid() = id and role = (select role from public.profiles where id = auth.uid())
    or public.is_admin()
  );

-- CANDIDATES: readable by any authenticated user (dashboard needs full
-- visibility across stages) and by anonymous users too (read-only public
-- volunteer/queue screen, per spec "no login needed").
create policy "candidates_select_all" on public.candidates
  for select to authenticated, anon using (true);

-- Reception can create new candidates.
create policy "candidates_insert_reception_or_admin" on public.candidates
  for insert to authenticated
  with check (
    public.is_admin() or public.current_role() = 'reception'
  );

-- Stage-owning roles can update ONLY rows currently sitting at their own
-- stage (before-image check) and only when moving them forward to an
-- allowed next stage or into 'rejected' (after-image check). Admin bypasses
-- entirely.
create policy "candidates_update_own_stage_or_admin" on public.candidates
  for update to authenticated
  using (
    public.is_admin()
    or stage = public.role_owns_stage(public.current_role())
  )
  with check (
    public.is_admin()
    or (
      -- the row must still belong to a valid transition initiated by this role:
      -- either it stayed on the same stage (editing fields, e.g. resume_received)
      -- or it moved to 'rejected', or it moved to the legitimate next stage.
      stage = public.role_owns_stage(public.current_role())
      or stage = 'rejected'
      or (public.current_role() = 'reception' and stage = 'hr_screening')
      or (public.current_role() = 'hr' and stage in ('cabin_1','cabin_2','cabin_3','cabin_4'))
      or (public.current_role() in ('cabin_1','cabin_2','cabin_3','cabin_4') and stage = 'loi')
      or (public.current_role() = 'loi_desk' and stage = 'completed')
    )
  );

-- No delete policy for anyone except admin — deletes should really only
-- happen via the "Reset for next event" flow, which is a full-table clear
-- done through an admin RPC/policy below, not row-by-row deletes.
create policy "candidates_delete_admin_only" on public.candidates
  for delete to authenticated using (public.is_admin());

-- ACTIVITY LOG: read-only to everyone signed in (and to volunteer/anon,
-- since the live queue may want to show "time in current stage"); NO insert/
-- update/delete policies for any client role — it is written exclusively by
-- the SECURITY DEFINER trigger function above, which bypasses RLS.
create policy "activity_log_select_all" on public.activity_log
  for select to authenticated, anon using (true);

-- SETTINGS: everyone can read (thresholds drive UI badge colors incl. the
-- volunteer view); only admin can write.
create policy "settings_select_all" on public.settings
  for select to authenticated, anon using (true);

create policy "settings_update_admin_only" on public.settings
  for update to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. REALTIME
-- ----------------------------------------------------------------------------
-- Enable realtime replication so the dashboard/stage screens get live
-- INSERT/UPDATE events without polling.

alter publication supabase_realtime add table public.candidates;
alter publication supabase_realtime add table public.activity_log;
alter publication supabase_realtime add table public.settings;

-- ----------------------------------------------------------------------------
-- 9. ADMIN "RESET FOR NEXT EVENT" RPC
-- ----------------------------------------------------------------------------
-- Wraps the destructive clear in a single SECURITY DEFINER function so the
-- client only ever calls one RPC (after the UI has already forced an export)
-- rather than issuing raw deletes. Admin-only, guarded by is_admin().

create or replace function public.reset_event_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can reset event data.';
  end if;
  delete from public.activity_log;
  delete from public.candidates;
end;
$$;

-- ============================================================================
-- End of migration. Next: run supabase/seed/002_seed_optional.sql if you want
-- sample data, otherwise skip straight to creating your first admin user
-- (see README.md).
-- ============================================================================
