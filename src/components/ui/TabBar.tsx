/**
 * FitBack Tab_Bar — Figma Tab_Bar(949:176) 조합. TabBarBackground(SVG) + 아이콘(icons.tsx) +
 * 토큰(theme.ts) 재사용. 라우팅(expo-router/ui TabTrigger)은 이 컴포넌트를 쓰는
 * app-tabs.tsx/app-tabs.web.tsx가 담당 — 여기는 순수 프레젠테이션.
 */
import type { ComponentType, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, MaxContentWidth, Palette, Radius } from '@/constants/theme';

import { TabBarBackground } from './TabBarBackground';

export type TabBarIconComponent = ComponentType<{ color: string; size?: number }>;

export function TabBar({ children, clipStyle }: { children: ReactNode; clipStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={styles.shadowWrap}>
      <View style={[styles.clip, clipStyle]}>
        <View style={StyleSheet.absoluteFill}>
          <TabBarBackground radiusTopLeft={Radius.button} radiusTopRight={Radius.button} radiusBottomLeft={0} radiusBottomRight={0} />
        </View>
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
    borderTopLeftRadius: Radius.button,
    borderTopRightRadius: Radius.button,
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
