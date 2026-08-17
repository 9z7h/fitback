/**
 * FitBack Gauge — Figma Gauge(1441:1607) 中 "prograss" variant.
 * 3칸 세그먼트 진행바. 단일 컴포넌트 + percent props(variant 분리 안 함).
 */
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

export function Gauge({
  percent,
  segments = 3,
  style,
}: {
  /** 전체 진행률 0~100 */
  percent: number;
  /** 세그먼트 개수 (기본 3, Figma 스펙) */
  segments?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const perSegment = 100 / segments;

  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: segments }).map((_, i) => {
        const segmentFillPct = Math.max(0, Math.min(100, (clamped - i * perSegment) / perSegment * 100));
        return (
          <View key={i} style={styles.track}>
            <View style={[styles.fill, { width: `${segmentFillPct}%` }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.half },
  track: {
    flex: 1,
    height: 32,
    borderRadius: Radius.small,
    backgroundColor: Palette.gray300,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.small,
    backgroundColor: Palette.blue200,
  },
});
