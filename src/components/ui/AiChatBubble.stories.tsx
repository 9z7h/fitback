import type { Meta, StoryObj } from '@storybook/react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { AiChatBubble } from './AiChatBubble';

const meta = {
  title: 'Components/AiChatBubble',
  component: AiChatBubble,
  decorators: [
    (Story) => (
      <View style={styles.frame}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof AiChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FloatingButton: Story = {
  args: { variant: 'floatingButton', onPress: () => {} },
};

export const Chat: Story = {
  args: { variant: 'chat', children: '이번 주 두 번 다녀오면 목표 페이스를 회복할 수 있어요.', alignSelf: 'flex-start' },
};

export const UserChat: Story = {
  args: { variant: 'userChat', children: '이번 주 페이스 어때?', alignSelf: 'flex-end' },
};

export const Card: Story = {
  args: {
    variant: 'card',
    title: '오늘의 코치 팁',
    message: '오늘 가면 회당 실비용이 ₩11,200까지 내려가요. 퇴근길에 20분만 들러볼까요?',
    onClose: () => {},
  },
};

export const CardWithoutClose: Story = {
  args: {
    variant: 'card',
    title: '이번 주 요약',
    message: '3회 방문으로 주간 목표를 채웠어요. 다음 주도 같은 페이스면 만료 전에 전부 회수해요.',
  },
};

export const Conversation: Story = {
  render: () => (
    <View style={styles.conversation}>
      <AiChatBubble variant="userChat" alignSelf="flex-end">
        이번 주 페이스 어때?
      </AiChatBubble>
      <AiChatBubble variant="chat" alignSelf="flex-start">
        지금까지 2회 다녀왔어요. 목표는 주 3회니까 한 번만 더 가면 됩니다.
      </AiChatBubble>
      <AiChatBubble variant="userChat" alignSelf="flex-end">
        내일 갈게
      </AiChatBubble>
    </View>
  ),
};

const styles = StyleSheet.create({
  frame: { width: 360, padding: Spacing.md },
  conversation: { width: '100%', gap: Spacing.sm },
});
