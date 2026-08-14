/**
 * FitBack Chip — Figma Chip size variant(large / medium_a / medium_b / state / day) 통합.
 * 단일 컴포넌트 + size props.
 */
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';

type ChipSize = 'large' | 'medium_a' | 'medium_b' | 'state' | 'day';

const CHIP_BG: Record<ChipSize, string> = {
  large: Palette.gray200,
  medium_a: Palette.gray200,
  medium_b: Palette.bgMuted,
  state: Palette.primaryLight,
  day: Palette.overlayWhite16,
};

const CHIP_FG: Record<ChipSize, string> = {
  large: Palette.gray500,
  medium_a: Palette.gray500,
  medium_b: Palette.gray500,
  state: Palette.primary,
  day: Palette.white,
};

export function Chip({
  size = 'large',
  children,
  label,
  color,
  bg,
  icon: IconCmp,
  secondaryLabel,
  style,
}: {
  size?: ChipSize;
  /** 칩 문구 */
  children?: ReactNode;
  /** children 대신 쓰는 문구 (기존 ui.tsx 호환) */
  label?: string;
  /** 지정 시 size 프리셋 텍스트·아이콘 색을 덮어쓴다 (기존 ui.tsx 호환) */
  color?: string;
  /** 지정 시 size 프리셋 배경색을 덮어쓴다 (기존 ui.tsx 호환) */
  bg?: string;
  /** medium_b / state 좌측 아이콘 */
  icon?: LucideIcon;
  /** medium_b 에서 가운데 점 구분자로 이어붙일 두 번째 문구 */
  secondaryLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const fg = color ?? CHIP_FG[size];
  const iconSize = size === 'state' ? 16 : 14;
  const body = label ?? children;

  return (
    <View style={[styles.base, BOX_STYLE[size], { backgroundColor: bg ?? CHIP_BG[size] }, style]}>
      {IconCmp ? <IconCmp size={iconSize} color={fg} strokeWidth={2} /> : null}
      <ThemedText style={[TEXT_STYLE[size], { color: fg }]}>{body}</ThemedText>
      {size === 'medium_b' && secondaryLabel ? (
        <>
          <View style={styles.dot} />
          <ThemedText style={[TEXT_STYLE[size], { color: fg }]}>{secondaryLabel}</ThemedText>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    borderRadius: Radius.full,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: Radius.full,
    backgroundColor: Palette.gray300,
  },

  // ── size box ──
  largeBox: { paddingHorizontal: Spacing.m, paddingVertical: Spacing.sm },
  mediumABox: {
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
    justifyContent: 'flex-end',
  },
  mediumBBox: { paddingHorizontal: Spacing.m, paddingVertical: Spacing.xs },
  stateBox: { paddingHorizontal: Spacing.m, paddingVertical: Spacing.xs },
  dayBox: { height: 22, paddingHorizontal: Spacing.sm, justifyContent: 'center' },

  // ── size text ──
  text16Semibold: Typography.bodySemibold,
  text14Medium: Typography.label,
  text14Semibold: Typography.labelBold,
});

const BOX_STYLE: Record<ChipSize, StyleProp<ViewStyle>> = {
  large: styles.largeBox,
  medium_a: styles.mediumABox,
  medium_b: styles.mediumBBox,
  state: styles.stateBox,
  day: styles.dayBox,
};

const TEXT_STYLE = {
  large: styles.text16Semibold,
  medium_a: styles.text14Medium,
  medium_b: styles.text14Medium,
  state: styles.text14Semibold,
  day: styles.text14Semibold,
} satisfies Record<ChipSize, unknown>;
