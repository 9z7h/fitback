import { describe, expect, it, vi } from 'vitest';

import { Gauge, getCircleGaugeGeometry } from './Gauge';

vi.mock('react-native', () => ({
  StyleSheet: { create: <T>(styles: T) => styles },
  View: () => null,
}));

vi.mock('react-native-svg', () => ({
  default: () => null,
  Path: () => null,
}));

vi.mock('@/constants/theme', () => ({
  Palette: { blue200: '', gray300: '' },
  Radius: { small: 0 },
  Spacing: { xs: 0 },
}));

describe('getCircleGaugeGeometry', () => {
  it('maps 0, 50, and 100 percent to the left, top, and right ends of the semicircle', () => {
    expect(getCircleGaugeGeometry(0).end).toEqual({ x: 0, y: 72 });
    expect(getCircleGaugeGeometry(50).end).toEqual({ x: 75, y: 0 });
    expect(getCircleGaugeGeometry(100).end).toEqual({ x: 150, y: 72 });
  });

  it('clamps percentages below 0 and above 100', () => {
    expect(getCircleGaugeGeometry(-20).percent).toBe(0);
    expect(getCircleGaugeGeometry(120).percent).toBe(100);
  });

  it('builds the exact Figma semicircle paths', () => {
    expect(getCircleGaugeGeometry(50)).toMatchObject({
      trackPath: 'M 0 72 A 75 72 0 0 1 150 72',
      progressPath: 'M 0 72 A 75 72 0 0 1 75 0',
    });
  });
});

describe('Gauge accessibility', () => {
  it('passes its accessibility label to the root progressbar', () => {
    const element = Gauge({
      percent: 50,
      variant: 'circle',
      accessibilityLabel: '오늘의 식단 점수',
    });

    expect(element.props.accessibilityLabel).toBe('오늘의 식단 점수');
  });
});
