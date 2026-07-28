# FitBack 작업 프로세스 (내부용)

루트 `CLAUDE.md`의 카파시 4원칙·하네스 규칙을 실행 절차로 구체화한 문서. 충돌 시 루트 `CLAUDE.md`가 우선.

## 7단계 작업 프로세스

1. **요청 분석** — 범위(FE/BE/양쪽), 모호한 지점 식별. 모호하면 코드 보기 전에 질문(Think Before Coding).
2. **기존 자산 확인** — 새로 만들기 전 `src/constants/theme.ts` 토큰, `src/components/ui.tsx` 공용 컴포넌트, 루트 `CLAUDE.md`의 코드 컨벤션·도메인 요약(`dashboard.ts`, `useCoach.ts` 등)부터 확인.
3. **하네스 트리거 판단** — 기능 추가·버그 수정·리팩토링이면 `fitback-harness` 스킬로 FE/BE 에이전트 범위 판단. 단순 질문·설명이면 직접 응답.
4. **구현** — 요청과 1:1 대응하는 줄만 변경(Surgical Changes). 범위 밖 리팩토링·포맷 변경·요청 안 한 추상화 금지.
5. **자체 검증** — 변경 후 최소 `npx tsc --noEmit` + `npm run lint`. UI 변경은 웹에서 실제 렌더 확인. "완료" 선언 전 검증 결과 먼저 확인(Goal-Driven Execution).
6. **QA/디자인 체크** — FE/BE 작업 완료 시 `fitback-qa-checklist`(토큰 위반·손익 컬러·FE-BE 경계면)로 점검. 화면 변경 시 `fitback-design-review` 병행.
7. **사용자 보고 및 확인** — 변경 요약 + 검증 결과 보고 후 다음 단계(커밋 등) 승인 받음. 승인 전 커밋/푸시 금지.

## 금지사항

- 색·여백·radius 하드코딩 (`Palette.*`/`Spacing.*`/`Radius.*` 미사용) 금지.
- variant마다 컴포넌트 쪼개기 금지 — 단일 컴포넌트 + props로 처리.
- 체크인 지오펜스(100m) 없는 자기신고로 ROI/출석 기록 변경 금지.
- 요청 범위 밖 리팩토링, 포맷 변경, 사용하지도 않을 추상화 추가 금지.
- 검증(`tsc`/`lint`/실행 확인) 없이 "완료" 또는 "작동함" 단정 금지.
- 사용자 확인 없는 자동 커밋·푸시·강제 삭제(`git reset --hard`, `git push --force` 등) 금지.
- Figma 구현 시 원본 텍스트·variant 임의 추가·변경 금지.
- 미사용 여부 확인 없이 파일 삭제 금지 — 삭제 전 반드시 참조(grep) 확인.
