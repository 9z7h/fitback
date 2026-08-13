import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';

import { Palette } from '@/constants/theme';
import { TabBarBackground } from './TabBarBackground';

const meta = {
  title: 'Components/TabBarBackground',
  component: TabBarBackground,
  decorators: [
    (Story) => (
      <View style={{ width: 335, height: 54, backgroundColor: Palette.gray800 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof TabBarBackground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TopRounded: Story = {
  args: { radiusTopLeft: 12, radiusTopRight: 12, radiusBottomLeft: 0, radiusBottomRight: 0 },
};

export const AllRounded: Story = {
  args: { radiusTopLeft: 12, radiusTopRight: 12, radiusBottomLeft: 12, radiusBottomRight: 12 },
};
