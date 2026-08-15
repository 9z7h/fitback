/**
 * FitBack Gnb — Figma Gnb(949:205) 이식. 좌측 메뉴+로고, 우측 벨.
 * 아이콘은 icons.tsx(Figma SVG 세트), 배경은 expo-blur BlurView(Figma backdrop-blur 4px) 재사용.
 * 캘린더 버튼은 하단 탭바 "기록"으로 기능 이동됨에 따라 제거.
 */
import { BlurView } from 'expo-blur';
import { Image, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { IconBell, IconMenu } from '@/components/icons';
import { MaxContentWidth, Palette, Radius, ScreenPadding, Spacing } from '@/constants/theme';

export function Gnb({
  onMenu,
  onAlarm,
  hasAlarm = false,
  style,
}: {
  onMenu?: () => void;
  onAlarm?: () => void;
  hasAlarm?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.wrap, style]}>
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={onMenu}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="메뉴 열기">
            <IconMenu size={24} color={Palette.gray800} />
          </Pressable>
          <Image source={require('../../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={onAlarm}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="알림">
            <View>
              <IconBell size={28} color={Palette.iconPrimary} />
              {hasAlarm && <View style={styles.alarmDot} />}
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: ScreenPadding,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerActions: { flexDirection: 'row', gap: Spacing.card },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  logo: { width: 110, height: 19 },
  alarmDot: {
    position: 'absolute',
    top: Spacing.half,
    right: Spacing.half,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.error,
  },
});
