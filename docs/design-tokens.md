# Design Tokens — Primitive → Semantic 매핑

> **출처** — Figma `fitback` 파일 > `Token Documentation` 프레임군 (`get_variable_defs`, 2026-08-12 추출).
> **런타임** — RN 코드는 이 문서를 참조하지 않는다. 실제 소스는 `src/constants/theme.ts`(`Palette`/`Spacing`/`Radius`/`Typography`/`Elevation`).
> **CSS 미러** — `src/tokens/colors.css`, `src/tokens/spacing.css`, `src/tokens/radius.css`, `src/tokens/typography.css` (웹 CSS 커스텀 프로퍼티, 런타임 미사용·Figma 동기화 참조용).

---

## 1. 컬러

> 출처: Figma `디자인시스템 > 스타일가이드_컬러`(nodeId 1401:988) "Alias → Primitive" 공식 표. 값은 기존 추출과 100% 일치 — 이번 갱신은 primitive 이름 보정만(이전엔 "대응 없음"으로 적었던 게 실은 다 있었음).

### Primitive (raw ramp)

| Figma 이름 | CSS 변수 | 값 |
|---|---|---|
| gray/00 | `--color-gray-00` | `#ffffff` |
| gray/200 | `--color-gray-200` | `#f2f4f7` |
| gray/300 | `--color-gray-300` | `#e7e9f1` |
| gray/400 | `--color-gray-400` | `#c0c3cf` |
| gray/500 | `--color-gray-500` | `#999999` |
| gray/600 | `--color-gray-600` | `#6b7280` |
| gray/800 | `--color-gray-800` | `#272e3e` |
| Indigo/100 | `--color-indigo-100` | `#f0f1ff` |
| Indigo/200 | `--color-indigo-200` | `#e0e3ff` |
| Indigo/500 | `--color-indigo-500` | `#6675ff` |
| Indigo/600 | `--color-indigo-600` | `#5566f7` |
| Indigo/700 | `--color-indigo-700` | `#4957d8` |
| blue/200 | `--color-blue-200` | `#d0deff` |
| blue/500 | `--color-blue-500` | `#6490ff` |
| purple/500 | `--color-purple-500` | `#bd7bf8` |

### Semantic → Primitive 참조 (Figma "Alias → Primitive" 표 그대로)

| Figma 이름 | CSS 변수 | 참조 Primitive | 값 |
|---|---|---|---|
| primary/primary | `--primary-primary` | `--color-indigo-500` | `#6675ff` |
| primary/primary-pressed | `--primary-primary-pressed` | `--color-indigo-600` | `#5566f7` |
| background/Primary | `--background-primary` | `--color-gray-200` | `#f2f4f7` |
| text/secondary | `--text-secondary` | `--color-gray-600` | `#6b7280` |
| text/primary | `--text-primary` | `--color-gray-800` | `#272e3e` |
| text/caption | `--text-caption` | `--color-gray-500` | `#999999` |
| text/inverse | `--text-inverse` | `--color-gray-00` | `#ffffff` |
| text/inverse-secondary | `--text-inverse-secondary` | `--color-indigo-200` | `#e0e3ff` |
| secondary/secondary | `--secondary-secondary` | `--color-blue-500` | `#6490ff` |
| card/emphasis | `--card-emphasis` | `--color-gray-800` | `#272e3e` |
| card/primary | `--card-primary` | `--color-gray-00` | `#ffffff` |
| card/secondary | `--card-secondary` | `--color-gray-200` | `#f2f4f7` |
| card/tertiary | `--card-tertiary` | `--color-gray-300` | `#e7e9f1` |
| icon/primary | `--icon-primary` | `--color-gray-400` | `#c0c3cf` |
| icon/select | `--icon-select` | `--color-indigo-500` | `#6675ff` |
| icon/inverse | `--icon-inverse` | `--color-gray-00` | `#ffffff` |
| icon/border | `--icon-border` | `--color-gray-600` | `#6b7280` |
| border/input | `--border-input` | `--color-gray-300` | `#e7e9f1` |
| tertiary/tertiary | `--tertiary-tertiary` | `--color-purple-500` | `#bd7bf8` |
| status/error | `--color-status-error` | 없음(Figma 표에도 "—") | `#ef4444` |
| status/error-light | `--color-status-error-light` | 없음 | `#fee2e2` |
| status/success | `--color-status-success` | 없음 | `#22c55e` |
| status/success-light | `--color-status-success-light` | 없음 | `#dcfce7` |
| status/warning | `--color-status-warning` | 없음 | `#ffcc00` |
| Overlay/200 | `--overlay-200` | 없음 | `#ffffffbf` |
| Overlay/100 | `--overlay-100` | 없음 | `#ffffff29` |

