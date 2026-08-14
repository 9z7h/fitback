import type { Meta, StoryObj } from '@storybook/react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { Gauge } from './Gauge';

const meta = {
  title: 'Components/Gauge',
  component: Gauge,
  decorators: [
    (Story) => (
      <View style={styles.frame}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Gauge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { percent: 0 },
};

export const OneThird: Story = {
  args: { percent: 33 },
};

export const SeventySeven: Story = {
  args: { percent: 77 },
};

export const Full: Story = {
  args: { percent: 100 },
};

const styles = StyleSheet.create({
  frame: { width: 295, padding: Spacing.md },
});
