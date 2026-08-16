/**
 * FitBack Tab_Bar — Figma Tab_Bar(949:176) 조합. BlurView(expo-blur) + 아이콘(icons.tsx) +
 * 토큰(theme.ts) 재사용. 라우팅(expo-router/ui TabTrigger)은 이 컴포넌트를 쓰는
 * app-tabs.tsx/app-tabs.web.tsx가 담당 — 여기는 순수 프레젠테이션.
 */
import { BlurView } from 'expo-blur';
import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';

export type TabBarIconComponent = ComponentType<{ color: string; size?: number }>;

// Figma 스펙(node 949:177): backdrop-blur 4px + overlay/200 rgba(255,255,255,0.75).
// expo-blur는 blur량·틴트 불투명도가 intensity 하나에 묶여 있어(getBackgroundColor.js:
// backgroundColor = rgba(249,249,249, intensity/100*0.78), blur = intensity*0.2px) 4px와 0.75를
// 동시에 못 맞춘다 — 틴트가 더 지배적인 시각 요소라 intensity=96(불투명도 0.749 ≈ 0.75)로 맞추고
// blur는 19.2px로 Figma 4px보다 커지는 것을 감수한다.
// frame(모서리 클리핑용 배경)은 이 공식과 정확히 같은 색이어야 blur 사각 모서리와의 이음새가 안 보인다.
const BLUR_INTENSITY = 96;
const BLUR_TINT_COLOR = `rgba(249, 249, 249, ${(BLUR_INTENSITY / 100) * 0.78})`;

export function TabBar({ children, clipStyle }: { children: ReactNode; clipStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={styles.shadowWrap}>
      <View style={[styles.clip, clipStyle]}>
        {/* Figma "Tab Bar Background" — backdrop-blur(4px) + 반투명 화이트 틴트.
            바깥 프레임(clip)은 반투명 틴트 배경만 깔아 모서리를 확실히 둥글게 보여준다 — 일반 배경색은
            overflow:hidden으로 정상 클리핑되지만, 웹에서 backdrop-filter는 border-radius/clip-path/mask를
            줘도 자기 사각 박스 모서리를 안 잘라내는 Chromium 렌더링 한계가 있어(직접 검증: 6가지 클리핑
            방식 전부 실패) BlurView를 안쪽으로 살짝 띄워 모서리가 바깥 프레임 뒤에 가려지게 한다. */}
        <View style={[styles.frame, { backgroundColor: BLUR_TINT_COLOR }]} />
        <BlurView intensity={BLUR_INTENSITY} tint="light" style={styles.blur} />
        <View style={styles.row}>{children}</View>
      </View>
    </View>
  );
}

export function TabBarItem({
  icon: Icon,
  label,
  active,
  onPress,
  ...pressableProps
}: {
  icon: TabBarIconComponent;
  label: string;
  active: boolean;
  onPress?: ((e: GestureResponderEvent) => void) | null;
}) {
  const color = active ? Palette.primary : Palette.iconPrimary;
  return (
    <Pressable
      onPress={onPress}
      {...pressableProps}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <Icon size={24} color={color} />
      <ThemedText type="label" style={{ color }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    height: 54,
    ...Elevation.sticky,
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: Radius.button,
  },
  // 틴트만 담당, 모서리는 완전히 둥글게 클리핑됨(일반 배경색이라 overflow:hidden 정상 적용).
  // 색(BLUR_TINT_COLOR)은 위에서 인라인으로 덮어씀.
  frame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // 실시간 블러는 안쪽으로 살짝 띄워 각진 모서리가 위 frame 뒤에 가려지게 함
  blur: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    bottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    height: 54,
  },
  pressed: { opacity: 0.6 },
});
