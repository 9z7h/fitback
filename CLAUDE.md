@AGENTS.md

# 프로젝트: FitBack

운동 회원권의 **ROI(본전 회수율)** 를 관리하는 AI 운동 코치. 웹앱 우선, 동일 코드로 iOS/Android 확장.
모든 판단 기준: **"사용자가 실제로 운동하러 가게 만드는가?"** ROI(흑자/적자)를 숫자로 보여주는 게 핵심 차별점.

## 핵심 원칙 (카파시 4원칙 · 강제)

1. **Think Before Coding** — 모호하면 멈추고 질문. 추측을 사실처럼 단정 금지.
2. **Simplicity First** — 새로 만들기 전 기존 컴포넌트·토큰·훅 재사용. 요청 안 한 추상화 금지.
3. **Surgical Changes** — 변경한 모든 줄이 요청과 1:1. 범위 밖 리팩토링·포맷 변경 금지.
4. **Goal-Driven Execution** — 측정 가능한 완료 조건. 자체 검증 전 "완료" 선언 금지.

## 절대 규칙 (디자인 토큰)

- 색·여백·radius **하드코딩 금지**. 반드시 `src/constants/theme.ts` 토큰 사용(`Palette.*`/`Spacing.*`/`Radius.*`). raw hex·raw 숫자 = 위반.
- 텍스트는 `ThemedText`, 아이콘은 Lucide. `docs/design-system.md`에 없는 값이면 먼저 질문.
- 손익 컬러(`Palette.loss/profit`)는 ROI 손익에만. 색 단독 의존 금지 → 아이콘+라벨+색 3중.

## 절대 규칙 (Figma 구현)

- 원본 텍스트·variant만 사용(자의 추가·변경 금지). variant마다 컴포넌트 쪼개지 말 것 — 단일 컴포넌트 + props.
- 컴포넌트는 `width:100%`/`flex:1`, 바깥 여백은 부모가 padding으로.

## 출석 검증 규칙 (확정: PRD §08 기준)

- 체크인은 센터 **100m 이내**에서만 활성(`CheckInFlow`의 지오펜스). 위치는 웹·앱 모두 `getPosition()`.
- 수동(자기신고) 출석도 ROI(회수 금액·활용도)에 반영한다(현행 유지). `visits.verify_status`로 검증 여부는 구분해 저장하되, NSM(북극성 지표) 등 신뢰도 전용 집계에서만 verified로 제한한다.

## 도메인 요약 (상세 → `docs/architecture.md`)

- **회원권 타입**: `session`(세션권 · PT/필라테스 등 횟수 차감형) / `period`(기간권 · 헬스 등 무제한·주당목표형).
- **ROI 핵심 지표**: 회당가치 = 원금 ÷ 목표 방문 수 (세션권=`max_visits`, 기간권=주당목표×기간으로 환산한 값). `valueAtRisk = 잔여 목표 방문 × 회당가치`. 세션권=소멸 프레이밍, 기간권=정체 프레이밍(현금은 안 사라지고 진행만 멈춤). → `dashboard.ts`
- **AI 코치**: `coach` Edge Function이 risk·pace 받아 `CoachTip` 1장 생성(6h 캐시). → `useCoach.ts`
- **실제 테이블**: profiles, memberships, centers, visits, exercise_records, user_preferences, workout_logs, exercises, meals, food_favorites.
- 식단(`diet.tsx`/`meals`)·홈트는 **독립 기능(ROI 비핵심)** — 코드는 유지, 신규 작업 시 ROI 우선.

## 코드 컨벤션

실제 코드를 분석해 정리한 현재 상태. 새 코드는 아래 패턴을 따른다.

### 1. 프로젝트 구조

- `src/app/`: Expo Router 라우트. 파일 = URL 경로.
- `src/features/{domain}/`: 도메인 훅·컴포넌트를 하위 폴더 없이 **평면 배치**(예: `membership/`에 컴포넌트 30여 개가 서브폴더 없이 나열). `.web.tsx`로 플랫폼 분기(`KakaoMap.tsx` / `KakaoMap.web.tsx`).
- `src/components/`: 여러 feature가 공유하는 컴포넌트만. `ui.tsx` 단일 파일이 Button/Card/Icon/Chip/Input/ProgressBar 배럴 역할.
- `src/hooks/`, `src/stores/`, `src/lib/`, `src/constants/`, `src/types/`: 각 역할별 평면 폴더.

### 2. 토큰

- **단일 소스는 `src/constants/theme.ts`**(`Palette`/`Typography`/`Spacing`/`Radius`/`Elevation`). 모든 컴포넌트가 여기서 import.
- ⚠️ **불일치 발견**: `src/tokens/colors.css`, `src/tokens/spacing.css`가 존재하지만 앱 어디서도 import 안 됨(죽은 코드, Figma 동기화용 미러로 추정). CSS 변수(`--color-*`, `--spacing-*`)는 런타임에 전혀 쓰이지 않는다 — 신규 작업에서 참조하지 말 것.
- ⚠️ `src/global.css`의 `body { background-color: #f2f2f7 }`가 `Palette.bgBase`(`#F5F5F9`) 값과 다름 — 하드코딩 드리프트.

### 3. 컴포넌트 (`src/components/ui.tsx`)

