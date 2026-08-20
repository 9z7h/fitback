/**
 * 운동 홈 — Figma "운동"(956:79) 이식.
 * 오늘 운동 요약(실데이터: 이번 주 방문·주간 목표) + AI 코칭 + 루틴 캐러셀(데이터 연결 전 빈 상태) +
 * 이번 주 근육 밸런스(실데이터: workout_logs/workout_sessions 부위별 집계).
 */
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import {
  Image,
  type LayoutChangeEvent,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sheetPresentation } from '@/components/modal-presentation';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui';
import { AiChatBubble } from '@/components/ui/AiChatBubble';
import { Gnb } from '@/components/ui/Gnb';
import { Indicator } from '@/components/ui/Indicator';
import { InfoBox } from '@/components/ui/InfoBox';
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
import { CoachChat } from '@/features/coach/CoachChat';
import { getRecentBodyPartCounts, type BodyPartKo } from '@/features/coach/bodyPartBalance';
import { useCenter } from '@/features/membership/useCenter';
import { useMemberships } from '@/features/membership/useMemberships';
import { FitCard } from '@/features/workout/FitCard';
import { getRecommendedRoutines } from '@/features/workout/recommendRoutines';
import { routeToCustom } from '@/features/workout/route-to-custom';
import { useThisWeekWorkouts } from '@/features/workout/useThisWeekWorkouts';

const GNB_HEIGHT = 68; // 52 헤더 + 16 하단 패딩
const BODY_PART_ORDER: BodyPartKo[] = ['하체', '상체', '코어', '전신'];

/** Figma(1427:1662) 상체/하체 카드 2장 그대로 — 세부 부위(어깨/등/가슴 등) 라벨·색상. */
interface MuscleCell { label: string; color: string }
const UPPER_CELLS: MuscleCell[] = [
  { label: '어깨', color: Palette.primary },
  { label: '등', color: Palette.secondary },
  { label: '가슴', color: Palette.tertiary },
  { label: '복부', color: Palette.gray600 },
  { label: '이두', color: Palette.gray600 },
  { label: '삼두', color: Palette.gray600 },
];
const LOWER_CELLS: MuscleCell[] = [
  { label: '엉덩이', color: Palette.primary },
  { label: '허벅지', color: Palette.gray600 },
  { label: '종아리', color: Palette.tertiary },
];
const BALANCE_CARDS: { headline: BodyPartKo; cells: MuscleCell[] }[] = [
  { headline: '상체', cells: UPPER_CELLS },
  { headline: '하체', cells: LOWER_CELLS },
];

function SectionTitle({ children }: { children: string }) {
  return <ThemedText type="subtitle">{children}</ThemedText>;
}

/** 데이터 연결 전(저장된 루틴 목록 없음) — 가짜 숫자 대신 빈 상태 카드. */
function EmptyCard({ text }: { text: string }) {
  return (
    <View style={styles.emptyCard}>
      <ThemedText type="body" themeColor="textSecondary">
        {text}
      </ThemedText>
    </View>
  );
}

/**
 * 근육 밸런스 카드 — Figma(1427:1662) 그대로. 헤더 %(상체/하체)는 실데이터
 * (workout_logs/workout_sessions 4대분류 집계) 기반, 세부 부위(어깨/등/가슴 등) 그리드는
 * DB에 없는 세부 데이터라 0%로 표기하고 그림 이미지는 임시 자리 표시자로 둔다.
 */
