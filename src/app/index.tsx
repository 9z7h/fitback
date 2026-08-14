/**
 * 홈 화면 — Figma 홈 디자인 이식.
 * 데이터는 아직 훅에 연결하지 않았다(TODO 표기). 이번 범위는 레이아웃·컴포넌트 조합.
 */
import { router } from 'expo-router';
import { Coins, MoreHorizontal, TrendingUp } from 'lucide-react-native';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconArrowChevron, IconInfo } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AiChatBubble } from '@/components/ui/AiChatBubble';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Gnb } from '@/components/ui/Gnb';
import { Indicator } from '@/components/ui/Indicator';
import { InfoBox } from '@/components/ui/InfoBox';
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

/** Gnb는 position:absolute — 스크롤 본문 상단 오프셋 보정값 */
const GNB_HEIGHT = 52;

// TODO: 실제 훅(useMemberships/dashboard) 연결 시 아래 하드코딩 값을 대체한다.
const MEMBERSHIP = {
  dday: 'D-41',
  centerName: '짐박스 강남1호점',
  recovered: '100,000원',
  todayGain: '+10,000원',
  progressPct: 77,
  remainingVisits: '3회',
  totalVisits: '/ 13회',
  remainingAmount: '30,000원',
};

// TODO: 추천 로직 연결 전 임시 목록.
const RECOMMENDATIONS: {
  title: string;
  sub: string;
  highlight?: string;
  href?: '/workout' | '/diet' | '/membership';
}[] = [
  { title: '오늘 운동 가기', sub: '회원권 회수 ', highlight: '+10,000원', href: '/membership' },
  { title: '하체 밸런스 맞추기', sub: '근육 밸런스 상승', href: '/workout' },
  { title: '아침 식사 기록하기', sub: '식단 점수 상승', href: '/diet' },
];

