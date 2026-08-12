-- ============================================================
-- FitBack — 통합 DB 셋업 (AUTO-GENERATED — 직접 수정하지 마세요)
-- supabase/migrations/ 의 모든 마이그레이션을 실행 순서대로 합친 파일입니다.
-- 재생성: node scripts/build-setup-sql.js
--
-- 사용법: Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여넣고 Run.
-- 사전 준비: Authentication → Users 에서 테스트 계정을 먼저 만들면
--            03_memberships 의 시드(가데이터)가 그 계정에 자동 연결됩니다.
--            계정이 없으면 시드는 조용히 skip 되고 테이블만 생성됩니다.
-- 멱등성: 모든 마이그레이션은 여러 번 실행해도 안전합니다.
-- ============================================================


-- ████████████████████████████████████████████████████████████
-- 01_init_profiles.sql
-- ████████████████████████████████████████████████████████████

-- profiles + RLS + triggers + is_admin helper
-- Paste into Supabase SQL Editor and run once.

-- ============================================================
-- profiles table
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- updated_at maintenance
-- ============================================================
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- Auto-create a profile row when a new auth user is inserted
-- ============================================================
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any users that already exist (e.g. dev test account created in dashboard)
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ============================================================
-- is_admin() helper — defined now but not yet referenced anywhere.
-- Future policies: `using (is_admin() or user_id = auth.uid())`.
-- ============================================================
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- ============================================================
-- Prevent self-elevation: silently ignore role changes from non-admins.
-- Without this, the "update own row" policy would let a user set role='admin'.
-- ============================================================
create or replace function public.prevent_role_self_elevation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_elevation on public.profiles;
create trigger profiles_prevent_role_elevation
  before update on public.profiles
  for each row execute function public.prevent_role_self_elevation();

-- ============================================================
-- RLS — own row only
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- No INSERT policy: profiles are inserted only via the SECURITY DEFINER trigger.
-- No DELETE policy: profile rows are removed via auth.users ON DELETE CASCADE.


-- ████████████████████████████████████████████████████████████
-- 02_exercises_and_tts.sql
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- 02_exercises_and_tts.sql
-- 운동 마스터 + 오디오 캐시 구조.
-- 텍스트 저장과 오디오 파일 캐싱을 분리해서 설계.
-- ============================================================

-- updated_at 자동 갱신 유틸 (재사용 가능)
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- exercises: 운동 마스터 (텍스트 + 오디오 캐시 url)
-- ------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text,
  muscle_group text,
  description_text text not null,
  description_audio_url text,
  caution_text text not null default '',
  caution_audio_url text,
  tts_version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists exercises_updated_at on public.exercises;
create trigger exercises_updated_at
  before update on public.exercises
  for each row execute function public.update_updated_at();