### `theme.ts` Palette와 대조

| Figma 값 | `theme.ts` 키 | 일치 |
|---|---|---|
| `#6675ff`(Indigo/500) | `Palette.primary` | ✓ |
| `#5566f7`(Indigo/600) | `Palette.primaryHover` | 값 일치, Figma는 `primary/primary-pressed`로 명명 — 네이밍 차이 |
| `#4957d8`(Indigo/700) | `Palette.primaryPressed` | 값은 존재하나 Figma 시맨틱 별칭 없음(램프에만 존재) |
| `#f0f1ff` | `Palette.primaryLight` | ✓ (8/12 갱신) |
| `#6490ff` | `Palette.secondary` | ✓ (8/12 갱신) |
| `#bd7bf8` | `Palette.tertiary` | ✓ (8/12 신규 추가) |
| `#ffcc00` | `Palette.warning` | ✓ (8/12 갱신) |
| `#f2f4f7` | `Palette.bgBase` / `Palette.bgMuted` / `Palette.gray50` | ✓ (8/12 갱신) |
| `#272e3e` | `Palette.gray900` / `Palette.loss` | ✓ (8/12 갱신) |
| `#c0c3cf` | `Palette.iconPrimary` | ✓ (8/12 신규 추가) |

---

## 2. 스페이싱 (8pt grid)

| Figma | CSS 변수 | 값 | `theme.ts` |
|---|---|---|---|
| xxs | `--spacing-xxs` | 2px | `Spacing.half`(레거시 별칭, 값 동일) |
| xs | `--spacing-xs` | 4px | `Spacing.xs` |
| sm | `--spacing-sm` | 8px | `Spacing.sm` |
| m | `--spacing-m` | 12px | `Spacing.m` |
| md | `--spacing-md` | 16px | `Spacing.md` |
| card | `--spacing-card` | 20px | `Spacing.card` |
| lg | `--spacing-lg` | 24px | `Spacing.lg` |
| xl | `--spacing-xl` | 32px | `Spacing.xl` |
| xxl | `--spacing-xxl` | 44px | `Spacing.xxl`(8/12 48→44 갱신) |

## 3. Radius

| Figma | CSS 변수 | 값 | `theme.ts` |
|---|---|---|---|
| xs | `--radius-xs` | 8px | `Radius.small` |
| sm | `--radius-sm` | 12px | `Radius.button` |
| md | `--radius-md` | 20px | `Radius.card` / `Radius.modal` |
| lg | `--radius-lg` | 100px | `Radius.full` |

## 4. 타이포그래피

| Figma | 크기/굵기 | CSS 변수 | `theme.ts` |
|---|---|---|---|
| Display/32 | 32 Bold, ls -3% | `--font-size-display` | `Typography.display` |
| Heading/24 | 24 Bold, ls -2.5% | `--font-size-h1` | `Typography.h1` |
| Heading/20 | 20 Bold, ls -2.5% | `--font-size-h2` | `Typography.h2` |
| Title/18 | 18 Bold, ls -2.5% | `--font-size-title` | `Typography.subtitle` |
| Body/16_M, Body/16_SB | 16 Medium/SemiBold | `--font-size-body` | `Typography.body` / `bodySemibold` |
| Label/14_M, Label/14_SB | 14 Medium/SemiBold | `--font-size-label` | `Typography.label` / `labelBold`(8/12 갱신 — 구 `caption`) |
| Caption/12 | 12 Medium | `--font-size-caption` | `Typography.caption`(8/12 갱신 — 구 `label`) |

`display2`(28px)는 Figma Token Documentation에 없음 — 코드 전용 확장 토큰(대형 강조 수치용), Figma 정본과 무관하게 유지.

## 5. Elevation

| Figma | CSS 변수 | 값 | `theme.ts` |
|---|---|---|---|
| shadow/s | `--shadow-s` | `rgba(17,24,39,0.04)` | `Elevation.level1` |
| shadow/m | `--shadow-m` | `rgba(17,24,39,0.08)` | `Elevation.level2` |
| shadow/l | `--shadow-l` | `rgba(17,24,39,0.16)` | 대응 없음 — Figma 신규, 미반영 |
