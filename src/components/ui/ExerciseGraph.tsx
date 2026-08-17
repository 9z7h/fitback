/**
 * FitBack ExerciseGraph — Figma Gauge(exercise, 1569:2773). 데이터 기반 라인 그래프.
 * 값 배열(data)을 받아 꺾은선 + 그라디언트 영역 채움 + 마지막 지점 도트로 렌더링한다.
 * onLayout으로 실제 렌더 폭을 측정해 그 값 그대로 SVG에 씀 — 카드 폭이 얼마든
 * (퍼센트 폭 기반 SVG는 react-native-svg에서 스케일이 안 먹는 경우가 있어) 도트가 잘리지 않는다.
 */
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Palette } from '@/constants/theme';

export function ExerciseGraph({
  data,
  height = 43,
}: {
  /** 시간순 데이터 포인트 — 2개 미만이면 빈 영역만 렌더 */
  data: number[];
  height?: number;
}) {
  const [measuredWidth, setMeasuredWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== measuredWidth) setMeasuredWidth(w);
  };

  if (data.length < 2 || measuredWidth === 0) {
    return <View style={{ width: '100%', height }} onLayout={onLayout} />;
  }

  const width = measuredWidth;
  const dotRadius = 6;
  const strokeWidth = 2;
  // react-native-svg는 <Svg>에 overflow:hidden을 강제로 건다 — 도트가 캔버스 경계에
  // 딱 맞닿기만 해도(여유 0px) 잘려 보인다. 상하좌우 전부 도트 반지름만큼 안쪽 여백을 둔다.
  const pad = dotRadius + strokeWidth / 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (value - min) / range) * (height - pad * 2),
  }));

  const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${lineD} L ${width} ${height} L 0 ${height} Z`;
  const last = points[points.length - 1];

  return (
    <View style={{ width: '100%', height }} onLayout={onLayout}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="exerciseGraphFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Palette.blue200} />
            <Stop offset="1" stopColor={Palette.blue200} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaD} fill="url(#exerciseGraphFill)" />
        <Path d={lineD} stroke={Palette.secondary} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
        <Circle cx={last.x} cy={last.y} r={dotRadius} fill={Palette.blue100} />
        <Circle cx={last.x} cy={last.y} r={dotRadius / 2} fill={Palette.secondary} />
      </Svg>
    </View>
  );
}