-- ------------------------------------------------------------
-- exercise_cues: 구간 큐 (세트 시작 / rep / rest / finish) 템플릿 + 캐시
-- 파라미터 고정값은 params jsonb로, 미리 생성된 오디오는 audio_url로.
-- ------------------------------------------------------------
create table if not exists public.exercise_cues (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid references public.exercises(id) on delete cascade,
  cue_type text not null check (cue_type in ('set_start', 'rep_count', 'rest', 'finish')),
  template text not null,
  params jsonb not null default '{}'::jsonb,
  audio_url text,
  tts_version int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists exercise_cues_lookup
  on public.exercise_cues (cue_type, exercise_id);

-- ------------------------------------------------------------
-- tts_cache: 동적 생성 TTS 캐시 (텍스트 해시 → 오디오 url)
-- text_hash = sha256(text || ':' || tts_version)
-- ------------------------------------------------------------
create table if not exists public.tts_cache (
  text_hash text primary key,
  text text not null,
  audio_url text not null,
  tts_version int not null default 1,
  last_used_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists tts_cache_last_used on public.tts_cache (last_used_at);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.exercises enable row level security;
alter table public.exercise_cues enable row level security;
alter table public.tts_cache enable row level security;

-- 인증된 사용자: 모든 테이블 읽기 가능
drop policy if exists "exercises readable by authenticated" on public.exercises;
create policy "exercises readable by authenticated"
  on public.exercises for select to authenticated using (true);

drop policy if exists "exercise_cues readable by authenticated" on public.exercise_cues;
create policy "exercise_cues readable by authenticated"
  on public.exercise_cues for select to authenticated using (true);

drop policy if exists "tts_cache readable by authenticated" on public.tts_cache;
create policy "tts_cache readable by authenticated"
  on public.tts_cache for select to authenticated using (true);

-- 1단계: 클라이언트에서 exercises upsert 허용 (운동 마스터 자동 영속화).
-- TODO Phase 2: Edge Function 경유로 전환 시 아래 정책 제거.
drop policy if exists "exercises insertable by authenticated" on public.exercises;
create policy "exercises insertable by authenticated"
  on public.exercises for insert to authenticated with check (true);

drop policy if exists "exercises updatable by authenticated" on public.exercises;
create policy "exercises updatable by authenticated"
  on public.exercises for update to authenticated using (true) with check (true);

-- exercise_cues / tts_cache 는 1단계에선 write 안 함.
-- (클라우드 TTS 도입 시 Edge Function 또는 백오피스 경유)


-- ████████████████████████████████████████████████████████████
-- 03_extend_profiles.sql
-- ████████████████████████████████████████████████████████████

-- Extend profiles with the User health/basic fields from the Phase 1 type doc.
-- Maps the doc's "users" entity onto the existing public.profiles table
-- (profiles.id == auth.users.id, 1:1). Run AFTER 01_init_profiles.sql.
--
-- Doc -> column mapping:
--   이름            -> display_name (already exists)
--   나이            -> age                  (만 나이, integer)
--   성별            -> gender               ('M' | 'F')
--   키 (cm)         -> height               (cm, 100~250)
--   몸무게 (kg)     -> weight               (kg, 20~300, 소수 허용)
--   운동경험        -> exercise_level       ('beginner'|'intermediate'|'advanced' = 초보/중급/고급)
--   부상이력        -> injury_history       (자유 텍스트, 선택)
--   건강 제약사항   -> medical_conditions   (자유 텍스트, 선택)
--   피해야 할 부위  -> avoid_exercise_parts (text[], 다중선택)
-- All columns are nullable: onboarding STEP 2 fills them in after login.

alter table public.profiles
  add column if not exists age integer,
  add column if not exists gender text,
  add column if not exists height numeric(5, 2),
  add column if not exists weight numeric(5, 2),
  add column if not exists exercise_level text,
  add column if not exists injury_history text,
  add column if not exists medical_conditions text,
  add column if not exists avoid_exercise_parts text[];

-- Range / enum checks (guarded so re-running is a no-op).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_age_check') then
    alter table public.profiles
      add constraint profiles_age_check check (age is null or age between 1 and 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_gender_check') then
    alter table public.profiles
      add constraint profiles_gender_check check (gender is null or gender in ('M', 'F'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_height_check') then
    alter table public.profiles
      add constraint profiles_height_check check (height is null or height between 100 and 250);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_weight_check') then
    alter table public.profiles
      add constraint profiles_weight_check check (weight is null or weight between 20 and 300);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_exercise_level_check') then
    alter table public.profiles
      add constraint profiles_exercise_level_check
      check (exercise_level is null or exercise_level in ('beginner', 'intermediate', 'advanced'));
  end if;
end $$;


-- ████████████████████████████████████████████████████████████
-- 04_init_meals.sql
-- ████████████████████████████████████████████████████████████

-- meals (식단 기록) + RLS
-- Paste into Supabase SQL Editor and run once. Depends on 01_init_profiles.sql (auth.users).
--
-- 현 UI(diet.tsx)는 끼니별로 칼로리·탄단지를 비정규화로 들고 있어, 이 테이블도
-- UI Meal 타입에 1:1로 매핑되는 단일 테이블로 둔다. foods 카탈로그 정규화는 추후 별도 마이그레이션.

-- ============================================================
-- meals table
-- ============================================================
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null default current_date,
  meal_type text not null check (meal_type in ('아침', '점심', '저녁', '간식')),
  name text not null,
  kcal integer not null default 0 check (kcal >= 0),
  carb integer not null default 0 check (carb >= 0),
  protein integer not null default 0 check (protein >= 0),
  fat integer not null default 0 check (fat >= 0),
  eaten_at timestamptz not null default now(),
  input_method text not null default 'manual' check (input_method in ('image', 'voice', 'manual')),
  created_at timestamptz not null default now()
);

-- 하루치 조회용 인덱스 (user_id + log_date)
create index if not exists meals_user_date_idx
  on public.meals (user_id, log_date);

-- ============================================================
-- RLS — own rows only
-- ============================================================
alter table public.meals enable row level security;

drop policy if exists "meals: read own" on public.meals;
create policy "meals: read own" on public.meals
  for select using (auth.uid() = user_id);

drop policy if exists "meals: insert own" on public.meals;
create policy "meals: insert own" on public.meals
  for insert with check (auth.uid() = user_id);

drop policy if exists "meals: update own" on public.meals;
create policy "meals: update own" on public.meals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "meals: delete own" on public.meals;
create policy "meals: delete own" on public.meals
  for delete using (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████
-- 05_memberships.sql
-- ████████████████████████████████████████████████████████████

-- memberships table + RLS (owner-only) + seed data for the test account.
-- Run AFTER 02_extend_profiles.sql. Paste into Supabase SQL Editor.
--
-- Doc -> column mapping:
--   회원권명     -> name
--   월비용/총액  -> cost        (원 단위 정수)
--   기간         -> period      ('month'|'3month'|'6month'|'12month')
--   시작일       -> start_date
--   종료일       -> end_date    (start_date + period; stored, not derived)
--   회원권 형태  -> type        ('free'|'session'|'class' = 자유이용권/세션권/예약권)
--   최대 횟수    -> max_visits  (세션권=계약 횟수, 예약권=횟수제, 무제한/자유이용권=null)

-- ============================================================
-- memberships table
-- ============================================================
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  cost integer not null default 0 check (cost >= 0),
  period text not null check (period in ('month', '3month', '6month', '12month')),
  start_date date not null,
  end_date date not null,
  type text not null check (type in ('free', 'session', 'class')),
  max_visits integer check (max_visits is null or max_visits > 0),
  created_at timestamptz not null default now()
);

create index if not exists memberships_user_id_idx on public.memberships (user_id);

-- ============================================================
-- RLS — own rows only (admin policies deferred per role strategy)
-- ============================================================
alter table public.memberships enable row level security;

drop policy if exists "memberships: read own" on public.memberships;
create policy "memberships: read own" on public.memberships
  for select using (auth.uid() = user_id);

drop policy if exists "memberships: insert own" on public.memberships;
create policy "memberships: insert own" on public.memberships
  for insert with check (auth.uid() = user_id);

drop policy if exists "memberships: update own" on public.memberships;
create policy "memberships: update own" on public.memberships
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "memberships: delete own" on public.memberships;
create policy "memberships: delete own" on public.memberships
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 시드(데모 데이터)는 여기서 넣지 않습니다.
-- 08_seed_demo_data.sql 이 전 테이블(memberships 포함)을 한 번에 채웁니다:
--   seed_demo_data_for_user() 함수 + 신규 계정 자동 트리거 + 기존 계정 백필.
-- ============================================================


-- ████████████████████████████████████████████████████████████
-- 06_workout_logs.sql
-- ████████████████████████████████████████████████████████████

-- workout_logs: 운동 완료 기록
create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_title text not null,
  routine_meta text not null,
  duration_min int not null,
  exercise_count int not null,
  difficulty text not null check (difficulty in ('easy', 'good', 'hard')),
  pain_areas text[] not null default '{}',
  completion_status text not null check (completion_status in ('completed', 'partial', 'missed')),
  memo text,
  ai_feedback jsonb,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.workout_logs enable row level security;

-- 본인 기록만 읽기/쓰기
create policy "workout_logs: own read"
  on public.workout_logs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "workout_logs: own insert"
  on public.workout_logs for insert
  to authenticated
  with check (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████
-- 07_centers.sql
-- ████████████████████████████████████████████████████████████

-- centers table + RLS (owner-only). Run AFTER 03_memberships.sql.
--
-- Doc -> column mapping:
--   센터명   -> name
--   주소     -> address
--   위도     -> latitude   (numeric(10,8), -90~90)
--   경도     -> longitude  (numeric(11,8), -180~180)
-- membership_id links the center to its membership (STEP 3 onboarding).

create table if not exists public.centers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete cascade,
  name text not null,
  address text,
  latitude numeric(10, 8) check (latitude is null or latitude between -90 and 90),
  longitude numeric(11, 8) check (longitude is null or longitude between -180 and 180),
  created_at timestamptz not null default now()
);

create index if not exists centers_user_id_idx on public.centers (user_id);
create index if not exists centers_membership_id_idx on public.centers (membership_id);

alter table public.centers enable row level security;

drop policy if exists "centers: read own" on public.centers;
create policy "centers: read own" on public.centers
  for select using (auth.uid() = user_id);

drop policy if exists "centers: insert own" on public.centers;
create policy "centers: insert own" on public.centers
  for insert with check (auth.uid() = user_id);

drop policy if exists "centers: update own" on public.centers;
create policy "centers: update own" on public.centers
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "centers: delete own" on public.centers;
create policy "centers: delete own" on public.centers
  for delete using (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████
-- 08_visits.sql
-- ████████████████████████████████████████████████████████████

-- visits table + RLS (owner-only). Run AFTER 04_centers.sql.
--
-- Doc -> column mapping:
--   체크인 시각      -> check_in_time
--   체크아웃 시각    -> check_out_time         (선택)
--   총 운동 시간(분) -> total_exercise_minutes (선택)
--   기분             -> mood   ('good'|'normal'|'tired' = 좋음/보통/피곤)
--   메모             -> notes
--   상태             -> status ('checked_in' 기본)

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  membership_id uuid not null references public.memberships (id) on delete cascade,
  center_name text,
  check_in_time timestamptz not null default now(),
  check_out_time timestamptz,
  total_exercise_minutes integer check (total_exercise_minutes is null or total_exercise_minutes >= 0),
  mood text check (mood is null or mood in ('good', 'normal', 'tired')),
  notes text,
  status text not null default 'checked_in',
  created_at timestamptz not null default now()
);

create index if not exists visits_user_id_idx on public.visits (user_id);
create index if not exists visits_membership_id_idx on public.visits (membership_id);

alter table public.visits enable row level security;

drop policy if exists "visits: read own" on public.visits;
create policy "visits: read own" on public.visits
  for select using (auth.uid() = user_id);

drop policy if exists "visits: insert own" on public.visits;
create policy "visits: insert own" on public.visits
  for insert with check (auth.uid() = user_id);

drop policy if exists "visits: update own" on public.visits;
create policy "visits: update own" on public.visits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "visits: delete own" on public.visits;
create policy "visits: delete own" on public.visits
  for delete using (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████
-- 09_exercise_records.sql
-- ████████████████████████████████████████████████████████████

-- exercise_records table + RLS (owner-only). Run AFTER 05_visits.sql.
--
-- Doc -> column mapping:
--   운동 부위   -> exercise_part  (가슴/등/다리/전신 …)
--   강도        -> intensity      ('easy'|'normal'|'hard' = 쉬움/보통/힘듦)
--   운동 시간   -> duration       (분, 선택)
--   메모        -> notes
--   자동 데이터 -> auto_data jsonb { distance, calories, speed, source }
--                  source: 'manual' | 'ocr'
--   기록 시각   -> recorded_at

create table if not exists public.exercise_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  visit_id uuid not null references public.visits (id) on delete cascade,
  exercise_part text not null,
  intensity text check (intensity is null or intensity in ('easy', 'normal', 'hard')),
  duration integer check (duration is null or duration >= 0),
  notes text,
  auto_data jsonb,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists exercise_records_user_id_idx on public.exercise_records (user_id);
create index if not exists exercise_records_visit_id_idx on public.exercise_records (visit_id);

alter table public.exercise_records enable row level security;

drop policy if exists "exercise_records: read own" on public.exercise_records;
create policy "exercise_records: read own" on public.exercise_records
  for select using (auth.uid() = user_id);

drop policy if exists "exercise_records: insert own" on public.exercise_records;
create policy "exercise_records: insert own" on public.exercise_records
  for insert with check (auth.uid() = user_id);

drop policy if exists "exercise_records: update own" on public.exercise_records;
create policy "exercise_records: update own" on public.exercise_records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "exercise_records: delete own" on public.exercise_records;
create policy "exercise_records: delete own" on public.exercise_records
  for delete using (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████
-- 10_user_preferences.sql
-- ████████████████████████████████████████████████████████████

-- user_preferences table + RLS (owner-only). Run AFTER 06_exercise_records.sql.
--
-- Phase 2 feature: the TABLE STRUCTURE is created now but the feature is NOT
-- activated (no form / no AI recommendation yet). Created here so later phases
-- can write to it without another migration round-trip.
--
-- Doc -> column mapping:
--   선호 운동 시간대 -> preferred_exercise_times text[]  (예: {"06:00-08:00"})
--   선호 운동 부위   -> preferred_exercise_parts text[]  (예: {"chest","back"})
--   운동 목표        -> fitness_goal ('muscle_gain'|'fat_loss'|'endurance'
--                       = 근력증가/지방감소/체력향상)
-- One row per user (unique user_id).

create table if not exists public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  preferred_exercise_times text[],
  preferred_exercise_parts text[],
  fitness_goal text check (fitness_goal is null or fitness_goal in ('muscle_gain', 'fat_loss', 'endurance')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reuse the set_updated_at() function defined in 01_init_profiles.sql.
drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences: read own" on public.user_preferences;
create policy "user_preferences: read own" on public.user_preferences
  for select using (auth.uid() = user_id);

drop policy if exists "user_preferences: insert own" on public.user_preferences;
create policy "user_preferences: insert own" on public.user_preferences
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_preferences: update own" on public.user_preferences;
create policy "user_preferences: update own" on public.user_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_preferences: delete own" on public.user_preferences;
create policy "user_preferences: delete own" on public.user_preferences
  for delete using (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████
-- 11_seed_demo_data.sql
-- ████████████████████████████████████████████████████████████

-- 08_seed_demo_data.sql — 전 테이블 데모(가) 데이터. Run AFTER 07_user_preferences.sql.
--
-- 함수 seed_demo_data_for_user(uid) 하나로 6개 테이블을 FK 관계까지 일관되게 채우고,
-- 이를 (a) 신규 계정 자동 트리거 + (b) 기존 계정 백필 에 재사용합니다.
--   memberships → centers/visits (membership FK) → exercise_records (visit FK)
--
-- ⚠️ 개발용입니다. 프로덕션 전환 시 자동 트리거(on_auth_user_created_demo_seed)를 제거하세요.
--    (실제 가입자에게 가짜 데이터가 들어가면 안 되므로)

-- ============================================================
-- 한 유저에 전 테이블 데모 데이터 (계정별 멱등: 이미 회원권 있으면 skip)
-- security definer: 신규 계정 트리거 컨텍스트에서도 RLS 우회해 insert.
-- ============================================================
create or replace function public.seed_demo_data_for_user(uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m_pt uuid;
  m_yoga uuid;
  m_pilates uuid;
  v_id uuid;
begin
  -- 이미 시드된 계정이면 아무것도 하지 않음 (중복 방지)
  if exists (select 1 from public.memberships where user_id = uid) then
    return;
  end if;

  -- 1) profiles — 건강·기본 정보 (행 자체는 handle_new_user 트리거가 이미 생성)
  update public.profiles set
    age = 28,
    gender = 'M',
    height = 175,
    weight = 72.5,
    exercise_level = 'intermediate',
    injury_history = '오른쪽 어깨 회전근개 경미 (2024)',
    medical_conditions = null,
    avoid_exercise_parts = array['shoulder']
  where id = uid;

  -- 2) memberships — 3건 (기준일 ~2026-06-09: 사용중 2 + 만료 1)
  insert into public.memberships (user_id, name, cost, period, start_date, end_date, type, max_visits)
  values (uid, '강남 PT 30회', 1800000, '6month', date '2026-04-01', date '2026-10-01', 'session', 30)
  returning id into m_pt;

  insert into public.memberships (user_id, name, cost, period, start_date, end_date, type, max_visits)
  values (uid, '요가 1개월권', 120000, 'month', date '2026-06-01', date '2026-07-01', 'free', null)
  returning id into m_yoga;

  insert into public.memberships (user_id, name, cost, period, start_date, end_date, type, max_visits)
  values (uid, '필라테스 10회', 350000, '3month', date '2026-02-01', date '2026-05-01', 'class', 10)
  returning id into m_pilates;

  -- 3) centers — membership 별 센터 (GPS: 서울 강남 일대 예시)
  insert into public.centers (user_id, membership_id, name, address, latitude, longitude) values
    (uid, m_pt,      '강남 피트니스',        '서울 강남구 테헤란로 123', 37.50120000, 127.03680000),
    (uid, m_yoga,    '요가 스튜디오 압구정', '서울 강남구 압구정로 45',  37.52700000, 127.02850000),
    (uid, m_pilates, '코어 필라테스 선릉',   '서울 강남구 선릉로 200',   37.50450000, 127.04900000);

  -- 4) visits + 5) exercise_records — 방문마다 운동 기록 연결
  -- PT 방문 #1 (하체)
  insert into public.visits (user_id, membership_id, center_name, check_in_time, check_out_time, total_exercise_minutes, mood, notes, status)
  values (uid, m_pt, '강남 피트니스', timestamptz '2026-06-01 19:00+09', timestamptz '2026-06-01 20:10+09', 70, 'good', '하체 집중', 'checked_in')
  returning id into v_id;
  insert into public.exercise_records (user_id, visit_id, exercise_part, intensity, duration, notes, auto_data) values
    (uid, v_id, 'legs', 'hard',   40, '스쿼트 5x5, 레그프레스 4세트', null),
    (uid, v_id, 'core', 'normal', 20, '플랭크 3세트, 행잉레그레이즈', null);

  -- PT 방문 #2 (상체 + 유산소, OCR 자동데이터 예시)
  insert into public.visits (user_id, membership_id, center_name, check_in_time, check_out_time, total_exercise_minutes, mood, notes, status)
  values (uid, m_pt, '강남 피트니스', timestamptz '2026-06-04 18:30+09', timestamptz '2026-06-04 19:40+09', 70, 'normal', '상체 + 가벼운 유산소', 'checked_in')
  returning id into v_id;
  insert into public.exercise_records (user_id, visit_id, exercise_part, intensity, duration, notes, auto_data) values
    (uid, v_id, 'chest',  'normal', 35, '벤치프레스, 인클라인 덤벨', null),
    (uid, v_id, 'cardio', 'easy',   20, '트레드밀 (러닝머신 OCR)', '{"distance": 3.2, "calories": 240, "speed": 9.6, "source": "ocr"}'::jsonb);

  -- 요가 방문 #1 (전신)
  insert into public.visits (user_id, membership_id, center_name, check_in_time, check_out_time, total_exercise_minutes, mood, notes, status)
  values (uid, m_yoga, '요가 스튜디오 압구정', timestamptz '2026-06-06 07:00+09', timestamptz '2026-06-06 08:00+09', 60, 'good', '아침 빈야사', 'checked_in')
  returning id into v_id;
  insert into public.exercise_records (user_id, visit_id, exercise_part, intensity, duration, notes, auto_data) values
    (uid, v_id, 'fullbody', 'easy', 60, '빈야사 플로우', null);

  -- 6) user_preferences — Phase 2 (구조만 활성). 데모 1건.
  insert into public.user_preferences (user_id, preferred_exercise_times, preferred_exercise_parts, fitness_goal)
  values (uid, array['06:00-08:00', '18:00-20:00'], array['chest', 'back', 'legs'], 'muscle_gain')
  on conflict (user_id) do nothing;
end;
$$;

-- ============================================================
-- 신규 계정 자동 시드 트리거 (개발용)
-- profile 생성(on_auth_user_created) 직후 실행되도록 트리거 이름을 잡았습니다.
-- 시드 실패가 회원가입을 막지 않도록 예외를 흡수합니다.
-- ⚠️ 프로덕션 전 이 트리거를 제거하세요.
-- ============================================================
create or replace function public.handle_new_user_demo_seed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform public.seed_demo_data_for_user(new.id);
  exception when others then
    raise warning 'demo seed skipped for %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_demo_seed on auth.users;
create trigger on_auth_user_created_demo_seed
  after insert on auth.users
  for each row execute function public.handle_new_user_demo_seed();

-- ============================================================
-- 기존 모든 계정 백필 (개발용 리셋)
-- ⚠️ 각 계정의 기존 memberships(+cascade로 centers/visits/exercise_records)와
--    user_preferences 를 지우고 데모 데이터를 새로 만듭니다.
--    수동으로 넣은 데이터가 있으면 사라지니, 개발 환경에서만 실행하세요.
-- ============================================================
do $$
declare
  u record;
  n integer := 0;
begin
  for u in select id from auth.users loop
    delete from public.memberships where user_id = u.id;       -- cascade: centers/visits/exercise_records
    delete from public.user_preferences where user_id = u.id;  -- membership FK가 아니라 별도 삭제
    perform public.seed_demo_data_for_user(u.id);
    n := n + 1;
  end loop;
  raise notice 'demo seed: reset + seeded % account(s).', n;
end $$;


-- ████████████████████████████████████████████████████████████
-- 12_disable_demo_seed_trigger.sql
-- ████████████████████████████████████████████████████████████

-- 09_disable_demo_seed_trigger.sql — 온보딩에서 회원권을 직접 등록하므로,
-- 08의 "신규 계정 자동 시드 트리거"를 비활성화합니다.
-- Run AFTER 08. 기존 DB에는 이 파일만 SQL Editor에서 Run 하면 트리거가 제거됩니다.
--
-- seed_demo_data_for_user() 함수와 백필 결과는 그대로 둡니다(개발용 수동 시드에 사용).
-- 다시 켜려면 08의 create trigger 블록을 재실행하세요.

drop trigger if exists on_auth_user_created_demo_seed on auth.users;


-- ████████████████████████████████████████████████████████████
-- 13_backfill_centers.sql
-- ████████████████████████████████████████████████████████████

-- 10_backfill_centers.sql — 센터(좌표) 없는 회원권에 기본 좌표 보정 (개발/테스트용).
-- Run AFTER 09. GPS 도착·날씨·경로는 센터 좌표가 있어야 동작하는데, 온보딩으로
-- 등록한 회원권 중 좌표를 안 넣은 것은 센터가 없다. 그런 회원권에 기본 좌표(강남역)를
-- 채운다. 멱등: 이미 센터가 있는 회원권은 건너뛴다.
--
-- ※ 이후 회원권 등록 시 '현재 위치를 센터로' 버튼으로 좌표를 넣으면 이 보정은 불필요.

insert into public.centers (user_id, membership_id, name, latitude, longitude)
select m.user_id, m.id, m.name, 37.49794500, 127.02758100
from public.memberships m
where not exists (
  select 1 from public.centers c where c.membership_id = m.id
);


-- ████████████████████████████████████████████████████████████
-- 14_exercise_records_by_type.sql
-- ████████████████████████████████████████████████████████████

-- 11_exercise_records_by_type.sql — 운동기록을 회원권 형태별로 저장 (PART 4).
-- 자유이용권: 부위/강도/시간. 세션권(PT): 트레이너명. 예약권(클래스): 클래스명.
-- PT/클래스는 '부위' 개념이 없으므로 exercise_part를 nullable로 완화하고,
-- 형태별 부가정보(트레이너명/클래스명/종류/상태)는 기존 auto_data(jsonb)에 저장한다.
--   auto_data 예: { "kind": "session", "trainer": "김코치", "status": "세션 완료" }
--                 { "kind": "class", "className": "스피닝", "status": "수강 완료" }
--                 { "kind": "free", "status": "운동 완료" }
-- 멱등: drop not null / drop table if exists 는 재실행 안전.

alter table public.exercise_records alter column exercise_part drop not null;

-- db:push 검증용 임시 테이블 정리.
drop table if exists public._db_push_test;


-- ████████████████████████████████████████████████████████████
-- 15_onboarding.sql
-- ████████████████████████████████████████████████████████████

-- 12_onboarding.sql — 최초 로그인 온보딩.
--  · profiles.onboarded: 온보딩 완료 여부(첫 진입 위저드 노출 판단).
--    기존 회원권 보유 사용자는 완료로 간주해 재노출 방지(backfill).
--  · 운동 목표(fitness_goal)를 기획서 5종으로 확장:
--    근력(muscle_gain)/감량(fat_loss)/지구력(endurance) + 건강관리(health)/체형개선(body_shape)/습관형성(habit)
-- 멱등: add column if not exists / drop constraint if exists 재실행 안전.

alter table public.profiles add column if not exists onboarded boolean not null default false;

update public.profiles p
set onboarded = true
where p.onboarded = false
  and exists (select 1 from public.memberships m where m.user_id = p.id);

alter table public.user_preferences drop constraint if exists user_preferences_fitness_goal_check;
alter table public.user_preferences add constraint user_preferences_fitness_goal_check
  check (
    fitness_goal is null or fitness_goal in (
      'muscle_gain', 'fat_loss', 'endurance', 'health', 'body_shape', 'habit'
    )
  );


-- ████████████████████████████████████████████████████████████
-- 16_food_favorites.sql
-- ████████████████████████████████████████████████████████████

-- food_favorites: 음식 즐겨찾기 (user_id + name 쌍으로 중복 방지)
create table if not exists public.food_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kcal integer not null default 0 check (kcal >= 0),
  carb integer not null default 0 check (carb >= 0),
  protein integer not null default 0 check (protein >= 0),
  fat integer not null default 0 check (fat >= 0),
  serving_size text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists food_favorites_user_idx
  on public.food_favorites (user_id);

alter table public.food_favorites enable row level security;

drop policy if exists "food_favorites: read own" on public.food_favorites;
create policy "food_favorites: read own" on public.food_favorites
  for select using (auth.uid() = user_id);

drop policy if exists "food_favorites: insert own" on public.food_favorites;
create policy "food_favorites: insert own" on public.food_favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists "food_favorites: delete own" on public.food_favorites;
create policy "food_favorites: delete own" on public.food_favorites
  for delete using (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████
-- 17_workout_logs_body_part.sql
-- ████████████████████████████████████████████████████████████

-- workout_logs: body_part 컬럼 추가 (식단 탭 운동 연동용)
-- 값: 'lower' | 'upper' | 'full' | 'cardio' | null
-- complete.tsx가 routine_title 키워드를 파싱해 저장한다.
alter table public.workout_logs
  add column if not exists body_part text
    check (body_part in ('lower', 'upper', 'full', 'cardio'));


-- ████████████████████████████████████████████████████████████
-- 18_exercises_extend.sql
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- 16_exercises_extend.sql
-- exercises 카탈로그를 추천 엔진의 후보 필터링·루틴 조립에 쓰기 위해
-- 메타데이터·기본값·코칭 큐 컬럼을 추가한다.
--
-- 기존 행은 LLM 자동 upsert로 쌓인 임시 데이터이므로 비운 뒤
-- 17_exercises_seed_100.sql 에서 카탈로그를 다시 채운다.
-- ============================================================

truncate table public.exercises restart identity cascade;

-- 의미 명확화: category(모호) → body_region('상체'/'하체'/'코어'/'전신'/'유연성')
alter table public.exercises
  rename column category to body_region;

alter table public.exercises
  -- 분류 축
  add column exercise_type text[] not null default '{}',           -- '유산소','근력','유연성','균형','복합'
  add column goal_tags text[] not null default '{}',               -- '체중 감량','체력 향상','자세 개선'
  add column place_tags text[] not null default '{}',              -- '집','야외','헬스장'
  add column phase_tags text[] not null default '{}',              -- 'warmup','main','cooldown'
  add column target_parts text[] not null default '{}',            -- 자극하는 부위
  add column contraindicated_parts text[] not null default '{}',   -- 이 부위가 불편하면 피해야 함
  add column equipment text[] not null default '{}',               -- 필요 장비 (빈 배열 = 맨몸)
  add column is_high_impact boolean not null default false,        -- 점프·뜀 동작 (집에서 층간소음)
  add column intensity int not null default 3,                     -- 1(매우 가벼움) ~ 5(매우 격렬)
  -- 세트 기반: 기본값·안전 범위
  add column default_sets int,
  add column default_reps int,
  add column min_reps int,
  add column max_reps int,
  -- 시간 기반: 기본값·안전 범위 (초)
  add column default_duration_sec int,
  add column min_duration_sec int,
  add column max_duration_sec int,
  -- 코칭 큐 (rep-scripts.ts / session.tsx가 그대로 소비)
  add column early_reps text[] not null default '{}',              -- 세트 기반: 초반 2개 ({count} 포함)
  add column middle_reps text[] not null default '{}',             -- 세트 기반: 중반 5개 generic 풀
  add column form_cues text[] not null default '{}',               -- 세트 기반: 운동 특화 폼 큐 2~3개 ({count} 포함)
                                                                   --   런타임에 middle_reps 슬롯 0/2/4 자리에 끼워 넣어 발화한다.
  add column final_reps text[] not null default '{}',              -- 세트 기반: 마지막 3개
  add column time_scripts text[] not null default '{}',            -- 시간 기반: 순차 cue (운동별 specific)
  add column halfway_encouragement text not null default '';       -- 시간 기반: 절반 시점 격려

alter table public.exercises
  add constraint exercises_intensity_range check (intensity between 1 and 5),
  -- 세트/시간 중 하나만 채워져야 함 (둘 다 비거나 둘 다 차면 무결성 위배)
  add constraint exercises_set_or_time check (
    (default_sets is not null and default_reps is not null and default_duration_sec is null)
    or
    (default_sets is null and default_reps is null and default_duration_sec is not null)
  );

-- 후보 필터링용 GIN 인덱스 (배열 contains/overlap 쿼리에 적합)
create index if not exists exercises_exercise_type_gin
  on public.exercises using gin (exercise_type);
create index if not exists exercises_goal_tags_gin
  on public.exercises using gin (goal_tags);
create index if not exists exercises_place_tags_gin
  on public.exercises using gin (place_tags);
create index if not exists exercises_phase_tags_gin
  on public.exercises using gin (phase_tags);
create index if not exists exercises_target_parts_gin
  on public.exercises using gin (target_parts);
create index if not exists exercises_contraindicated_parts_gin
  on public.exercises using gin (contraindicated_parts);
create index if not exists exercises_equipment_gin
  on public.exercises using gin (equipment);
create index if not exists exercises_intensity_idx
  on public.exercises (intensity);
-- form_cues 는 검색축이 아니라 페이로드라 인덱스 불필요.


-- ████████████████████████████████████████████████████████████
-- 19_exercises_seed_100.sql
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- 17_exercises_seed_100.sql
-- AI 운동 루틴 추천의 1차 후보 카탈로그 (총 100개).
--
-- 큐레이션 기준:
--   - 너무 비슷한 것 제외, 유명한 종류 위주
--   - 부위 4 × 20 + 스트레칭 20 = 100, 균등 분포
--   - 스트레칭은 phase_tags 로 세분: warmup / cooldown / recovery
--
-- 멘트 차별화:
--   - 세트 기반: middle_reps(공통 풀) + form_cues(운동 특화 2~3개)
--     런타임에 middle_reps 슬롯 0/2/4 자리에 form_cues 가 끼어듦.
--   - 시간 기반: time_scripts 를 운동별로 specific 하게 inline.
-- ============================================================

do $$
declare
  -- ── 세트 기반 generic 풀 ────────────────────────────────────
  -- form_cues 가 슬롯 0/2/4 에 끼어들고, 1/3 만 generic 으로 남는 구조.
  -- 슬롯 0/2/4 의 generic 값은 form_cues 가 없을 때 fallback.
  m_general text[] := array[
    '{count}, 호흡을 유지하세요.',
    '{count}, 좋아요. 자세 신경쓰면서 갑니다.',
    '{count}, 천천히 컨트롤해요.',
    '{count}, 코어에 힘을 주세요.',
    '{count}, 자세 좋아요.'
  ];
  m_cardio text[] := array[
    '{count}, 호흡을 같이 가요.',
    '{count}, 리듬을 유지해요.',
    '{count}, 시선은 앞을 봐요.',
    '{count}, 코어를 단단히 하세요.',
    '{count}, 자세 좋아요.'
  ];
  m_dumbbell text[] := array[
    '{count}, 호흡을 유지하세요.',
    '{count}, 덤벨은 흔들리지 않게 합니다.',
    '{count}, 천천히 컨트롤해요.',
    '{count}, 어깨를 내리세요.',
    '{count}, 자세를 정확히 유지하세요.'
  ];
  m_easy text[] := array[
    '{count}, 편안하게 호흡하세요.',
    '{count}, 호흡을 같이 가주세요.',
    '{count}, 천천히 자세를 신경써주세요.',
    '{count}, 어깨 힘을 빼세요.',
    '{count}, 좋아요.'
  ];

  e_general text[] := array['{count}, 자세 잡고 천천히 시작해요.', '{count}, 좋아요. 호흡 같이 가요.'];
  e_easy text[] := array['{count}, 가볍게 시작해요. 호흡은 편하게.', '{count}, 좋아요. 무리하지 말고요.'];
  e_focus text[] := array['{count}, 자세 정확히 잡아요.', '{count}, 좋아요. 코어에 힘을 줍니다.'];

  f_general text[] := array['{count}, 거의 다 왔어요.', '{count}, 한 번만 더 가요.', '{count}, 마지막이에요. 천천히 마무리해요.'];
  f_strong text[] := array['{count}, 마지막 세 번. 힘내요.', '{count}, 두 번 남았어요.', '{count}, 마지막이에요. 끝까지 마무리합니다.'];
  f_gentle text[] := array['{count}, 거의 끝났어요.', '{count}, 한 번만 더요.', '{count}, 마지막. 천천히 마무리해요.'];

begin

insert into public.exercises (
  name, body_region, exercise_type, goal_tags, place_tags, phase_tags,
  target_parts, contraindicated_parts, equipment, is_high_impact, intensity,
  default_sets, default_reps, min_reps, max_reps,
  default_duration_sec, min_duration_sec, max_duration_sec,
  description_text, caution_text,
  early_reps, middle_reps, final_reps, time_scripts, halfway_encouragement,
  form_cues
) values

-- ============================================================
-- 상체 (1-20) : 가슴·어깨·등·팔
-- ============================================================
('푸시업', '상체', array['근력'], array['체력 향상','자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['가슴','어깨','삼두'], array['손목','어깨'], array[]::text[],
 false, 3, 3, 10, 6, 18, null, null, null,
 '손을 어깨 너비로 짚고 몸을 일직선으로 유지한 채 내려갔다 올라옵니다.',
 '허리가 처지지 않게 코어에 힘 주세요.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 가슴이 바닥에 닿을 듯 내려가요.','{count}, 팔꿈치는 옆구리쪽 45도로요.','{count}, 어깨가 귀에 붙지 않게 합니다.']),

('무릎 푸시업', '상체', array['근력'], array['체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['가슴','어깨','삼두'], array['손목'], array['매트'],
 false, 2, 3, 12, 8, 20, null, null, null,
 '무릎을 바닥에 댄 채 푸시업 자세로 천천히 내려갔다 올라옵니다.',
 '손목이 아프면 주먹을 쥐고 해도 좋아요.',
 e_easy, m_general, f_gentle, array[]::text[], '',
 array['{count}, 무릎부터 머리까지 일직선으로 유지합니다.','{count}, 가슴부터 천천히 바닥으로 내려갑니다.','{count}, 손목 바로 위에 어깨 두세요.']),

('인클라인 푸시업', '상체', array['근력'], array['체력 향상'],
 array['집','야외','헬스장'], array['warmup','main'],
 array['가슴','어깨'], array['손목'], array[]::text[],
 false, 2, 3, 12, 8, 20, null, null, null,
 '의자나 벤치에 손을 짚고 몸을 비스듬히 한 채 푸시업해요.',
 '팔꿈치가 너무 벌어지지 않게 45도 정도로요.',
 e_easy, m_general, f_gentle, array[]::text[], '',
 array['{count}, 의자를 단단히 짚어요.','{count}, 가슴부터 의자에 가까이 내려옵니다.','{count}, 몸은 비스듬한 일직선이요.']),

('다이아몬드 푸시업', '상체', array['근력'], array['체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['삼두','가슴'], array['손목','어깨'], array[]::text[],
 false, 4, 3, 8, 4, 12, null, null, null,
 '엄지와 검지로 다이아몬드를 만들어 손을 모은 뒤 푸시업해요.',
 '난이도 높습니다. 힘들다면 무릎 푸시업으로 대체해보세요.',
 e_focus, m_general, f_strong, array[]::text[], '',
 array['{count}, 손가락은 다이아몬드 모양 유지합니다.','{count}, 팔꿈치는 옆구리에 붙여요.','{count}, 삼두로 미는 느낌이에요.']),

('파이크 푸시업', '상체', array['근력'], array['체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['어깨','삼두'], array['어깨','손목'], array['매트'],
 false, 4, 3, 8, 4, 12, null, null, null,
 '엉덩이를 높게 들고 머리가 바닥에 닿도록 내려갔다 올라옵니다.',
 '어깨에 통증 있으면 즉시 중단하세요.',
 e_focus, m_general, f_strong, array[]::text[], '',
 array['{count}, 엉덩이를 최대한 천장으로.','{count}, 머리가 손 사이로 내려가요.','{count}, 어깨로 밀어 올려요.']),

('트라이셉 딥', '상체', array['근력'], array['체력 향상'],
 array['집','헬스장'], array['main'],
 array['삼두','어깨'], array['어깨','손목'], array[]::text[],
 false, 3, 3, 10, 6, 15, null, null, null,
 '의자 끝을 짚고 엉덩이를 들어 팔꿈치를 굽혔다 폅니다.',
 '어깨가 너무 떨어지지 않게 주의하세요.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 엉덩이를 의자 가까이로요.','{count}, 팔꿈치는 뒤로 곧게요.','{count}, 어깨가 솟지 않게요.']),

('슈퍼맨', '상체', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['등','엉덩이'], array[]::text[], array['매트'],
 false, 2, 3, 12, 8, 20, null, null, null,
 '엎드린 자세에서 팔과 다리를 동시에 들어올려 등을 조여요.',
 '허리에 통증 있으면 팔만 들어요.',
 e_easy, m_general, f_gentle, array[]::text[], '',
 array['{count}, 팔과 다리를 동시에 들어올립니다.','{count}, 엉덩이를 꽉 조여요.','{count}, 목은 자연스럽게 유지하세요.']),

('인버티드 로우', '상체', array['근력'], array['자세 개선','체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['등','이두'], array['어깨'], array[]::text[],
 false, 3, 3, 10, 6, 15, null, null, null,
 '봉이나 단단한 테이블 아래 누워 가슴을 봉 쪽으로 당겨요.',
 '단단한 지지대가 필수에요. 흔들리면 위험합니다.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 가슴을 봉 쪽으로 당겨요.','{count}, 견갑골을 조여요.','{count}, 몸은 일직선 유지합니다.']),

('풀업', '상체', array['근력'], array['체력 향상'],
 array['헬스장'], array['main'],
 array['등','이두','어깨'], array['어깨'], array[]::text[],
 false, 4, 3, 8, 3, 12, null, null, null,
 '봉에 매달려 턱이 봉 위로 올라가도록 몸을 당겨 올려요.',
 '어려우면 밴드 보조나 점프 풀업으로.',
 e_focus, m_general, f_strong, array[]::text[], '',
 array['{count}, 턱을 봉 위로 올려요.','{count}, 견갑골을 먼저 내려요.','{count}, 천천히 컨트롤하며 내려요.']),

('덤벨 숄더 프레스', '상체', array['근력'], array['체력 향상','자세 개선'],
 array['집','헬스장'], array['main'],
 array['어깨','삼두'], array['어깨','허리'], array['덤벨'],
 false, 3, 3, 10, 6, 15, null, null, null,
 '덤벨을 어깨 위에서 머리 위로 밀어 올렸다 천천히 내립니다.',
 '허리가 꺾이지 않게 코어에 힘을 주세요.',
 e_general, m_dumbbell, f_general, array[]::text[], '',
 array['{count}, 덤벨을 머리 위로 곧게 밀어요.','{count}, 팔꿈치는 약간 앞으로.','{count}, 천천히 어깨 옆으로 내려요.']),

('덤벨 바이셉 컬', '상체', array['근력'], array['체력 향상'],
 array['집','헬스장'], array['main'],
 array['이두'], array[]::text[], array['덤벨'],
 false, 3, 3, 12, 8, 18, null, null, null,
 '덤벨을 들고 팔꿈치를 고정한 채 어깨 쪽으로 들어올렸다 내려요.',
 '반동 쓰지 말고 천천히 올렸다 내립니다.',
 e_general, m_dumbbell, f_general, array[]::text[], '',
 array['{count}, 팔꿈치를 옆구리에 고정하세요.','{count}, 덤벨을 어깨까지 천천히 올리고 천천히 내립니다.','{count}, 내릴 때 더 천천히요.']),

('덤벨 해머 컬', '상체', array['근력'], array['체력 향상'],
 array['집','헬스장'], array['main'],
 array['이두','전완'], array[]::text[], array['덤벨'],
 false, 3, 3, 12, 8, 18, null, null, null,
 '덤벨을 망치 잡듯 세로로 잡고 손바닥이 마주보게 컬해요.',
 '반동 쓰지 마세요.',
 e_general, m_dumbbell, f_general, array[]::text[], '',
 array['{count}, 손바닥이 서로 마주보게요.','{count}, 팔꿈치 옆구리 고정.','{count}, 컨트롤하며 내려요.']),

('덤벨 트라이셉 익스텐션', '상체', array['근력'], array['체력 향상'],
 array['집','헬스장'], array['main'],
 array['삼두'], array['어깨'], array['덤벨'],
 false, 3, 3, 10, 6, 15, null, null, null,
 '덤벨 하나를 양손으로 머리 뒤로 내렸다 펴 올려요.',
 '팔꿈치를 좁게 고정한 채로요.',
 e_general, m_dumbbell, f_general, array[]::text[], '',
 array['{count}, 팔꿈치는 머리 옆에 고정.','{count}, 머리 뒤로 천천히 내려요.','{count}, 팔꿈치 안 벌어지게 내렸다 올립니다.']),

('덤벨 로우', '상체', array['근력'], array['자세 개선','체력 향상'],
 array['집','헬스장'], array['main'],
 array['등','이두'], array['허리'], array['덤벨'],
 false, 3, 3, 10, 6, 15, null, null, null,
 '한 손은 의자에 짚고 다른 손의 덤벨을 옆구리로 당겨요.',
 '등을 평평하게, 허리를 꺾지 마세요.',
 e_general, m_dumbbell, f_general, array[]::text[], '',
 array['{count}, 등으로 당기는 느낌으로요.','{count}, 팔꿈치를 옆구리 쪽으로요.','{count}, 허리는 평평하게요.']),

('덤벨 플라이', '상체', array['근력'], array['체력 향상'],
 array['집','헬스장'], array['main'],
 array['가슴','어깨'], array['어깨'], array['덤벨','매트'],
 false, 3, 3, 12, 8, 18, null, null, null,
 '누운 자세에서 덤벨을 양옆으로 펼쳤다 모아요.',
 '팔꿈치는 살짝 굽힌 채 유지.',
 e_general, m_dumbbell, f_general, array[]::text[], '',
 array['{count}, 팔꿈치는 살짝 굽힌 채로요.','{count}, 가슴 위로 모아요.','{count}, 천천히 양옆으로 펼쳐요.']),

('덤벨 사이드 레이즈', '상체', array['근력'], array['체력 향상'],
 array['집','헬스장'], array['main'],
 array['어깨'], array['어깨'], array['덤벨'],
 false, 3, 3, 12, 8, 18, null, null, null,
 '덤벨을 양옆으로 어깨 높이까지 들어올렸다 내려요.',
 '반동 쓰지 말고 천천히, 어깨 으쓱 금지.',
 e_general, m_dumbbell, f_general, array[]::text[], '',
 array['{count}, 어깨 높이까지 들어요.','{count}, 손등이 천장 향하게요.','{count}, 어깨 으쓱하지 마세요.']),

('덤벨 프론트 레이즈', '상체', array['근력'], array['체력 향상'],
 array['집','헬스장'], array['warmup','main'],
 array['어깨'], array['어깨'], array['덤벨'],
 false, 2, 3, 12, 8, 18, null, null, null,
 '덤벨을 정면으로 어깨 높이까지 들어올렸다 내려요.',
 '허리 꺾지 말고 코어로 버텨요.',
 e_easy, m_dumbbell, f_gentle, array[]::text[], '',
 array['{count}, 앞으로 어깨 높이까지요.','{count}, 팔꿈치 살짝만 굽혀요.','{count}, 반동 없이 천천히요.']),

('덤벨 풀오버', '상체', array['근력'], array['체력 향상'],
 array['집','헬스장'], array['main'],
 array['가슴','등'], array['어깨'], array['덤벨','매트'],
 false, 3, 3, 12, 8, 18, null, null, null,
 '누워 덤벨 하나를 양손으로 잡고 머리 뒤로 내렸다 가슴 위로 올려요.',
 '허리 뜨지 않게 코어로 눌러요.',
 e_general, m_dumbbell, f_general, array[]::text[], '',
 array['{count}, 덤벨을 머리 뒤로 내려요.','{count}, 가슴 늘어나는 느낌까지요.','{count}, 가슴 위로 다시 올려요.']),

('덤벨 리버스 플라이', '상체', array['근력'], array['자세 개선'],
 array['집','헬스장'], array['main'],
 array['후면 어깨','등'], array['허리'], array['덤벨'],
 false, 3, 3, 12, 8, 18, null, null, null,
 '상체를 숙인 채 덤벨을 양옆으로 날개처럼 펼쳤다 모아요.',
 '등을 평평하게, 허리 둥글지 않게.',
 e_general, m_dumbbell, f_general, array[]::text[], '',
 array['{count}, 양옆으로 날개처럼 펼쳐요.','{count}, 견갑골을 조여요.','{count}, 등을 평평하게 유지요.']),

('덤벨 슈러그', '상체', array['근력'], array['자세 개선'],
 array['집','헬스장'], array['main'],
 array['승모근'], array[]::text[], array['덤벨'],
 false, 2, 3, 15, 10, 20, null, null, null,
 '덤벨을 양옆으로 든 채 어깨를 귀 쪽으로 들어 올렸다 내려요.',
 '목을 앞으로 빼지 마세요.',
 e_easy, m_dumbbell, f_gentle, array[]::text[], '',
 array['{count}, 어깨를 귀 쪽으로 들어요.','{count}, 정점에서 1초 유지.','{count}, 천천히 내려요.']),

-- ============================================================
-- 하체 (21-40) : 엉덩이·허벅지·종아리
-- ============================================================
('스쿼트', '하체', array['근력'], array['체력 향상','자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['허벅지 앞','엉덩이','코어'], array['무릎'], array[]::text[],
 false, 3, 3, 12, 8, 20, null, null, null,
 '발을 어깨 너비로 벌리고 의자에 앉듯 엉덩이를 뒤로 빼며 내려가요.',
 '무릎이 발끝 안쪽으로 모이지 않게 주의.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 엉덩이를 의자에 앉듯 뒤로요.','{count}, 무릎이 발끝 방향과 같게.','{count}, 가슴 들고 시선 앞으로.']),

('점프 스쿼트', '하체', array['복합','유산소'], array['체중 감량','체력 향상'],
 array['야외','헬스장'], array['main'],
 array['허벅지 앞','엉덩이','종아리'], array['무릎','허리'], array[]::text[],
 true, 4, 3, 10, 5, 15, null, null, null,
 '스쿼트로 내려갔다 폭발적으로 점프해 올라와요.',
 '무릎으로 착지하지 말고 발 전체로 부드럽게.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 내려가서 폭발적으로 점프!','{count}, 발 전체로 부드럽게 착지요.','{count}, 바로 다음 스쿼트로 이어요.']),

('스모 스쿼트', '하체', array['근력'], array['체력 향상','자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['허벅지 안쪽','엉덩이'], array['무릎'], array[]::text[],
 false, 3, 3, 12, 8, 20, null, null, null,
 '발을 매우 넓게 벌리고 발끝을 45도 바깥으로 향한 채 스쿼트해요.',
 '무릎이 안쪽으로 모이지 않게.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 발끝을 45도 바깥으로요.','{count}, 무릎을 발끝 방향으로요.','{count}, 엉덩이는 아래로 곧게요.']),

('불가리안 스플릿 스쿼트', '하체', array['근력'], array['체력 향상'],
 array['집','헬스장'], array['main'],
 array['허벅지 앞','엉덩이'], array['무릎'], array[]::text[],
 false, 4, 3, 8, 5, 12, null, null, null,
 '한 발을 의자에 올리고 앞 다리만으로 스쿼트해요.',
 '앞 무릎이 발끝을 넘지 않게.',
 e_focus, m_general, f_strong, array[]::text[], '',
 array['{count}, 앞 다리에 체중을 실어요.','{count}, 뒤 다리는 의자에 살짝만.','{count}, 앞 무릎 발끝 안 넘게요.']),

('월 시트', '하체', array['근력'], array['체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['허벅지 앞','엉덩이'], array['무릎'], array[]::text[],
 false, 3, null, null, null, null, 45, 20, 90,
 '벽에 등을 대고 의자에 앉은 듯한 자세로 무릎 90도를 유지해요.',
 '무릎 통증 시 즉시 중단.',
 array[]::text[], array[]::text[], array[]::text[],
 array['벽에 등을 평평히 붙여요.','무릎이 90도가 되게 내려요.','허벅지가 바닥과 평행해요.','복근에 힘 단단히 주세요.','호흡 유지하세요.'],
 '절반 지났어요. 잘 버티고 있어요.',
 array[]::text[]),

('포워드 런지', '하체', array['근력'], array['체력 향상','자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['허벅지 앞','엉덩이'], array['무릎'], array[]::text[],
 false, 3, 3, 10, 6, 16, null, null, null,
 '한 발을 앞으로 크게 내디뎌 무릎을 90도로 굽혔다 돌아와요.',
 '앞 무릎이 발끝을 넘지 않게요.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 앞으로 크게 한 걸음 내디뎌요.','{count}, 앞 무릎이 90도 되도록요.','{count}, 상체는 꼿꼿이 유지해요.']),

('백 런지', '하체', array['근력'], array['체력 향상','자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['허벅지 앞','엉덩이'], array['무릎'], array[]::text[],
 false, 3, 3, 10, 6, 16, null, null, null,
 '한 발을 뒤로 크게 보내 무릎을 굽혔다 돌아와요.',
 '상체는 꼿꼿이, 코어 잡아요.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 뒤로 한 걸음 보내요.','{count}, 앞 무릎을 90도 굽혀요.','{count}, 앞 무릎이 발끝 안 넘게요.']),

('사이드 런지', '하체', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['허벅지 안쪽','엉덩이'], array['무릎'], array[]::text[],
 false, 3, 3, 10, 6, 16, null, null, null,
 '한쪽으로 크게 발을 벌려 그쪽 무릎을 굽히며 내려가요.',
 '굽힌 쪽 무릎이 발끝 방향과 같게.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 한쪽으로 크게 벌리며 내려가요.','{count}, 굽힌 무릎이 발끝과 같게.','{count}, 반대 다리는 곧게 펴요.']),

('커시 런지', '하체', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['엉덩이','허벅지 옆'], array['무릎'], array[]::text[],
 false, 3, 3, 10, 6, 14, null, null, null,
 '한 발을 반대편 사선 뒤로 보내 인사하듯 무릎을 굽혀요.',
 '균형이 어려우면 의자 잡아도 좋아요.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 뒤 사선으로 인사하듯 내려요.','{count}, 앞 무릎은 정면 유지요.','{count}, 엉덩이 옆 자극 느껴봐요.']),

('점프 런지', '하체', array['복합','유산소'], array['체중 감량','체력 향상'],
 array['야외','헬스장'], array['main'],
 array['허벅지 앞','엉덩이'], array['무릎','허리'], array[]::text[],
 true, 4, 3, 10, 5, 14, null, null, null,
 '런지 자세에서 점프해 다리를 바꿔 착지해요.',
 '무릎 부담 큼. 통증 시 즉시 중단.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 점프해서 다리를 교차해요.','{count}, 부드럽게 착지하세요.','{count}, 코어 단단히 잡아요.']),

('글루트 브릿지', '하체', array['근력'], array['자세 개선','체력 향상'],
 array['집','야외','헬스장'], array['main','warmup'],
 array['엉덩이','허벅지 뒤'], array[]::text[], array['매트'],
 false, 2, 3, 12, 8, 20, null, null, null,
 '누운 자세에서 무릎을 굽히고 엉덩이를 천천히 들어올렸다 내려요.',
 '허리를 과하게 꺾지 말고 엉덩이에 힘.',
 e_easy, m_general, f_gentle, array[]::text[], '',
 array['{count}, 엉덩이를 천장 쪽으로 들어요.','{count}, 정점에서 엉덩이 꽉 조여요.','{count}, 천천히 내려와요.']),

('싱글 레그 글루트 브릿지', '하체', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['엉덩이','허벅지 뒤'], array[]::text[], array['매트'],
 false, 3, 3, 10, 6, 15, null, null, null,
 '한 발을 들어올린 채로 글루트 브릿지해요.',
 '엉덩이가 한쪽으로 기울지 않게.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 한 발 든 채 엉덩이 올려요.','{count}, 정점에서 1초 유지.','{count}, 골반이 기울지 않게요.']),

('힙 쓰러스트', '하체', array['근력'], array['자세 개선'],
 array['집','헬스장'], array['main'],
 array['엉덩이','허벅지 뒤'], array[]::text[], array['매트'],
 false, 3, 3, 12, 8, 18, null, null, null,
 '의자에 어깨를 기대고 엉덩이를 들어 무릎까지 일직선으로요.',
 '허리가 꺾이지 않게 갈비뼈 닫아요.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 엉덩이를 무릎 높이까지요.','{count}, 갈비뼈를 닫는 느낌으로요.','{count}, 정점에서 엉덩이 조여요.']),

('도노키 킥', '하체', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['엉덩이'], array[]::text[], array['매트'],
 false, 2, 3, 12, 8, 18, null, null, null,
 '네발 자세에서 한 다리의 무릎을 굽힌 채 발바닥으로 천장을 차요.',
 '골반이 흔들리지 않게.',
 e_easy, m_general, f_gentle, array[]::text[], '',
 array['{count}, 무릎 굽힌 채 발바닥으로 천장 차요.','{count}, 골반이 흔들리지 않게요.','{count}, 엉덩이 위쪽 자극 느껴요.']),

('파이어 하이드런트', '하체', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['warmup','main'],
 array['엉덩이 옆','고관절'], array[]::text[], array['매트'],
 false, 2, 3, 12, 8, 18, null, null, null,
 '네발 자세에서 한 다리를 옆으로 90도 들어 올렸다 내려요.',
 '골반이 옆으로 기울지 않게.',
 e_easy, m_general, f_gentle, array[]::text[], '',
 array['{count}, 옆으로 무릎을 들어 올려요.','{count}, 골반은 정면 유지요.','{count}, 엉덩이 옆 자극 느껴요.']),

('클램쉘', '하체', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['warmup','main'],
 array['엉덩이 옆','고관절'], array[]::text[], array['매트'],
 false, 2, 3, 15, 10, 25, null, null, null,
 '옆으로 누워 무릎을 굽힌 채 위쪽 무릎만 천천히 들었다 내려요.',
 '엉덩이가 뒤로 빠지지 않게.',
 e_easy, m_general, f_gentle, array[]::text[], '',
 array['{count}, 위쪽 무릎만 천장 쪽으로요.','{count}, 골반이 뒤로 빠지지 않게요.','{count}, 엉덩이 옆 자극 느껴요.']),

('카프 레이즈', '하체', array['근력'], array['체력 향상'],
 array['집','야외','헬스장'], array['warmup','main'],
 array['종아리'], array[]::text[], array[]::text[],
 false, 2, 3, 15, 10, 25, null, null, null,
 '발끝으로 천천히 올라섰다 내려와요.',
 '균형 어려우면 벽을 짚어요.',
 e_easy, m_general, f_gentle, array[]::text[], '',
 array['{count}, 발끝으로 최대한 높이 올라가요.','{count}, 정점에서 1초 멈춰요.','{count}, 천천히 발뒤꿈치 내려요.']),

('덤벨 루마니안 데드리프트', '하체', array['근력'], array['자세 개선','체력 향상'],
 array['집','헬스장'], array['main'],
 array['햄스트링','엉덩이','허리'], array['허리'], array['덤벨'],
 false, 4, 3, 8, 5, 12, null, null, null,
 '덤벨을 든 채 엉덩이를 뒤로 빼며 상체를 숙였다 일어나요.',
 '허리는 굽히지 말고 엉덩이로 접어요.',
 e_focus, m_dumbbell, f_strong, array[]::text[], '',
 array['{count}, 엉덩이를 뒤로 빼며 숙여요.','{count}, 등은 평평하게 유지요.','{count}, 햄스트링 늘어나는 느낌까지요.']),

('덤벨 스쿼트', '하체', array['근력'], array['체력 향상'],
 array['집','헬스장'], array['main'],
 array['허벅지 앞','엉덩이','코어'], array['무릎'], array['덤벨'],
 false, 4, 3, 10, 6, 14, null, null, null,
 '덤벨을 어깨 또는 옆에 들고 스쿼트해요.',
 '무릎이 발끝 방향과 같게.',
 e_general, m_dumbbell, f_strong, array[]::text[], '',
 array['{count}, 덤벨 어깨에 안정적으로요.','{count}, 엉덩이부터 뒤로 빼며 앉아요.','{count}, 가슴 들고 천천히요.']),

('덤벨 런지', '하체', array['근력'], array['체력 향상'],
 array['집','헬스장'], array['main'],
 array['허벅지 앞','엉덩이'], array['무릎'], array['덤벨'],
 false, 4, 3, 10, 6, 14, null, null, null,
 '덤벨을 양손에 들고 런지해요.',
 '상체 꼿꼿이, 코어 단단히.',
 e_general, m_dumbbell, f_strong, array[]::text[], '',
 array['{count}, 덤벨 들고 균형 잡으며 내려요.','{count}, 앞 무릎 90도까지요.','{count}, 상체 꼿꼿이 유지요.']),

-- ============================================================
-- 코어 (41-60) : 복근·허리·옆구리
-- ============================================================
('플랭크', '코어', array['근력'], array['자세 개선','체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['코어','어깨'], array['허리','어깨'], array['매트'],
 false, 3, null, null, null, null, 45, 20, 90,
 '팔꿈치와 발끝으로 몸을 지지하며 일직선으로 버텨요.',
 '엉덩이가 처지거나 솟지 않게.',
 array[]::text[], array[]::text[], array[]::text[],
 array['어깨를 손목 바로 위에 두세요.','엉덩이가 처지지 않게 골반 들어요.','시선은 바닥 한 점을 봐요.','복근에 힘 단단히 주세요.','호흡 깊게 들이마시고 내쉬어요.'],
 '절반 지났어요. 호흡 유지하세요.',
 array[]::text[]),

('사이드 플랭크', '코어', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['옆구리','어깨'], array['어깨','허리'], array['매트'],
 false, 2, null, null, null, null, 30, 15, 60,
 '한쪽 팔꿈치로 지지하며 옆으로 몸을 일직선으로 들어요.',
 '어깨에 통증 있으면 무릎을 바닥에.',
 array[]::text[], array[]::text[], array[]::text[],
 array['팔꿈치는 어깨 바로 아래.','엉덩이가 떨어지지 않게.','옆구리에 힘 단단히.','호흡 유지하세요.'],
 '절반 지났어요. 잘 버티고 있어요.',
 array[]::text[]),

('리버스 플랭크', '코어', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['코어','등','엉덩이'], array['손목','어깨'], array['매트'],
 false, 2, null, null, null, null, 30, 15, 60,
 '앉은 자세에서 손으로 바닥을 짚고 엉덩이를 들어 몸을 일직선으로요.',
 '손목 부담 크면 짧게.',
 array[]::text[], array[]::text[], array[]::text[],
 array['손은 어깨 아래에.','엉덩이 끝까지 들어 올려요.','시선은 천장으로요.','몸은 일직선 유지요.'],
 '절반 지났어요. 조금만 더요.',
 array[]::text[]),

('할로우 홀드', '코어', array['근력'], array['체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['코어'], array['허리'], array['매트'],
 false, 3, null, null, null, null, 30, 15, 60,
 '누워 어깨와 다리를 살짝 들어 몸을 바나나 모양으로 유지해요.',
 '허리 통증 시 즉시 중단.',
 array[]::text[], array[]::text[], array[]::text[],
 array['턱을 가슴 쪽으로 살짝 당겨요.','다리는 모아 살짝 들어요.','허리는 바닥에 눌러요.','복근에 힘 단단히 주세요.','호흡 유지하세요.'],
 '절반 지났어요. 잘 버티고 있어요.',
 array[]::text[]),

('크런치', '코어', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['상복부'], array['허리','목'], array['매트'],
 false, 2, 3, 15, 10, 25, null, null, null,
 '누워 무릎을 굽힌 채 상체만 살짝 말아 올렸다 내려요.',
 '목을 잡아당기지 말고 복근 힘으로.',
 e_easy, m_general, f_gentle, array[]::text[], '',
 array['{count}, 상체만 살짝 말아 올려요.','{count}, 복근 힘으로 들어요.','{count}, 목 잡아당기지 마세요.']),

('시트업', '코어', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['상복부','하복부'], array['허리','목'], array['매트'],
 false, 3, 3, 12, 8, 18, null, null, null,
 '누운 자세에서 상체를 완전히 일으켜 앉았다 천천히 내려요.',
 '목 잡아당기지 마세요.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 손은 가슴 위 또는 머리 옆에요.','{count}, 끝까지 일어났다 내려요.','{count}, 천천히 컨트롤해요.']),

('리버스 크런치', '코어', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['하복부'], array['허리'], array['매트'],
 false, 3, 3, 12, 8, 18, null, null, null,
 '누워 무릎을 가슴 쪽으로 말아 올려 엉덩이를 띄웠다 내려요.',
 '반동 쓰지 말고 천천히.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 무릎을 가슴 쪽으로 말아요.','{count}, 엉덩이를 띄웠다 내려요.','{count}, 반동 쓰지 마세요.']),

('바이시클 크런치', '코어', array['근력','유산소'], array['체중 감량','자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['코어','옆구리'], array['목','허리'], array['매트'],
 false, 3, 3, 16, 10, 24, null, null, null,
 '누워 자전거 페달 밟듯 반대편 무릎과 팔꿈치를 마주쳐요.',
 '목 잡아당기지 말고 코어로요.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 반대 팔꿈치와 무릎 마주쳐요.','{count}, 자전거 페달처럼 교차요.','{count}, 목 잡아당기지 마세요.']),

('레그 레이즈', '코어', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['하복부'], array['허리'], array['매트'],
 false, 3, 3, 10, 6, 16, null, null, null,
 '누운 자세에서 다리를 모아 천천히 올렸다 바닥에 안 닿게 내려요.',
 '허리가 뜨면 손을 엉덩이 밑에.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 다리 모아 천천히 올려요.','{count}, 바닥에 안 닿게 내려요.','{count}, 허리 뜨면 손 엉덩이 밑에요.']),

