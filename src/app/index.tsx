/**
 * 홈 화면 — Figma 홈 디자인 이식.
 * 회원권·운동·식단 요약은 각 도메인 훅의 실데이터를 사용한다.
 */
import { router } from 'expo-router';
import { MoreHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconAiUp, IconArrowChevron, IconInfo } from '@/components/icons';
import { sheetPresentation } from '@/components/modal-presentation';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AiChatBubble } from '@/components/ui/AiChatBubble';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ExerciseGraph } from '@/components/ui/ExerciseGraph';
import { Gauge } from '@/components/ui/Gauge';
import { Gnb } from '@/components/ui/Gnb';
import { Indicator } from '@/components/ui/Indicator';
import { InfoBox } from '@/components/ui/InfoBox';
import { MembershipCard } from '@/components/ui/MembershipCard';
import { SpeechBubble } from '@/components/ui/SpeechBubble';
import {
  BottomTabInset,
  Elevation,
  MaxContentWidth,
  Palette,
  Radius,
  ScreenPadding,
  Spacing,
  Typography,
} from '@/constants/theme';
import { CoachChat } from '@/features/coach/CoachChat';
import { useDietSummary } from '@/features/coach/useDietSummary';
import { CheckInFlow } from '@/features/membership/CheckInFlow';
import { computeRisk, ddayBadge, sortByRisk, won } from '@/features/membership/dashboard';
import { useMemberships } from '@/features/membership/useMemberships';
import { useMonthlyStats } from '@/features/membership/useMonthlyStats';
import { useThisWeekWorkouts } from '@/features/workout/useThisWeekWorkouts';
import { useTodayWorkoutLog } from '@/features/workout/useTodayWorkoutLog';
import CoinIconImage from '../../assets/images/icon/coin_icon.png';
import DumbbellImage from '../../assets/images/dumbbell.png';
import MainIconImage from '../../assets/images/icon/main_icon.png';
import Suggestion2Image from '../../assets/images/icon/suggestion_2.png';
import Suggestion3Image from '../../assets/images/icon/suggestion_3.png';

/** Gnb는 position:absolute — 스크롤 본문 상단 오프셋 보정값 */
const GNB_HEIGHT = 52;

