import type { Meta, StoryObj } from '@storybook/react';

import { Palette, Radius, Spacing, Typography } from './theme';

const meta = {
  title: 'Foundation/Colors',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Palette.* 키를 theme.ts 주석 섹션 기준으로 그룹핑. 값은 항상 Palette에서 직접 읽으므로
// 여기 값을 바꿔도 반영 안 됨 — 색을 바꾸려면 theme.ts를 고칠 것. 새 키 추가 시 이 목록에
// 넣지 않으면 "미분류" 섹션에 자동으로 잡힌다(누락 방지).
const COLOR_GROUPS: { title: string; keys: (keyof typeof Palette)[] }[] = [
  { title: 'Primary & Secondary', keys: ['primary', 'primaryHover', 'primaryPressed', 'primaryLight', 'secondary', 'tertiary'] },
  { title: 'Background', keys: ['bgBase', 'bgSurface', 'bgMuted'] },
  { title: 'Semantic — UI 상태', keys: ['success', 'successLight', 'warning', 'error', 'errorLight'] },
  { title: 'Semantic — 손익 상태', keys: ['profit', 'profitLight', 'loss', 'lossLight'] },
  { title: 'Neutral', keys: ['gray900', 'gray800', 'gray700', 'gray500', 'gray400', 'gray300', 'gray200', 'gray100', 'gray50', 'white'] },
  { title: 'Coach', keys: ['coachAccent'] },
  { title: 'Diet', keys: ['tintOrange', 'tintYellow', 'tintPurple', 'tintIndigo'] },
  { title: 'Line / Border', keys: ['lineDefault', 'lineStrong', 'linePrimary', 'borderStrong', 'iconPrimary'] },
];

const groupedKeys = new Set(COLOR_GROUPS.flatMap((g) => g.keys));
const uncategorized = (Object.keys(Palette) as (keyof typeof Palette)[]).filter((k) => !groupedKeys.has(k));
const allGroups = uncategorized.length ? [...COLOR_GROUPS, { title: '미분류(story 그룹핑 누락)', keys: uncategorized }] : COLOR_GROUPS;

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div style={{ width: 176 }}>
      <div
        style={{
          width: '100%',
          height: 88,
          borderRadius: 8,
          border: '1px solid rgba(0,0,0,0.1)',
          background: value,
        }}
      />
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>Palette.{name}</div>
      <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

function ColorGroups({ groups }: { groups: typeof COLOR_GROUPS }) {
  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      {groups.map((g) => (
        <div key={g.title} style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>{g.title}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {g.keys.map((k) => (
              <Swatch key={k} name={String(k)} value={Palette[k]} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export const AllColors: Story = {
  render: () => <ColorGroups groups={allGroups} />,
};

export const PrimaryAndSecondary: Story = {
  render: () => <ColorGroups groups={[allGroups[0]]} />,
};

export const Background: Story = {
  render: () => <ColorGroups groups={[allGroups[1]]} />,
};

export const SemanticUiState: Story = {
  render: () => <ColorGroups groups={[allGroups[2]]} />,
};

export const SemanticRoi: Story = {
  render: () => <ColorGroups groups={[allGroups[3]]} />,
};

export const Neutral: Story = {
  render: () => <ColorGroups groups={[allGroups[4]]} />,
};

export const LineAndBorder: Story = {
  render: () => <ColorGroups groups={[allGroups[7]]} />,
};

// ── Spacing ─────────────────────────────────────────────
const SPACING_ENTRIES = (Object.entries(Spacing) as [string, number][]).sort((a, b) => a[1] - b[1]);
const SPACING_BOX_WIDTH = 140;
const SPACING_MAX = Math.max(...SPACING_ENTRIES.map(([, px]) => px));

export const SpacingScale: Story = {
  parameters: {
    docs: { description: { story: `Spacing.${SPACING_ENTRIES[0][0]} ~ Spacing.${SPACING_ENTRIES[SPACING_ENTRIES.length - 1][0]} 전체 스케일 — 변수명 + 박스 + px 값` } },
  },
  render: () => (
    <div style={{ fontFamily: 'sans-serif' }}>
      {SPACING_ENTRIES.map(([name, px]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{ width: 140, fontSize: 14, fontFamily: 'monospace' }}>Spacing.{name}</div>
          <div
            style={{
              width: SPACING_BOX_WIDTH,
              height: 24,
              border: '1px dashed #D1D5DB',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: (px / SPACING_MAX) * SPACING_BOX_WIDTH,
                height: 24,
                background: Palette.primary,
                borderRadius: 4,
              }}
            />
          </div>
          <div style={{ fontSize: 14, color: '#6B7280' }}>{px}px</div>
        </div>
      ))}
    </div>
  ),
};

// ── Radius ──────────────────────────────────────────────
export const RadiusScale: Story = {
  render: () => (
    <div style={{ fontFamily: 'sans-serif', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {(Object.entries(Radius) as [string, number][]).map(([name, px]) => (
        <div key={name} style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: Palette.primaryLight,
              border: `1px solid ${Palette.primary}`,
              borderRadius: px,
            }}
          />
          <div style={{ marginTop: 8, fontSize: 13, fontFamily: 'monospace' }}>Radius.{name}</div>
          <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{px}px</div>
        </div>
      ))}
    </div>
  ),
};

// ── Typography ──────────────────────────────────────────
export const TypeScale: Story = {
  render: () => (
    <div style={{ fontFamily: 'sans-serif' }}>
      {(Object.entries(Typography) as [string, (typeof Typography)[keyof typeof Typography]][]).map(([name, style]) => (
        <div key={name} style={{ marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace', marginBottom: 4 }}>
            Typography.{name} — {style.fontSize}px / {style.lineHeight}px / {style.fontWeight} / ls {style.letterSpacing}
          </div>
          <div
            style={{
              fontSize: style.fontSize,
              lineHeight: `${style.lineHeight}px`,
              fontWeight: style.fontWeight,
              letterSpacing: style.letterSpacing,
            }}
          >
            회당 실비용 ₩12,500
          </div>
        </div>
      ))}
    </div>
  ),
};
