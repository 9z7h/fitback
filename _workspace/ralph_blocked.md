## 항목 001 — SKIP (2026-07-27)
사유: src/app/diet.tsx의 DateStrip/CalendarModal 함수가 lint상 "정의됐지만 미사용"으로 나왔지만, 이 둘을 지우니 그 안에서만 쓰이던 DOW_KO(요일 배열), parseIso(날짜 파싱) 헬퍼가 새로 미사용 상태가 됨 — 원래 백로그 스코프(9개 명시 항목)를 벗어난 연쇄 삭제가 필요해짐.
diet.tsx는 사용자가 활발히 작업 중인 파일이라(최근 커밋 다수) 스코프 확장을 무인으로 판단하지 않고 되돌림. DATE_ITEM_W 상수를 삭제했다가 styles에서 여전히 참조 중인 걸 뒤늦게 발견 — 빌드 깨질 뻔함(간발의 차이로 diet.tsx git checkout으로 전체 원복해 안전 확보).
필요한 사람 결정: DateStrip/CalendarModal이 진짜 죽은 코드인지(달력/날짜스트립 UI를 다른 컴포넌트로 교체한 것인지), 아니면 곧 다시 연결할 예정인 스캐폴딩인지.
다음 조치: 항목 001 SKIP 유지, diet.tsx는 원상태(git checkout 완료). 백로그 002로 진행함.

## 항목 002 — SKIP (2026-07-27), 루프 전체 중단
사유: src/app/workout/session.tsx의 `overallProgress`(632라인)와 `widthPct`(752라인)는 실제로는 사용되고 있음 — 단, 주석 처리된(`{/* ... */}`) JSX 블록 안에서만. 특히 widthPct 쪽 주석에는 개발자가 직접 "파형 아래 얇은 진행바 — 일단 화면에서 숨김. 필요해지면 주석 해제." 라고 적어둠. 즉 lint의 "미사용" 판정은 맞지만, 실제로는 곧 복원할 의도적 보류 코드 — 삭제하면 향후 복원이 막힘.
파일을 아직 수정하지 않은 채 발견해서 diet.tsx 때처럼 원복할 필요는 없었음.

**설계 전제 재검토 필요**: fitback-ralph-backlog 스킬의 "lint 실패 기계적 수정 = 안전"이라는 분류가 이 코드베이스엔 안 맞을 수 있음 — "일단 숨김, 나중에 주석 해제" 패턴이 최소 2개 파일(diet.tsx, session.tsx)에서 발견됨. 무인 반복 전에 "unused var 삭제 전 그 심볼이 주석 블록 안에서 참조되는지" 체크를 백로그 안전기준에 추가하는 게 맞아 보임.

다음 조치: 루프 전체 취소(iteration 1에서 중단). 003~007(app-tabs.tsx, CoachChat.tsx, CheckInFlow.tsx, KakaoMap.web.tsx, WorkoutDateStrip.tsx)은 아직 미검토 — 사용자 확인 후 재개.
