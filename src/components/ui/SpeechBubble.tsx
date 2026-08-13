/**
 * FitBack SpeechBubble — Figma Speech_Bubble. AI 코치 말풍선.
 * 꼬리(tail) 도형은 SVG 없이 정확히 재현할 수 없어 현재는 미구현.
 * variant로 방향만 받아 정렬을 결정하고, 추후 꼬리 추가 시 확장한다.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, Palette, Radius, Spacing } from '@/constants/theme';

type SpeechBubbleVariant = 'tail-left' | 'tail-right';

const ALIGN: Record<SpeechBubbleVariant, ViewStyle['alignSelf']> = {
  'tail-left': 'flex-start',
  'tail-right': 'flex-end',
};

export function SpeechBubble({
  variant = 'tail-left',
  children,
  style,
}: {
  variant?: SpeechBubbleVariant;
  /** 말풍선 내용 — 문자열이면 자동으로 ThemedText로 감싼다 */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.bubble, { alignSelf: ALIGN[variant] }, Elevation.level2, style]}>
      {typeof children === 'string' ? (
        <ThemedText type="bodySemibold" style={styles.text}>
          {children}
        </ThemedText>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: Palette.bgSurface,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  text: { color: Palette.gray900 },
});
