import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useCurrentUser } from '@/stores/auth';

export type Role = 'member' | 'admin';
export type Gender = 'M' | 'F';
// 활동 수준 5단계 (활동계수 매핑은 features/diet/guide.ts ACTIVITY_FACTOR)
export type ExerciseLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
  // 신체 정보 (식단 가이드 계산에 사용)
  age: number | null;
  gender: Gender | null;
  height: number | null; // cm
  weight: number | null; // kg
  exercise_level: ExerciseLevel | null;
  injury_history: string | null;
  medical_conditions: string | null;
  avoid_exercise_parts: string[] | null;
  onboarded: boolean;
}

export function useProfile() {
  const user = useCurrentUser();
  return useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}
