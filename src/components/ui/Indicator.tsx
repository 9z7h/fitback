/**
 * FitBack Indicator — Figma Indicator. 캐러셀/온보딩 점 페이지네이션.
 * 점 개수는 count prop으로 동적 렌더(하드코딩 금지).
 */
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Palette, Radius, Spacing } from '@/constants/theme';

export function Indicator({
  count,
  activeIndex,
  style,
}: {
  /** 점 개수 */
  count: number;
  /** 활성 점 인덱스(0-base) */
  activeIndex: number;
  style?: StyleProp<ViewStyle>;
}) {
  if (count <= 1) return null;

  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: count, now: activeIndex + 1 }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, { backgroundColor: i === activeIndex ? Palette.gray600 : Palette.gray400 }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Radius.full,
  },
});
