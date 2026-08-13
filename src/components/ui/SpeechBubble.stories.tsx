import type { Meta, StoryObj } from '@storybook/react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';

import { SpeechBubble } from './SpeechBubble';

const meta = {
  title: 'Components/SpeechBubble',
  component: SpeechBubble,
  decorators: [
    (Story) => (
      <View style={styles.frame}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof SpeechBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TailLeft: Story = {
  args: { variant: 'tail-left', children: '오늘 가면 회당 비용이 ₩11,200까지 내려가요' },
};

export const TailRight: Story = {
  args: { variant: 'tail-right', children: '이번 주는 이미 3번 갔어요!' },
};

export const LongText: Story = {
  args: {
    variant: 'tail-left',
    children: '이번 주 페이스가 목표보다 조금 느려요. 주말 전에 한 번 더 다녀오면 목표 회수 페이스를 따라잡을 수 있어요.',
  },
};

export const CustomChildren: Story = {
  render: () => (
    <SpeechBubble variant="tail-left">
      <View style={styles.custom}>
        <ThemedText type="bodySemibold">남은 세션 12회</ThemedText>
        <ThemedText type="caption" style={styles.sub}>
          주 2회 페이스 기준 6주 남음
        </ThemedText>
      </View>
    </SpeechBubble>
  ),
};

const styles = StyleSheet.create({
  frame: { width: 360, padding: Spacing.md },
  custom: { gap: Spacing.xs },
  sub: { color: Palette.gray500 },
});