('행잉 레그 레이즈', '코어', array['근력'], array['체력 향상'],
 array['헬스장'], array['main'],
 array['하복부','코어'], array['어깨','허리'], array[]::text[],
 false, 4, 3, 10, 5, 14, null, null, null,
 '봉에 매달려 다리를 모은 채 90도까지 올렸다 내려요.',
 '반동 쓰지 말고 코어로 컨트롤.',
 e_focus, m_general, f_strong, array[]::text[], '',
 array['{count}, 봉에 매달려 다리 들어요.','{count}, 반동 쓰지 마세요.','{count}, 코어 힘으로 들어요.']),

('플러터 킥', '코어', array['근력','유산소'], array['체중 감량'],
 array['집','야외','헬스장'], array['main'],
 array['하복부','허벅지 앞'], array['허리'], array['매트'],
 false, 3, 3, 20, 12, 30, null, null, null,
 '누운 자세에서 다리를 살짝 들고 위아래로 빠르게 교차해요.',
 '허리가 뜨지 않게 코어로 눌러요.',
 e_general, m_general, f_strong, array[]::text[], '',
 array['{count}, 다리 살짝 들고 위아래 교차요.','{count}, 허리는 바닥 눌러요.','{count}, 호흡 유지하세요.']),

('시저 킥', '코어', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['하복부','허벅지 안쪽'], array['허리'], array['매트'],
 false, 3, 3, 16, 10, 24, null, null, null,
 '누운 자세에서 다리를 좌우로 가위질하듯 교차해요.',
 '허리가 뜨지 않게.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 다리 좌우 가위질로 교차요.','{count}, 허리 뜨지 않게요.','{count}, 다리는 곧게 펴요.']),

