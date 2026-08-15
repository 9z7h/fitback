/**
 * FitBack Design System tokens — docs/design-system.md 기준.
 * 라이트 전용(웜 오프화이트). 다크 테마는 라이트와 동일하게 매핑해 사실상 단일 테마.
 */

import '@/global.css';

import { Platform, type TextStyle, type ViewStyle } from 'react-native';

// ── 4. 컬러 시스템 (raw palette) ──────────────────────────
export const Palette = {
  // Primary & Secondary (인디고)
  primary: '#6675FF',
  primaryHover: '#5566F7',
  primaryPressed: '#4957D8',
  primaryLight: '#F0F1FF',
  secondary: '#6490FF',
  blue200: '#D0DEFF', // Figma variable blue/200 — Gauge(prograss) 채움색
  tertiary: '#BD7BF8',

  // Background
  bgBase: '#F2F4F7',
  bgSurface: '#FFFFFF',
  bgSurfaceTranslucent: 'rgba(255, 255, 255, 0.75)', // Figma TabBar — 반투명 표면(블러 위)
  bgMuted: '#F2F4F7',
  overlayWhite16: 'rgba(255, 255, 255, 0.16)', // Figma overlay/100 — Chip size=day 등 dark 배경 위 오버레이

  // Semantic — UI 상태
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#FFCC00',
  error: '#EF4444',
  errorLight: '#FEE2E2',

  // Semantic — 손익 상태 (흑자=Primary, 적자=Gray900 — design-system §5)
  // loss는 빨강 아닌 다크 네이비: "Encourage, Not Pressure" — 압박이 아닌 사실 전달
  profit: '#6675FF',
  profitLight: '#EEF1FF',
  loss: '#272E3E',
  lossLight: '#F2F2F7',

  // Neutral (Figma gray 스케일: 800/600/500/400/300/200/00)
  gray800: '#272E3E',
  gray600: '#6B7280',
  gray500: '#999999',
  gray400: '#C0C3CF',
  gray300: '#E7E9F1',
  gray200: '#F2F4F7',
  white: '#FFFFFF',

  // Coach banner — "운동" 강조 (코치 배너 전용, 인디고 위 노란 포인트)
  coachAccent: '#FFF700',

  // Diet — 매크로·끼니 구분 틴트 (diet.tsx 전용)
  tintOrange: '#F5A623',   // 단백질·아침·간식
  tintYellow: '#F2B807',   // 탄수화물·점심
  tintPurple: '#7C6CF0',   // 저녁
  tintIndigo: '#8E9BFF',   // 칼로리 그래프 그라디언트

  // Line / Border
  lineDefault: 'rgba(0, 0, 0, 0.07)',
  lineStrong: 'rgba(0, 0, 0, 0.15)',
  linePrimary: '#6675FF',
  borderStrong: '#6B7280', // Figma border/strong — 아이콘 stroke, 강조 라인
  iconPrimary: '#C0C3CF', // Figma icon/primary — 비활성/기본 아이콘 색
} as const;

// 기존 ThemedText/ThemedView 호환용 시맨틱 키 (라이트 전용).
const lightTheme = {
  text: Palette.gray800,
  textSecondary: Palette.gray600,
  background: Palette.bgBase,
  backgroundElement: Palette.bgSurface, // 카드/모달 표면
  backgroundSelected: Palette.gray200,
} as const;

export const Colors = {
  light: lightTheme,
  dark: lightTheme, // 라이트 전용: 다크도 라이트로 매핑
} as const;

export type ThemeColor = keyof typeof Colors.light;

// ── 5. 타이포그래피 ───────────────────────────────────────
// Pretendard. 자간 -2.5% = -0.025 * fontSize (RN은 px 단위).
export const FontFamily = {
  regular: 'Pretendard',
  medium: 'PretendardMedium',
  semibold: 'PretendardSemiBold',
  bold: 'PretendardBold',
} as const;

type TypeToken = Pick<
  TextStyle,
  'fontSize' | 'lineHeight' | 'fontFamily' | 'letterSpacing' | 'fontWeight'
>;

