---
name: fitback-ralph-backlog
description: ralph-loop 플러그인으로 FitBack의 저위험·확정된 백로그(반복 패턴 구현, lint 수정, fitback-qa 위반 수정)를 무인 반복 처리할 때 사용. "백로그 루프 돌려", "ralph로 처리해줘", "무인으로 반복 처리", "밤새 돌려줘" 요청에서 트리거. DB 스키마·정책 재정의·디자인 주관 판단처럼 사람 결정이 필요한 작업에는 트리거하지 않는다 — 그런 요청이면 fitback-harness로 안내한다.
---

# FitBack × ralph-loop 무인 백로그 처리

## Why

`ralph-loop` 플러그인(Stop 훅으로 동일 프롬프트를 반복 주입하는 무인 루프)은 사람이 응답할 방법이 없다. 반면 `fitback-frontend`/`fitback-backend`는 모호하면 질문을 반환하도록 설계돼 있고, `fitback-harness`의 Phase 4는 사람 확인을 원칙으로 한다. 이 스킬은 그 둘을 억지로 합치지 않고, **"이미 결정된 것만 자동화한다"**는 원칙으로 안전한 접점만 만든다. `/ralph-loop`를 실행하는 행위 자체가 사람의 사전 승인이며, 이 스킬은 그 사전 승인이 실제로 안전한 범위에서만 이뤄지도록 체크리스트·포맷·프롬프트를 표준화한다.

## Step 0: 활성 상태 확인

`ralph-loop` 플러그인이 이 프로젝트에서 활성인지 `/plugin`으로 먼저 확인한다. 비활성이면 활성화 여부를 사용자에게 확인받은 뒤 진행한다 — 추측으로 `.Codex/settings.json`을 먼저 고치지 않는다.

## Step 1: 백로그 항목 안전기준 판정

사용자가 제시한 작업 목록을 아래 기준으로 분류한다.

**넣어도 되는 항목** (판단 없이 복제·적용·기계적 검증만 하면 되는 것):
- 이미 확정된 패턴의 반복 구현 (예: `session` 타입에 이미 만든 UI 패턴을 `class`/`free`에도 동일 적용)
- lint/typecheck 실패의 기계적 수정
- `fitback-qa-checklist`의 `check-tokens.sh`가 이미 확정 판정한 위반 수정
- 기존 로직에 대한 테스트 보강

**절대 넣으면 안 되는 항목** (사람 판단이 본질인 것):
- DB 스키마/RLS 정책 설계 판단
- 출석 검증 규칙처럼 AGENTS.md에 "확정"으로 명시된 정책 자체의 재정의
- `fitback-design`의 주관적 제안을 반영할지 결정하는 것
- Figma/스펙 없는 신규 화면 디자인
- FE-BE 계약(응답 shape)의 최초 확정
- 프로덕션 디버깅

금지 항목이 하나라도 섞여 있으면 그 항목만 제외하고 사용자에게 알린다 — 전체 요청을 거부하지 않는다.

## Step 2: 백로그 파일 작성

`_workspace/ralph_backlog.md`를 아래 포맷으로 생성한다:

```markdown
# Ralph Backlog — <날짜> 생성
## 목표: <한 줄 요약>
## 안전기준 확인: 신규 정책 판단·DB 스키마 설계·디자인 주관 판단 없음 (사용자 사전확인 완료)

- [ ] 001 | FE | <파일경로> | <완료조건을 포함한 설명>
- [ ] 002 | QA-FIX | <파일경로:라인> | <check-tokens.sh가 잡은 위반 내용>
- [ ] 00N | FINAL | (자동) 전체 lint + fitback-qa 재실행 최종 클린 확인
```

- 범위 태그: `FE`/`BE`/`QA-FIX`/`LINT`/`FINAL`.
- 마지막 항목은 항상 `FINAL` — 개별 항목이 다 끝나도 상호작용 회귀가 없는지 전체 스윕 1회를 강제한다.
- 완료 시 해당 라인만 `- [ ]` → `- [x] ... ✅ <시각>, qa: 위반없음`으로 수술적으로 치환한다(다른 라인은 건드리지 않는다).

