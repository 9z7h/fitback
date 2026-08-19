import type { BodyPartCounts, BodyPartKo } from '@/features/coach/bodyPartBalance';

export interface RecommendedRoutine {
  chipLabel: string;
  title: string;
  durationMin: number;
  exerciseCount: number;
  calories: number;
}

// 부위별 대표 루틴 스펙(운동시간/종목/칼로리) — 실제 루틴 데이터 연결 전 임시값.
const BODY_PART_STATS: Record<BodyPartKo, { durationMin: number; exerciseCount: number; calories: number }> = {
  하체: { durationMin: 50, exerciseCount: 5, calories: 410 },
  상체: { durationMin: 45, exerciseCount: 5, calories: 380 },
  코어: { durationMin: 30, exerciseCount: 4, calories: 220 },
  전신: { durationMin: 55, exerciseCount: 6, calories: 450 },
};

const DEFAULT_ORDER: BodyPartKo[] = ['하체', '상체', '코어'];

/** 최근 운동 기록이 적은 부위 순으로 2~3개 추천. 기록이 전혀 없으면 기본 순서(하체/상체/코어). */
export function getRecommendedRoutines(bodyParts: BodyPartCounts | null | undefined): RecommendedRoutine[] {
  const order =
    bodyParts && Object.values(bodyParts).some((n) => n > 0)
      ? (Object.keys(bodyParts) as BodyPartKo[]).sort((a, b) => bodyParts[a] - bodyParts[b])
      : DEFAULT_ORDER;

  return order.slice(0, 3).map((part) => ({
    chipLabel: `${part} 근력 부족 보완`,
    title: `${part} 근육 강화 루틴`,
    ...BODY_PART_STATS[part],
  }));
}
