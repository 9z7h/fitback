---
name: fitback-design-tokens
description: FitBack에서 화면·컴포넌트를 만들거나 수정할 때 반드시 참조. 색·여백·radius를 하드코딩하지 않고 src/constants/theme.ts의 Palette/Spacing/Radius 토큰만 쓰도록 강제한다. 새 화면 작성, 기존 UI 수정, Figma 디자인 구현, 손익(ROI) 컬러 표시 작업에서 트리거.
---

# FitBack 디자인 토큰 규칙

## Why

FitBack은 라이트 전용 단일 테마(다크는 라이트와 동일 매핑)라서, 토큰 없이 raw hex/숫자를 쓰면 나중에 테마 조정이 전 화면에 흩어진 하드코딩을 찾아 고치는 작업이 된다. `docs/design-system.md`가 유일한 진실 소스이므로, 거기 없는 값이 필요하면 만들지 말고 사용자에게 질문한다.

## 토큰 사용법

```ts
import { Palette, Spacing, Radius, Elevation } from '@/constants/theme';
```

- **색**: `Palette.*` 만 사용. 대표: `primary`(#6675FF), `bgBase`/`bgSurface`/`bgMuted`, `success`/`warning`/`error`, `gray900~gray50`. raw `#RRGGBB` 리터럴을 `.tsx`/`.ts`에 직접 쓰면 위반.
- **여백**: `Spacing.*` 만 사용 (`xs`4 / `sm`8 / `ms`10 / `m`12 / `md`16 / `card`20 / `lg`24 / `xl`32 / `xxl`48 / `screen-x`20). `half`/`one`/`two`/`three`는 레거시 alias — 신규 코드에서는 쓰지 말고 위 이름 사용.
- **radius**: `Radius.*` 만 사용 (`small`8 / `button`12 / `card`20 / `modal`20 / `full`100).
- **그림자**: `Elevation.level1`/`level2`/`sticky` — 네이티브 shadow*와 web boxShadow를 동시 제공하므로 직접 shadow 스타일을 쓰지 않는다.
- **텍스트**: RN 기본 `Text` 대신 `ThemedText`(`src/components/themed-text.tsx`) 사용.
- **아이콘**: `lucide-react-native`만 사용. 이모지·커스텀 SVG로 대체하지 않는다.

## ROI 손익 컬러 — 3중 표기 원칙

`Palette.profit`(#6675FF, 인디고)과 `Palette.loss`(#222C43, 다크 네이비)는 **ROI 손익 표현에만** 쓴다. loss가 빨강이 아니라 다크 네이비인 이유는 design-system §5의 "Encourage, Not Pressure" 원칙 — 압박이 아닌 사실 전달.

색만으로 의미를 전달하면 접근성 위반이다. 손익을 표시할 땐 항상 다음 3가지를 함께 쓴다:
1. 아이콘 (Lucide, 예: `TrendingUp`/`AlertTriangle`)
2. 텍스트 라벨 (예: "안전"/"위험")
3. 색 (`Palette.profit`/`Palette.loss`)

이미 `src/features/membership/dashboard.ts`의 `RISK_COLORS`/`RISK_META`가 이 패턴을 구현해 두었으니 새로 만들지 말고 재사용한다.

## Figma 구현 시 추가 규칙

- 원본 텍스트·variant만 사용 — 자의로 문구 추가·변경 금지.
- variant마다 컴포넌트를 쪼개지 말 것. 단일 컴포넌트 + props로 variant 표현.
- 컴포넌트는 `width:100%` 또는 `flex:1`로 작성하고, 바깥 여백은 부모가 padding으로 준다(컴포넌트 자신이 바깥 margin을 갖지 않는다).

## 셀프 체크 (커밋 전)

```bash
# 변경 파일에서 raw hex 리터럴 탐색
git diff --name-only -- '*.tsx' '*.ts' | xargs grep -nE "#[0-9A-Fa-f]{3,6}" 2>/dev/null
```
결과가 나오면 `theme.ts`에 대응 토큰이 있는지 먼저 확인하고, 없으면 질문한다.
