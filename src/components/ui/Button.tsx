/**
 * FitBack Button — Figma Btn_Primary / Btn_Secondary / Btn_Quick / Btn_More /
 * Btn_Card / Btn_Disable / Btn_chat 통합. 단일 컴포넌트 + variant props.
 */
import type { LucideIcon } from 'lucide-react-native';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { IconPlusCircle } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Elevation, FontFamily, Palette, Radius, Spacing, Typography } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'quick' | 'more' | 'disable' | 'chat' | 'card';

const BTN_BG: Record<ButtonVariant, string> = {
  primary: Palette.primary,
  secondary: Palette.bgSurface,
  quick: Palette.gray300,
  more: Palette.gray300,
  disable: Palette.iconPrimary,
  chat: Palette.bgBase,
  card: Palette.bgSurface,
};

const BTN_PRESSED: Record<ButtonVariant, string> = {
  primary: Palette.primaryHover,
  secondary: Palette.bgSurface,
  quick: Palette.gray400,
  more: Palette.gray400,
  disable: Palette.iconPrimary,
  chat: Palette.gray300,
  card: Palette.bgMuted,
};

const BTN_FG: Record<ButtonVariant, string> = {
  primary: Palette.white,
  secondary: Palette.primary,
  quick: Palette.gray600,
  more: Palette.gray600,
  disable: Palette.gray800,
  chat: Palette.gray800,
  card: Palette.gray800,
};

