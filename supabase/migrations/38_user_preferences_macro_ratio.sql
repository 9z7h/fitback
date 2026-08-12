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
