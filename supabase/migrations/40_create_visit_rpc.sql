-- 회원권 유효성 검증과 방문 생성을 한 트랜잭션으로 처리한다.
-- 클라이언트는 직접 visits insert를 할 수 없으며, 수동 출석도 이 RPC를 통과한다.

create or replace function public.create_visit(
  p_membership_id uuid,
  p_center_name text default null,
  p_method text default null,
  p_verify_status text default null,
  p_recovered_amount integer default 0,
  p_center_lat double precision default null,
  p_center_lng double precision default null,
  p_distance_m double precision default null
)
returns public.visits
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_membership public.memberships%rowtype;
  used_visit_count integer;
  created_visit public.visits%rowtype;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
  into target_membership
  from public.memberships
  where id = p_membership_id
    and user_id = auth.uid()
  for update;

  if not found then
    raise exception '회원권을 찾을 수 없습니다.';
  end if;

  if target_membership.start_date > current_date then
    raise exception '아직 시작되지 않은 회원권입니다.';
  end if;

  if target_membership.end_date < current_date then
    raise exception '만료된 회원권입니다.';
  end if;

  if target_membership.type = 'session'
    and target_membership.max_visits is not null then
    select count(*)
    into used_visit_count
    from public.visits
    where membership_id = target_membership.id;

    if used_visit_count >= target_membership.max_visits then
      raise exception '남은 횟수가 없는 회원권입니다.';
    end if;
  end if;

  insert into public.visits (
    user_id,
    membership_id,
    center_name,
    status,
    method,
    verify_status,
    recovered_amount,
    center_lat,
    center_lng,
    distance_m
  )
  values (
    auth.uid(),
    target_membership.id,
    p_center_name,
    'checked_in',
    p_method,
    p_verify_status,
    coalesce(p_recovered_amount, 0),
    p_center_lat,
    p_center_lng,
    p_distance_m
  )
  returning * into created_visit;

  return created_visit;
end;
$$;

drop policy if exists "visits: insert own" on public.visits;
drop policy if exists "visits: update own" on public.visits;
drop policy if exists "visits: delete own" on public.visits;

revoke all on function public.create_visit(uuid, text, text, text, integer, double precision, double precision, double precision) from public;
grant execute on function public.create_visit(uuid, text, text, text, integer, double precision, double precision, double precision) to authenticated;