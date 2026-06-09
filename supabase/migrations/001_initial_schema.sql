-- ── Tables ────────────────────────────────────────────────────────────────

create table public.profiles (
  id          uuid references auth.users primary key,
  full_name   text,
  avatar_url  text,
  whoop_connected boolean default false,
  created_at  timestamptz default now()
);

create table public.plans (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users not null,
  name                text not null,
  goal                text,
  goal_time_seconds   integer,
  current_pb_seconds  integer,
  start_date          date,
  end_date            date,
  status              text default 'active',
  created_at          timestamptz default now()
);

create table public.phases (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid references plans on delete cascade not null,
  name        text not null,
  order_index integer,
  start_week  integer,
  end_week    integer
);

create table public.workouts (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid references plans on delete cascade not null,
  phase_id       uuid references phases,
  user_id        uuid references auth.users not null,
  scheduled_date date not null,
  type           text not null,
  name           text not null,
  duration_mins  integer,
  coach_note     text,
  status         text default 'planned'
);

create table public.exercises (
  id               uuid primary key default gen_random_uuid(),
  workout_id       uuid references workouts on delete cascade not null,
  name             text not null,
  order_index      integer,
  sets             integer,
  reps             integer,
  target_weight_kg decimal
);

create table public.workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  workout_id   uuid references workouts not null,
  user_id      uuid references auth.users not null,
  completed_at timestamptz default now(),
  rpe          integer check (rpe between 1 and 10),
  energy_level integer check (energy_level between 1 and 10),
  mood         integer check (mood between 1 and 10),
  sleep_quality integer check (sleep_quality between 1 and 10),
  pain_level   integer check (pain_level between 1 and 10),
  notes        text
);

create table public.run_results (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid references workout_sessions on delete cascade not null,
  user_id          uuid references auth.users not null,
  run_type         text,
  distance_meters  integer,
  duration_seconds integer,
  avg_pace_seconds integer,
  avg_heart_rate   integer,
  rpe              integer
);

create table public.exercise_sets (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid references workout_sessions on delete cascade not null,
  exercise_id    uuid references exercises not null,
  set_number     integer,
  weight_kg      decimal,
  reps_completed integer
);

create table public.whoop_recovery (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users not null,
  date               date not null,
  recovery_score     integer,
  hrv_ms             decimal,
  resting_hr         integer,
  sleep_performance  integer,
  strain_score       decimal,
  unique(user_id, date)
);

create table public.personal_records (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  record_type   text,
  value_seconds integer,
  achieved_date date,
  session_id    uuid references workout_sessions
);

-- ── Row-level security ─────────────────────────────────────────────────────

alter table public.profiles         enable row level security;
alter table public.plans            enable row level security;
alter table public.phases           enable row level security;
alter table public.workouts         enable row level security;
alter table public.exercises        enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.run_results      enable row level security;
alter table public.exercise_sets    enable row level security;
alter table public.whoop_recovery   enable row level security;
alter table public.personal_records enable row level security;

-- profiles
create policy "users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- plans
create policy "users manage own plans"
  on plans for all using (auth.uid() = user_id);

-- phases
create policy "users access own phases"
  on phases for all using (
    exists (select 1 from plans where plans.id = phases.plan_id and plans.user_id = auth.uid())
  );

-- workouts
create policy "users manage own workouts"
  on workouts for all using (auth.uid() = user_id);

-- exercises
create policy "users access own exercises"
  on exercises for all using (
    exists (select 1 from workouts where workouts.id = exercises.workout_id and workouts.user_id = auth.uid())
  );

-- workout_sessions
create policy "users manage own sessions"
  on workout_sessions for all using (auth.uid() = user_id);

-- run_results
create policy "users manage own run results"
  on run_results for all using (auth.uid() = user_id);

-- exercise_sets
create policy "users access own exercise sets"
  on exercise_sets for all using (
    exists (select 1 from workout_sessions where workout_sessions.id = exercise_sets.session_id and workout_sessions.user_id = auth.uid())
  );

-- whoop_recovery
create policy "users manage own whoop data"
  on whoop_recovery for all using (auth.uid() = user_id);

-- personal_records
create policy "users manage own records"
  on personal_records for all using (auth.uid() = user_id);

-- ── Auto-create profile on sign-up ────────────────────────────────────────

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
