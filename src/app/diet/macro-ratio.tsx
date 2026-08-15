/**
 * 탄단지 비율 직접 조정 — 권장 섭취 칼로리 기준으로 탄/단/지 비율(%)을 직접 맞춘다.
 *
 * - 진입 조건: 프로필(나이·성별·키·체중·활동수준)이 모두 채워져 있어야 한다.
 *   하나라도 비어 있으면 안내 + 프로필 입력 CTA만 노출(기본값으로 대체하지 않음).
 * - 조정: ±1%p 스테퍼. 합계 100%를 유지하도록 나머지 둘이 현재 비중에 비례해 자동 조정
 *   (adjustMacroRatio — features/diet/useMacroRatio.ts).
 * - 저장: user_preferences upsert 후 이전 화면으로 복귀.
 */

import { useRouter } from 'expo-router';
import { Check, ChevronLeft, CircleAlert, Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sheetPresentation } from '@/components/modal-presentation';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button, Icon } from '@/components/ui';
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  Radius,
  ScreenPadding,
  Spacing,
} from '@/constants/theme';
import { MyPanel } from '@/features/auth/MyPanel';
import { useProfile } from '@/features/auth/useProfile';
import { calorieTargetFromProfile, workoutAdjustedKcal } from '@/features/diet/guide';
import {
  DEFAULT_MACRO_RATIO,
  MACRO_RATIO_KEYS,
  MACRO_RATIO_OPTIMAL,
  MACRO_RATIO_RANGE,
  adjustMacroRatio,
  gramsOf,
  useMacroRatio,
  useSaveMacroRatio,
  type MacroRatio,
  type MacroRatioKey,
} from '@/features/diet/useMacroRatio';
import { useTodayWorkoutLog } from '@/features/workout/useTodayWorkoutLog';

const MACRO_LABEL: Record<MacroRatioKey, string> = {
  carb: '탄수화물',
  protein: '단백질',
  fat: '지방',
};

// 비율 조정 단위(%p)
const STEP = 1;

export default function MacroRatioScreen() {
  const router = useRouter();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: saved, isLoading: ratioLoading } = useMacroRatio();
  const save = useSaveMacroRatio();
  // diet 화면과 같은 기준의 kcal — 오늘 운동 컨텍스트(목표·부위·강도) 보정까지 반영.
  const workoutLog = useTodayWorkoutLog();

  // 조정 전에는 저장된 커스텀 값(없으면 기본값)을 그대로 보여준다.
  const [edited, setEdited] = useState<MacroRatio | null>(null);
  const ratio: MacroRatio = edited ?? saved ?? DEFAULT_MACRO_RATIO;
  const [showProfilePanel, setShowProfilePanel] = useState(false);

  const loading = profileLoading || ratioLoading || workoutLog.isLoading;
  const profileReady =
    !!profile &&
    profile.age != null &&
    profile.gender != null &&
    profile.height != null &&
    profile.weight != null &&
    profile.exercise_level != null;

  const workoutCtx = workoutLog.data?.context ?? { source: 'none' as const, goal: 'maintain' as const };
  const baseKcal = profileReady
    ? calorieTargetFromProfile(
        {
          age: profile.age,
          gender: profile.gender,
          height: profile.height,
          weight: profile.weight,
          exerciseLevel: profile.exercise_level,
        },
        workoutCtx.goal,
      )
    : null;
  const kcal = baseKcal == null ? null : workoutAdjustedKcal(workoutCtx, baseKcal);

  function step(key: MacroRatioKey, delta: number) {
    setEdited(adjustMacroRatio(ratio, key, delta));
  }

  function submit() {
    save.mutate(ratio, { onSuccess: () => router.back() });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            style={({ pressed }) => [styles.iconBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <Icon icon={ChevronLeft} size={24} color={Palette.gray800} />
          </Pressable>
          <ThemedText type="subtitle">탄단지 비율 조정</ThemedText>
          <View style={styles.iconBtn} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.primary} />
          </View>
        ) : !profileReady || kcal == null ? (
          <View style={styles.center}>
            <Icon icon={CircleAlert} size={40} color={Palette.gray500} />
            <ThemedText type="h2" style={styles.blockTitle}>
              프로필을 먼저 입력해주세요
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.blockDesc}>
              나이·성별·키·체중·활동 수준이 있어야 권장 섭취 칼로리를 계산할 수 있어요.
            </ThemedText>
            <Button
              label="프로필 입력하러 가기"
              onPress={() => setShowProfilePanel(true)}
              style={styles.blockBtn}
            />
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}>
              <ThemedText type="h2">탄단지 비율을 직접 변경할 수 있어요!</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.lead}>
                권장 섭취 칼로리 {kcal.toLocaleString()}kcal 기준으로 계산했어요.
              </ThemedText>

              {/* 추천 영양 섭취표 — 허용 범위(%)와 g 환산 범위 */}
              <View style={styles.card}>
                <ThemedText type="bodySemibold">추천 영양 섭취표</ThemedText>
                {MACRO_RATIO_KEYS.map((key) => {
                  const range = MACRO_RATIO_RANGE[key];
                  return (
                    <View key={key} style={styles.tableRow}>
                      <ThemedText type="caption" style={styles.tableLabel}>
                        {MACRO_LABEL[key]}
                      </ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {range.min}–{range.max}%
                      </ThemedText>
                      <ThemedText type="captionBold" style={styles.tableGrams}>
                        {gramsOf(kcal, key, range.min)}–{gramsOf(kcal, key, range.max)}g
                      </ThemedText>
                    </View>
                  );
                })}
              </View>

              {/* 비율 조정 */}
              <View style={styles.card}>
                {MACRO_RATIO_KEYS.map((key) => (
                  <MacroRatioRow
                    key={key}
                    label={MACRO_LABEL[key]}
                    value={ratio[key]}
                    grams={gramsOf(kcal, key, ratio[key])}
                    optimal={
                      ratio[key] >= MACRO_RATIO_OPTIMAL[key].min &&
                      ratio[key] <= MACRO_RATIO_OPTIMAL[key].max
                    }
                    optimalLabel={`${MACRO_RATIO_OPTIMAL[key].min}–${MACRO_RATIO_OPTIMAL[key].max}%`}
                    canDecrease={ratio[key] > MACRO_RATIO_RANGE[key].min}
                    canIncrease={ratio[key] < MACRO_RATIO_RANGE[key].max}
                    onStep={(delta) => step(key, delta)}
                  />
                ))}
              </View>

              <ThemedText type="caption" themeColor="textSecondary" style={styles.note}>
                세 영양소의 합은 항상 100%예요. 하나를 조정하면 나머지 두 영양소가 지금 비중만큼 나눠서
                자동으로 조정돼요.
              </ThemedText>
            </ScrollView>

            <View style={styles.footer}>
              <Button label="완료" onPress={submit} loading={save.isPending} />
            </View>
          </>
        )}
      </SafeAreaView>

      <Modal
        visible={showProfilePanel}
        animationType="slide"
        presentationStyle={sheetPresentation}
        onRequestClose={() => setShowProfilePanel(false)}>
        <MyPanel onClose={() => setShowProfilePanel(false)} />
      </Modal>
    </ThemedView>
  );
}

