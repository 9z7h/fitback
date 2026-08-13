/**
 * Input — Figma Input_Field(4 states) + InputField_WithLabel(3 states) 통합.
 * ui.tsx의 Input 관례(RN TextInput 래핑)를 따르는 확장판.
 */
import { Search, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
  type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing, Typography } from '@/constants/theme';

type InputState = 'normal' | 'pressed' | 'selected' | 'filled';

const FIELD_STYLE: Record<InputState, ViewStyle> = {
  normal: { backgroundColor: Palette.bgSurface, borderWidth: 1, borderColor: Palette.gray200, height: 56 },
  pressed: { backgroundColor: Palette.bgSurface, borderWidth: 1, borderColor: Palette.primary, height: 56 },
  selected: { backgroundColor: Palette.bgSurface, borderWidth: 1, borderColor: Palette.gray200, height: 56 },
  filled: { backgroundColor: Palette.gray50, borderWidth: 0, height: 52 },
};

const PLACEHOLDER_COLOR: Record<InputState, string> = {
  normal: Palette.gray500,
  pressed: Palette.gray500,
  selected: Palette.gray500,
  filled: Palette.gray400,
};

export function Input({
  state,
  label,
  value,
  onChangeText,
  placeholder,
  onClear,
  style,
  textStyle,
  ...props
}: Omit<TextInputProps, 'style'> & {
  /** 생략 시 포커스 여부에 따라 normal ↔ pressed 자동 전환(기존 ui.tsx 동작). */
  state?: InputState;
  /** 라벨 포함형(InputField_WithLabel). filled state에는 라벨이 없다. */
  label?: string;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
  /** TextInput에 직접 적용할 텍스트 스타일 (기존 ui.tsx 호환) */
  textStyle?: StyleProp<TextStyle>;
}) {
  const [focused, setFocused] = useState(false);
  const resolved: InputState = state ?? (focused ? 'pressed' : 'normal');

  const field = (
    <View style={[styles.field, FIELD_STYLE[resolved], style]}>
      {resolved === 'filled' ? <Search size={20} color={Palette.gray400} strokeWidth={1.5} /> : null}
      <TextInput
        style={[styles.input, textStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={PLACEHOLDER_COLOR[resolved]}
        {...props}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
      {resolved === 'filled' && onClear ? (
        <Pressable onPress={onClear} accessibilityRole="button">
          <X size={24} color={Palette.gray400} strokeWidth={1.5} />
        </Pressable>
      ) : null}
    </View>
  );

  if (label && resolved !== 'filled') {
    return (
      <View style={styles.labeled}>
        <ThemedText type="caption" style={styles.label}>
          {label}
        </ThemedText>
        {field}
      </View>
    );
  }
  return field;
}

const styles = StyleSheet.create({
  labeled: { width: '100%', gap: Spacing.xs },
  label: { color: Palette.gray500 },
  field: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.m,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Palette.gray900,
    padding: 0,
  },
});
