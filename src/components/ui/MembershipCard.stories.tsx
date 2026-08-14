import type { Meta, StoryObj } from '@storybook/react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';

import { MembershipCard } from './MembershipCard';

const styles = StyleSheet.create({
  frame: { width: 335, padding: Spacing.md, backgroundColor: Palette.bgBase },
  header: { padding: Spacing.m },
  headerText: { color: Palette.white },
  body: { padding: Spacing.card, gap: Spacing.sm },
});

const meta = {
  title: 'Components/MembershipCard',
  component: MembershipCard,
  decorators: [
    (Story) => (
      <View style={styles.frame}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof MembershipCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    header: (
      <View style={styles.header}>
        <ThemedText style={styles.headerText}>헤더 영역</ThemedText>
      </View>
    ),
    children: (
      <View style={styles.body}>
        <ThemedText type="body">바디 영역 — 높이 가변</ThemedText>
      </View>
    ),
  },
};

export const TallBody: Story = {
  args: {
    header: (
      <View style={styles.header}>
        <ThemedText style={styles.headerText}>헤더 영역</ThemedText>
      </View>
    ),
    children: (
      <View style={styles.body}>
        <ThemedText type="body">내용이 많아지면 카드가 늘어남</ThemedText>
        <ThemedText type="body">내용이 많아지면 카드가 늘어남</ThemedText>
        <ThemedText type="body">내용이 많아지면 카드가 늘어남</ThemedText>
        <ThemedText type="body">내용이 많아지면 카드가 늘어남</ThemedText>
      </View>
    ),
  },
};
