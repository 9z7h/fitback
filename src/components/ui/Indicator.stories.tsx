import type { Meta, StoryObj } from '@storybook/react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { Indicator } from './Indicator';

const meta = {
  title: 'Components/Indicator',
  component: Indicator,
  decorators: [
    (Story) => (
      <View style={styles.frame}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Indicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstStep: Story = {
  args: { count: 3, activeIndex: 0 },
};

export const MiddleStep: Story = {
  args: { count: 3, activeIndex: 1 },
};

export const LastStep: Story = {
  args: { count: 3, activeIndex: 2 },
};

export const FiveDots: Story = {
  args: { count: 5, activeIndex: 2 },
};

export const SingleDot: Story = {
  args: { count: 1, activeIndex: 0 },
};

const styles = StyleSheet.create({
  frame: { width: 360, padding: Spacing.md },
});