function MuscleBalanceCard({
  width,
  headline,
  pct,
  cells,
  activeIndex,
}: {
  width: number;
  headline: BodyPartKo;
  pct: number;
  cells: MuscleCell[];
  activeIndex: number;
}) {
  return (
    <View style={[styles.balanceCard, { width }]}>
      <View>
        <ThemedText type="body" themeColor="textSecondary">
          {headline}
        </ThemedText>
        <ThemedText type="h1">{pct}%</ThemedText>
      </View>
      <View style={styles.balanceImagePlaceholder} />
      <View style={styles.balanceGrid}>
        {cells.map((c) => (
          <View key={c.label} style={styles.balanceCell}>
            <ThemedText type="bodySemibold" style={{ color: c.color }}>
              {c.label}
            </ThemedText>
            <ThemedText type="bodySemibold" style={{ color: Palette.gray800 }}>
              0%
            </ThemedText>
          </View>
        ))}
      </View>
      <Indicator count={BALANCE_CARDS.length} activeIndex={activeIndex} style={styles.balanceIndicator} />
    </View>
  );
}

export default function WorkoutScreen() {
  const router = useRouter();
  const [showMyPanel, setShowMyPanel] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  const { data: thisWeekWorkouts } = useThisWeekWorkouts();
  const weeklyWorkoutCount = (thisWeekWorkouts ?? []).filter((d) => d.status !== null).length;

  const { data: memberships } = useMemberships();
  const activeMembership = (memberships ?? []).find((m) => m.status !== 'expired');
  const weeklyGoal = activeMembership?.weeklyGoal ?? null;
  const { data: activeCenter } = useCenter(activeMembership?.id ?? null);
  const centerName = activeCenter?.name ?? activeMembership?.name ?? '센터 미등록';

  const { data: profile } = useProfile();
  const { data: bodyParts } = useQuery({
    queryKey: ['workout-home-body-parts', profile?.id],
    staleTime: 1000 * 60 * 30,
    enabled: !!profile?.id,
    queryFn: () => getRecentBodyPartCounts(profile!.id),
  });
  const bodyPartTotal = bodyParts
    ? BODY_PART_ORDER.reduce((sum, k) => sum + bodyParts[k], 0)
    : 0;
  const recommendedRoutines = getRecommendedRoutines(bodyParts);

  const [recWidth, setRecWidth] = useState(0);
  const [recIndex, setRecIndex] = useState(0);
  const onRecLayout = (e: LayoutChangeEvent) => setRecWidth(e.nativeEvent.layout.width);
  // 캐러셀 영역만 화면 좌우 여백(ScreenPadding) 밖으로 풀블리드(recWidth=화면 전체 폭)시키고,
  // ScrollView 안쪽에 같은 여백을 padding으로 되돌려 카드 폭(335 상당)은 기존과 동일하게 유지한다.
  // 그 결과 생기는 좌우 여백 공간에서 스와이프 중 옆 카드가 잘리지 않고 피크로 보인다.
  const recCardWidth = recWidth > 0 ? recWidth - ScreenPadding * 2 : 0;
  const recSnapInterval = recCardWidth + Spacing.sm;
  const onRecScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!recSnapInterval) return;
    setRecIndex(Math.round(e.nativeEvent.contentOffset.x / recSnapInterval));
  };

  const [balanceWidth, setBalanceWidth] = useState(0);
  const [balanceIndex, setBalanceIndex] = useState(0);
  const onBalanceLayout = (e: LayoutChangeEvent) => setBalanceWidth(e.nativeEvent.layout.width);
  const balanceCardWidth = balanceWidth > 0 ? balanceWidth - ScreenPadding * 2 : 0;
  const balanceSnapInterval = balanceCardWidth + Spacing.sm;
  const onBalanceScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!balanceSnapInterval) return;
    setBalanceIndex(Math.round(e.nativeEvent.contentOffset.x / balanceSnapInterval));
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Gnb onMenu={() => setShowMyPanel(true)} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* 오늘 운동 히어로 카드 + 핏쌤 코칭 — 이 둘 사이만 16px, 나머지 섹션은 scrollContent gap(32px) */}
          <View style={styles.heroGroup}>
          <View style={styles.heroCard}>
            <View style={styles.heroHead}>
              <View style={styles.heroTextCol}>
                <ThemedText type="h1">오늘 운동 해볼까요?</ThemedText>
                <ThemedText type="body" themeColor="textSecondary">
                  이번 주 {weeklyWorkoutCount}회 운동 중
                </ThemedText>
              </View>
              <Image
                source={require('../../../assets/images/dumbbell.png')}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.heroInfoRow}>
              <InfoBox label="권장 운동시간" valueMain="50분" />
              <InfoBox
                label="이번 주 목표"
                valueMain={`${weeklyWorkoutCount}회`}
                valueSub={weeklyGoal ? `/ ${weeklyGoal}회` : undefined}
              />
            </View>

            <View style={styles.heroBtnRow}>
              <Button
                variant="secondary"
                style={styles.heroBtn}
                onPress={() => router.push('/workout/coach?mode=dev')}>
                홈트하기
              </Button>
              <Button
                variant="primary"
                style={styles.heroBtn}
                onPress={() => void routeToCustom(router)}>
                센터 가기
              </Button>
            </View>
          </View>

          <Pressable
            onPress={() => setShowCoach(true)}
            accessibilityRole="button"
            accessibilityLabel="핏쌤 코칭 열기">
            <AiChatBubble variant="card" title="핏쌤 코칭">
              이번 주는 2번만 더 가면 페이스 회복 돼요. 오늘 가볍게 시작해볼까요?
            </AiChatBubble>
          </Pressable>
          </View>

          {/* 핏쌤 추천 루틴하기 — Figma fit_card(1610:2927). 저장된 루틴 데이터 없어도
              최근 기록이 적은 부위 순으로 2~3개 추천(recommendRoutines.ts), 센터명은 실데이터. */}
          <View style={styles.section}>
            <SectionTitle>핏쌤 추천 루틴하기</SectionTitle>
            <View onLayout={onRecLayout} style={styles.recBleed}>
              {recCardWidth > 0 ? (
                <ScrollView
                  horizontal
                  snapToInterval={recSnapInterval}
                  decelerationRate="fast"
                  contentContainerStyle={styles.recContent}
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onRecScrollEnd}
                  onScrollEndDrag={onRecScrollEnd}
                  onScroll={onRecScrollEnd}
                  scrollEventThrottle={100}>
                  {recommendedRoutines.map((routine) => (
                    <FitCard
                      key={routine.title}
                      routine={routine}
                      centerName={centerName}
                      width={recCardWidth}
                      count={recommendedRoutines.length}
                      activeIndex={recIndex}
                    />
                  ))}
                </ScrollView>
              ) : null}
            </View>
          </View>

          {/* 내 루틴으로 운동하기 — 저장된 내 루틴 목록 기능 없음(데이터 설계 전), 빈 상태 */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <SectionTitle>내 루틴으로 운동하기</SectionTitle>
              <ArrowRight color={Palette.iconPrimary} size={20} />
            </View>
            <EmptyCard text="아직 등록한 루틴이 없어요" />
          </View>

          {/* 이번 주 근육 밸런스 — 실데이터(workout_logs/workout_sessions 부위별 집계) */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <SectionTitle>이번 주 근육 밸런스</SectionTitle>
              <ArrowRight color={Palette.iconPrimary} size={20} />
            </View>
            <View onLayout={onBalanceLayout} style={styles.recBleed}>
              {balanceCardWidth > 0 ? (
                <ScrollView
                  horizontal
                  snapToInterval={balanceSnapInterval}
                  decelerationRate="fast"
                  contentContainerStyle={styles.recContent}
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onBalanceScrollEnd}
                  onScrollEndDrag={onBalanceScrollEnd}
                  onScroll={onBalanceScrollEnd}
                  scrollEventThrottle={100}>
                  {BALANCE_CARDS.map(({ headline, cells }) => (
                    <MuscleBalanceCard
                      key={headline}
                      width={balanceCardWidth}
                      headline={headline}
                      pct={bodyPartTotal > 0 ? Math.round(((bodyParts?.[headline] ?? 0) / bodyPartTotal) * 100) : 0}
                      cells={cells}
                      activeIndex={balanceIndex}
                    />
                  ))}
                </ScrollView>
              ) : null}
            </View>
          </View>

          {/* ── 빠른 기록 (홈과 동일 스펙) ── */}
          {/* TODO: 빠른 기록 시트 연결 */}
          <Button variant="quick" onPress={() => {}} style={styles.quickButton}>
            빠른 기록
          </Button>

        </ScrollView>
      </SafeAreaView>

      {/* FAB — AI 코치 */}
      <AiChatBubble
        variant="floatingButton"
        onPress={() => setShowCoach(true)}
        style={styles.fab}
      />

      <Modal
        visible={showMyPanel}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMyPanel(false)}>
        <MyPanel onClose={() => setShowMyPanel(false)} />
      </Modal>

      <Modal
        visible={showCoach}
        animationType="slide"
        presentationStyle={sheetPresentation}
        onRequestClose={() => setShowCoach(false)}>
        <CoachChat onClose={() => setShowCoach(false)} />
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: Palette.bgBase,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: ScreenPadding,
    paddingTop: GNB_HEIGHT - 8,
    gap: Spacing.xl,
    // 네이티브: NativeTabs 자체 inset 처리 → BottomTabInset 불필요. 웹: fixed 탭바 보정.
    paddingBottom: (Platform.OS === 'web' ? BottomTabInset : 0) + Spacing.lg,
  },

  // 히어로 카드 + 핏쌤 코칭 묶음(내부 16px)
  heroGroup: { gap: Spacing.md },
  heroCard: {
    backgroundColor: Palette.bgSurface,
    borderRadius: Radius.card,
    padding: Spacing.card,
    gap: Spacing.md,
  },
  heroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTextCol: { gap: Spacing.half, flex: 1 },
  heroImage: { width: 70, height: 70 },
  heroInfoRow: { flexDirection: 'row', gap: Spacing.sm },
  heroBtnRow: { flexDirection: 'row', gap: Spacing.sm },
  heroBtn: { flex: 1 },

  // 섹션
  section: { gap: Spacing.m },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // 빈 상태 카드
  emptyCard: {
    backgroundColor: Palette.bgSurface,
    borderRadius: Radius.card,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 근육 밸런스 카드
  balanceCard: {
    backgroundColor: Palette.bgSurface,
    borderRadius: Radius.card,
    padding: Spacing.card,
    gap: Spacing.md,
  },
  // 세부 부위(어깨/등/가슴 등) 실데이터 없음 — 이미지 자리만 예약, 실제 다이어그램 미연결.
  balanceImagePlaceholder: {
    height: 142,
    borderRadius: Radius.small,
    backgroundColor: Palette.bgMuted,
  },
  balanceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  balanceCell: {
    flexBasis: '30%',
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.m,
    borderWidth: 1,
    borderColor: Palette.gray300,
    borderRadius: Radius.small,
    backgroundColor: Palette.bgSurface,
  },
  balanceIndicator: { alignSelf: 'center' },
  // paddingVertical: 카드 그림자(Elevation.shadowS)가 스크롤 영역 경계에 잘리지 않도록 여유 확보.
  // 화면 좌우 여백(ScreenPadding) 밖으로 풀블리드 — 스와이프 중 옆 카드가 그 여백 공간에서 피크로 보이게.
  recBleed: { marginHorizontal: -ScreenPadding },
  recContent: { gap: Spacing.sm, paddingHorizontal: ScreenPadding, paddingVertical: Spacing.xs },
  quickButton: { alignSelf: 'center', marginTop: Spacing.xxl, marginBottom: Spacing.xxl },
  fab: {
    position: 'absolute',
    right: ScreenPadding,
    bottom: BottomTabInset + Spacing.card,
    width: 60,
    height: 60,
  },
});