('러시안 트위스트', '코어', array['근력'], array['체중 감량','자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['옆구리','코어'], array['허리'], array['매트'],
 false, 3, 3, 16, 10, 24, null, null, null,
 '앉은 자세로 다리를 띄우고 상체를 좌우로 천천히 회전해요.',
 '허리가 둥글게 말리지 않게.',
 e_general, m_general, f_general, array[]::text[], '',
 array['{count}, 상체 좌우로 천천히 회전.','{count}, 다리는 띄운 채 유지요.','{count}, 허리 둥글지 않게요.']),

('마운틴 클라이머', '코어', array['유산소','복합'], array['체중 감량','체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['코어','허벅지 앞','어깨'], array['손목'], array['매트'],
 false, 4, 3, 20, 12, 30, null, null, null,
 '높은 플랭크 자세에서 무릎을 가슴 쪽으로 번갈아 당겨요.',
 '엉덩이가 솟지 않게.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 무릎을 가슴까지 끌어와요.','{count}, 엉덩이가 솟지 않게요.','{count}, 빠르게 교차해요.']),

('데드 버그', '코어', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['warmup','main'],
 array['코어'], array[]::text[], array['매트'],
 false, 2, 3, 12, 8, 18, null, null, null,
 '누워 팔다리를 천장으로 든 뒤 반대편을 동시에 펴 내렸다 돌아와요.',
 '허리가 바닥에서 뜨지 않게.',
 e_easy, m_general, f_gentle, array[]::text[], '',
 array['{count}, 반대편 팔다리 동시에 내려요.','{count}, 허리가 뜨지 않게요.','{count}, 천천히 돌아와요.']),

('버드 도그', '코어', array['근력'], array['자세 개선'],
 array['집','야외','헬스장'], array['warmup','main'],
 array['코어','등','엉덩이'], array[]::text[], array['매트'],
 false, 2, 3, 12, 8, 18, null, null, null,
 '네발 자세에서 반대편 팔다리를 동시에 뻗었다 돌아와요.',
 '허리 일직선 유지에 집중.',
 e_easy, m_general, f_gentle, array[]::text[], '',
 array['{count}, 반대편 팔다리 동시에 뻗어요.','{count}, 허리 일직선 유지.','{count}, 골반이 기울지 않게요.']),

('V-up', '코어', array['근력'], array['체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['상복부','하복부'], array['허리','목'], array['매트'],
 false, 4, 3, 10, 6, 14, null, null, null,
 '누운 자세에서 다리와 상체를 동시에 들어 손이 발끝에 닿게요.',
 '허리에 무리. 초보자는 패스.',
 e_focus, m_general, f_strong, array[]::text[], '',
 array['{count}, 다리와 상체 동시에 들어요.','{count}, 손이 발끝에 닿도록요.','{count}, 천천히 내려요.']),

('호로우 락', '코어', array['근력'], array['체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['코어'], array['허리','목'], array['매트'],
 false, 4, 3, 12, 6, 18, null, null, null,
 '할로우 홀드 자세에서 몸을 앞뒤로 살짝 흔들어요.',
 '허리 통증 시 즉시 중단.',
 e_focus, m_general, f_strong, array[]::text[], '',
 array['{count}, 할로우 자세로 앞뒤 흔들어요.','{count}, 복근에 힘 단단히.','{count}, 허리는 바닥 눌러요.']),

('토 터치', '코어', array['근력','유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['main'],
 array['상복부','햄스트링'], array['허리'], array['매트'],
 false, 2, 3, 12, 8, 18, null, null, null,
 '누워 다리를 천장으로 들고 손으로 발끝을 짚으러 상체를 말아요.',
 '햄스트링이 뻣뻣하면 무릎 살짝 굽혀요.',
 e_easy, m_general, f_gentle, array[]::text[], '',
 array['{count}, 다리 천장으로 들어요.','{count}, 손으로 발끝 짚으러요.','{count}, 상체만 말아 올려요.']),

('덤벨 사이드 벤드', '코어', array['근력'], array['자세 개선'],
 array['집','헬스장'], array['main'],
 array['옆구리'], array['허리'], array['덤벨'],
 false, 3, 3, 12, 8, 18, null, null, null,
 '한 손에 덤벨을 들고 그쪽으로 옆구리를 굽혔다 똑바로 돌아와요.',
 '반대편 옆구리에 힘 주며 일어나요.',
 e_general, m_dumbbell, f_general, array[]::text[], '',
 array['{count}, 덤벨 든 쪽으로 옆구리 굽혀요.','{count}, 천천히 똑바로 돌아와요.','{count}, 반대쪽 옆구리 자극 느껴요.']),

-- ============================================================
-- 전신 (61-80) : 복합 동작·유산소·기능성
-- ============================================================
('버피', '전신', array['복합','유산소'], array['체중 감량','체력 향상'],
 array['야외','헬스장'], array['main'],
 array['전신'], array['무릎','허리','손목'], array[]::text[],
 true, 5, 3, 10, 5, 14, null, null, null,
 '서서 → 스쿼트 → 푸시업 자세 → 점프 한 사이클을 반복해요.',
 '강도 매우 높음. 무릎/허리 안 좋으면 점프 빼고 스텝으로.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 스쿼트 푸시업 점프 한 사이클.','{count}, 점프 부드럽게 착지.','{count}, 호흡 끊지 마세요.']),

('점핑잭', '전신', array['유산소'], array['체중 감량','체력 향상'],
 array['야외','헬스장'], array['warmup','main'],
 array['전신','종아리'], array['무릎'], array[]::text[],
 true, 3, 3, 25, 15, 40, null, null, null,
 '제자리에서 점프하며 팔과 다리를 동시에 벌렸다 모아요.',
 '무릎 부담 시 발만 옆으로 빼는 스텝잭으로.',
 e_easy, m_cardio, f_general, array[]::text[], '',
 array['{count}, 팔다리 동시에 벌려요.','{count}, 발은 가볍게 착지요.','{count}, 리듬 유지하세요.']),

('하이 니', '전신', array['유산소'], array['체중 감량','체력 향상'],
 array['야외','헬스장'], array['main'],
 array['전신','코어'], array['무릎'], array[]::text[],
 true, 4, 3, 20, 12, 30, null, null, null,
 '제자리에서 무릎을 허리 높이까지 올리며 빠르게 뛰어요.',
 '무릎 부담 시 천천히 또는 스텝으로.',
 e_general, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 무릎을 허리 높이까지요.','{count}, 빠르게 교차해요.','{count}, 코어로 들어 올려요.']),

('스피드 스케이터', '전신', array['유산소','복합'], array['체중 감량','체력 향상'],
 array['야외','헬스장'], array['main'],
 array['엉덩이','허벅지','코어'], array['무릎'], array[]::text[],
 true, 4, 3, 16, 10, 24, null, null, null,
 '좌우로 크게 옆 점프하며 스케이트 타듯 반대 발을 뒤로 보내요.',
 '무릎 부담 시 점프 없이 사이드 스텝으로.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 옆으로 크게 점프요.','{count}, 반대 발을 뒤로 보내요.','{count}, 스케이트 타듯 가요.']),

('토끼뜀', '전신', array['유산소','복합'], array['체중 감량','체력 향상'],
 array['야외','헬스장'], array['main'],
 array['하체','전신'], array['무릎','허리'], array[]::text[],
 true, 4, 3, 10, 6, 14, null, null, null,
 '쪼그려 앉은 자세에서 앞으로 폭발적으로 점프해요.',
 '무릎 부담 큼. 통증 시 중단.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 쪼그려 앉아 폭발적 점프.','{count}, 부드럽게 착지하세요.','{count}, 무릎 부담 크면 멈춰요.']),

('사이드 셔플', '전신', array['유산소'], array['체력 향상'],
 array['집','야외','헬스장'], array['warmup','main'],
 array['하체','코어'], array[]::text[], array[]::text[],
 false, 3, 3, 20, 12, 30, null, null, null,
 '발을 어깨 너비로 좌우로 빠르게 스텝해요. 점프 없음.',
 '',
 e_easy, m_cardio, f_general, array[]::text[], '',
 array['{count}, 어깨 너비로 좌우 스텝요.','{count}, 코어 단단히 잡아요.','{count}, 빠르게 리듬 타요.']),

('박스 점프', '전신', array['복합','유산소'], array['체력 향상'],
 array['헬스장'], array['main'],
 array['하체','전신'], array['무릎','허리'], array[]::text[],
 true, 5, 3, 8, 4, 12, null, null, null,
 '안정된 박스나 단차에 양발로 점프해 올라섰다 내려와요.',
 '발목/무릎 약하면 금지. 박스 안정성 필수.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 박스에 양발 점프 올라가요.','{count}, 무릎으로 흡수하며 착지요.','{count}, 박스 안정성 확인했어요?']),

('점프 로프', '전신', array['유산소'], array['체중 감량','체력 향상'],
 array['야외','헬스장'], array['main'],
 array['종아리','전신'], array['무릎'], array[]::text[],
 true, 4, null, null, null, null, 60, 30, 180,
 '줄넘기를 일정 리듬으로 뛰어요. 실제 줄 없이 동작만도 가능.',
 '무릎 부담 시 짧게 끊어서.',
 array[]::text[], array[]::text[], array[]::text[],
 array['발 앞꿈치로 가볍게 뛰어요.','어깨는 가만히, 손목으로 돌려요.','리듬 유지하세요.','호흡 같이 가요.','시선은 앞을 봐요.'],
 '절반 지났어요. 리듬 유지해요.',
 array[]::text[]),

('베어 크롤', '전신', array['복합','근력'], array['체중 감량','체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['전신','코어','어깨'], array['손목'], array[]::text[],
 false, 3, 3, 12, 8, 18, null, null, null,
 '네발 자세에서 무릎을 살짝 띄우고 곰처럼 손발 교차로 기어가요.',
 '엉덩이가 너무 솟지 않게.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 무릎 살짝 띄우고 교차로 기어요.','{count}, 엉덩이가 솟지 않게요.','{count}, 코어 단단히.']),

('크랩 워크', '전신', array['복합','근력'], array['체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['삼두','엉덩이','코어'], array['손목','어깨'], array[]::text[],
 false, 3, 3, 12, 8, 18, null, null, null,
 '엉덩이를 든 채 손발로 지지하며 게처럼 옆으로 걸어요.',
 '손목 부담 큰 동작.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 엉덩이 든 채 옆으로 걸어요.','{count}, 손목 부담되면 천천히요.','{count}, 엉덩이 안 떨어지게요.']),

('인치웜', '전신', array['복합','유연성'], array['체력 향상'],
 array['집','야외','헬스장'], array['warmup','main'],
 array['어깨','코어','햄스트링'], array[]::text[], array[]::text[],
 false, 2, 3, 10, 5, 15, null, null, null,
 '선 자세에서 손으로 바닥을 짚고 푸시업 자세까지 걸어갔다 돌아와요.',
 '햄스트링이 뻣뻣하면 무릎 살짝 굽혀요.',
 e_easy, m_cardio, f_gentle, array[]::text[], '',
 array['{count}, 손으로 바닥 천천히 걸어 나가요.','{count}, 플랭크까지 도달해요.','{count}, 돌아와서 일어나요.']),

('클라이밍 트위스트', '전신', array['복합','유산소'], array['체중 감량'],
 array['집','야외','헬스장'], array['main'],
 array['코어','옆구리','어깨'], array['손목','허리'], array['매트'],
 false, 4, 3, 14, 8, 20, null, null, null,
 '플랭크 자세에서 무릎을 반대편 팔꿈치 쪽으로 비스듬히 가져와요.',
 '엉덩이가 솟지 않게.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 무릎을 반대편 팔꿈치로요.','{count}, 엉덩이가 솟지 않게요.','{count}, 빠르게 교차요.']),

