import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

import { Input } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  decorators: [
    (Story) => (
      <View style={styles.frame}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Input_Field 4 states ────────────────────────────────
export const Normal: Story = {
  args: { state: 'normal', placeholder: '센터 이름을 입력하세요' },
};

export const Pressed: Story = {
  args: { state: 'pressed', placeholder: '센터 이름을 입력하세요' },
};

export const Selected: Story = {
  args: { state: 'selected', value: '강남 피트니스' },
};

export const Filled: Story = {
  args: { state: 'filled', placeholder: '센터 검색' },
};

export const FilledWithClear: Story = {
  args: { state: 'filled', value: '강남 피트니스', onClear: () => {} },
};

// ── InputField_WithLabel ────────────────────────────────
export const WithLabel: Story = {
  args: { label: '회원권 이름', state: 'normal', placeholder: '예) 6개월 헬스 이용권' },
};

export const WithLabelPressed: Story = {
  args: { label: '회원권 이름', state: 'pressed', placeholder: '예) 6개월 헬스 이용권' },
};

export const WithLabelSelected: Story = {
  args: { label: '결제 금액', state: 'selected', value: '540,000' },
};

// ── 자동 state 전환(포커스 시 normal ↔ pressed) ─────────
function InteractiveInput() {
  const [value, setValue] = useState('');
  return (
    <Input label="센터 검색" placeholder="센터 이름을 입력하세요" value={value} onChangeText={setValue} />
  );
}

export const Interactive: Story = {
  render: () => <InteractiveInput />,
};

const styles = StyleSheet.create({
  frame: { width: 360, padding: Spacing.md },
});
