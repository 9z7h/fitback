/**
 * FitBack AiChatBubble — Figma Ai 섹션(Ai_Card / Ai_Chat / Ai_Ploating_Button / User_Chat) 통합.
 * variant 하나로 처리하며 variant별 컴포넌트 분리 금지.
 */
import { Sparkles, X, Zap } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, FontFamily, Palette, Radius, Spacing, Typography } from '@/constants/theme';

type AiChatBubbleVariant = 'floatingButton' | 'chat' | 'userChat' | 'card';

export function AiChatBubble({
  variant = 'chat',
  children,
  message,
  title,
  imageSource,
  onPress,
  onClose,
  alignSelf,
  style,
}: {
  variant?: AiChatBubbleVariant;
  /** chat / userChat / card 본문 — 문자열이면 자동으로 ThemedText로 감싼다 */
  children?: ReactNode;
  /** variant="card" 본문 텍스트 (children 대신 사용 가능) */
  message?: string;
  /** variant="card" 타이틀 */
  title?: string;
  /** variant="floatingButton" 프로필/캐릭터 이미지 */
  imageSource?: ImageSourcePropType;
  /** variant="floatingButton" / card 탭 */
  onPress?: () => void;
  /** variant="card" 닫기 */
  onClose?: () => void;
  /** 말풍선 정렬 (userChat은 'flex-end'로 쓰는 것을 상정) */
  alignSelf?: ViewStyle['alignSelf'];
  style?: StyleProp<ViewStyle>;
}) {
  const body = message ?? children;
  const content =
    typeof body === 'string' ? (
      <ThemedText type="body" style={styles.text}>
        {body}
      </ThemedText>
    ) : (
      body
    );

  if (variant === 'floatingButton') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.floating,
          Elevation.level2,
          alignSelf ? { alignSelf } : null,
          pressed && styles.pressed,
          style,
        ]}>
        {imageSource ? (
          <Image source={imageSource} style={styles.floatingImage} resizeMode="cover" />
        ) : (
          <Sparkles size={24} color={Palette.primary} strokeWidth={1.5} />
        )}
      </Pressable>
    );
  }

  if (variant === 'card') {
    return (
      <View style={[styles.card, Elevation.level2, alignSelf ? { alignSelf } : null, style]}>
        <View style={styles.cardHead}>
          <View style={styles.cardTitleWrap}>
            <Zap size={20} color={Palette.primary} strokeWidth={1.5} />
            <ThemedText style={styles.cardTitle}>{title}</ThemedText>
          </View>
          {onClose ? (
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="닫기"
              style={({ pressed }) => [pressed && styles.pressed]}>
              <X size={20} color={Palette.gray500} strokeWidth={1.5} />
            </Pressable>
          ) : null}
        </View>
        {content}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bubbleBase,
        variant === 'chat' ? styles.chat : styles.userChat,
        alignSelf ? { alignSelf } : null,
        style,
      ]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  text: { color: Palette.gray900 },

  // ── floatingButton ──
  floating: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    backgroundColor: Palette.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  floatingImage: { width: '100%', height: '100%' },

  // ── chat / userChat ──
  bubbleBase: {
    padding: Spacing.md,
    borderRadius: Radius.card,
  },
  chat: {
    backgroundColor: Palette.primaryLight,
    borderTopLeftRadius: Radius.small,
  },
  userChat: {
    backgroundColor: Palette.bgSurface,
    borderWidth: 1,
    borderColor: Palette.gray200,
    borderTopRightRadius: Radius.small,
  },

  // ── card ──
  card: {
    width: '100%',
    backgroundColor: Palette.primaryLight,
    borderRadius: Radius.card,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardTitle: {
    ...Typography.subtitle,
    fontFamily: FontFamily.bold,
    fontWeight: '700',
    color: Palette.gray900,
  },
});