('스쿼트 푸시업 콤보', '전신', array['복합'], array['체중 감량','체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['전신'], array['무릎','손목'], array[]::text[],
 false, 5, 3, 8, 5, 12, null, null, null,
 '스쿼트 1회 → 손 짚고 푸시업 자세로 가서 푸시업 1회 → 돌아오기.',
 '강도 매우 높음.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 스쿼트 1회로 시작해요.','{count}, 손 짚고 푸시업 자세로요.','{count}, 푸시업 후 돌아오기.']),

('점프 푸시업', '전신', array['복합','유산소'], array['체력 향상'],
 array['야외','헬스장'], array['main'],
 array['전신','가슴'], array['손목','어깨','허리'], array[]::text[],
 true, 5, 3, 8, 4, 10, null, null, null,
 '푸시업 내려갔다 폭발적으로 밀어 손을 띄워요.',
 '손목·어깨 부담 매우 큼.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 푸시업 내려갔다 폭발적으로요.','{count}, 손을 살짝 띄우세요.','{count}, 부드럽게 착지해요.']),

('인치웜 푸시업', '전신', array['복합'], array['체중 감량','체력 향상'],
 array['집','야외','헬스장'], array['main'],
 array['전신','가슴','코어'], array['손목'], array[]::text[],
 false, 4, 3, 8, 5, 12, null, null, null,
 '인치웜으로 푸시업 자세까지 간 뒤 푸시업 한 번, 돌아오기 반복.',
 '난이도 높음. 푸시업 빼고 인치웜만도 OK.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 인치웜으로 푸시업 자세까지.','{count}, 푸시업 한 번 추가요.','{count}, 돌아와서 일어나요.']),

('덤벨 스러스터', '전신', array['복합'], array['체중 감량','체력 향상'],
 array['집','헬스장'], array['main'],
 array['하체','어깨','코어'], array['무릎','어깨'], array['덤벨'],
 false, 4, 3, 10, 6, 14, null, null, null,
 '덤벨을 어깨에 들고 스쿼트 → 일어나며 머리 위로 밀어요.',
 '코어 단단히 잡아야 허리 보호.',
 e_focus, m_dumbbell, f_strong, array[]::text[], '',
 array['{count}, 덤벨 어깨에 들고 스쿼트.','{count}, 일어나며 머리 위로 밀어요.','{count}, 코어 단단히 잡아요.']),

('덤벨 클린', '전신', array['복합','근력'], array['체력 향상'],
 array['헬스장'], array['main'],
 array['전신'], array['허리','어깨','무릎'], array['덤벨'],
 false, 5, 3, 8, 4, 10, null, null, null,
 '바닥에서 덤벨을 폭발적으로 들어 어깨까지 올려요.',
 '기술 동작. 폼 익힌 뒤 무게 늘려요.',
 e_focus, m_dumbbell, f_strong, array[]::text[], '',
 array['{count}, 바닥에서 폭발적으로 들어요.','{count}, 어깨까지 한 번에 올려요.','{count}, 천천히 내려놓아요.']),

('덤벨 스윙', '전신', array['복합','유산소'], array['체중 감량','체력 향상'],
 array['집','헬스장'], array['main'],
 array['엉덩이','허벅지 뒤','코어'], array['허리'], array['덤벨'],
 false, 4, 3, 12, 8, 18, null, null, null,
 '덤벨 하나를 양손으로 들고 엉덩이 힘으로 어깨 높이까지 흔들어 올려요.',
 '팔 힘 쓰지 말고 엉덩이 추진력으로.',
 e_focus, m_cardio, f_strong, array[]::text[], '',
 array['{count}, 엉덩이 추진력으로 흔들어요.','{count}, 어깨 높이까지 올려요.','{count}, 팔 힘 쓰지 마세요.']),

