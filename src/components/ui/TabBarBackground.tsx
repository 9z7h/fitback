/**
 * FitBack Tab Bar Background — Figma "Tab Bar Background"(949:177) SVG 이식.
 * 반투명 화이트 틴트 + 상/하단 인셋 섀도우(글로시 효과)를 SVG rect+gradient로 렌더.
 * backdrop-blur(뒤 콘텐츠 블러)는 SVG로 재현 불가 — expo-blur 미설치라 네이티브는 틴트만,
 * 웹은 부모의 CSS backdropFilter와 조합해서 씀(app-tabs.web.tsx).
 */
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Palette } from '@/constants/theme';

export function TabBarBackground({
  radiusTopLeft = 12,
  radiusTopRight = 12,
  radiusBottomLeft = 0,
  radiusBottomRight = 0,
}: {
  radiusTopLeft?: number;
  radiusTopRight?: number;
  radiusBottomLeft?: number;
  radiusBottomRight?: number;
}) {
  // 4개 코너 반경이 전부 같을 때만 rx 단일값 사용 가능(react-native-svg Rect는 코너별 반경 미지원) —
  // 하단 네비게이션은 위쪽만 둥글어야 해서 코너별 Path로 직접 그림.
  return (
    <Svg width="100%" height="100%" viewBox="0 0 335 54" preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        {/* Figma: inset(0px 40px 10px -40px #282828) 상단 + inset(0px -40px 10px -40px #282828) 하단
            + inset(0px 40px 30px -40px #e6e6e6) 상단 밝은 하이라이트 — 3중 인셋 섀도우를 세로 그라디언트로 근사 */}
        <LinearGradient id="tabBarGloss" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#282828" stopOpacity={0.1} />
          <Stop offset="0.12" stopColor="#e6e6e6" stopOpacity={0.4} />
          <Stop offset="0.4" stopColor="#ffffff" stopOpacity={0} />
          <Stop offset="0.85" stopColor="#282828" stopOpacity={0} />
          <Stop offset="1" stopColor="#282828" stopOpacity={0.12} />
        </LinearGradient>
      </Defs>
      <Path
        d={roundedRectPath(335, 54, radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft)}
        fill={Palette.bgSurfaceTranslucent}
      />
      <Path
        d={roundedRectPath(335, 54, radiusTopLeft, radiusTopRight, radiusBottomRight, radiusBottomLeft)}
        fill="url(#tabBarGloss)"
      />
    </Svg>
  );
}

// 코너별 반경을 가진 사각형 path (시계방향: top-left → top-right → bottom-right → bottom-left)
function roundedRectPath(w: number, h: number, tl: number, tr: number, br: number, bl: number): string {
  return `M${tl},0 H${w - tr} A${tr},${tr} 0 0 1 ${w},${tr} V${h - br} A${br},${br} 0 0 1 ${w - br},${h} H${bl} A${bl},${bl} 0 0 1 0,${h - bl} V${tl} A${tl},${tl} 0 0 1 ${tl},0 Z`;
}