// 매크로 한 줄 — 라벨 + (- % +) 스테퍼 + g 환산 + 최적 뱃지/권장 구간
function MacroRatioRow({
  label,
  value,
  grams,
  optimal,
  optimalLabel,
  canDecrease,
  canIncrease,
  onStep,
}: {
  label: string;
  value: number;
  grams: number;
  optimal: boolean;
  optimalLabel: string;
  canDecrease: boolean;
  canIncrease: boolean;
  onStep: (delta: number) => void;
}) {
  return (
    <View style={styles.macroRow}>
      <View style={styles.macroHead}>
        <ThemedText type="bodySemibold">{label}</ThemedText>
        {optimal ? (
          <View style={styles.optimalBadge}>
            <Icon icon={Check} size={12} color={Palette.primary} />
            <ThemedText type="label" style={styles.optimalText}>
              최적
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="label" themeColor="textSecondary">
            권장 {optimalLabel}
          </ThemedText>
        )}
      </View>
      <View style={styles.macroControl}>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => onStep(-STEP)}
            disabled={!canDecrease}
            accessibilityRole="button"
            accessibilityLabel={`${label} 비율 줄이기`}
            style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}>
            <Icon icon={Minus} size={16} color={canDecrease ? Palette.gray800 : Palette.gray400} />
          </Pressable>
          <ThemedText type="bodySemibold" style={styles.stepValue}>
            {value}%
          </ThemedText>
          <Pressable
            onPress={() => onStep(STEP)}
            disabled={!canIncrease}
            accessibilityRole="button"
            accessibilityLabel={`${label} 비율 늘리기`}
            style={({ pressed }) => [styles.stepBtn, pressed && styles.stepBtnPressed]}>
            <Icon icon={Plus} size={16} color={canIncrease ? Palette.gray800 : Palette.gray400} />
          </Pressable>
        </View>
        <ThemedText type="captionBold" themeColor="textSecondary">
          {grams}g
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.bgBase },
  safe: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ScreenPadding,
    paddingVertical: Spacing.m,
  },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ScreenPadding,
    gap: Spacing.sm,
  },
  blockTitle: { marginTop: Spacing.sm, textAlign: 'center' },
  blockDesc: { textAlign: 'center' },
  blockBtn: { marginTop: Spacing.md, alignSelf: 'stretch' },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: ScreenPadding,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  lead: { marginTop: -Spacing.sm },

  card: {
    width: '100%',
    backgroundColor: Palette.bgSurface,
    borderRadius: Radius.card,
    padding: Spacing.card,
    gap: Spacing.m,
  },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tableLabel: { flex: 1 },
  tableGrams: { width: 96, textAlign: 'right' },

  macroRow: { gap: Spacing.sm },
  macroHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  macroControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.lineDefault,
    borderRadius: Radius.button,
    backgroundColor: Palette.bgMuted,
  },
  stepBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepBtnPressed: { opacity: 0.6 },
  stepValue: { minWidth: 56, textAlign: 'center' },
  optimalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
  },
  optimalText: { color: Palette.primary },
  note: { marginTop: -Spacing.xs },

  footer: {
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.m,
    paddingBottom: Spacing.m + BottomTabInset,
  },
});
