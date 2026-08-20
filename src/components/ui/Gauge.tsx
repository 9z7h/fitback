/**
 * FitBack Gauge — Figma Gauge의 segmented progress / circle variant.
 */
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Palette, Radius, Spacing } from '@/constants/theme';

const CIRCLE_WIDTH = 150;
const CIRCLE_HEIGHT = 72;
const CIRCLE_STROKE_WIDTH = 12;
const CIRCLE_STROKE_INSET = CIRCLE_STROKE_WIDTH / 2;
const CIRCLE_CANVAS_WIDTH = CIRCLE_WIDTH + CIRCLE_STROKE_WIDTH;
const CIRCLE_CANVAS_HEIGHT = CIRCLE_HEIGHT + CIRCLE_STROKE_WIDTH;

export function getCircleGaugeGeometry(percent: number) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radiusX = CIRCLE_WIDTH / 2;
  const radiusY = CIRCLE_HEIGHT;
  const centerX = CIRCLE_WIDTH / 2;
  const theta = Math.PI * (1 - clamped / 100);
  const end = {
    x: Number((centerX + radiusX * Math.cos(theta)).toFixed(2)),
    y: Number((CIRCLE_HEIGHT - radiusY * Math.sin(theta)).toFixed(2)),
  };

  return {
    percent: clamped,
    trackPath: `M 0 ${CIRCLE_HEIGHT} A ${radiusX} ${radiusY} 0 0 1 ${CIRCLE_WIDTH} ${CIRCLE_HEIGHT}`,
    progressPath: `M 0 ${CIRCLE_HEIGHT} A ${radiusX} ${radiusY} 0 0 1 ${end.x} ${end.y}`,
    end,
  };
}

export function Gauge({
  percent,
  segments = 3,
  variant = 'progress',
  accessibilityLabel,
  style,
}: {
  /** 전체 진행률 0~100 */
  percent: number;
  /** 세그먼트 개수 (기본 3, Figma 스펙) */
  segments?: number;
  variant?: 'progress' | 'circle';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const clamped = Math.max(0, Math.min(100, percent));

  if (variant === 'circle') {
    const geometry = getCircleGaugeGeometry(clamped);
    return (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 0, max: 100, now: geometry.percent }}
        style={[styles.circle, style]}>
        <Svg
          width={CIRCLE_CANVAS_WIDTH}
          height={CIRCLE_CANVAS_HEIGHT}
          viewBox={`${-CIRCLE_STROKE_INSET} ${-CIRCLE_STROKE_INSET} ${CIRCLE_CANVAS_WIDTH} ${CIRCLE_CANVAS_HEIGHT}`}
          style={styles.circleCanvas}>
          <Path
            d={geometry.trackPath}
            stroke={Palette.gray300}
            strokeWidth={CIRCLE_STROKE_WIDTH}
            fill="none"
            strokeLinecap="round"
          />
          {geometry.percent > 0 ? (
            <Path
              d={geometry.progressPath}
              stroke={Palette.blue200}
              strokeWidth={CIRCLE_STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
            />
          ) : null}
        </Svg>
      </View>
    );
  }

  const perSegment = 100 / segments;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={[styles.row, style]}>
      {Array.from({ length: segments }).map((_, i) => {
        const segmentFillPct = Math.max(0, Math.min(100, (clamped - i * perSegment) / perSegment * 100));
        return (
          <View key={i} style={styles.track}>
            <View style={[styles.fill, { width: `${segmentFillPct}%` }]} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', flexDirection: 'row', gap: Spacing.xs / 2 },
  circle: { width: CIRCLE_WIDTH, height: CIRCLE_HEIGHT, overflow: 'visible' },
  circleCanvas: {
    position: 'absolute',
    left: -CIRCLE_STROKE_INSET,
    top: -CIRCLE_STROKE_INSET,
    overflow: 'visible',
  },
  track: {
    flex: 1,
    height: 32,
    borderRadius: Radius.small,
    backgroundColor: Palette.gray300,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.small,
    backgroundColor: Palette.blue200,
  },
});
