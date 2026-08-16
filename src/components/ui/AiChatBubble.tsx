/**
 * FitBack AiChatBubble — Figma Ai 섹션(Ai_Card / Ai_Chat / Ai_Ploating_Button / User_Chat) 통합.
 * variant 하나로 처리하며 variant별 컴포넌트 분리 금지.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { X, Zap } from 'lucide-react-native';
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
import AiPloatingButtonImage from '../../../assets/images/Ai_Ploating_Button.png';

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
          Elevation.shadowL,
          alignSelf ? { alignSelf } : null,
          pressed && styles.pressed,
          style,
        ]}>
        <Image
          source={imageSource ?? AiPloatingButtonImage}
          style={styles.floatingImage}
          resizeMode="cover"
        />
      </Pressable>
    );
  }

  if (variant === 'card') {
    return (
      <LinearGradient
        colors={[Palette.primary, Palette.secondary]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.cardBorder, alignSelf ? { alignSelf } : null, style]}>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardTitleWrap}>
              <Zap size={20} color={Palette.primary} strokeWidth={2} />
              <ThemedText style={styles.cardTitle}>{title}</ThemedText>
            </View>
            {onClose ? (
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="닫기"
                style={({ pressed }) => [pressed && styles.pressed]}>
                <X size={20} color={Palette.gray600} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>
          {content}
        </View>
      </LinearGradient>
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
  text: { color: Palette.gray800 },

  // ── floatingButton ──
  floating: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // 원본 PNG(336x336)는 캐릭터 원형 배지(240x240) 바깥에 투명 여백이 있어
  // 60x60 그대로 그리면 원이 꽉 차지 않는다. 336/240=1.4배 확대(84x84)해
  // 배지 지름이 60이 되도록 맞추고, 배지 중심이 위로 치우친 만큼 아래로 보정한다.
  floatingImage: { width: 84, height: 84, transform: [{ translateY: 2 }] },

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
    borderColor: Palette.gray300,
    borderTopRightRadius: Radius.small,
  },

  // ── card ──
  // 외곽 그라데이션 테두리 — 안쪽 카드는 1px 두께만큼 패딩된 자리에 앉는다.
  cardBorder: {
    width: '100%',
    borderRadius: Radius.card,
    padding: 1,
  },
  card: {
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
    color: Palette.gray800,
  },
});
