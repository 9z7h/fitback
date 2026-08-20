import type { LucideIcon } from 'lucide-react-native';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';

const { ChevronRightMock } = vi.hoisted(() => ({ ChevronRightMock: () => null }));

vi.mock('react-native', () => ({
  ActivityIndicator: () => null,
  Pressable: () => null,
  StyleSheet: { create: (styles: unknown) => styles },
  View: () => null,
}));

vi.mock('lucide-react-native', () => ({
  ChevronDown: () => null,
  ChevronRight: ChevronRightMock,
  Sparkles: () => null,
}));

vi.mock('@/components/icons', () => ({ IconPlusCircle: () => null }));
vi.mock('@/components/themed-text', () => ({ ThemedText: () => null }));
vi.mock('@/constants/theme', () => ({
  Elevation: { shadowS: {} },
  FontFamily: { bold: '' },
  Palette: {
    bgBase: '', bgMuted: '', bgSurface: '', gray300: '', gray400: '', gray600: '', gray800: '',
    iconPrimary: '', primary: '', primaryPressed: '', white: '',
  },
  Radius: { button: 0, card: 0, full: 0 },
  Spacing: { card: 20, md: 16, m: 12, sm: 8, xs: 4 },
  Typography: { body: {}, bodySemibold: {}, label: {}, subtitle: {} },
}));

describe('Button iconRight', () => {
  it('renders a custom right icon after the text', () => {
    const CustomRight = (() => null) as unknown as LucideIcon;
    const button = Button({ children: '식단 기록하기', iconRight: CustomRight });
    const inner = button.props.children({ pressed: false });
    const visibleChildren = inner.props.children.filter(Boolean);

    expect(visibleChildren.at(-1).type).toBe(CustomRight);
    expect(visibleChildren.at(-1).props.size).toBe(24);
    expect(visibleChildren.at(-2).props.children).toBe('식단 기록하기');
    expect(inner.props.style).toContainEqual(expect.objectContaining({ gap: 2 }));
  });

  it('keeps boolean true mapped to a 24px ChevronRight', () => {
    const button = Button({ children: '다음', iconRight: true });
    const inner = button.props.children({ pressed: false });
    const visibleChildren = inner.props.children.filter(Boolean);

    expect(visibleChildren.at(-1).type).toBe(ChevronRightMock);
    expect(visibleChildren.at(-1).props.size).toBe(24);
  });
});
