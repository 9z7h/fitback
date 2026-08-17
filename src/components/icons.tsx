import { ArrowRight, ChevronLeft, ChevronRight, Menu } from 'lucide-react-native';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Palette, Radius } from '@/constants/theme';

type IconProps = {
  color: string;
  size?: number;
};

const STROKE = 2;

export function IconMenu({ color, size = 24 }: IconProps) {
  return <Menu size={size} color={color} strokeWidth={STROKE} />;
}

// Figma "Icons" 세트(949:219) — SVG 벡터 그대로 렌더(react-native-svg). 좌표/translate는
// Figma export 기준(24x24 뷰박스, bell만 28x28, infor만 16x16).
export function IconHome({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        transform="translate(0.976 2)"
        d="M11.688 0.201373C11.2914 -0.0671243 10.7586 -0.0671243 10.3619 0.201373L0.483535 6.88841C-0.0377917 7.24131 -0.15722 7.9589 0.221701 8.46163C0.574346 8.9295 1.23179 9.03892 1.71697 8.71049L11.0249 2.40962L20.333 8.7105C20.8182 9.03893 21.4756 8.92951 21.8283 8.46164C22.2072 7.9589 22.0878 7.2413 21.5664 6.88839L11.688 0.201373ZM19.6732 11.0122L11.688 5.60678C11.2914 5.33828 10.7586 5.33828 10.3619 5.60678L2.37682 11.0122C2.07705 11.2151 1.89913 11.5427 1.89913 11.8919V18.9189C1.89913 19.516 2.40985 20 3.03986 20H19.0101C19.6401 20 20.1508 19.516 20.1508 18.9189V11.8919C20.1508 11.5427 19.9729 11.2151 19.6732 11.0122Z"
        fill={color}
      />
    </Svg>
  );
}

export function IconFood({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        transform="translate(2 2)"
        d="M17.0021 18.0039C17.0021 18.5343 16.7912 19.0429 16.4162 19.418C16.0411 19.7929 15.5325 20.0039 15.0021 20.0039H5.00212C4.47181 20.0038 3.96306 19.793 3.58806 19.418C3.21312 19.0429 3.00216 18.5342 3.00212 18.0039V16.0039H17.0021V18.0039ZM10.0021 0C11.1749 0 12.3224 0.343379 13.3019 0.988281C14.087 1.50516 14.7366 2.19776 15.2023 3.00684C16.1324 3.04319 17.0389 3.33888 17.8166 3.86719C18.7914 4.52951 19.5015 5.51486 19.8205 6.64941C20.1394 7.7839 20.0475 8.9951 19.5607 10.0684C19.0741 11.1411 18.2233 12.0062 17.1603 12.5137L17.1613 12.5146C17.0916 12.5481 17.0433 12.5923 17.0187 12.626C16.9976 12.655 17.002 12.6635 17.0021 12.6543V14.0039H3.00212V12.6533C3.00225 12.6635 3.00708 12.6556 2.98552 12.626C2.96094 12.5923 2.91312 12.5485 2.84392 12.5146L2.64763 12.415C1.67673 11.8973 0.901259 11.0724 0.445483 10.0664C-0.0405279 8.99356 -0.132118 7.78324 0.186694 6.64941C0.505559 5.5156 1.21471 4.53045 2.18865 3.86816C2.96578 3.33981 3.87231 3.04375 4.80193 3.00684C5.26757 2.19782 5.91738 1.50516 6.70232 0.988281C7.68179 0.343391 8.82942 6.28662e-05 10.0021 0Z"
        fill={color}
      />
    </Svg>
  );
}

