/**
 * FitBack Tab_Bar — Figma Tab_Bar(949:176) 조합. TabBarBackground(949:177, BlurView) +
 * 아이콘(icons.tsx) + 토큰(theme.ts) 재사용. 라우팅(expo-router/ui TabTrigger)은 이 컴포넌트를 쓰는
 * app-tabs.tsx/app-tabs.web.tsx가 담당 — 여기는 순수 프레젠테이션.
 */
import { BlurView } from 'expo-blur';
import type { ComponentType, ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, MaxContentWidth, Palette, Radius } from '@/constants/theme';

export type TabBarIconComponent = ComponentType<{ color: string; size?: number }>;

export function TabBar({ children, clipStyle }: { children: ReactNode; clipStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={styles.shadowWrap}>
      <View style={[styles.clip, clipStyle]}>
        {/* Figma "Tab Bar Background"(949:177) — backdrop-blur(4px) + 반투명 화이트 틴트(overlay/200) +
            상단 글로시 하이라이트. BlurView 하나로 틴트+블러 전부 담당(단일 레이어, Figma와 동일 구조). */}
        <BlurView intensity={40} tint="light" style={styles.blur} />
        <View style={styles.gloss} pointerEvents="none" />
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
    borderRadius: Radius.button,
    ...Elevation.sticky,
  },
  clip: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: Radius.button,
  },
  blur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.button,
  },
  // Figma 글로시 하이라이트(inset shadow 3겹, 100% 흰색) — 네이티브는 inset shadow 미지원이라 웹 전용.
  // mixBlendMode는 넣지 않는다 — 형제 BlurView의 backdrop-filter와 함께 있으면 블렌드 모드가
  // 스태킹 컨텍스트를 격리시켜서 blur가 실제 배경을 못 보고 풀려버린다(직접 확인).
  gloss: Platform.select({
    web: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: Radius.button,
      boxShadow:
        'inset 0px 4px 10px -4px #ffffffff , inset 0px -8px 10px -8px #ffffffff, inset 0px 40px 30px -40px #ffffffff',
    } as ViewStyle,
    default: {},
  }) as ViewStyle,
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
