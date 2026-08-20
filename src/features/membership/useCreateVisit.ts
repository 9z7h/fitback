import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/stores/auth';

export interface NewVisitInput {
  membershipId: string;
  centerName?: string | null;
  /** 검증/수동 출석 구분 */
  method?: 'geofence' | 'fallback';
  verifyStatus?: 'verified' | 'unverified';
  recoveredAmount?: number; // unverified면 0
  centerLat?: number | null;
  centerLng?: number | null;
  distanceM?: number | null;
}

/**
 * 센터 도착 = 체크인. visits에 한 건 insert (check_in_time은 DB default now()).
 * 성공 시 memberships(visit 집계)와 monthlyStats를 무효화해 위험도·방문수가 갱신된다.
 */
export function useCreateVisit() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewVisitInput) => {
      if (!user) throw new Error('로그인이 필요합니다.');
      const { data, error } = await supabase
        .rpc('create_visit', {
          p_membership_id: input.membershipId,
          p_center_name: input.centerName ?? null,
          p_method: input.method ?? null,
          p_verify_status: input.verifyStatus ?? null,
          p_recovered_amount: input.recoveredAmount ?? 0,
          p_center_lat: input.centerLat ?? null,
          p_center_lng: input.centerLng ?? null,
          p_distance_m: input.distanceM ?? null,
        })
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['monthlyStats', user?.id] });
    },
  });
}