('덤벨 터키시 겟업', '전신', array['복합','근력'], array['체력 향상','자세 개선'],
 array['집','헬스장'], array['main'],
 array['전신','코어'], array['어깨','허리'], array['덤벨','매트'],
 false, 3, 3, 6, 3, 10, null, null, null,
 '누운 자세에서 한 손에 덤벨을 천장으로 들고 천천히 일어났다 다시 누워요.',
 '기술 동작. 가벼운 무게로 시작.',
 e_focus, m_dumbbell, f_general, array[]::text[], '',
 array['{count}, 누운 자세에서 천천히 일어나요.','{count}, 덤벨은 항상 천장 향하게요.','{count}, 동작 하나하나 정확히.']),

('덤벨 윈드밀', '전신', array['복합','유연성'], array['자세 개선'],
 array['집','헬스장'], array['main'],
 array['코어','옆구리','어깨'], array['허리','어깨'], array['덤벨'],
 false, 3, 3, 10, 6, 14, null, null, null,
 '덤벨을 천장으로 든 채 반대편으로 상체를 숙여 발끝을 향해요.',
 '시선은 항상 덤벨에 고정.',
 e_focus, m_dumbbell, f_general, array[]::text[], '',
 array['{count}, 덤벨을 천장 향해 들어요.','{count}, 옆으로 천천히 숙여요.','{count}, 시선은 덤벨에 고정.']),

-- ============================================================
-- 스트레칭 (81-100) : 워밍업·마무리·회복
-- ============================================================
-- 워밍업 (81-87) : 동적 스트레칭, 관절 활성화
('어깨 회전', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['warmup'],
 array['어깨'], array[]::text[], array[]::text[],
 false, 1, null, null, null, null, 45, 20, 90,
 '팔을 옆으로 크게 원을 그리며 앞·뒤로 회전해요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['팔을 옆으로 펼치세요.','앞으로 천천히 원을 그려요.','점점 크게 그려보세요.','반대로 뒤로 돌려요.','어깨 힘 빼고 부드럽게요.'],
 '절반 지났어요. 호흡 유지하세요.',
 array[]::text[]),

('골반 회전', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['warmup'],
 array['고관절','코어'], array[]::text[], array[]::text[],
 false, 1, null, null, null, null, 30, 15, 60,
 '서서 손을 허리에 얹고 골반으로 크게 원을 그리듯 돌려요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['손을 허리에 얹어요.','골반으로 천천히 원을 그려요.','점점 크게요.','반대 방향으로 돌려요.','호흡 유지하세요.'],
 '절반 지났어요. 부드럽게요.',
 array[]::text[]),

('발목 회전', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['warmup'],
 array['발목'], array[]::text[], array[]::text[],
 false, 1, null, null, null, null, 30, 15, 60,
 '한 발을 들어 발목을 원을 그리며 좌우 양방향으로 천천히 돌려요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['한 발을 들어 발끝을 띄워요.','발목으로 원을 천천히 그려요.','반대 방향도 돌려요.','반대 발도 해요.'],
 '반대쪽도 곧 해요.',
 array[]::text[]),

('목 회전', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['warmup'],
 array['목'], array[]::text[], array[]::text[],
 false, 1, null, null, null, null, 30, 15, 60,
 '고개를 좌·우·앞·뒤로 천천히 굴리며 목 주변을 풀어요.',
 '빠르게 돌리지 마세요.',
 array[]::text[], array[]::text[], array[]::text[],
 array['고개를 천천히 좌우로 굴려요.','앞뒤로 천천히 움직여요.','원을 그리듯 부드럽게요.','빠르게 돌리지 마세요.'],
 '천천히 호흡하세요.',
 array[]::text[]),

('캣카우', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['warmup','cooldown'],
 array['척추','코어'], array[]::text[], array['매트'],
 false, 1, null, null, null, null, 45, 20, 90,
 '네발 자세에서 등을 둥글게 말았다 아래로 늘어뜨리며 호흡과 함께 움직여요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['네발 자세 잡아요.','숨 들이마시며 등을 아래로요.','내쉬며 등을 둥글게 말아요.','턱은 가슴 쪽으로요.','호흡 리듬에 맞춰 천천히요.'],
 '절반 지났어요. 호흡 깊게요.',
 array[]::text[]),

('다이내믹 햄스트링 스윙', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['warmup'],
 array['햄스트링','고관절'], array['허리'], array[]::text[],
 false, 2, null, null, null, null, 45, 20, 90,
 '한 다리를 앞뒤로 크게 흔들어 햄스트링과 고관절을 동적으로 풀어요.',
 '균형 어려우면 벽을 짚어요.',
 array[]::text[], array[]::text[], array[]::text[],
 array['한 다리를 앞뒤로 흔들어요.','점점 크게 스윙요.','균형 잡으며 천천히요.','반대 다리도 해요.'],
 '반대쪽도 곧 해요.',
 array[]::text[]),

('측면 스트레칭', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['warmup','cooldown'],
 array['옆구리','등'], array[]::text[], array[]::text[],
 false, 1, null, null, null, null, 30, 15, 60,
 '서서 한 팔을 머리 위로 뻗어 반대편으로 상체를 기울여요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['한 팔을 머리 위로 뻗어요.','반대편으로 상체 기울여요.','옆구리 늘어나는 느낌요.','반대쪽도 곧 해요.'],
 '반대쪽도 곧 해요.',
 array[]::text[]),

-- 마무리 (88-94) : 정적 스트레칭
('햄스트링 스트레칭', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['cooldown'],
 array['햄스트링'], array['허리'], array['매트'],
 false, 1, null, null, null, null, 30, 15, 60,
 '한 다리를 앞으로 뻗어 발끝을 잡듯 상체를 천천히 숙여요.',
 '반동 쓰지 말고 호흡으로.',
 array[]::text[], array[]::text[], array[]::text[],
 array['한 다리 앞으로 펴요.','발끝을 잡듯 상체 숙여요.','호흡으로 더 깊게요.','반동 쓰지 마세요.'],
 '반대쪽도 곧 해요.',
 array[]::text[]),

('쿼드 스트레칭', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['cooldown'],
 array['허벅지 앞'], array['무릎'], array[]::text[],
 false, 1, null, null, null, null, 30, 15, 60,
 '서서 한 발을 뒤로 들어 발등을 손으로 잡고 엉덩이 쪽으로 당겨요.',
 '균형 어려우면 벽 짚어요.',
 array[]::text[], array[]::text[], array[]::text[],
 array['한 발을 뒤로 들어요.','발등을 손으로 잡아요.','엉덩이 쪽으로 당겨요.','균형 어려우면 벽 짚어요.'],
 '반대쪽도 곧 해요.',
 array[]::text[]),

('종아리 스트레칭', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['cooldown'],
 array['종아리'], array[]::text[], array[]::text[],
 false, 1, null, null, null, null, 30, 15, 60,
 '벽을 짚고 한 발을 뒤로 보내 뒤꿈치를 바닥에 누른 채 종아리를 늘려요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['벽을 짚고 한 발 뒤로요.','뒤꿈치를 바닥에 누르세요.','종아리 늘어나는 느낌요.','반대쪽도 해요.'],
 '반대쪽도 곧 해요.',
 array[]::text[]),

('차일드 포즈', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['cooldown'],
 array['허리','등','어깨'], array[]::text[], array['매트'],
 false, 1, null, null, null, null, 45, 20, 90,
 '무릎 꿇고 엉덩이를 발뒤꿈치로 내린 뒤 팔을 앞으로 뻗어 이마를 바닥에.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['무릎 꿇고 엉덩이 발뒤꿈치로요.','팔을 앞으로 뻗어요.','이마는 바닥에요.','어깨 힘 빼고 호흡하세요.'],
 '절반 지났어요. 어깨 힘 빼세요.',
 array[]::text[]),

('비둘기 자세', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['cooldown'],
 array['엉덩이','고관절'], array['무릎'], array['매트'],
 false, 2, null, null, null, null, 45, 20, 90,
 '한 다리를 앞으로 굽혀 정강이를 매트 옆으로, 뒷다리는 곧게 펴고 상체를 숙여요.',
 '무릎 통증 시 부드럽게.',
 array[]::text[], array[]::text[], array[]::text[],
 array['한 다리 앞으로 굽혀요.','정강이를 매트 옆으로요.','뒷다리는 곧게 펴요.','상체를 천천히 숙여요.'],
 '반대쪽도 곧 해요.',
 array[]::text[]),

('나비 자세', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['cooldown'],
 array['고관절','허벅지 안쪽'], array[]::text[], array['매트'],
 false, 1, null, null, null, null, 45, 20, 90,
 '앉아 발바닥을 마주 댄 뒤 무릎을 좌우로 부드럽게 내려요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['앉아 발바닥을 마주 대요.','무릎을 좌우로 부드럽게.','상체를 살짝 앞으로요.','호흡으로 더 깊게요.'],
 '절반 지났어요. 호흡 깊게요.',
 array[]::text[]),

('누운 척추 트위스트', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['cooldown'],
 array['척추','옆구리'], array['허리'], array['매트'],
 false, 1, null, null, null, null, 45, 20, 90,
 '누운 자세에서 무릎을 한쪽으로 넘기고 상체는 반대쪽을 향해요.',
 '허리 통증 시 천천히.',
 array[]::text[], array[]::text[], array[]::text[],
 array['누워서 무릎을 한쪽으로요.','상체는 반대쪽 향해요.','시선은 손끝 따라가요.','호흡 유지하세요.'],
 '반대쪽도 곧 해요.',
 array[]::text[]),

-- 회복 (95-100) : 호흡·이완·정적 휴식
('박스 호흡', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['recovery'],
 array['횡격막'], array[]::text[], array[]::text[],
 false, 1, null, null, null, null, 90, 60, 180,
 '4초 들이마시고, 4초 멈추고, 4초 내쉬고, 4초 멈추는 박스 호흡을 반복해요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['4초간 코로 들이마셔요.','4초간 숨을 멈춰요.','4초간 입으로 내쉬어요.','4초간 다시 멈춰요.','이 사이클을 반복하세요.'],
 '절반 지났어요. 박스를 그리듯 호흡요.',
 array[]::text[]),

('디아프램 호흡', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['recovery'],
 array['횡격막','코어'], array[]::text[], array['매트'],
 false, 1, null, null, null, null, 90, 60, 180,
 '누워 배에 손을 얹고 코로 깊이 들이마셔 배를 부풀렸다 천천히 내쉬어요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['배에 손을 얹어요.','코로 깊게 들이마셔요. 배가 부풀어요.','입으로 천천히 내쉬어요.','어깨는 움직이지 않게요.','호흡에만 집중해요.'],
 '절반 지났어요. 호흡 천천히요.',
 array[]::text[]),

('다리 벽에 올리기', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','헬스장'], array['recovery'],
 array['하체','등'], array[]::text[], array['매트'],
 false, 1, null, null, null, null, 120, 60, 300,
 '엉덩이를 벽에 가까이 두고 누워 다리를 벽에 곧게 올린 채 휴식해요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['엉덩이 벽에 가까이 두고 누워요.','다리를 벽에 곧게 올려요.','팔은 옆으로 편안하게요.','깊게 호흡하세요.','온몸의 긴장 풀어요.'],
 '절반 지났어요. 마음 가라앉히세요.',
 array[]::text[]),

('사바아사나', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['recovery'],
 array['전신'], array[]::text[], array['매트'],
 false, 1, null, null, null, null, 180, 60, 300,
 '편안하게 누워 눈을 감고 발끝부터 머리까지 차례로 힘을 빼며 휴식해요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['편안하게 누우세요.','눈을 감아요.','발끝부터 머리까지 힘 빼요.','호흡에만 집중하세요.','마음을 가라앉혀요.'],
 '절반 지났어요. 그대로 편안하게요.',
 array[]::text[]),

('무릎 가슴 안기', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['cooldown','recovery'],
 array['허리','엉덩이'], array[]::text[], array['매트'],
 false, 1, null, null, null, null, 45, 20, 90,
 '누워서 양 무릎을 가슴 쪽으로 끌어안고 허리를 늘려요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['누워서 양 무릎 가슴으로 안아요.','깊게 호흡하세요.','허리가 늘어나는 느낌요.','어깨 힘 빼고요.'],
 '절반 지났어요. 호흡 깊게요.',
 array[]::text[]),

('점진적 근육 이완', '스트레칭', array['유연성'], array['자세 개선'],
 array['집','야외','헬스장'], array['recovery'],
 array['전신'], array[]::text[], array['매트'],
 false, 1, null, null, null, null, 180, 90, 300,
 '발끝부터 시작해 차례로 근육에 힘을 줬다 빼며 전신의 긴장을 풀어요.',
 '',
 array[]::text[], array[]::text[], array[]::text[],
 array['발끝부터 시작해요. 힘 줬다 빼요.','종아리, 허벅지 차례로요.','복부, 가슴, 어깨까지요.','팔과 손, 얼굴까지요.','온몸이 풀렸어요. 호흡 유지요.'],
 '절반 지났어요. 천천히 호흡요.',
 array[]::text[]);

end $$;

-- ============================================================
-- 시드 결과 분포 검증 (참고용 — 실행 후 직접 확인)
-- ============================================================
-- select body_region, count(*) from public.exercises group by body_region order by 1;
-- → 상체:20  하체:20  코어:20  전신:20  스트레칭:20
--
-- select unnest(phase_tags) phase, count(*)
--   from public.exercises group by phase order by 2 desc;
-- → main 70+, cooldown 10+, warmup 14+, recovery 6
--
-- select unnest(goal_tags) goal, count(*)
--   from public.exercises group by goal order by 2 desc;
--
-- select count(*) from public.exercises where array_length(form_cues, 1) > 0;
-- → 74 (세트 기반만 form_cues 채워짐)
--
-- select count(*) from public.exercises where array_length(time_scripts, 1) > 0;
-- → 26 (시간 기반만 time_scripts 채워짐)


-- ████████████████████████████████████████████████████████████
-- 20_tts_audio_bucket.sql
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- 18_tts_audio_bucket.sql
-- OpenAI TTS 합성 결과(MP3)를 보관할 Storage 버킷 생성.
-- public 으로 두어 클라이언트가 URL 로 직접 재생 가능.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('tts-audio', 'tts-audio', true)
on conflict (id) do nothing;

-- 인증된 사용자가 오디오 URL 을 SELECT(metadata 조회) 할 수 있도록.
-- 파일 자체는 public 이라 직접 GET 가능하지만,
-- supabase-js 가 getPublicUrl 외에 list/info 를 쓸 때 필요.
drop policy if exists "tts-audio readable to all" on storage.objects;
create policy "tts-audio readable to all"
  on storage.objects for select
  using (bucket_id = 'tts-audio');


-- ████████████████████████████████████████████████████████████
-- 21_workout_logs_review_and_calories.sql
-- ████████████████████████████████████████████████████████████

-- workout_logs: 운동 완료 시점 자동 저장 + 리뷰 분리 저장을 위한 스키마 조정
--
-- 변경 의도:
--   1) 운동 완료 페이지 진입 즉시 calories/completion_status/ai_feedback 을 자동 저장한다.
--      이 시점에 사용자는 아직 리뷰(난이도/통증/메모)를 입력하지 않았으므로 difficulty 는 NULL 이어야 한다.
--   2) 사용자가 "운동 리뷰 남기기" 버튼을 누르면 같은 row 를 UPDATE 하여 difficulty/pain_areas/memo 를 채운다.
--      RLS 에 own update 정책이 없었으므로 추가한다.
--   3) calories 컬럼을 신설. 루틴의 운동 강도·시간·사용자 체중으로 계산한 추정치.

alter table public.workout_logs
  add column if not exists calories int default 0;

-- difficulty 를 NULL 허용으로 변경. 기존 CHECK (difficulty in ('easy','good','hard')) 는
-- NULL 값에 대해 자동으로 통과하므로 그대로 둔다.
alter table public.workout_logs
  alter column difficulty drop not null;

-- 본인 기록만 수정 가능 (리뷰 추가·AI 피드백 백필 용도)
drop policy if exists "workout_logs: own update" on public.workout_logs;
create policy "workout_logs: own update"
  on public.workout_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████
-- 22_workout_logs_actual_duration.sql
-- ████████████████████████████████████████████████████████████

-- workout_logs: 실제 경과 시간(초) 컬럼 추가
--
-- 변경 의도:
--   계획된 운동 시간(duration_min, 루틴 meta에서 파싱)과 별개로,
--   사용자가 실제로 세션 화면에 머문 시간을 초 단위로 기록한다.
--   일부 완료 시 "실제/계획" 비율 표시(예: "10 / 15분")에 사용.
--
-- 기존 row 는 NULL — 표시 측에서 NULL 이면 계획 시간만 노출.

alter table public.workout_logs
  add column if not exists actual_duration_sec int;


-- ████████████████████████████████████████████████████████████
-- 23_drop_place_tags.sql
-- ████████████████████████████████████████████████████████████

