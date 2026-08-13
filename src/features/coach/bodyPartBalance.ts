/**
 * 최근 완료 운동의 부위 밸런스 집계.
 *
 * 핏쌤(ai-feedback) plan 추천에서 편중 트레이닝을 막기 위한 입력값.
 * 두 소스를 합산한다:
 *   1) workout_logs      — 영문 body_part(lower/upper/full/cardio), created_at 기준
 *   2) workout_sessions  — 한글 body_part(하체/상체/코어/전신), completed_at 기준
 */

import { supabase } from '@/lib/supabase';

/** 부위 밸런스 카테고리(한글). */
export type BodyPartKo = '하체' | '상체' | '코어' | '전신';

/** 부위별 완료 횟수. */
export type BodyPartCounts = Record<BodyPartKo, number>;

/** workout_logs 영문 부위 → 한글 카테고리. cardio는 대응 카테고리가 없어 집계 제외. */
const LOG_PART_TO_KO: Record<string, BodyPartKo> = {
  lower: '하체',
  upper: '상체',
  full: '전신',
};

const LOG_PARTS = ['lower', 'upper', 'full'];
const SESSION_PARTS: BodyPartKo[] = ['하체', '상체', '코어', '전신'];

/**
 * 최근 `days`일간 완료한 운동의 부위별 횟수.
 * 집계 대상 기록이 하나도 없으면 null (cardio만 있는 경우 포함 — 밸런스 판단 근거가 못 됨).
 */
export async function getRecentBodyPartCounts(
  userId: string,
  days = 7,
): Promise<BodyPartCounts | null> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const [logsResp, sessionsResp] = await Promise.all([
    supabase
      .from('workout_logs')
      .select('body_part')
      .eq('user_id', userId)
      .eq('completion_status', 'completed')
      .in('body_part', LOG_PARTS)
      .gte('created_at', since),
    supabase
      .from('workout_sessions')
      .select('body_part')
      .eq('user_id', userId)
      .eq('success_flag', 'Y')
      .in('body_part', SESSION_PARTS)
      .gte('completed_at', since),
  ]);

  if (logsResp.error) throw logsResp.error;
  if (sessionsResp.error) throw sessionsResp.error;

  const counts: BodyPartCounts = { 하체: 0, 상체: 0, 코어: 0, 전신: 0 };
  let total = 0;

  for (const row of (logsResp.data ?? []) as { body_part: string }[]) {
    const ko = LOG_PART_TO_KO[row.body_part];
    if (!ko) continue; // cardio
    counts[ko] += 1;
    total += 1;
  }

  for (const row of (sessionsResp.data ?? []) as { body_part: BodyPartKo }[]) {
    counts[row.body_part] += 1;
    total += 1;
  }

  return total > 0 ? counts : null;
}
