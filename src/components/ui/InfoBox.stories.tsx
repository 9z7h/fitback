import type { Meta, StoryObj } from '@storybook/react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { InfoBox } from './InfoBox';

const meta = {
  title: 'Components/InfoBox',
  component: InfoBox,
  decorators: [
    (Story) => (
      <View style={styles.frame}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof InfoBox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: 'primary', label: '회당 실비용', valueMain: '12,500원', valueSub: '/ 1회' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', label: '남은 세션', valueMain: '12회' },
};

export const Tertiary: Story = {
  args: { variant: 'tertiary', label: '이번 주', valueMain: '3회' },
};

export const PrimaryWithoutSub: Story = {
  args: { variant: 'primary', label: '결제 금액', valueMain: '540,000원' },
};

export const SecondaryWithSub: Story = {
  args: { variant: 'secondary', label: '주간 목표', valueMain: '3회', valueSub: '/ 주' },
};

export const TertiaryWithSub: Story = {
  args: { variant: 'tertiary', label: '만료까지', valueMain: '48일', valueSub: '남음' },
};

export const Fill: Story = {
  args: { variant: 'primary', label: '회수한 금액', valueMain: '320,000원', valueSub: '/ 540,000원', fill: true },
};

const styles = StyleSheet.create({
  frame: { width: 360, padding: Spacing.md },
});
