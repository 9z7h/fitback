---
name: fitback-design-tokens
description: FitBack 화면이나 컴포넌트를 만들고 수정할 때 사용. theme.ts 토큰, ThemedText, Lucide, ROI 컬러 규칙을 강제한다.
---

# FitBack 디자인 토큰 규칙

`docs/design-system.md`와 `src/constants/theme.ts`가 유일한 기준이다. 문서에 없는 값이 필요하면 임의로 만들지 말고 사용자에게 질문한다.

- 색은 `Palette.*`, 여백은 `Spacing.*`, radius는 `Radius.*`, 그림자는 `Elevation.*`만 사용한다.
- 신규 코드에서 레거시 `Spacing.half/one/two/three` 별칭을 사용하지 않는다.
- RN 기본 `Text` 대신 `ThemedText`, 아이콘은 `lucide-react-native`를 사용한다.
- `Palette.profit/loss`는 ROI 손익에만 사용하며 아이콘, 텍스트 라벨, 색을 함께 제공한다.
- `dashboard.ts`의 `RISK_COLORS`와 `RISK_META`를 재사용한다.
- Figma 원본 텍스트와 variant를 임의로 바꾸지 않는다.
- variant별 컴포넌트를 만들지 않고 단일 컴포넌트와 props로 표현한다.
- 컴포넌트는 `width: 100%` 또는 `flex: 1`을 사용하고 바깥 여백은 부모가 제공한다.

변경 후 다음 후보를 확인하고 실제 위반인지 맥락을 검토한다.

```bash
git diff --name-only -- '*.tsx' '*.ts' | xargs grep -nE "#[0-9A-Fa-f]{3,8}" 2>/dev/null
```
