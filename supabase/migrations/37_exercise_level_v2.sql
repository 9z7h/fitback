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
