/**
 * InfoBox — Figma InfoBox primary / secondary / tertiary.
 * 라벨 + 값 요약 박스. 값은 valueMain(강조) + valueSub(보조) 조합.
 */
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

type InfoBoxVariant = 'primary' | 'secondary' | 'tertiary';

const BOX_STYLE: Record<InfoBoxVariant, ViewStyle> = {
  primary: {
    flex: 1,
    minHeight: 72,
    borderColor: Palette.gray300,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  secondary: { flex: 1, borderColor: Palette.gray300, paddingVertical: Spacing.sm, gap: Spacing.sm },
  tertiary: {
    flex: 1,
    minHeight: 40,
    borderColor: Palette.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
};

export function InfoBox({
  variant = 'primary',
  label,
  valueMain,
  valueSub,
  fill,
  style,
}: {
  variant?: InfoBoxVariant;
  label: string;
  /** 강조 값 (16px SemiBold gray800) */
  valueMain: string;
  /** 보조 값 (16px Medium gray600) — primary에서 주로 사용 */
  valueSub?: string;
  /** 부모 폭을 100%로 채움 (기본값은 flex:1) */
  fill?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.box, BOX_STYLE[variant], fill && styles.fill, style]}>
      <ThemedText type="body" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.valueRow}>
        <ThemedText type="bodySemibold" style={styles.valueMain}>
          {valueMain}
        </ThemedText>
        {valueSub ? (
          <ThemedText type="body" style={styles.valueSub}>
            {valueSub}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: Palette.bgSurface,
    borderWidth: 1,
    borderRadius: Radius.small,
    paddingHorizontal: Spacing.m,
  },
  fill: { width: '100%', flex: 1 },
  label: { color: Palette.gray600 },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  valueMain: { color: Palette.gray800 },
  valueSub: { color: Palette.gray600 },
});
