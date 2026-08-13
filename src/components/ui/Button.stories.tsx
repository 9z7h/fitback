import type { Meta, StoryObj } from '@storybook/react';
import { Dumbbell, MapPin } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  decorators: [
    (Story) => (
      <View style={styles.frame}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Figma 디자인 시스템 variant ─────────────────────────
export const Primary: Story = {
  args: { variant: 'primary', children: '오늘 체크인하기' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: '회원권 등록하기' },
};

export const Quick: Story = {
  args: { variant: 'quick', children: '운동 기록 추가' },
};

export const More: Story = {
  args: { variant: 'more', children: '지난 기록 더보기' },
};

export const Disable: Story = {
  args: { variant: 'disable', children: '센터 100m 이내에서 체크인' },
};

export const Chat: Story = {
  args: { variant: 'chat', children: '이번 주 페이스 알려줘' },
};

export const Card: Story = {
  args: {
    variant: 'card',
    label: '남은 세션',
    value: '12회',
    sublabel: '주 2회 페이스',
  },
};

// ── 레거시(ui.tsx 흡수) variant ─────────────────────────
export const Ghost: Story = {
  args: { variant: 'ghost', children: '건너뛰기' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: '회원권 삭제' },
};

export const Outline: Story = {
  args: { variant: 'outline', children: '센터 다시 검색' },
};

// ── state ───────────────────────────────────────────────
export const Loading: Story = {
  args: { variant: 'primary', children: '체크인 중', loading: true },
};

export const Disabled: Story = {
  args: { variant: 'primary', children: '오늘 체크인하기', disabled: true },
};

export const WithLeftChevron: Story = {
  args: { variant: 'primary', children: '이전 단계', icon: true },
};

export const WithRightChevron: Story = {
  args: { variant: 'secondary', children: '센터 정보 보기', iconRight: true },
};

export const WithCustomIcon: Story = {
  args: { variant: 'outline', children: '주변 센터 찾기', icon: MapPin },
};

export const CardWithoutSublabel: Story = {
  args: { variant: 'card', label: '이번 주 방문', value: '3회' },
};

export const QuickWithIcon: Story = {
  args: { variant: 'quick', children: '오늘의 루틴', icon: Dumbbell },
};

const styles = StyleSheet.create({
  frame: { width: 360, padding: Spacing.md },
});
