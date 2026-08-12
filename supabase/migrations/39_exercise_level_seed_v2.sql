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
