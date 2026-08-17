import type { Meta, StoryObj } from '@storybook/react';
import { CheckCircle2, Clock, TrendingDown, TrendingUp } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

import { Chip } from './Chip';

const meta = {
  title: 'Components/Chip',
  component: Chip,
  decorators: [
    (Story) => (
      <View style={styles.frame}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── size variant ────────────────────────────────────────
export const Large: Story = {
  args: { size: 'large', children: '헬스' },
};

export const MediumA: Story = {
  args: { size: 'medium_a', children: '주 3회 목표' },
};

export const MediumB: Story = {
  args: { size: 'medium_b', children: '가슴', secondaryLabel: '4세트' },
};

export const State: Story = {
  args: { size: 'state', children: '이용 중' },
};

export const Day: Story = {
  args: { size: 'day', children: '월' },
};

// ── 아이콘 조합 ─────────────────────────────────────────
export const MediumBWithIcon: Story = {
  args: { size: 'medium_b', icon: Clock, children: '48분', secondaryLabel: '오늘 19:30' },
};

export const StateWithIcon: Story = {
  args: { size: 'state', icon: CheckCircle2, children: '체크인 완료' },
};

// ── ROI 손익 색 오버라이드 (아이콘 + 라벨 + 색 3중 표기) ──
export const RoiProfit: Story = {
  args: {
    size: 'state',
    icon: TrendingUp,
    color: Palette.profit,
    bg: Palette.profitLight,
    children: '흑자 +32,000원',
  },
};

export const RoiLoss: Story = {
  args: {
    size: 'state',
    icon: TrendingDown,
    color: Palette.loss,
    bg: Palette.lossLight,
    children: '적자 -48,000원',
  },
};

const styles = StyleSheet.create({
  frame: { width: 360, padding: Spacing.md },
});
