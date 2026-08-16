/**
 * FitBack MembershipCard — Figma main_card(1529:2700).
 * 상단 dark 헤더는 자체 콘텐츠 높이로 고정(body 높이와 무관), 하단 white 바디는 콘텐츠에 따라 가변 높이.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Elevation, Palette, Radius } from '@/constants/theme';

export function MembershipCard({
  header,
  children,
  style,
}: {
  /** 상단 dark 영역 콘텐츠 — 자체 높이로 고정, body 높이 변화에 영향받지 않음 */
  header?: ReactNode;
  /** 하단 가변 높이 white 영역 콘텐츠 */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>{header}</View>
      <View style={[styles.body, Elevation.shadowL]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%' },
  // 실제 콘텐츠 아래에 라운드값만큼 안 보이는 여백을 더 둔다 — body가 그만큼만 끌어올려
  // 겹쳐도 콘텐츠는 안 가리고, 겹친 자리엔 이 여백의 dark 배경만 드러난다.
  header: {
    backgroundColor: Palette.gray800,
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    paddingBottom: Radius.card,
  },
  body: {
    marginTop: -Radius.card,
    borderRadius: Radius.card,
    backgroundColor: Palette.bgSurface,
  },
});