## Step 3: 자동 게이트 정의 (Phase 4 사전승인의 실체)

- **자동 게이트로 승격 가능** (객관적 이진 판정만): `fitback-qa`가 "위반 없음" 판정 — 단 "확인 필요"로 표시된 항목이 하나라도 있으면 게이트 실패로 취급한다(자동 통과 금지). `npm run lint` exit code 0.
- **자동 반영 절대 금지, 로그만**: `fitback-design`의 결과는 매 반복 병렬 실행하되 `_workspace/ralph_design_notes.md`에 append만 하고 코드에는 반영하지 않는다.
- **커밋/푸시**: 로컬 커밋까지만 사전승인 대상. **push는 이 모드에서도 예외 없이 사람이 직접 실행**한다.

## Step 4: 모호함 탈출 규칙 (프롬프트에 고정 텍스트로 삽입)

ralph는 매 반복 동일 프롬프트를 재주입하므로, 이 규칙이 없으면 답할 수 없는 질문이 반복돼 같은 항목에서 영원히 맴돈다. `/ralph-loop` 프롬프트에 반드시 포함한다:

```
[에스케이프 규칙 — 반드시 준수]
fitback-frontend 또는 fitback-backend 서브에이전트가 모호함을 이유로 질문을
반환하면, 너는 그 질문에 답할 수 없다(사람이 없다). 절대로 추측해서 답을
만들지 말고:
1. 해당 백로그 항목을 `_workspace/ralph_backlog.md`에서 `- [~] (SKIPPED)`로 표시한다.
2. `_workspace/ralph_blocked.md`에 항목 번호·질문 원문·필요한 사람 결정을 append한다.
3. 그 항목은 더 이상 재시도하지 않고 다음 미완료(`- [ ]`) 항목으로 넘어간다.
4. 같은 항목에 이미 SKIP 기록이 있으면 다시 시도하지 않는다.
```

## Step 5: max-iterations / completion-promise 산정

- `max_iterations = ceil(N × 2.5) + 2` (N = 백로그 실작업 항목 수, FINAL 제외). N이 20개 이상이면 배수를 2.0으로 낮춰도 무방. 최종 값은 `/ralph-loop` 실행 직전 사용자에게 보여주고 확인받는다.
- `--completion-promise`는 짧고 고유한 문구로 (정확한 문자열 일치가 필요하므로): 예 `"RALPH BACKLOG CLEAR"`.
- 완료 조건(프롬프트에 명시): "`_workspace/ralph_backlog.md`의 모든 항목이 `[x]` 또는 `[~]`(SKIPPED)이고, FINAL 항목에서 실행한 fitback-qa 결과가 '위반 없음'(확인 필요 포함 시 미달)이며 `npm run lint`가 통과할 때에만 `<promise>RALPH BACKLOG CLEAR</promise>`를 출력하라. 하나라도 미달이면 절대 출력하지 말고 다음 미완료 항목을 계속 진행하라."

## Step 6: /ralph-loop 프롬프트 조립 및 실행

Step 2~5의 내용을 하나의 프롬프트로 합쳐 `fitback-harness`의 Phase 0~3 절차(백로그 항목 하나를 골라 범위 판단 → 해당 에이전트 호출 → fitback-qa[+fitback-design] 검증 → 결과 기록)를 그대로 수행하도록 지시한 뒤, `/ralph-loop "<조립된 프롬프트>" --max-iterations <계산값> --completion-promise "RALPH BACKLOG CLEAR"`를 실행한다.

실행 주체는 **최상위 세션(메인 스레드) 자신**이다 — ralph의 Stop 훅은 최상위 세션에만 걸리므로, 백로그를 읽고 다음 항목을 고르는 판단을 서브에이전트에 위임하면 게이트가 무의미해진다.

## 종료 후

루프가 completion-promise로 끝나면 `_workspace/ralph_backlog.md`(전체 체크 상태), `_workspace/ralph_blocked.md`(있으면), `_workspace/ralph_design_notes.md`(있으면)를 사용자에게 요약 보고한다. 커밋 목록을 `git log`로 보여주고, **push는 사용자가 직접 확인 후 실행**하도록 안내한다.