export default function HomeScreen() {
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
          {/* ── 멤버십 카드 ── */}
          <View style={[styles.membershipCard, Elevation.level1]}>
            <View style={styles.membershipHeader}>
              <Chip size="day">{MEMBERSHIP.dday}</Chip>
              <ThemedText style={styles.centerName} numberOfLines={1}>
                {MEMBERSHIP.centerName}
              </ThemedText>
              {/* TODO: 회원권 목록/액션 연결 */}
              <Pressable
                onPress={() => {}}
                hitSlop={Spacing.sm}
                accessibilityRole="button"
                accessibilityLabel="회원권 더보기">
                <MoreHorizontal size={20} color={Palette.white} strokeWidth={2} />
              </Pressable>
            </View>

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
                    {MEMBERSHIP.recovered}
                  </ThemedText>
                  <View style={styles.todayRow}>
                    <TrendingUp size={16} color={Palette.secondary} strokeWidth={2} />
                    <ThemedText type="bodySemibold" style={styles.todayText}>
                      오늘 출석시{' '}
                      <ThemedText type="bodySemibold" style={styles.todayGain}>
                        {MEMBERSHIP.todayGain}
                      </ThemedText>
                    </ThemedText>
                  </View>
                </View>
                {/* 캐릭터 이미지 자리 — 이미지 연결 전 placeholder */}
                <View style={styles.avatarPlaceholder} />
              </View>

              <View>
                <View style={[styles.bubbleAnchor, { width: `${MEMBERSHIP.progressPct}%` }]}>
                  <SpeechBubble variant="tail-right">{`${MEMBERSHIP.progressPct}%`}</SpeechBubble>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${MEMBERSHIP.progressPct}%` }]} />
                  <View style={styles.coinBadge}>
                    <Coins size={14} color={Palette.primary} strokeWidth={2} />
                  </View>
                </View>
              </View>

              <View style={styles.infoRow}>
                <InfoBox
                  label="남은 방문"
                  valueMain={MEMBERSHIP.remainingVisits}
                  valueSub={MEMBERSHIP.totalVisits}
                />
                <InfoBox label="남은 금액" valueMain={MEMBERSHIP.remainingAmount} />
              </View>

              {/* TODO: CheckInFlow 연결 */}
              <Button variant="primary" onPress={() => {}}>
                지금 출석하기
              </Button>

              {/* TODO: 회원권 캐러셀 연결 시 count/activeIndex 동적화 */}
              <Indicator count={2} activeIndex={0} />
            </View>
          </View>

          {/* ── AI 코칭 배너 (Figma Ai_Card) ── */}
          {/* TODO: useCoach 연결 */}
          <AiChatBubble variant="card" title="핏쌤 코칭">
            이번 주는 2번만 더 가면 페이스 회복 돼요. 오늘 가볍게 시작해볼까요?
          </AiChatBubble>

          {/* ── 오늘의 추천 ── */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>오늘의 추천</ThemedText>
            <View style={styles.listCard}>
              {RECOMMENDATIONS.map((item, i) => (
                <Pressable
                  key={item.title}
                  onPress={() => item.href && router.navigate(item.href)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.listRow,
                    i < RECOMMENDATIONS.length - 1 && styles.listRowDivider,
                    pressed && styles.pressed,
                  ]}>
                  {/* 썸네일 자리 — 이미지 연결 전 placeholder */}
                  <View style={styles.listThumb} />
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
                  <IconArrowChevron size={20} color={Palette.gray400} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* ── 내 기록 모아보기 ── */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>내 기록 모아보기</ThemedText>
            <View style={styles.recordGrid}>
              {/* TODO: useTodayWorkoutLog 연결 */}
              <RecordTile title="운동" value="9분" onPress={() => router.navigate('/workout')}>
                {/* 꺾은선 그래프 자리 — 그래프 연결 전 placeholder */}
                <View style={styles.chartPlaceholder} />
                <ThemedText style={styles.recordCaption}>이번주 5회</ThemedText>
              </RecordTile>

              {/* TODO: 체크리스트 데이터 연결 */}
              <RecordTile title="체크리스트" value="5개" onPress={() => {}} />

              {/* TODO: useDietSummary 연결 */}
              <RecordTile title="식단" value="0kcal" onPress={() => router.navigate('/diet')}>
                <Chip size="large" style={styles.recordChip}>
                  단백질・0g
                </Chip>
              </RecordTile>

              {/* TODO: useMemberships 연결 */}
              <RecordTile title="회원권" value="3개" onPress={() => router.navigate('/membership')}>
                <Chip size="day" style={styles.recordChip}>
                  D-20
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
      {/* TODO: CoachChat 연결 */}
      <AiChatBubble variant="floatingButton" onPress={() => {}} style={styles.floatingAi} />
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
        <IconArrowChevron size={20} color={Palette.gray400} />
      </View>
      <ThemedText type="h2" style={styles.recordValue}>
        {value}
      </ThemedText>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.bgBase },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  scrollView: { flex: 1 },
  body: {
    paddingHorizontal: ScreenPadding,
    paddingTop: GNB_HEIGHT + Spacing.md,
    paddingBottom: BottomTabInset + Spacing.lg,
    gap: Spacing.lg,
  },
  pressed: { opacity: 0.75 },

  // ── 멤버십 카드 ──
  membershipCard: {
    width: '100%',
    borderRadius: Radius.card,
    backgroundColor: Palette.bgSurface,
    overflow: 'hidden',
  },
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.gray800,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.m,
  },
  centerName: { ...Typography.bodySemibold, flex: 1, color: Palette.white },
  membershipBody: {
    padding: Spacing.card,
    gap: Spacing.card,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  summaryLeft: { flex: 1, gap: Spacing.xs },
  summaryLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  summaryLabel: { color: Palette.gray500 },
  summaryAmount: { color: Palette.gray900 },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  todayText: { color: Palette.gray500 },
  todayGain: { color: Palette.secondary },
  avatarPlaceholder: {
    width: 77,
    height: 77,
    borderRadius: Radius.full,
    backgroundColor: Palette.gray100,
  },

  // ── 진행률 바 ──
  bubbleAnchor: { alignItems: 'flex-end', paddingBottom: Spacing.sm },
  progressTrack: {
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Palette.gray200,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: Radius.full,
    backgroundColor: Palette.primary,
  },
  coinBadge: {
    position: 'absolute',
    right: Spacing.xs,
    width: Spacing.lg,
    height: Spacing.lg,
    borderRadius: Radius.full,
    backgroundColor: Palette.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoRow: { flexDirection: 'row', gap: Spacing.sm },

  // ── AI 코칭 ──

  // ── 섹션 공통 ──
  section: { gap: Spacing.m },
  sectionTitle: { ...Typography.subtitle, color: Palette.gray900 },

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
    borderBottomColor: Palette.gray200,
  },
  listThumb: {
    width: Spacing.xxl,
    height: Spacing.xxl,
    borderRadius: Radius.small,
    backgroundColor: Palette.gray200,
  },
  listTextWrap: { flex: 1, gap: Spacing.xs },
  listTitle: { color: Palette.gray900 },
  listSub: { ...Typography.caption, color: Palette.gray500 },
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
  recordTitle: { color: Palette.gray500 },
  recordValue: { color: Palette.gray900 },
  recordCaption: { ...Typography.caption, color: Palette.gray400, marginTop: 'auto' },
  recordChip: { marginTop: 'auto' },
  chartPlaceholder: {
    height: 43,
    borderRadius: Radius.small,
    backgroundColor: Palette.gray100,
  },

  // ── 빠른 기록 ──
  quickButton: { alignSelf: 'center' },

  // ── 플로팅 AI ──
  floatingAi: {
    position: 'absolute',
    right: Spacing.md,
    bottom: BottomTabInset + Spacing.card,
    backgroundColor: Palette.primaryLight,
  },
});
