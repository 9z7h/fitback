/**
 * FitCard — Figma fit_card(1610:2927). 추천 루틴 카드: 부족 부위 칩 + 제목 + 센터명 +
 * 운동시간/종목/칼로리 InfoBox 3개. "핏쌤 추천 루틴하기" 캐러셀 아이템.
 */
import { Sparkles } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Chip } from '@/components/ui';
import { Indicator } from '@/components/ui/Indicator';
import { InfoBox } from '@/components/ui/InfoBox';
import { Elevation, Palette, Radius, Spacing } from '@/constants/theme';

import type { RecommendedRoutine } from './recommendRoutines';

const EXERCISE_IMAGE = require('../../../assets/images/fit-card-exercise.png') as number;

export function FitCard({
  routine,
  centerName,
  width,
  count,
  activeIndex,
}: {
  routine: RecommendedRoutine;
  centerName: string;
  width: number;
  /** 캐러셀 전체 카드 수(하단 점 표시용) */
  count: number;
  /** 캐러셀 현재 페이지(0-base) */
  activeIndex: number;
}) {
  return (
    <View style={[styles.card, { width }, Elevation.shadowS]}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Chip size="state" icon={Sparkles} label={routine.chipLabel} />
          <View style={styles.titleGroup}>
            <ThemedText type="subtitle" numberOfLines={1}>{routine.title}</ThemedText>
            <ThemedText type="body" style={styles.centerName} numberOfLines={1}>{centerName}</ThemedText>
          </View>
        </View>
        <Image source={EXERCISE_IMAGE} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.infoRow}>
        <InfoBox label="운동 시간" valueMain={`${routine.durationMin}분`} />
        <InfoBox label="종목" valueMain={`${routine.exerciseCount}개`} />
        <InfoBox label="칼로리" valueMain={`${routine.calories}kcal`} />
      </View>
      <Indicator count={count} activeIndex={activeIndex} style={styles.indicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.bgSurface,
    borderRadius: Radius.card,
    padding: Spacing.card,
    gap: Spacing.md,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headText: { gap: Spacing.sm, flex: 1 },
  titleGroup: { gap: 2 },
  centerName: { color: Palette.gray500 },
  image: { width: 80, height: 80, borderRadius: Radius.small },
  infoRow: { flexDirection: 'row', gap: Spacing.sm },
  indicator: { alignSelf: 'center' },
});
