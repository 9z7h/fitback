/**
 * FitBack 공용 UI 컴포넌트 — docs/design-system.md §9 기준.
 * Button / Card / Icon / ProgressBar / Chip / Input.
 */
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Elevation, Palette, Radius, Spacing } from '@/constants/theme';

// Button / Chip / Input은 Figma 디자인 시스템 구현체를 배럴로 재수출한다.
export { Button } from './ui/Button';
export { Chip } from './ui/Chip';
export { Input } from './ui/Input';

// ── 아이콘 (Lucide, outline 통일 · 24px · stroke 2) ──────
export function Icon({
  icon: IconCmp,
  size = 24,
  color = Palette.gray800,
  strokeWidth = 2,
}: {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  return <IconCmp size={size} color={color} strokeWidth={strokeWidth} />;
}

// ── 카드 ──────────────────────────────────────────────────
export function Card({
  children,
  onPress,
  style,
  elevated,
  accentColor,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  /** 좌측 강조 보더 색 (손익 상태 등) */
  accentColor?: string;
}) {
  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    elevated && Elevation.level1,
    accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : null,
    style,
  ];
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [cardStyle, pressed && styles.cardPressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{children}</View>;
}

// ── Progress (트랙 위 채움) ───────────────────────────────
export function ProgressBar({
  ratio,
  color = Palette.primary,
  trackColor = Palette.gray200,
  height = 8,
  label,
}: {
  ratio: number; // 0~1
  color?: string;
  trackColor?: string;
  height?: number;
  label?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      accessibilityLabel={label}>
      <View style={[styles.track, { height, borderRadius: height, backgroundColor: trackColor }]}>
        <View style={{ height, borderRadius: height, width: `${pct}%`, backgroundColor: color }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.bgSurface,
    borderRadius: Radius.modal, // §9 카드 반경 20
    borderWidth: 0.5,
    borderColor: Palette.lineDefault,
    padding: Spacing.card,
  },
  cardPressed: { opacity: 0.85 },

  track: { width: '100%', overflow: 'hidden' },
});
