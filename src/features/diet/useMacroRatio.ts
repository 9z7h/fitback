/**
 * 탄단지 비율 커스텀 — user_preferences(carb_ratio/protein_ratio/fat_ratio) 조회·저장.
 *
 * 비율은 %(정수) 3개의 합이 항상 100. 커스텀 전(널)이면 DEFAULT_MACRO_RATIO를 쓴다.
 * 재분배 로직(adjustMacroRatio)은 순수 함수로 분리해 화면에서 그대로 소비한다.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/stores/auth';

export type MacroRatioKey = 'carb' | 'protein' | 'fat';
export const MACRO_RATIO_KEYS: MacroRatioKey[] = ['carb', 'protein', 'fat'];

export interface MacroRatio {
  carb: number;
  protein: number;
  fat: number;
}

/** 커스텀 전 기본 비율 (합 100) */
export const DEFAULT_MACRO_RATIO: MacroRatio = { carb: 50, protein: 20, fat: 30 };

/** 허용 범위 (DB 제약과 동일) */
export const MACRO_RATIO_RANGE: Record<MacroRatioKey, { min: number; max: number }> = {
  carb: { min: 40, max: 65 },
  protein: { min: 7, max: 35 },
  fat: { min: 15, max: 30 },
};

/** 기본값 ±5%p — 이 구간 안이면 화면에서 '최적'으로 표시 */
export const MACRO_RATIO_OPTIMAL: Record<MacroRatioKey, { min: number; max: number }> = {
  carb: { min: 45, max: 55 },
  protein: { min: 15, max: 25 },
  fat: { min: 25, max: 30 },
};

/** 매크로 1g당 칼로리 */
export const MACRO_KCAL_PER_G: Record<MacroRatioKey, number> = { carb: 4, protein: 4, fat: 9 };

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** 비율(%) → g. 목표 칼로리 × 비율 ÷ (4 또는 9). */
export function gramsOf(kcal: number, key: MacroRatioKey, ratio: number): number {
  return Math.round((kcal * (ratio / 100)) / MACRO_KCAL_PER_G[key]);
}

/**
 * 한 매크로를 delta(%p)만큼 조정하고 합계 100을 유지하도록 나머지 둘을 재분배한다.
 * - 나머지 둘은 "현재 두 값의 비율"에 비례해 나눠 흡수한다(반올림 오차는 두 번째 값이 떠안음).
 * - 각 매크로는 MACRO_RATIO_RANGE를 벗어나지 않으며, 흡수 여력이 부족하면 그만큼만 움직인다.
 */
export function adjustMacroRatio(current: MacroRatio, key: MacroRatioKey, delta: number): MacroRatio {
  const dir = Math.sign(delta);
  if (dir === 0) return current;

  const others = MACRO_RATIO_KEYS.filter((k) => k !== key);
  const roomOf = (k: MacroRatioKey, d: number) =>
    d > 0 ? MACRO_RATIO_RANGE[k].max - current[k] : current[k] - MACRO_RATIO_RANGE[k].min;

  // 자기 범위 여유와 나머지 둘의 흡수 여력 중 작은 쪽까지만 움직인다.
  const capacity = Math.min(
    Math.abs(delta),
    roomOf(key, dir),
    others.reduce((s, o) => s + roomOf(o, -dir), 0),
  );
  const move = dir * capacity;
  if (move === 0) return current;

  const next: MacroRatio = { ...current, [key]: current[key] + move };

  // 나머지 둘이 합쳐서 흡수할 양(부호 포함) — 현재 비중대로 비례 분배
  const rest = -move;
  const total = others.reduce((s, o) => s + current[o], 0);
  const first = total > 0 ? Math.round((current[others[0]] / total) * rest) : Math.round(rest / 2);
  const shares = [first, rest - first];
  others.forEach((o, i) => {
    next[o] = clamp(current[o] + shares[i], MACRO_RATIO_RANGE[o].min, MACRO_RATIO_RANGE[o].max);
  });

  // clamp로 옮기지 못한 잔량은 여유가 남은 쪽으로 이월 (합계 100 보정)
  let leftover = 100 - (next.carb + next.protein + next.fat);
  for (const o of others) {
    if (leftover === 0) break;
    const moved = clamp(next[o] + leftover, MACRO_RATIO_RANGE[o].min, MACRO_RATIO_RANGE[o].max);
    leftover -= moved - next[o];
    next[o] = moved;
  }

  return next;
}

interface MacroRatioRow {
  carb_ratio: number | null;
  protein_ratio: number | null;
  fat_ratio: number | null;
}

/** 저장된 커스텀 비율. 커스텀한 적 없으면 null. */
export function useMacroRatio() {
  const user = useCurrentUser();
  return useQuery<MacroRatio | null>({
    queryKey: ['macroRatio', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_preferences')
        .select('carb_ratio, protein_ratio, fat_ratio')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      const row = data as MacroRatioRow | null;
      if (!row || row.carb_ratio == null || row.protein_ratio == null || row.fat_ratio == null) {
        return null;
      }
      return { carb: row.carb_ratio, protein: row.protein_ratio, fat: row.fat_ratio };
    },
  });
}

/** 커스텀 비율 저장 — user_id 기준 upsert. */
export function useSaveMacroRatio() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ratio: MacroRatio) => {
      if (!user) throw new Error('로그인이 필요합니다.');
      const { error } = await supabase.from('user_preferences').upsert(
        {
          user_id: user.id,
          carb_ratio: ratio.carb,
          protein_ratio: ratio.protein,
          fat_ratio: ratio.fat,
        },
        { onConflict: 'user_id' },
      );
      if (error) throw error;
      return ratio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['macroRatio', user?.id] });
    },
  });
}