export default function HomeScreen() {
  const [showCoach, setShowCoach] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const { data: memberships } = useMemberships();
  const { data: monthlyStats } = useMonthlyStats();
  const { data: todayWorkout } = useTodayWorkoutLog();
  const { data: thisWeekWorkouts } = useThisWeekWorkouts();
  const { summary: dietSummary } = useDietSummary();

  const activeMemberships = (memberships ?? []).filter((membership) => membership.status !== 'expired');
  const visitsOf = (membershipId: string) => monthlyStats?.byMembership[membershipId] ?? 0;
  const primaryMembership = sortByRisk(
    activeMemberships,
    (membership) => computeRisk(membership, visitsOf(membership.id)),
  )[0];
  const primaryRisk = primaryMembership
    ? computeRisk(primaryMembership, visitsOf(primaryMembership.id))
    : null;
  const primaryVisits = primaryMembership ? visitsOf(primaryMembership.id) : 0;
  const primaryDday = primaryRisk ? ddayBadge(primaryRisk).label : null;
  const primaryProgress = primaryRisk
    ? Math.round((primaryRisk.hasSessions ? primaryRisk.sessionFilledRatio : primaryRisk.periodFilledRatio) * 100)
    : 0;
  const weeklyWorkoutCount = (thisWeekWorkouts ?? []).filter((workout) => workout.status !== null).length;
  const recommendations = [
    primaryMembership && primaryRisk
      ? {
          title: '오늘 운동 가기',
          sub: primaryRisk.hasSessions
            ? '회원권 회수 '
            : `이번 달 ${primaryVisits}회 방문`,
          highlight: primaryRisk.hasSessions ? `+${won(primaryRisk.costPerSession)}` : undefined,
          href: '/workout' as const,
          icon: DumbbellImage,
        }
      : {
          title: '회원권 등록하기',
          sub: '운동 기록을 시작해 보세요',
          href: '/membership' as const,
          icon: DumbbellImage,
        },
    {
      title: todayWorkout?.hasWorkout ? '오늘 운동 완료했어요' : '오늘 운동 기록하기',
      sub: todayWorkout?.hasWorkout
        ? `${todayWorkout.durationMin}분 운동했어요`
        : `이번 주 ${weeklyWorkoutCount}일 운동했어요`,
      href: '/workout' as const,
      icon: Suggestion2Image,
    },
    {
      title: dietSummary ? '오늘 식단 더 기록하기' : '오늘 식단 기록하기',
      sub: dietSummary
        ? `${dietSummary.totalKcal}kcal · 단백질 ${dietSummary.protein_g}g`
        : '오늘의 식단을 기록해 보세요',
      href: '/diet' as const,
      icon: Suggestion3Image,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView
        edges={Platform.select({ web: ['bottom'] as const, default: [] as const })}
        style={styles.safeArea}>
        <Gnb
          // TODO: 마이 패널 연결
          onMenu={() => {}}
          // TODO: 알림 모달 연결
          onAlarm={() => {}}
          hasAlarm={false}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}>
          {/* ── 멤버십 카드 (Figma main_card) ── */}
          {primaryMembership && primaryRisk ? (
          <MembershipCard
            header={
              <View style={styles.membershipHeader}>
                <Chip size="day" style={styles.ddayChip}>
                  {primaryDday}
                </Chip>
                <ThemedText style={styles.centerName} numberOfLines={1}>
                  {primaryMembership.name}
                </ThemedText>
                <Pressable
                  onPress={() => router.navigate('/membership')}
                  hitSlop={Spacing.sm}
                  accessibilityRole="button"
                  accessibilityLabel="회원권 더보기">
                  <MoreHorizontal size={20} color={Palette.white} strokeWidth={2} />
                </Pressable>
              </View>
            }>
            <View style={styles.membershipBody}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryLeft}>
                  <View style={styles.summaryLabelRow}>
                    <ThemedText type="body" style={styles.summaryLabel}>
                      현재 활용
                    </ThemedText>
                    <IconInfo size={16} color={Palette.gray400} />
                  </View>
                  <ThemedText type="display" style={styles.summaryAmount}>
                    {primaryRisk.hasSessions ? won(primaryRisk.valueUsed) : `${primaryVisits}회`}
                  </ThemedText>
                  <View style={styles.todayRow}>
                    <ThemedText type="body" style={styles.todayText}>
                      {primaryRisk.hasSessions ? '오늘 출석시 ' : '이번 달 방문 '}
                      <ThemedText type="body" style={styles.todayGain}>
                        {primaryRisk.hasSessions ? `${won(primaryRisk.costPerSession)} 활용` : `${primaryVisits}회`}
                      </ThemedText>
                    </ThemedText>
                    <IconAiUp />
                  </View>
                </View>
                <Image source={MainIconImage} style={styles.avatarPlaceholder} resizeMode="cover" />
              </View>

              <View style={styles.progressSection}>
                {/* 말풍선 자체 너비보다 앵커가 좁으면 flex-end 정렬 때문에 왼쪽으로 넘친다 —
                    실제 진행률과 별개로 앵커 폭만 최소/최대로 묶어 카드 밖으로 안 나가게 한다. */}
                <View style={[styles.bubbleAnchor, { width: `${Math.min(92, Math.max(15, primaryProgress))}%` }]}>
                  <SpeechBubble>{`${primaryProgress}%`}</SpeechBubble>
                </View>
                <View style={styles.progressWrap}>
                  <Gauge percent={primaryProgress} />
                  <Image source={CoinIconImage} style={styles.coinBadge} resizeMode="contain" />
                </View>
              </View>

              <View style={[styles.infoRow, styles.infoRowGap]}>
                <InfoBox
                  label={primaryRisk.hasSessions ? '남은 방문' : '이번 달 방문'}
                  valueMain={primaryRisk.hasSessions ? `${primaryRisk.remainingSessions ?? 0}회` : `${primaryVisits}회`}
                  valueSub={primaryRisk.hasSessions ? `/ ${primaryRisk.totalSessions ?? 0}회` : undefined}
                />
                <InfoBox
                  label={primaryRisk.hasSessions ? '남은 금액' : '남은 기간'}
                  valueMain={primaryRisk.hasSessions ? won(primaryRisk.valueAtRisk) : primaryDday ?? '만료'}
                />
              </View>

              <Indicator count={activeMemberships.length} activeIndex={0} style={styles.indicatorGap} />

              <Button variant="primary" onPress={() => setShowCheckIn(true)}>
                지금 출석하기
              </Button>
            </View>
          </MembershipCard>
          ) : (
            <MembershipCard
              header={
                <View style={styles.membershipHeader}>
                  <ThemedText style={styles.centerName}>등록된 활성 회원권이 없어요</ThemedText>
                </View>
              }>
              <View style={styles.emptyMembershipBody}>
                <ThemedText type="body" style={styles.summaryLabel}>
                  회원권을 등록하면 활용 현황을 확인할 수 있어요.
                </ThemedText>
                <Button variant="primary" onPress={() => router.navigate('/membership')}>
                  회원권 등록하기
                </Button>
              </View>
            </MembershipCard>
          )}

          {/* ── AI 코칭 배너 (Figma Ai_Card) ── */}
          <Pressable
            onPress={() => setShowCoach(true)}
            accessibilityRole="button"
            accessibilityLabel="핏쌤 코칭 열기"
            style={({ pressed }) => [styles.coachCardPressable, pressed && styles.pressed]}>
            <AiChatBubble variant="card" title="핏쌤 코칭">
              이번 주는 2번만 더 가면 페이스 회복 돼요. 오늘 가볍게 시작해볼까요?
            </AiChatBubble>
          </Pressable>

          {/* ── 오늘의 추천 ── */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>오늘의 추천</ThemedText>
            <View style={styles.listCard}>
              {recommendations.map((item, i) => (
                <Pressable
                  key={item.title}
                  onPress={() => item.href && router.navigate(item.href)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.listRow,
                    i < recommendations.length - 1 && styles.listRowDivider,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.listThumb}>
                    {item.icon ? (
                      <Image source={item.icon} style={styles.listThumbIcon} resizeMode="contain" />
                    ) : null}
                  </View>
                  <View style={styles.listTextWrap}>
                    <ThemedText type="bodySemibold" style={styles.listTitle}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={styles.listSub}>
                      {item.sub}
                      {item.highlight ? (
                        <ThemedText style={[styles.listSub, styles.listSubHighlight]}>
                          {item.highlight}
                        </ThemedText>
                      ) : null}
                    </ThemedText>
                  </View>
                  <IconArrowChevron size={20} color={Palette.gray500} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── 내 기록 모아보기 ── */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>내 기록 모아보기</ThemedText>
            <View style={styles.recordGrid}>
              <RecordTile
                title="운동"
                value={todayWorkout?.hasWorkout ? `${todayWorkout.durationMin}분` : '0분'}
                onPress={() => router.navigate('/workout')}>
                <ExerciseGraph
                  data={(thisWeekWorkouts ?? []).map((day) =>
                    day.status === 'completed' ? 1 : day.status === 'partial' ? 0.5 : 0,
                  )}
                />
                <ThemedText style={styles.recordCaption}>이번 주 {weeklyWorkoutCount}일</ThemedText>
              </RecordTile>

              {/* TODO: 체크리스트 데이터 연결 */}
              <RecordTile title="체크리스트" value="5개" onPress={() => {}} />

              <RecordTile title="식단" value={`${dietSummary?.totalKcal ?? 0}kcal`} onPress={() => router.navigate('/diet')}>
                <Chip size="large" style={styles.recordChip}>
                  단백질・{dietSummary?.protein_g ?? 0}g
                </Chip>
              </RecordTile>

              <RecordTile title="회원권" value={`${activeMemberships.length}개`} onPress={() => router.navigate('/membership')}>
                <Chip size="large" style={styles.recordChip}>
                  {primaryDday ?? '등록 필요'}
                </Chip>
              </RecordTile>
            </View>
          </View>

          {/* ── 빠른 기록 ── */}
          {/* TODO: 빠른 기록 시트 연결 */}
          <Button variant="quick" onPress={() => {}} style={styles.quickButton}>
            빠른 기록
          </Button>
        </ScrollView>
      </SafeAreaView>

      {/* ── 플로팅 AI 버튼 ── */}
      <AiChatBubble variant="floatingButton" onPress={() => setShowCoach(true)} style={styles.floatingAi} />

      <Modal
        visible={showCoach}
        animationType="slide"
        presentationStyle={sheetPresentation}
        onRequestClose={() => setShowCoach(false)}>
        <CoachChat onClose={() => setShowCoach(false)} />
      </Modal>

      {/* ── 지금 출석하기 (지오펜스 100m 체크인) ── */}
      <Modal
        visible={showCheckIn}
        animationType="slide"
        presentationStyle={sheetPresentation}
        onRequestClose={() => setShowCheckIn(false)}>
        <ThemedView style={styles.checkInRoot}>
          <SafeAreaView style={styles.checkInSafe} edges={['top', 'bottom']}>
            {primaryMembership ? (
              <CheckInFlow
                memberships={activeMemberships}
                initialMembershipId={primaryMembership.id}
                onClose={() => setShowCheckIn(false)}
              />
            ) : null}
          </SafeAreaView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

/** 기록 카드 1칸 — 타이틀+화살표, 큰 값, 하단 슬롯. */
function RecordTile({
  title,
  value,
  onPress,
  children,
}: {
  title: string;
  value: string;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.recordTile, Elevation.level1, pressed && styles.pressed]}>
      <View style={styles.recordHead}>
        <ThemedText type="body" style={styles.recordTitle}>
          {title}
        </ThemedText>
        <IconArrowChevron size={20} color={Palette.gray500} />
      </View>
      <ThemedText type="subtitle" style={styles.recordValue} numberOfLines={1}>
        {value}
      </ThemedText>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.bgBase },
  checkInRoot: { flex: 1, backgroundColor: Palette.bgBase },
  checkInSafe: { flex: 1 },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  scrollView: { flex: 1 },
  body: {
    paddingHorizontal: ScreenPadding,
    paddingTop: GNB_HEIGHT + Spacing.sm,
    paddingBottom: BottomTabInset + Spacing.lg,
    gap: Spacing.lg,
  },
  pressed: { opacity: 0.75 },

  // ── 멤버십 카드 ──
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 40,
    paddingHorizontal: Spacing.md,
  },
  ddayChip: { alignSelf: 'center' },
  centerName: { ...Typography.bodySemibold, flex: 1, color: Palette.white },
  membershipBody: {
    padding: Spacing.card,
    gap: Spacing.card,
  },
  emptyMembershipBody: { padding: Spacing.card, gap: Spacing.card },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  summaryLeft: { flex: 1, gap: Spacing.xs },
  summaryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  summaryLabel: { color: Palette.gray600 },
  summaryAmount: { color: Palette.gray800 },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  todayText: { color: Palette.gray800 },
  todayGain: { color: Palette.secondary },
  // marginTop은 레이아웃 높이에 반영돼 카드 전체가 늘어나므로, transform으로 시각적 위치만 내린다.
  avatarPlaceholder: {
    width: 100,
    height: 85,
    transform: [{ translateY: Spacing.card }],
  },

  // ── 진행률 바 ──
  // 부모(membershipBody) gap이 20(Spacing.card)이라 -4(Spacing.xs)만큼 당겨서 16px로 맞춘다.
  progressSection: { marginTop: -Spacing.xs },
  // flow는 유지(공간을 그대로 차지)하면서 position:'relative'+zIndex로 다음 형제(progressWrap,
  // 포지션 없음)보다 위 레이어에 그려서 꼬리가 바에 가려지지 않게 한다. marginBottom 음수로 겹침.
  bubbleAnchor: {
    alignItems: 'flex-end',
    marginBottom: -Spacing.md,
    position: 'relative',
    zIndex: 10,
  },
  progressWrap: { justifyContent: 'center' },
  coinBadge: {
    position: 'absolute',
    right: Spacing.xs,
    width: Spacing.lg,
    height: Spacing.lg,
  },

  infoRow: { flexDirection: 'row', gap: Spacing.sm },
  // 부모(membershipBody) gap이 20(Spacing.card)이라 -12(Spacing.m)만큼 당겨서 8px로 맞춘다.
  infoRowGap: { marginTop: -Spacing.m },
  indicatorGap: { marginTop: -Spacing.m },

  // ── AI 코칭 ──
  coachCardPressable: { width: '100%' },

  // ── 섹션 공통 ──
  // 부모(body) gap이 24(Spacing.lg)라 +8(Spacing.sm)만큼 더해 32px(Spacing.xl)로 맞춘다.
  section: { gap: Spacing.m, marginTop: Spacing.sm },
  sectionTitle: { ...Typography.subtitle, color: Palette.gray800, },

  // ── 오늘의 추천 리스트 ──
  listCard: {
    width: '100%',
    backgroundColor: Palette.bgSurface,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.m,
    paddingVertical: Spacing.md,
  },
  listRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.gray300,
  },
  listThumb: {
    width: Spacing.xxl,
    height: Spacing.xxl,
    borderRadius: Radius.small,
    backgroundColor: Palette.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listThumbIcon: { width: 38, height: 38, marginTop: Spacing.half },
  listTextWrap: { flex: 1, gap: 0 },
  listTitle: {...Typography.bodySemibold, color: Palette.gray800 },
  listSub: { ...Typography.label, color: Palette.gray600 },
  listSubHighlight: { color: Palette.secondary },

  // ── 기록 카드 그리드 ──
  recordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.m,
  },
  recordTile: {
    flexGrow: 1,
    flexBasis: '47%',
    aspectRatio: 161.5 / 163,
    backgroundColor: Palette.bgSurface,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  recordHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordTitle: { color: Palette.gray600 },
  recordValue: { color: Palette.gray800 },
  recordCaption: { ...Typography.caption, color: Palette.gray500, marginTop: 'auto' },
  recordChip: { marginTop: 'auto' },

  // ── 빠른 기록 ──
  // 부모(body) gap이 24(Spacing.lg)라 위쪽은 20(Spacing.card)만 더해 44px로 맞춘다.
  quickButton: { alignSelf: 'center', marginTop: Spacing.card, marginBottom: Spacing.xxl },

  // ── 플로팅 AI ──
  floatingAi: {
    position: 'absolute',
    right: Spacing.md,
    bottom: BottomTabInset + Spacing.card,
    backgroundColor: Palette.primaryLight,
  },
});
