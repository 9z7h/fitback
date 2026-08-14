/**
 * FitBack Tab_Bar — Figma Tab_Bar(949:176) 조합. TabBarBackground(SVG) + 아이콘(icons.tsx) +
 * 토큰(theme.ts) 재사용. 라우팅(expo-router/ui TabTrigger)은 이 컴포넌트를 쓰는
 * app-tabs.tsx/app-tabs.web.tsx가 담당 — 여기는 순수 프레젠테이션.
 */
import { BlurView } from 'expo-blur';
import type { ComponentType, ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, MaxContentWidth, Palette, Radius } from '@/constants/theme';
import TabBarBackgroundImage from '../../../assets/images/Tab_Bar_Background.png';

export type TabBarIconComponent = ComponentType<{ color: string; size?: number }>;

export function TabBar({ children, clipStyle }: { children: ReactNode; clipStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={styles.shadowWrap}>
      <View style={[styles.clip, clipStyle]}>
        {/* Figma "Tab Bar Background" — backdrop-blur(4px) + 반투명 화이트 틴트. BlurView가 뒤 콘텐츠를
            블러(네이티브·웹 둘 다 지원), 그 위에 SVG로 틴트+글로시 하이라이트를 그림. */}
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
        <Image source={TabBarBackgroundImage} style={StyleSheet.absoluteFill} resizeMode="stretch" />
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
