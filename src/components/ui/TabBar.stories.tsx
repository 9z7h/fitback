import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconCalendar, IconCard, IconFit, IconFood } from '@/components/icons';
import { Palette, Radius, Spacing } from '@/constants/theme';

import { TabBar, TabBarItem } from './TabBar';

const meta = {
  title: 'Components/TabBar',
  component: TabBar,
  decorators: [
    (Story) => (
      <View style={styles.frame}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

function Interactive() {
  const [active, setActive] = useState(0);
  const items = [
    { icon: IconCard, label: '회원권' },
    { icon: IconFit, label: '운동' },
    { icon: IconFood, label: '식단' },
    { icon: IconCalendar, label: '기록' },
  ];
  return (
    <TabBar>
      {items.map((item, i) => (
        <TabBarItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          active={active === i}
          onPress={() => setActive(i)}
        />
      ))}
    </TabBar>
  );
}

export const Default: Story = {
  args: { children: <Interactive /> },
  render: () => <Interactive />,
};

export const FirstActive: Story = {
  args: {
    children: (
      <>
        <TabBarItem icon={IconCard} label="회원권" active onPress={() => {}} />
        <TabBarItem icon={IconFit} label="운동" active={false} onPress={() => {}} />
        <TabBarItem icon={IconFood} label="식단" active={false} onPress={() => {}} />
        <TabBarItem icon={IconCalendar} label="기록" active={false} onPress={() => {}} />
      </>
    ),
  },
};

// 배경 위에 떠 있는 실제 사용 맥락 — 글래스 블러가 뒤 콘텐츠를 어떻게 흐리는지 확인용.
export const OverContent: Story = {
  args: {
    children: (
      <>
        <TabBarItem icon={IconCard} label="회원권" active onPress={() => {}} />
        <TabBarItem icon={IconFit} label="운동" active={false} onPress={() => {}} />
        <TabBarItem icon={IconFood} label="식단" active={false} onPress={() => {}} />
        <TabBarItem icon={IconCalendar} label="기록" active={false} onPress={() => {}} />
      </>
    ),
  },
  decorators: [
    (Story) => (
      <View style={styles.contentFrame}>
        <View style={styles.fakeCard} />
        <View style={styles.tabBarWrap}>
          <Story />
        </View>
      </View>
    ),
  ],
};

const styles = StyleSheet.create({
  frame: { width: 360, padding: Spacing.md },
  contentFrame: {
    width: 360,
    height: 200,
    backgroundColor: Palette.bgBase,
    justifyContent: 'flex-end',
  },
  fakeCard: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.md,
    right: Spacing.md,
    height: 100,
    borderRadius: Radius.card,
    backgroundColor: Palette.primaryLight,
  },
  tabBarWrap: { padding: Spacing.md },
});
