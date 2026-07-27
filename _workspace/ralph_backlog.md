# Ralph Backlog — 2026-07-27 생성
## 목표: 기계적 lint 위반(no-unused-vars, unused eslint-disable) 정리
## 안전기준 확인: 신규 정책 판단·DB 스키마 설계·디자인 주관 판단 없음 (사용자 사전확인 완료). 워킹트리 클린 확인 후 시작.

- [~] 001 (SKIPPED) | LINT | src/app/diet.tsx | 미사용 항목 제거 — DateStrip/CalendarModal 삭제 시 DOW_KO/parseIso가 연쇄로 새 미사용 코드가 됨(당초 스코프 밖). 사람 판단 필요해 되돌림(diet.tsx git checkout으로 원복). _workspace/ralph_blocked.md 참조.
- [~] 002 (SKIPPED) | LINT | src/app/workout/session.tsx | overallProgress/widthPct가 "필요해지면 주석 해제" 표시된 의도적 보류 JSX에서만 쓰임 — 삭제 시 향후 복원 불가. theme(145라인)은 미확인. 루프 전체 중단, 사람 판단 필요. _workspace/ralph_blocked.md 참조.
- [x] 003 | LINT | src/components/app-tabs.tsx | TAB_ROUTES 제거 ✅ 2026-07-27, lint 클린 확인
- [x] 004 | LINT | src/features/coach/CoachChat.tsx | isAnalyzingPhoto(구조분해 제거, setter 유지)/e(옵셔널 catch)/isLast 제거 ✅ 2026-07-27, lint 클린 확인
- [x] 005 | LINT | src/features/membership/CheckInFlow.tsx | TextInput import 제거 ✅ 2026-07-27, lint 클린 확인
- [x] 006 | LINT | src/features/membership/KakaoMap.web.tsx | unused eslint-disable 5건 제거 ✅ 2026-07-27, lint 클린 확인
- [x] 007 | LINT | src/features/workout/WorkoutDateStrip.tsx | View import 제거 ✅ 2026-07-27, lint 클린 확인
- [x] 008 | FINAL | 2026-07-27 tsc --noEmit 클린, lint 120→109(에러 19 그대로, 경고 11건 감소, 정확히 003~007 대상), check-tokens.sh 결과는 003~007 파일의 기존(미수정) 코드라 회귀 아님
