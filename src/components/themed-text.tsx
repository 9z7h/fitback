import { StyleSheet, Text, type TextProps } from 'react-native';

import { Palette, ThemeColor, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextType =
  // 디자인 시스템 타입 스케일
  | 'display'
  | 'h1'
  | 'h2'
  | 'body'
  | 'bodySemibold'
  | 'caption'
  | 'captionBold'
  | 'label'
  // 레거시 별칭 (점진 마이그레이션)
  | 'default'
  | 'title'
  | 'subtitle'
  | 'small'
  | 'smallBold'
  | 'link'
  | 'linkPrimary'
  | 'code';

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  return (
    <Text
      style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // 디자인 시스템 타입 스케일
  display: Typography.display,
  h1: Typography.h1,
  h2: Typography.h2,
  body: Typography.body,
  bodySemibold: Typography.bodySemibold,
  caption: Typography.label,
  captionBold: Typography.labelBold,
  label: Typography.caption,

  // 레거시 별칭 → 디자인 토큰 매핑
  default: Typography.body,
  title: Typography.h1,
  subtitle: Typography.subtitle,
  small: Typography.label,
  smallBold: Typography.labelBold,
  link: { ...Typography.label, color: Palette.primary },
  linkPrimary: { ...Typography.label, color: Palette.primary },
  code: { fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
});