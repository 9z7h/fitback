/**
 * FitBack SpeechBubble — Figma SpeechBubble(1436:6015). 하단 중앙(살짝 좌측)에 꼬리가 달린 말풍선.
 * 박스(라운드 사각형)와 꼬리(SVG)를 분리해서 내용 길이에 따라 너비가 가변하게 구현.
 * 박스 배경은 Figma "배경 흐림"(고르게, 흐림 2) 스펙 — 진짜 블러(BlurView) + 반투명 틴트를
 * 겹쳐서 재현한다(TabBar와 동일 패턴: BlurView 단독으로는 색을 정확히 못 맞춰서 틴트를 별도로 얹음).
 */
import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Elevation, Palette, Radius, Spacing } from '@/constants/theme';

// Figma 배경 흐림: 고르게, 흐림 2px → expo-blur intensity = px / 0.2.
const BLUR_INTENSITY = 10;

export function SpeechBubble({
  children,
  style,
}: {
  /** 말풍선 내용 — 문자열이면 자동으로 ThemedText로 감싼다 */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.box, Elevation.shadowM]}>
        <BlurView intensity={BLUR_INTENSITY} tint="light" style={styles.blur} />
        <View style={styles.tint} pointerEvents="none" />
        {typeof children === 'string' ? (
          <ThemedText type="bodySemibold" style={styles.text}>
            {children}
          </ThemedText>
        ) : (
          children
        )}
      </View>
      <Svg width={9} height={7} viewBox="0 0 8.084 6.1667" style={styles.tail}>
        <Path
          d="M8.084 0L4.9082 5.5C4.5233 6.1667 3.5607 6.1667 3.1758 5.5L0 0Z"
          fill={Palette.overlayWhite200}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  box: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.half,
  },
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.small,
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.small,
    backgroundColor: Palette.overlayWhite200,
  },
  tail: { marginTop: -1 },
  text: { color: Palette.gray800 },
});