-- exercises: place_tags 컬럼 제거
--
-- 변경 의도:
--   FitBack 은 홈트 전용 앱 — '집'/'야외'/'헬스장' 분기는 더 이상 쓰지 않는다.
--   루틴 생성에서 장소 질문이 제거됐고, filterCandidates 도 place_tags 필터를 제거.
--   인덱스 + 컬럼 모두 dead weight 가 되어 정리.
--
-- 비가역 작업 — drop 후 데이터는 복구 불가.

drop index if exists public.exercises_place_tags_gin;

alter table public.exercises
  drop column if exists place_tags;


-- ████████████████████████████████████████████████████████████
-- 24_memberships_type_v2.sql
-- ████████████████████████████████████████████████████████████

-- 21_memberships_type_v2.sql
-- '회원권 활용도' 화면 명세 v1.1 (시나리오 C) — 회원권 도메인 전반 개편의 토대.
--   · type 2종화: 'session'(인세권) / 'period'(기간권)   (기존 free/session/class 3종 → 2종)
--   · weekly_goal: 기간권 주당 목표 방문 (회당 가치·목표 회수 환산의 분모)
--   · input_method: 등록 출처(manual/receipt_scan) — 데이터 신뢰도 구분
-- 멱등(idempotent): 반복 실행 안전.

-- 1) 옛 제약 먼저 제거 (있어야 type 값을 새 값으로 바꿀 수 있음)
alter table public.memberships drop constraint if exists memberships_type_check;
alter table public.memberships drop constraint if exists memberships_type_check_v2;

-- 2) 데이터 이전 (3종 → 2종)
update public.memberships set type = 'period'  where type = 'free';
update public.memberships set type = 'session' where type = 'class' and max_visits is not null;
update public.memberships set type = 'period'  where type = 'class' and max_visits is null;

-- 3) 새 제약 추가 (session/period)
alter table public.memberships add constraint memberships_type_check_v2 check (type in ('session', 'period'));

-- 4) 기간권 주당 목표 방문 (PERIOD 전용, nullable)
alter table public.memberships add column if not exists weekly_goal integer
  check (weekly_goal is null or weekly_goal > 0);

-- 5) 입력 출처
alter table public.memberships add column if not exists input_method text
  check (input_method is null or input_method in ('manual', 'receipt_scan'));


-- ████████████████████████████████████████████████████████████
-- 25_visits_verification.sql
-- ████████████████████████████████████████████████████████████

-- 25_visits_verification.sql
-- 체크인 UX Flow 명세 §6 — 방문 검증/자기신고 구분 + 회수 금액 기록.
--   method        : geofence(지오펜스 검증) / fallback(자기신고 보정)
--   verify_status : verified / unverified
--   recovered_amount : 이 방문으로 발생한 회수액(원). verify_status와 무관하게
--                       항상 계산된 회당가치가 들어간다(PRD §08, CheckInFlow.tsx
--                       checkIn() 참조) — 이 주석은 초기 설계 의도였고 실제
--                       구현과 다름.
--   center_lat/lng, distance_m : 검증 근거(반경 100m 판정)
-- 멱등(idempotent).
alter table public.visits add column if not exists method text
  check (method is null or method in ('geofence', 'fallback'));
alter table public.visits add column if not exists verify_status text
  check (verify_status is null or verify_status in ('verified', 'unverified'));
alter table public.visits add column if not exists recovered_amount integer not null default 0
  check (recovered_amount >= 0);
alter table public.visits add column if not exists center_lat double precision;
alter table public.visits add column if not exists center_lng double precision;
alter table public.visits add column if not exists distance_m double precision;


-- ████████████████████████████████████████████████████████████
-- 26_schedules.sql
-- ████████████████████████████████████████████████████████████

-- 26_schedules.sql
-- 일정 캘린더 — 예정 일정 저장(AI 추천/수동 입력). 과거 기록(visits/workout_logs/meals)과 별개.
--   type   : diet / workout / visit / custom
--   source : ai(코치 추천) / manual(직접 입력)
--   status : planned(예정) / done(완료) / skipped(건너뜀)
--   payload: 타입별 상세(jsonb) — 예) 식단 메뉴/끼니, 운동 루틴 요약, 메모
-- RLS owner-only. 멱등.

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  type text not null check (type in ('diet', 'workout', 'visit', 'custom')),
  title text not null,
  payload jsonb,
  source text not null default 'manual' check (source in ('ai', 'manual')),
  status text not null default 'planned' check (status in ('planned', 'done', 'skipped')),
  created_at timestamptz not null default now()
);

create index if not exists schedules_user_date_idx on public.schedules (user_id, date);

alter table public.schedules enable row level security;

drop policy if exists "schedules: read own" on public.schedules;
create policy "schedules: read own" on public.schedules
  for select using (auth.uid() = user_id);

drop policy if exists "schedules: insert own" on public.schedules;
create policy "schedules: insert own" on public.schedules
  for insert with check (auth.uid() = user_id);

drop policy if exists "schedules: update own" on public.schedules;
create policy "schedules: update own" on public.schedules
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "schedules: delete own" on public.schedules;
create policy "schedules: delete own" on public.schedules
  for delete using (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████
-- 29_exercise_add_cobra.sql
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- 29_exercise_add_cobra.sql
-- exercises 카탈로그에 "코브라 자세"(Bhujangasana) 1건 추가.
--
-- 분류:
--   body_region   = 스트레칭 (코치 톤 'stretch' — 명상적)
--   exercise_type = ['유연성']
--   goal_tags     = ['자세 개선']      — 가슴·척추 확장이 자세 교정에 효과
--   phase_tags    = ['cooldown','recovery'] — 마무리/회복 용도
--   intensity     = 1  (매우 가벼움)
-- 시간 기반(30초 default) — workout-ai 의 stretch warmup/cooldown 후보에 포함됨.
--
-- 주의:
--   place_tags 컬럼은 마이그레이션 23 에서 DROP 됐을 수 있어 INSERT 컬럼 목록에서 제외.
--   허리 통증자는 contraindicated_parts 로 제외되도록 '허리' 명시.
-- ============================================================

insert into public.exercises (
  name, body_region, exercise_type, goal_tags, phase_tags,
  target_parts, contraindicated_parts, equipment, is_high_impact, intensity,
  default_sets, default_reps, min_reps, max_reps,
  default_duration_sec, min_duration_sec, max_duration_sec,
  description_text, caution_text,
  early_reps, middle_reps, form_cues, final_reps,
  time_scripts, halfway_encouragement
) values
('코브라 자세', '스트레칭', array['유연성'], array['자세 개선'],
 array['cooldown','recovery'],
 array['척추','가슴','복부','어깨'], array['허리','손목'], array[]::text[],
 false, 1,
 null, null, null, null,
 30, 15, 45,
 '엎드린 자세에서 손바닥으로 바닥을 천천히 밀어 상체만 들어올립니다.',
 '허리 통증이 있다면 무리하지 말고 낮게 시작하세요.',
 array[]::text[], array[]::text[], array[]::text[], array[]::text[],
 array[
   '엎드려 손바닥을 어깨 옆에 둡니다.',
   '팔꿈치는 옆구리에 붙이고 천천히 밀어 상체를 들어올립니다.',
   '가슴을 펴고 시선은 살짝 위를 보세요.',
   '어깨는 귀에서 멀리 떨어뜨려요.',
   '호흡을 깊게 유지합니다.'
 ],
 '어깨 긴장 풀고 호흡 유지하세요.');


-- ████████████████████████████████████████████████████████████
-- 30_exercise_videos_bucket.sql
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- 30_exercise_videos_bucket.sql
-- 운동 시범 영상(MP4) 저장용 Storage 버킷 + exercises.video_url 컬럼.
--
-- 사용:
--   1) Studio Storage 에 squat.mp4 / cobra.mp4 / plank.mp4 업로드
--   2) update exercises set video_url='<publicURL>' where name='스쿼트'; ...
--   3) session.tsx 에서 current.video_url 있으면 <video>/expo-video 로 재생
--
-- public read — 영상은 사용자 비특정 콘텐츠라 인증 없이 URL 직접 GET 가능.
-- MIME video/mp4, 50MB 상한 — 임의 파일 업로드 차단 + 30초 안팎 운동 영상에 충분.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-videos',
  'exercise-videos',
  true,
  52428800,                    -- 50 MB
  array['video/mp4']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- public 버킷이지만 list/metadata 조회는 RLS 정책 필요.
drop policy if exists "exercise-videos readable to all" on storage.objects;
create policy "exercise-videos readable to all"
  on storage.objects for select
  using (bucket_id = 'exercise-videos');

-- exercises 테이블에 video_url 컬럼 추가 (nullable — 영상 없는 운동은 기존처럼 텍스트만).
alter table public.exercises
  add column if not exists video_url text;


-- ████████████████████████████████████████████████████████████
-- 31_exercise_videos_link.sql
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- 31_exercise_videos_link.sql
-- exercises.video_url 에 Storage 업로드 영상의 public URL 연결.
--
-- 매핑:
--   스쿼트       → squat.mp4
--   코브라 자세  → cobra.mp4
--   플랭크       → plank.mp4
--
-- 적용 전 30 마이그레이션으로 video_url 컬럼 + exercise-videos 버킷이 있어야 함.
-- 운동 행이 없으면 UPDATE 가 0 rows affected — 무해.
-- ============================================================

update public.exercises
   set video_url = 'https://cmghfzlctogzknbobdxn.supabase.co/storage/v1/object/public/exercise-videos/squat.mp4'
 where name = '스쿼트';

update public.exercises
   set video_url = 'https://cmghfzlctogzknbobdxn.supabase.co/storage/v1/object/public/exercise-videos/cobra.mp4'
 where name = '코브라 자세';

update public.exercises
   set video_url = 'https://cmghfzlctogzknbobdxn.supabase.co/storage/v1/object/public/exercise-videos/plank.mp4'
 where name = '플랭크';


-- ████████████████████████████████████████████████████████████
-- 32_events.sql
-- ████████████████████████████████████████████████████████████

-- 32_events.sql
-- 제품 이벤트 트래킹 — 계정 단위 퍼널/지표(NSM=주간 검증 체크인 등) 측정용.
--   name   : 이벤트 이름(signup / checkin_verified / schedule_added …)
--   props  : 이벤트별 상세(jsonb)
--   platform: web / ios / android
-- RLS owner-only(insert/select). 집계 분석은 서버(직접 SQL)에서 수행.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  props jsonb,
  platform text,
  created_at timestamptz not null default now()
);

create index if not exists events_name_created_idx on public.events (name, created_at);
create index if not exists events_user_created_idx on public.events (user_id, created_at);

alter table public.events enable row level security;

drop policy if exists "events: read own" on public.events;
create policy "events: read own" on public.events
  for select using (auth.uid() = user_id);

drop policy if exists "events: insert own" on public.events;
create policy "events: insert own" on public.events
  for insert with check (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████
-- 33_analytics_views.sql
-- ████████████████████████████████████████████████████████████

-- 33_analytics_views.sql
-- 사업/관리 지표 뷰. 전용 스키마 analytics(= PostgREST 기본 노출 X → 클라이언트로 새지 않음).
-- Metabase/SQL 직접 연결(읽기 전용 롤)에서 조회. 멱등(create or replace).

create schema if not exists analytics;

-- 1) 활성화 퍼널(베타 NSM) — 사용자별 단계 도달.
--    온보딩=profiles.onboarded, 회원권/핵심행동=도메인 테이블(이벤트 적재 이전 사용자도 포함).
create or replace view analytics.v_user_activation as
select
  u.id as user_id,
  coalesce(p.onboarded, false) as onboarded,
  exists (select 1 from public.memberships m where m.user_id = u.id) as has_membership,
  (
    exists (select 1 from public.visits v where v.user_id = u.id)
    or exists (select 1 from public.schedules s where s.user_id = u.id)
    or exists (select 1 from public.meals me where me.user_id = u.id)
    or exists (select 1 from public.workout_logs w where w.user_id = u.id)
  ) as did_core_action,
  exists (select 1 from public.visits v where v.user_id = u.id and v.verify_status = 'verified') as did_verified_checkin
from auth.users u
left join public.profiles p on p.id = u.id;

-- 1-요약) 인원수 퍼널(n/total). 베타(≤5명)에서 바로 4/5 확인용.
create or replace view analytics.v_activation_summary as
select
  count(*) as total_users,
  count(*) filter (where onboarded) as onboarded,
  count(*) filter (where has_membership) as with_membership,
  count(*) filter (where did_core_action) as core_action,
  count(*) filter (where did_verified_checkin) as verified_checkin
from analytics.v_user_activation;

-- 2) 주간 검증 체크인(출시 NSM) — 주별 검증 체크인 수 + 활성 사용자.
create or replace view analytics.v_weekly_verified_checkins as
select
  date_trunc('week', check_in_time) as week,
  count(*) as verified_checkins,
  count(distinct user_id) as active_users
from public.visits
where verify_status = 'verified'
group by 1
order by 1;

-- 3) 회원권 활용도/회수액 — 회원권별 검증 방문·회수액·회수율(원금 대비).
create or replace view analytics.v_membership_utilization as
select
  m.id as membership_id,
  m.user_id,
  m.type,
  m.cost,
  count(v.id) filter (where v.verify_status = 'verified') as verified_visits,
  coalesce(sum(v.recovered_amount), 0) as recovered,
  round(coalesce(sum(v.recovered_amount), 0)::numeric / nullif(m.cost, 0) * 100, 1) as recovery_pct,
  m.end_date,
  (m.end_date < now()::date) as expired
from public.memberships m
left join public.visits v on v.membership_id = m.id
group by m.id;

-- 4) 가입 코호트(주별) — 가입 수 + 방문 경험 비율.
create or replace view analytics.v_weekly_cohort as
select
  date_trunc('week', p.created_at) as cohort_week,
  count(*) as signups,
  count(*) filter (where exists (select 1 from public.visits v where v.user_id = p.id)) as ever_visited
from public.profiles p
group by 1
order by 1;


-- ████████████████████████████████████████████████████████████
-- 34_workout_custom.sql
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- 34_workout_custom.sql
-- "오늘 운동 커스텀" (워크아웃 챗봇 → 커스텀 루틴) 전용 도메인.
--
-- 두 테이블:
--   (1) workout_custom_catalog  — 부위×유형별 선택 가능한 종목 마스터.
--   (2) workout_sessions        — 한 번의 오운완 흐름(선택→루틴→기록).
--
-- 'exercises' 테이블과 분리한 이유:
--  - exercises 는 AI 코치 루틴/TTS 큐 용도라 컬럼·시드 정책이 달라서,
--    커스텀 UI에 노출할 6/4개 큐레이션을 깔끔히 분리한다.
-- ============================================================

-- ------------------------------------------------------------
-- (1) 카탈로그
-- ------------------------------------------------------------
create table if not exists public.workout_custom_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body_part text not null check (body_part in ('하체','상체','코어','전신')),
  exercise_type text not null check (exercise_type in ('근력','유산소','스트레칭')),
  unit text not null default '회' check (unit in ('회','초')),
  default_sets int not null default 3,
  default_reps int not null default 12,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (body_part, exercise_type, name)
);

create index if not exists workout_custom_catalog_lookup
  on public.workout_custom_catalog (body_part, exercise_type, sort_order);

alter table public.workout_custom_catalog enable row level security;

drop policy if exists "catalog readable by authenticated"
  on public.workout_custom_catalog;
create policy "catalog readable by authenticated"
  on public.workout_custom_catalog for select to authenticated using (true);

-- ------------------------------------------------------------
-- (2) 세션 (오운완 1건)
-- items JSONB: [{ catalog_id, name, unit, duration_min, sets, reps, done }]
-- success_flag: null = 진행중, 'Y' = 완료, 'N' = 실패(자정 넘김)
-- ------------------------------------------------------------
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  body_part text not null,
  exercise_type text not null,
  total_duration_min int not null default 60,
  items jsonb not null default '[]'::jsonb,
  memo text,
  success_flag text check (success_flag in ('Y','N')),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists workout_sessions_user_active
  on public.workout_sessions (user_id, success_flag, started_at desc);

alter table public.workout_sessions enable row level security;

drop policy if exists "sessions: own read" on public.workout_sessions;
create policy "sessions: own read"
  on public.workout_sessions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "sessions: own insert" on public.workout_sessions;
create policy "sessions: own insert"
  on public.workout_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "sessions: own update" on public.workout_sessions;
create policy "sessions: own update"
  on public.workout_sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ████████████████████████████████████████████████████████████
-- 35_workout_custom_seed.sql
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- 35_workout_custom_seed.sql
-- 부위(4) × 유형(3) 카탈로그 시드.
-- 근력: 6개 (헬스 기구 중심) / 유산소·스트레칭: 4개씩.
-- 단위는 정적·시간 기반 운동만 '초', 나머지는 '회'.
-- ============================================================

insert into public.workout_custom_catalog
  (name, body_part, exercise_type, unit, default_sets, default_reps, sort_order)
