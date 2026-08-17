import type { Meta, StoryObj } from '@storybook/react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { ExerciseGraph } from './ExerciseGraph';

const meta = {
  title: 'Components/ExerciseGraph',
  component: ExerciseGraph,
  decorators: [
    (Story) => (
      <View style={styles.frame}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ExerciseGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { data: [3, 8, 5, 9, 6, 4, 7] },
};

export const Uptrend: Story = {
  args: { data: [1, 2, 3, 5, 7, 9, 12] },
};

export const Downtrend: Story = {
  args: { data: [12, 9, 7, 6, 4, 3, 1] },
};

export const Flat: Story = {
  args: { data: [5, 5, 5, 5, 5, 5, 5] },
};

// 카드 폭이 Figma 기준(129)보다 좁을 때도 도트가 안 잘리는지 확인용
export const NarrowContainer: Story = {
  args: { data: [3, 8, 5, 9, 6, 4, 7] },
  decorators: [
    (Story) => (
      <View style={styles.narrowFrame}>
        <Story />
      </View>
    ),
  ],
};

const styles = StyleSheet.create({
  frame: { width: 200, padding: Spacing.md },
  narrowFrame: { width: 90, padding: Spacing.md },
});