- 컴포넌트당 `export function Name({ ...props }: { ... })` — **별도 `type Props` 선언 없이 함수 시그니처에 인라인 객체 타입**. 기본값은 구조분해 시 지정(`variant = 'primary'`).
- 여러 variant는 한 컴포넌트 + `Record<Variant, T>` 매핑(`BTN_BG`/`BTN_FG`/`BTN_PRESSED`)으로 처리, variant별 컴포넌트 분리 금지.
- 스타일은 파일 하단 `const styles = StyleSheet.create({...})` 한 곳에 모음, 컴포넌트 위에서 정의하지 않음.
- ⚠️ **불일치 발견**: `src/components/ui/collapsible.tsx`(폴더)가 `ui.tsx`(파일)와 별도로 존재 — 아무 곳에서도 import 안 되는 죽은 코드이자 Expo 템플릿 잔재. `Spacing.two/three/four` 레거시 별칭과 raw `borderRadius: 12` 하드코딩까지 있어 토큰 규칙 위반. 삭제 대상.

### 4. 스타일링

- **Tailwind 미사용** — `package.json`에 의존성 없음, config 없음. 요청 전제와 다름.
- 전부 RN `StyleSheet.create` + `theme.ts` JS 상수 참조. `className`은 프로젝트 전체에서 `animated-icon.web.tsx` 1곳뿐(웹 전용 CSS 모듈 예외).
- CSS는 `global.css`(웹 폰트 스택·바디 배경)에만 남아 있고 그 외엔 없음.

### 5. Import 순서

관찰된 3-그룹 패턴(빈 줄로 구분):
1. 외부 패키지(`lucide-react-native`, `react-native` 등, RN을 외부 그룹 마지막에 배치)
2. `@/` 내부 import — `@/components` → `@/constants` → `@/features` → `@/hooks` 순으로 대체로 경로 알파벳/의존 깊이순
3. (필요 시) 타입 전용 `type` import는 named import에 인라인(`import { useCoach, type CoachInput } from '...'`)으로, 별도 줄 분리 안 함.

**확정(2026-07-28)**: ESLint import 순서 강제 플러그인은 추가하지 않는다(관례 유지). 위 3-그룹 순서를 코드리뷰 기준으로만 적용.

### 6. 네이밍

| 대상 | 케이스 | 예 |
|------|--------|-----|
| 라우트 파일 (`src/app/`) | kebab-case / camelCase 혼용 없이 소문자 | `diet.tsx`, `membership.tsx` |
| feature 컴포넌트 파일 | PascalCase | `CoachCard.tsx`, `MembershipCard.tsx` |
| feature 훅·유틸 파일 | camelCase | `useCoach.ts`, `dashboard.ts` |
| 공용 컴포넌트 파일 (`src/components/`) | kebab-case | `themed-text.tsx`, `record-card.tsx` |
| zustand store 파일 | kebab-case | `workout-session.ts` |
| 함수/변수 | camelCase | `valueAtRisk`, `useMonthlyStats` |
| CSS 커스텀 프로퍼티 | kebab-case, primitive는 `-p-` 삽입 | `--color-p-indigo-400` → `--color-brand-primary` |

**확정(2026-07-28)**: 훅 파일명 케이스는 위치 기반 분리로 확정. `src/hooks/`(범용 훅)=kebab-case, `src/features/*`(도메인 훅)=camelCase. 통일 리네임 안 함 — 신규 훅은 놓이는 폴더의 케이스를 따를 것.

### 7. Storybook

- Story 파일은 컴포넌트 옆에 `*.stories.tsx`로 위치(`themed-text.tsx` 옆 `themed-text.stories.tsx`).
- `meta.title`은 `Category/ComponentName` 형식(`Components/ThemedText`).
- autodocs는 `.storybook/preview.tsx`의 `tags: ['autodocs']` 전역 설정으로 적용 — 스토리 파일마다 태그 안 붙임.
- (참고) 현재 stories 파일이 1개뿐이라 위 패턴은 이번에 갓 확립된 규칙이며, 다수 파일로 검증된 컨벤션은 아님.

### 8. 테스트

- ⚠️ **불일치 발견이 아니라 부재**: 테스트 파일·테스트 프레임워크(Jest/Vitest) 자체가 프로젝트에 없음(`package.json`에 관련 의존성 없음, config 없음). 테스트 위치/네이밍 컨벤션은 아직 정의된 바 없음 — 필요 시 먼저 어떤 프레임워크를 쓸지 사용자에게 질문할 것.

## 작업 원칙

- 요구사항이 명확하고 비파괴적인 bounded 변경은 별도 중간 승인 없이 구현·검증까지 자동 진행한다. 삭제·푸시·DB/RLS 정책 변경·모호한 요구사항처럼 되돌리기 어렵거나 제품 결정이 필요한 작업만 사용자 확인을 받는다.
- 크로스플랫폼 분기는 `Platform.OS` / `.web.tsx` / `.native.tsx`.
- Expo v56 공식 문서 우선(AGENTS.md). 상세 모델·결정 이력·검증 갭은 `docs/architecture.md` 참조.

## 하네스: FitBack 개발 에이전트 팀

**목표:** 화면(FE)·데이터/ROI 로직(BE)·검증(QA)을 분리된 에이전트로 처리해 카파시 4원칙(수술적 변경·단계별 확인)을 지키며 개발한다.

**트리거:** 기능 추가·버그 수정·리팩토링 등 코드 작업 요청 시 `fitback-harness` 스킬을 사용하라. 단순 질문·설명 요청은 직접 응답 가능. (변경 이력 → `.claude/skills/fitback-harness/SKILL.md`)