export function Button({
  variant = 'primary',
  children,
  onPress,
  disabled,
  loading,
  icon = false,
  iconRight = false,
  label,
  value,
  sublabel,
  style,
}: {
  variant?: ButtonVariant;
  /** primary/secondary/quick/more/chat 의 문구 */
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** true면 스피너로 문구를 대체하고 입력을 막는다. */
  loading?: boolean;
  /**
   * boolean이면 Figma 방식(좌측 ChevronRight on/off),
   * LucideIcon이면 기존 ui.tsx 방식(좌측에 해당 아이콘 렌더).
   */
  icon?: LucideIcon | boolean;
  /** primary/secondary 우측 ChevronRight 표시 */
  iconRight?: boolean;
  /** variant="card" 상단 라벨 · 그 외 variant에서는 children 대신 쓰는 문구 */
  label?: string;
  /** variant="card" 큰 숫자 */
  value?: string;
  /** variant="card" 하단 pill 보조 텍스트 */
  sublabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  // disabled/loading은 variant와 무관하게 Figma disable variant의 색을 강제한다.
  const forcedDisable = Boolean(disabled || loading);
  const off = forcedDisable || variant === 'disable';
  // icon prop 유니온 해석: boolean → chevron on/off, 컴포넌트 → 그대로 렌더.
  const showChevron = icon === true;
  const CustomIcon = typeof icon === 'boolean' ? undefined : icon;
  // card는 label을 상단 라벨로 쓰므로 문구 대체 대상에서 제외한다.
  const body = variant === 'card' ? children : (label ?? children);

  const renderBody = (pressed: boolean) => {
    // secondary는 pressed 시 텍스트·보더가 함께 primaryHover로 전환된다.
    const fg = forcedDisable
      ? BTN_FG.disable
      : variant === 'secondary' && pressed
        ? Palette.primaryHover
        : BTN_FG[variant];
    if (loading) return <ActivityIndicator color={fg} />;
    return variant === 'card' ? (
      <View style={styles.cardInner}>
        <View style={styles.cardHead}>
          <ThemedText style={styles.cardLabel}>{label}</ThemedText>
          <ChevronRight size={20} color={Palette.iconPrimary} strokeWidth={2} />
        </View>
        <ThemedText style={[styles.cardValue, { color: fg }]}>{value}</ThemedText>
        {sublabel ? (
          <View style={styles.cardPill}>
            <ThemedText style={styles.cardPillText}>{sublabel}</ThemedText>
          </View>
        ) : null}
      </View>
    ) : (
      <View style={[styles.inner, INNER_ALIGN[variant]]}>
        {variant === 'chat' ? <Sparkles size={20} color={fg} strokeWidth={2} /> : null}
        {showChevron ? <ChevronRight size={20} color={fg} strokeWidth={2} /> : null}
        {CustomIcon ? <CustomIcon size={20} color={fg} strokeWidth={2} /> : null}
        <ThemedText style={[TEXT_STYLE[variant], { color: fg }]}>{body}</ThemedText>
        {iconRight ? <ChevronRight size={20} color={fg} strokeWidth={2} /> : null}
        {variant === 'quick' ? <IconPlusCircle size={20} color={Palette.iconPrimary} /> : null}
        {variant === 'more' ? <ChevronDown size={20} color={fg} strokeWidth={2} /> : null}
      </View>
    );
  };

  return (
    <Pressable
      onPress={off ? undefined : onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: off }}
      style={({ pressed }) => [
        styles.base,
        BOX_STYLE[variant],
        variant === 'card' && Elevation.level1,
        {
          backgroundColor: forcedDisable
            ? BTN_BG.disable
            : pressed && !off
              ? BTN_PRESSED[variant]
              : BTN_BG[variant],
        },
        !forcedDisable &&
          variant === 'secondary' && {
            borderWidth: 1,
            borderColor: pressed ? Palette.primaryHover : Palette.primary,
          },
        style,
      ]}>
      {({ pressed }) => renderBody(pressed)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, width: '100%' },
  alignCenter: { justifyContent: 'center' },
  alignSpread: { justifyContent: 'space-between' },
  alignStart: { justifyContent: 'flex-start', width: 'auto' },
  quickInner: { justifyContent: 'center', gap: Spacing.xs, width: 'auto' },

  // ── variant box ──
  primaryBox: {
    width: '100%',
    height: 56,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.md,
  },
  quickBox: {
    alignSelf: 'flex-start',
    height: 52,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.md,
  },
  moreBox: {
    width: '100%',
    height: 44,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.md,
  },
  chatBox: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingVertical: Spacing.m,
    paddingHorizontal: Spacing.md,
  },
  cardBox: {
    flex: 1,
    minWidth: 150,
    aspectRatio: 162 / 163,
    borderRadius: Radius.card,
    padding: Spacing.md,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },

  // ── variant text ──
  bold18: { ...Typography.subtitle, fontFamily: FontFamily.bold, fontWeight: '700' },
  body16: Typography.body,
  semibold16: Typography.bodySemibold,

  // ── card 내부 ──
  cardInner: { width: '100%', flex: 1, gap: Spacing.sm },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { ...Typography.body, color: Palette.gray600 },
  cardValue: { ...Typography.subtitle, fontFamily: FontFamily.bold, fontWeight: '700' },
  cardPill: {
    alignSelf: 'flex-start',
    marginTop: 'auto',
    backgroundColor: Palette.bgMuted,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.m,
    paddingVertical: Spacing.xs,
  },
  cardPillText: { ...Typography.label, color: Palette.gray600 },
});

const BOX_STYLE: Record<ButtonVariant, StyleProp<ViewStyle>> = {
  primary: styles.primaryBox,
  secondary: styles.primaryBox,
  quick: styles.quickBox,
  more: styles.moreBox,
  disable: styles.primaryBox,
  chat: styles.chatBox,
  card: styles.cardBox,
};

const INNER_ALIGN: Record<ButtonVariant, StyleProp<ViewStyle>> = {
  primary: styles.alignCenter,
  secondary: styles.alignCenter,
  quick: styles.quickInner,
  more: styles.alignSpread,
  disable: styles.alignCenter,
  chat: styles.alignStart,
  card: styles.alignCenter,
};

const TEXT_STYLE = {
  primary: styles.bold18,
  secondary: styles.bold18,
  quick: styles.bold18,
  more: styles.body16,
  disable: styles.bold18,
  chat: styles.body16,
  card: styles.body16,
} satisfies Record<ButtonVariant, unknown>;