values
  -- ===== 하체 × 근력 (6) =====
  ('스쿼트',         '하체', '근력', '회', 3, 12, 1),
  ('런지',           '하체', '근력', '회', 3, 10, 2),
  ('레그 프레스',    '하체', '근력', '회', 3, 12, 3),
  ('레그 익스텐션',  '하체', '근력', '회', 3, 12, 4),
  ('레그 컬',        '하체', '근력', '회', 3, 12, 5),
  ('카프 레이즈',    '하체', '근력', '회', 3, 15, 6),

  -- ===== 상체 × 근력 (6) =====
  ('벤치 프레스',         '상체', '근력', '회', 3, 10, 1),
  ('랫풀다운',            '상체', '근력', '회', 3, 12, 2),
  ('시티드 로우',         '상체', '근력', '회', 3, 12, 3),
  ('숄더 프레스',         '상체', '근력', '회', 3, 10, 4),
  ('체스트 플라이',       '상체', '근력', '회', 3, 12, 5),
  ('트라이셉 익스텐션',   '상체', '근력', '회', 3, 12, 6),

  -- ===== 코어 × 근력 (6) =====
  ('플랭크',              '코어', '근력', '초', 3, 40, 1),
  ('행잉 레그 레이즈',    '코어', '근력', '회', 3, 12, 2),
  ('케이블 크런치',       '코어', '근력', '회', 3, 15, 3),
  ('디클라인 싯업',       '코어', '근력', '회', 3, 15, 4),
  ('러시안 트위스트',     '코어', '근력', '회', 3, 20, 5),
  ('앱 휠 롤아웃',        '코어', '근력', '회', 3, 10, 6),

  -- ===== 전신 × 근력 (6) =====
  ('데드리프트',     '전신', '근력', '회', 3, 8,  1),
  ('클린 앤 프레스', '전신', '근력', '회', 3, 8,  2),
  ('케틀벨 스윙',    '전신', '근력', '회', 3, 15, 3),
  ('버피',           '전신', '근력', '회', 3, 12, 4),
  ('파머스 워크',    '전신', '근력', '초', 3, 30, 5),
  ('스내치',         '전신', '근력', '회', 3, 6,  6),

  -- ===== 하체 × 유산소 (4) =====
  ('트레드밀 인클라인 워킹', '하체', '유산소', '초', 1, 600, 1),
  ('스텝밀',                 '하체', '유산소', '초', 1, 600, 2),
  ('사이클',                 '하체', '유산소', '초', 1, 600, 3),
  ('로잉 머신',              '하체', '유산소', '초', 1, 600, 4),

  -- ===== 상체 × 유산소 (4) =====
  ('상체 로잉 머신', '상체', '유산소', '초', 1, 600, 1),
  ('배틀 로프',      '상체', '유산소', '초', 3, 30,  2),
  ('어시스트 풀업',  '상체', '유산소', '회', 3, 10,  3),
  ('점핑잭',         '상체', '유산소', '회', 3, 30,  4),

  -- ===== 코어 × 유산소 (4) =====
  ('마운틴 클라이머', '코어', '유산소', '회', 3, 30, 1),
  ('버피 (코어)',     '코어', '유산소', '회', 3, 12, 2),
  ('박스 점프',       '코어', '유산소', '회', 3, 10, 3),
  ('점프 로프',       '코어', '유산소', '초', 3, 60, 4),

  -- ===== 전신 × 유산소 (4) =====
  ('트레드밀',     '전신', '유산소', '초', 1, 1200, 1),
  ('사이클 (전신)', '전신', '유산소', '초', 1, 1200, 2),
  ('일립티컬',     '전신', '유산소', '초', 1, 1200, 3),
  ('점프 로프 (전신)', '전신', '유산소', '초', 3, 90,  4),

  -- ===== 하체 × 스트레칭 (4) =====
  ('햄스트링 스트레칭',  '하체', '스트레칭', '초', 2, 30, 1),
  ('카프 스트레칭',      '하체', '스트레칭', '초', 2, 30, 2),
  ('힙 플렉서 스트레칭', '하체', '스트레칭', '초', 2, 30, 3),
  ('쿼드 스트레칭',      '하체', '스트레칭', '초', 2, 30, 4),

  -- ===== 상체 × 스트레칭 (4) =====
  ('가슴 스트레칭',  '상체', '스트레칭', '초', 2, 30, 1),
  ('어깨 회전',      '상체', '스트레칭', '회', 2, 15, 2),
  ('삼두 스트레칭',  '상체', '스트레칭', '초', 2, 30, 3),
  ('광배 스트레칭',  '상체', '스트레칭', '초', 2, 30, 4),

  -- ===== 코어 × 스트레칭 (4) =====
  ('코브라',          '코어', '스트레칭', '초', 2, 30, 1),
  ('차일드 포즈',     '코어', '스트레칭', '초', 2, 30, 2),
  ('캣카우',          '코어', '스트레칭', '회', 2, 10, 3),
  ('시티드 트위스트', '코어', '스트레칭', '초', 2, 30, 4),

  -- ===== 전신 × 스트레칭 (4) =====
  ('다운독',         '전신', '스트레칭', '초', 2, 30, 1),
  ('선 워리어',      '전신', '스트레칭', '초', 2, 30, 2),
  ('척추 트위스트',  '전신', '스트레칭', '초', 2, 30, 3),
  ('전신 폼롤링',    '전신', '스트레칭', '초', 1, 120, 4)
on conflict (body_part, exercise_type, name) do nothing;


-- ████████████████████████████████████████████████████████████
-- 36_workout_custom_images.sql
-- ████████████████████████████████████████████████████████████

-- ============================================================
-- 36_workout_custom_images.sql
-- 종목 카탈로그에 slug + image_path 추가 + Storage 버킷 생성.
--
-- 폴더 구조:
--   workout-custom-exercise/lower/<slug>.png   (하체)
--   workout-custom-exercise/upper/<slug>.png   (상체)
--   workout-custom-exercise/core/<slug>.png    (코어)
--   workout-custom-exercise/full/<slug>.png    (전신)
--
-- 앱은 image_path 만 읽고, supabase.storage.from(bucket).getPublicUrl(path)
-- 로 런타임에 public URL 을 구성한다. (프로젝트 URL 하드코딩 회피)
-- ============================================================

-- ------------------------------------------------------------
-- 컬럼 추가
-- ------------------------------------------------------------
alter table public.workout_custom_catalog
  add column if not exists slug text,
  add column if not exists image_path text;

-- ------------------------------------------------------------
-- Storage 버킷 생성 (public)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('workout-custom-exercise', 'workout-custom-exercise', true)
  on conflict (id) do nothing;

-- 공개 읽기 정책 (anon + authenticated 모두 SELECT 가능)
drop policy if exists "wcx public read"
  on storage.objects;
create policy "wcx public read"
  on storage.objects for select
  to public
  using (bucket_id = 'workout-custom-exercise');

-- 인증된 사용자 업로드 (Studio 사용자 / 운영용. 운영 정책 조정 시 변경)
drop policy if exists "wcx authenticated write"
  on storage.objects;
create policy "wcx authenticated write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'workout-custom-exercise');

-- ------------------------------------------------------------
-- slug + image_path 채우기 (종목명 기준)
-- ------------------------------------------------------------
update public.workout_custom_catalog set slug = v.slug, image_path = v.image_path
from (values
  -- 하체 / lower
  ('스쿼트',        'squat',          'lower/squat.png'),
  ('런지',          'lunge',          'lower/lunge.png'),
  ('레그 프레스',   'leg_press',      'lower/leg_press.png'),
  ('레그 익스텐션', 'leg_extension',  'lower/leg_extension.png'),
  ('레그 컬',       'leg_curl',       'lower/leg_curl.png'),
  ('카프 레이즈',   'calf_raise',     'lower/calf_raise.png'),
  ('트레드밀 인클라인 워킹', 'treadmill_incline', 'lower/treadmill_incline.png'),
  ('스텝밀',        'stepmill',       'lower/stepmill.png'),
  ('사이클',        'cycle',          'lower/cycle.png'),
  ('로잉 머신',     'rowing_machine', 'lower/rowing_machine.png'),
  ('햄스트링 스트레칭',  'hamstring_stretch',   'lower/hamstring_stretch.png'),
  ('카프 스트레칭',      'calf_stretch',        'lower/calf_stretch.png'),
  ('힙 플렉서 스트레칭', 'hip_flexor_stretch',  'lower/hip_flexor_stretch.png'),
  ('쿼드 스트레칭',      'quad_stretch',        'lower/quad_stretch.png'),

  -- 상체 / upper
  ('벤치 프레스',         'bench_press',      'upper/bench_press.png'),
  ('랫풀다운',            'lat_pulldown',     'upper/lat_pulldown.png'),
  ('시티드 로우',         'seated_row',       'upper/seated_row.png'),
  ('숄더 프레스',         'shoulder_press',   'upper/shoulder_press.png'),
  ('체스트 플라이',       'chest_fly',        'upper/chest_fly.png'),
  ('트라이셉 익스텐션',   'tricep_extension', 'upper/tricep_extension.png'),
  ('상체 로잉 머신',      'upper_rowing',     'upper/upper_rowing.png'),
  ('배틀 로프',           'battle_rope',      'upper/battle_rope.png'),
  ('어시스트 풀업',       'assist_pullup',    'upper/assist_pullup.png'),
  ('점핑잭',              'jumping_jack',     'upper/jumping_jack.png'),
  ('가슴 스트레칭',       'chest_stretch',    'upper/chest_stretch.png'),
  ('어깨 회전',           'shoulder_rotation','upper/shoulder_rotation.png'),
  ('삼두 스트레칭',       'tricep_stretch',   'upper/tricep_stretch.png'),
  ('광배 스트레칭',       'lat_stretch',      'upper/lat_stretch.png'),

  -- 코어 / core
  ('플랭크',              'plank',              'core/plank.png'),
  ('행잉 레그 레이즈',    'hanging_leg_raise',  'core/hanging_leg_raise.png'),
  ('케이블 크런치',       'cable_crunch',       'core/cable_crunch.png'),
  ('디클라인 싯업',       'decline_situp',      'core/decline_situp.png'),
  ('러시안 트위스트',     'russian_twist',      'core/russian_twist.png'),
  ('앱 휠 롤아웃',        'ab_wheel_rollout',   'core/ab_wheel_rollout.png'),
  ('마운틴 클라이머',     'mountain_climber',   'core/mountain_climber.png'),
  ('버피 (코어)',         'burpee_core',        'core/burpee_core.png'),
  ('박스 점프',           'box_jump',           'core/box_jump.png'),
  ('점프 로프',           'jump_rope',          'core/jump_rope.png'),
  ('코브라',              'cobra',              'core/cobra.png'),
  ('차일드 포즈',         'child_pose',         'core/child_pose.png'),
  ('캣카우',              'cat_cow',            'core/cat_cow.png'),
  ('시티드 트위스트',     'seated_twist',       'core/seated_twist.png'),

  -- 전신 / full
  ('데드리프트',          'deadlift',           'full/deadlift.png'),
  ('클린 앤 프레스',      'clean_and_press',    'full/clean_and_press.png'),
  ('케틀벨 스윙',         'kettlebell_swing',   'full/kettlebell_swing.png'),
  ('버피',                'burpee',             'full/burpee.png'),
  ('파머스 워크',         'farmers_walk',       'full/farmers_walk.png'),
  ('스내치',              'snatch',             'full/snatch.png'),
  ('트레드밀',            'treadmill',          'full/treadmill.png'),
  ('사이클 (전신)',       'cycle_full',         'full/cycle_full.png'),
  ('일립티컬',            'elliptical',         'full/elliptical.png'),
  ('점프 로프 (전신)',    'jump_rope_full',     'full/jump_rope_full.png'),
  ('다운독',              'downdog',            'full/downdog.png'),
  ('선 워리어',           'warrior',            'full/warrior.png'),
  ('척추 트위스트',       'spine_twist',        'full/spine_twist.png'),
  ('전신 폼롤링',         'full_foam_rolling',  'full/full_foam_rolling.png')
) as v(name, slug, image_path)
where public.workout_custom_catalog.name = v.name;

-- slug 유일성 보장 (이후 운영 추가시 보호막)
create unique index if not exists workout_custom_catalog_slug_key
  on public.workout_custom_catalog (slug);


-- ████████████████████████████████████████████████████████████
-- 37_exercise_level_v2.sql
-- ████████████████████████████████████████████████████████████

-- Expand profiles.exercise_level from a 3-step 운동경험 scale to a 5-step 활동계수 scale.
-- Run AFTER 03_extend_profiles.sql (which created profiles_exercise_level_check).
--
-- Old -> New mapping (활동계수 기준):
--   beginner     -> sedentary    (1.2   거의 안 움직임)
--   intermediate -> moderate     (1.55  주 3~5회)
--   advanced     -> very_active  (1.9   매일 고강도)
--   (신규 값 light 1.375 / active 1.725 는 백필 대상 없음 — 사용자가 직접 선택)
--
-- Order matters: drop the old constraint -> backfill rows -> add the new constraint.

alter table public.profiles
  drop constraint if exists profiles_exercise_level_check;

update public.profiles set exercise_level = 'sedentary' where exercise_level = 'beginner';
update public.profiles set exercise_level = 'moderate' where exercise_level = 'intermediate';
update public.profiles set exercise_level = 'very_active' where exercise_level = 'advanced';

alter table public.profiles
  add constraint profiles_exercise_level_check
  check (
    exercise_level is null
    or exercise_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')
  );


-- ████████████████████████████████████████████████████████████
-- 38_user_preferences_macro_ratio.sql
-- ████████████████████████████████████████████████████████████

-- Activate the macro-ratio part of user_preferences (10_user_preferences.sql was
-- created as a Phase 2 placeholder). Run AFTER 10_user_preferences.sql.
--
-- Doc -> column mapping:
--   탄수화물 비율 -> carb_ratio    (%, 40~65)
--   단백질 비율   -> protein_ratio (%, 7~35)
--   지방 비율     -> fat_ratio     (%, 15~30)
--
-- All three are nullable: a user who has never customised the ratio stays null and
-- the client falls back to the 50/20/30 default.
--
-- NOTE: 세 컬럼의 합이 100인지는 DB에서 강제하지 않는다. 슬라이더 반올림/부동소수점
-- 오차 때문에 DB 레벨 제약은 과하며, 합계 100 보장은 애플리케이션(프론트 슬라이더
-- 로직) 책임이다.
--
-- RLS: 10_user_preferences.sql 의 owner-only 정책이 그대로 적용되므로 추가 정책 불필요.

alter table public.user_preferences
  add column if not exists carb_ratio numeric,
  add column if not exists protein_ratio numeric,
  add column if not exists fat_ratio numeric;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_preferences_carb_ratio_check') then
    alter table public.user_preferences
      add constraint user_preferences_carb_ratio_check
      check (carb_ratio is null or carb_ratio between 40 and 65);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_preferences_protein_ratio_check') then
    alter table public.user_preferences
      add constraint user_preferences_protein_ratio_check
      check (protein_ratio is null or protein_ratio between 7 and 35);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_preferences_fat_ratio_check') then
    alter table public.user_preferences
      add constraint user_preferences_fat_ratio_check
      check (fat_ratio is null or fat_ratio between 15 and 30);
  end if;
end $$;


-- ████████████████████████████████████████████████████████████
-- 39_exercise_level_seed_v2.sql
-- ████████████████████████████████████████████████████████████

-- 37_exercise_level_v2.sql 이후에도 남아 있는 3단계(운동경험) 값 잔재를 정리한다.
-- Run AFTER 37_exercise_level_v2.sql.
--
-- 11_seed_demo_data.sql 은 과거 마이그레이션 히스토리 파일이라 수정하지 않는다(append-only).
-- 대신 여기서 두 가지를 처리한다.
--   (1) 데모 시드로 들어간 profiles.exercise_level 잔여 값 백필
--       (37 이후에 시드가 다시 돌았거나, 37 이전 스냅샷에서 복원한 DB 대비)
--   (2) seed_demo_data_for_user() 함수 본문에 하드코딩된 'intermediate' → 'moderate'
--       함수가 그대로면 수동 시드 실행 시 profiles_exercise_level_check 를 위반한다.
-- 둘 다 멱등이다.

-- (1) 값 백필 — 37 과 동일한 매핑
update public.profiles set exercise_level = 'sedentary'    where exercise_level = 'beginner';
update public.profiles set exercise_level = 'moderate'     where exercise_level = 'intermediate';
update public.profiles set exercise_level = 'very_active'  where exercise_level = 'advanced';

-- (2) 데모 시드 함수 본문 패치 — 78줄짜리 시드 본문을 복제하지 않고
--     기존 정의를 읽어 exercise_level 리터럴만 바꿔 재정의한다.
do $$
declare
  def text;
begin
  select pg_get_functiondef(p.oid)
    into def
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and p.proname = 'seed_demo_data_for_user';

  if def is not null and position('exercise_level = ''intermediate''' in def) > 0 then
    execute replace(def, 'exercise_level = ''intermediate''', 'exercise_level = ''moderate''');
  end if;
end $$;