export const Typography = {
  display: { fontSize: 32, lineHeight: 40, fontFamily: FontFamily.bold, letterSpacing: -0.96, fontWeight: '700' },
  display2: { fontSize: 28, lineHeight: 36, fontFamily: FontFamily.bold, letterSpacing: -0.7, fontWeight: '700' },
  h1: { fontSize: 24, lineHeight: 30, fontFamily: FontFamily.bold, letterSpacing: -0.6, fontWeight: '700' },
  h2: { fontSize: 20, lineHeight: 25, fontFamily: FontFamily.semibold, letterSpacing: -0.5, fontWeight: '600' },
  subtitle: { fontSize: 18, lineHeight: 23, fontFamily: FontFamily.semibold, letterSpacing: -0.45, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontFamily: FontFamily.medium, letterSpacing: -0.4, fontWeight: '500' },
  bodySemibold: { fontSize: 16, lineHeight: 24, fontFamily: FontFamily.semibold, letterSpacing: -0.4, fontWeight: '600' },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontFamily: FontFamily.medium, letterSpacing: -0.4, fontWeight: '500' }, // body와 동일 — alias
  // Figma 명명 기준(Token Documentation — Typography): 14px=Label, 12px=Caption.
  label: { fontSize: 14, lineHeight: 21, fontFamily: FontFamily.medium, letterSpacing: -0.35, fontWeight: '500' },
  labelBold: { fontSize: 14, lineHeight: 21, fontFamily: FontFamily.semibold, letterSpacing: -0.35, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 18, fontFamily: FontFamily.medium, letterSpacing: -0.3, fontWeight: '500' },
} as const satisfies Record<string, TypeToken>;

export const Fonts = Platform.select({
  ios: { sans: FontFamily.regular, serif: 'ui-serif', rounded: FontFamily.regular, mono: 'ui-monospace' },
  default: { sans: FontFamily.regular, serif: 'serif', rounded: FontFamily.regular, mono: 'monospace' },
  web: { sans: FontFamily.regular, serif: 'var(--font-serif)', rounded: FontFamily.regular, mono: 'var(--font-mono)' },
});

// ── 6. 스페이싱 (8pt grid) ────────────────────────────────
// 디자인 토큰. 기존 코드 호환을 위해 half/one/two/three/four/five/six 별칭 유지.
export const Spacing = {
  xs: 4,
  sm: 8,
  ms: 10,
  m: 12,
  md: 16,
  card: 20,
  lg: 24,
  xl: 32,
  xxl: 44,
  'screen-x': 20,
  // legacy aliases (점진 마이그레이션)
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** 전 화면 공통 좌우 여백 */
export const ScreenPadding = 20;

// ── 7. Border Radius ──────────────────────────────────────
export const Radius = {
  small: 8,
  button: 12,
  card: 20,
  modal: 20,
  full: 100,
} as const;

// ── 8. Elevation ──────────────────────────────────────────
// 네이티브 shadow* + web boxShadow 동시 제공.
export const Elevation: Record<'level1' | 'level2' | 'sticky', ViewStyle> = {
  // Level 1 · Card — 회원권·기록·추천 카드
  level1: Platform.select({
    web: { boxShadow: '0 2px 12px rgba(17,24,39,0.04)' } as ViewStyle,
    default: {
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 2,
    },
  }) as ViewStyle,
  // Level 2 · Tab Bar — 바텀 탭바
  level2: Platform.select({
    web: { boxShadow: '0 2px 12px rgba(34,44,67,0.08)' } as ViewStyle,
    default: {
      shadowColor: '#222C43',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  }) as ViewStyle,
  // Sticky — 스티키 바·시트 상단 경계 (위 방향)
  sticky: Platform.select({
    web: { boxShadow: '0 -2px 12px rgba(17,24,39,0.08)' } as ViewStyle,
    default: {
      shadowColor: '#111827',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  }) as ViewStyle,
};

// 웹: 탭바가 position:absolute로 콘텐츠 위에 겹침 → 54px(바 높이) + 20px(플로팅 마진) 보정 필요
// 네이티브: 탭바가 flex layout 안에서 콘텐츠 아래에 위치 → 보정 불필요
export const BottomTabInset = Platform.select({ web: 74 }) ?? 0;
export const MaxContentWidth = 800;