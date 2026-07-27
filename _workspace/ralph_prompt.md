# Ralph 반복 지시 (매 iteration 동일하게 재주입됨)

`_workspace/ralph_backlog.md`를 읽어라. 미완료(`- [ ]`) 항목 중 번호가 가장 빠른 것 하나를 골라 처리한다.

## 처리 절차

1. 항목이 LINT 태그면 명시된 파일에서 설명된 미사용 import/변수/eslint-disable 라인을 제거한다. 다른 코드는 건드리지 않는다.
2. 수정 후 그 파일에 한해 `npx eslint <파일경로>`로 클린한지 확인한다.
3. 모호함 발생 시(사람에게 답을 받을 수 없는 상황): 그 항목을 `_workspace/ralph_backlog.md`에서 `- [~] (SKIPPED)`로 바꾸고, `_workspace/ralph_blocked.md`에 항목 번호와 이유를 append한 뒤 다음 항목으로 넘어간다. 추측으로 답을 만들지 않는다. 이미 SKIP된 항목은 다시 시도하지 않는다.
4. 성공하면 `_workspace/ralph_backlog.md`에서 해당 라인만 `- [x] ... ✅ <시각>`으로 치환한다(다른 라인은 그대로).
5. 항목 번호가 008(FINAL)이면 `npm run lint` 전체와 `.claude/skills/fitback-qa-checklist/scripts/check-tokens.sh`를 재실행해 회귀 없는지 확인 후 문제 없으면 008도 완료 처리한다.
6. 처리 후 `git add -A`, `git commit -m "ralph: <항목요약>"`로 로컬 커밋한다. push는 하지 않는다.

## 완료 조건

`_workspace/ralph_backlog.md`의 모든 항목이 완료 또는 스킵 상태이고, 008 FINAL에서 실행한 lint와 check-tokens.sh 결과가 깨끗할 때에만 아래를 정확히 출력하라:

<promise>RALPH BACKLOG CLEAR</promise>

하나라도 미달이면 절대 출력하지 말고 다음 미완료 항목을 계속 처리하라. 거짓 promise를 출력하지 마라.