export function IconFit({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        transform="translate(5.5 3)"
        d="M1 2.33333V15.6667C1 16.0203 1.10536 16.3594 1.29289 16.6095C1.48043 16.8595 1.73478 17 2 17H3C3.26522 17 3.51957 16.8595 3.70711 16.6095C3.89464 16.3594 4 16.0203 4 15.6667V2.33333C4 1.97971 3.89464 1.64057 3.70711 1.39052C3.51957 1.14048 3.26522 1 3 1H2C1.73478 1 1.48043 1.14048 1.29289 1.39052C1.10536 1.64057 1 1.97971 1 2.33333Z"
        fill={color}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path transform="translate(8.5 11)" d="M1 1H6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        transform="translate(13.5 3)"
        d="M1 2.33333V15.6667C1 16.0203 1.10536 16.3594 1.29289 16.6095C1.48043 16.8595 1.73478 17 2 17H3C3.26522 17 3.51957 16.8595 3.70711 16.6095C3.89464 16.3594 4 16.0203 4 15.6667V2.33333C4 1.97971 3.89464 1.64057 3.70711 1.39052C3.51957 1.14048 3.26522 1 3 1H2C1.73478 1 1.48043 1.14048 1.29289 1.39052C1.10536 1.64057 1 1.97971 1 2.33333Z"
        fill={color}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path transform="translate(0.5 5.5)" d="M1.5 1.5V11.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path transform="translate(20.5 5.5)" d="M1.5 1.5V11.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function IconCalendar({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path transform="translate(7 2)" d="M1 1V4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path transform="translate(15 2)" d="M1 1V4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        transform="translate(3 4.5)"
        d="M18 13.8887C18 15.4209 16.6617 16.4998 15.2227 16.5H2.77734C1.33828 16.4998 0 15.4209 0 13.8887V6.5H18V13.8887ZM15.2227 0C16.6617 0.000216788 18 1.07906 18 2.61133V4.5H0V2.61133C0 1.07906 1.33828 0.000216847 2.77734 0H15.2227Z"
        fill={color}
      />
    </Svg>
  );
}

export function IconCard({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        transform="translate(2 4)"
        d="M20 13.7139C20 14.9762 19.1046 16 18 16H2C0.89543 16 0 14.9762 0 13.7139V7H20V13.7139ZM18 0C19.1046 0 20 1.02377 20 2.28613V5H0V2.28613C0 1.02377 0.89543 0 2 0H18Z"
        fill={color}
      />
    </Svg>
  );
}

export function IconCamera({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        transform="translate(2 3)"
        d="M12.4336 0C13.136 0 13.7869 0.36852 14.1484 0.9707L14.9209 2.25684C15.0113 2.40744 15.174 2.5 15.3496 2.5H17C18.6569 2.5 20 3.84315 20 5.5V15C20 16.6569 18.6569 18 17 18H3C1.34315 18 0 16.6569 0 15V5.5C0 3.84315 1.34315 2.5 3 2.5H4.65039C4.82602 2.5 4.98874 2.40744 5.0791 2.25684L5.85156 0.9707C6.21306 0.36852 6.86403 0 7.56641 0H12.4336ZM10 5.5C7.51472 5.5 5.5 7.5147 5.5 10C5.5 12.4853 7.51472 14.5 10 14.5C12.4853 14.5 14.5 12.4853 14.5 10C14.5 7.5147 12.4853 5.5 10 5.5ZM10 7.5C11.3807 7.5 12.5 8.6193 12.5 10C12.5 11.3807 11.3807 12.5 10 12.5C8.6193 12.5 7.5 11.3807 7.5 10C7.5 8.6193 8.6193 7.5 10 7.5Z"
        fill={color}
      />
    </Svg>
  );
}

export function IconPlus({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path transform="translate(4 11)" d="M1 1H15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path transform="translate(11 4)" d="M1 1V15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconSearch({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path transform="translate(14.5 14.5)" d="M6.49997 6.5L1 1" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        transform="translate(2 2)"
        d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconLocation({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        transform="translate(3 1)"
        d="M9 0C11.3869 0 13.6764 0.947915 15.3643 2.63574C17.0521 4.32357 18 6.61305 18 9C18 11.8337 16.4474 14.603 14.7939 16.7754C13.1175 18.978 11.2102 20.7308 10.2549 21.5557C10.2379 21.5704 10.2201 21.5851 10.2021 21.5986C9.85562 21.8592 9.43356 22 9 22C8.56644 22 8.14438 21.8592 7.79785 21.5986C7.77987 21.5851 7.76215 21.5704 7.74512 21.5557C6.78983 20.7308 4.88248 18.978 3.20605 16.7754C1.55262 14.603 0 11.8337 0 9C0 6.61305 0.947915 4.32357 2.63574 2.63574C4.32357 0.947915 6.61305 0 9 0ZM9 6C7.34315 6 6 7.34315 6 9C6 10.6569 7.34315 12 9 12C10.6569 12 12 10.6569 12 9C12 7.34315 10.6569 6 9 6Z"
        fill={color}
      />
    </Svg>
  );
}

export function IconMore({ color, size = 24 }: IconProps) {
  const dot = 'M1.75 2.75C2.30228 2.75 2.75 2.30228 2.75 1.75C2.75 1.19772 2.30228 0.75 1.75 0.75C1.19772 0.75 0.75 1.19772 0.75 1.75C0.75 2.30228 1.19772 2.75 1.75 2.75Z';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path transform="translate(10.25 3.25)" d={dot} fill={color} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path transform="translate(10.25 10.25)" d={dot} fill={color} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path transform="translate(10.25 17.25)" d={dot} fill={color} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconInfo({ color, size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        transform="translate(1 1)"
        d="M7 14C3.134 14 0 10.866 0 7C0 3.134 3.134 0 7 0C10.866 0 14 3.134 14 7C14 10.866 10.866 14 7 14ZM6.8 6.3C6.52386 6.3 6.3 6.52386 6.3 6.8V10C6.3 10.2761 6.52386 10.5 6.8 10.5H7.2C7.47614 10.5 7.7 10.2761 7.7 10V6.8C7.7 6.52386 7.47614 6.3 7.2 6.3H6.8ZM6.8 3.5C6.52386 3.5 6.3 3.72386 6.3 4V4.4C6.3 4.67614 6.52386 4.9 6.8 4.9H7.2C7.47614 4.9 7.7 4.67614 7.7 4.4V4C7.7 3.72386 7.47614 3.5 7.2 3.5H6.8Z"
        fill={color}
      />
    </Svg>
  );
}

export function IconBell({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        transform="translate(3 1)"
        d="M9.23233 1.66947C8.76349 2.09812 8.5001 2.67951 8.5001 3.28571C7.06458 3.90632 5.84084 4.87237 4.96003 6.08034C4.07922 7.28831 3.57455 8.69266 3.5001 10.1429V13.5714C3.40603 14.282 3.1308 14.9624 2.69658 15.5579C2.26236 16.1534 1.68127 16.6473 1.0001 17H21.0001C20.3189 16.6473 19.7378 16.1534 19.3036 15.5579C18.8694 14.9624 18.5942 14.282 18.5001 13.5714V10.1429C18.4256 8.69266 17.921 7.28831 17.0402 6.08034C16.1593 4.87237 14.9356 3.90632 13.5001 3.28571C13.5001 2.67951 13.2367 2.09812 12.7679 1.66947C12.299 1.24082 11.6631 1 11.0001 1C10.3371 1 9.70117 1.24082 9.23233 1.66947Z"
        fill={color}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        transform="translate(10 22.08)"
        d="M7 1V1.25C7 1.9577 6.70065 2.65045 6.14453 3.17188C5.58614 3.69537 4.81573 4 4 4C3.18427 4 2.41386 3.69537 1.85547 3.17188C1.29935 2.65045 1 1.9577 1 1.25V1H7Z"
        fill={color}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconClose({
  color,
  size = 24,
  variant = 'line',
}: IconProps & { variant?: 'fill' | 'line' }) {
  if (variant === 'fill') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          transform="translate(2 2)"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20ZM10 8.5858L7.87867 6.46447C7.48815 6.07394 6.85499 6.07394 6.46446 6.46446C6.07394 6.85499 6.07394 7.48815 6.46447 7.87867L8.5858 10L6.46447 12.1213C6.07395 12.5118 6.07395 13.145 6.46447 13.5355C6.85499 13.926 7.48815 13.926 7.87867 13.5355L10 11.4142L12.1213 13.5355C12.5118 13.926 13.145 13.926 13.5355 13.5355C13.926 13.145 13.926 12.5118 13.5355 12.1213L11.4142 10L13.5355 7.87867C13.926 7.48815 13.926 6.85499 13.5355 6.46447C13.145 6.07395 12.5118 6.07395 12.1213 6.46447L10 8.5858Z"
          fill={color}
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path transform="translate(5 5)" d="M13 1L1 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path transform="translate(5 5)" d="M1 1L13 13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconPlusCircle({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM11 11H8C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13H11V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V13H16C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11H13V8C13 7.44772 12.5523 7 12 7C11.4477 7 11 7.44772 11 8V11Z"
        fill={color}
      />
    </Svg>
  );
}

export function IconArrowRight({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path transform="translate(8 5)" d="M1 13L7 7L1 1" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconArrowUp({ color, size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path transform="translate(4 4)" d="M1 8L8 1L15 8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path transform="translate(11 4)" d="M1 15V1" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconArrowChevron({
  color = Palette.gray500,
  size = 20,
  direction = 'right',
}: {
  color?: string;
  size?: number;
  direction?: 'left' | 'right';
}) {
  const Chevron = direction === 'left' ? ChevronLeft : ChevronRight;
  return <Chevron size={size} color={color} strokeWidth={STROKE} />;
}

export function IconArrowCircle({
  size = 36,
  bgColor = 'rgba(255,255,255,0.2)',
}: {
  size?: number;
  bgColor?: string;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Radius.full,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <ArrowRight size={size / 2} color={Palette.white} strokeWidth={STROKE} />
    </View>
  );
}

// Figma "Ai/Up"(1454:2528) — 채워진 위쪽 삼각형(상승 표시). 16x16 프레임 안에 벡터가
// 중앙 정렬되지 않고 좌상단으로 치우쳐 있어(insets: 6.25%/6.7%/18.75%/6.7% + 12.5%/7.91%/0/7.91%
// 중첩), translate로 그 위치를 그대로 재현한다.
export function IconAiUp({ color = Palette.secondary, size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        transform="translate(2.168 2.5)"
        d="M4.53333 0.75C5.11068 -0.25 6.55405 -0.25 7.1314 0.75L11.4615 8.25C12.0389 9.25 11.3172 10.5 10.1625 10.5H1.50224C0.347536 10.5 -0.37415 9.25 0.2032 8.25L4.53333 0.75Z"
        fill={color}
      />
    </Svg>
  );
}
