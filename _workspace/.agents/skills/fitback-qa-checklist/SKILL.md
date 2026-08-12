---
name: fitback-qa-checklist
description: FitBack 변경사항을 검증할 때 반드시 사용. fitback-frontend/fitback-backend 작업 직후, PR/diff 리뷰 요청, "이 변경 검토해줘"/"토큰 위반 확인해줘"/"경계면 확인해줘" 같은 요청에서 트리거. grep 기반 후보 탐지 + 경계면 교차 비교 방법론 제공.
---

# FitBack QA 방법론

## Why

"파일이 존재한다"는 검증이 아니다. FitBack에서 실제로 자주 깨지는 지점은 **경계면** — Edge Function이 바꾼 응답 shape을 프론트 훅이 모르고 옛 타입으로 읽거나, ROI 공식이 free/session 타입을 구분 안 해서 잘못된 금액을 보여주는 경우다. 그래서 QA는 "존재 확인"이 아니라 "양쪽을 나란히 읽고 비교"하는 작업이다.

## 실행 순서

1. **후보 탐지** — 번들된 스크립트로 기계적 위반 후보를 뽑는다:
   ```bash
   .Codex/skills/fitback-qa-checklist/scripts/check-tokens.sh [base-ref]
   ```
   결과는 후보일 뿐이다. 예를 들어 `theme.ts` 자체 내부의 hex는 정상이고, 주석 안의 hex도 정상이다 — 맥락을 보고 판단한다.

2. **경계면 교차 비교** — 변경된 Edge Function이 있으면 그 `index.ts`의 응답 구조와, 이를 소비하는 `src/features/*/use*.ts`의 타입을 **동시에 Read**해서 필드명·nullable·단위(원 단위인지 개수인지)가 일치하는지 확인한다. 하나만 보고 "괜찮아 보인다"고 판단하지 않는다.

3. **ROI 공식 검증** — `valueAtRisk`/`costPerSession` 등을 건드린 코드가 있으면 `remaining × (cost / max_visits)` 정의와 비교하고, free 타입이 session과 동일 분기를 타지 않는지 확인한다([[fitback-roi-logic]] 참조).

4. **출석 검증 규칙** — 방문/체크인 관련 변경이 있으면 100m 지오펜스 체크를 우회하는 경로가 없는지, verified 플래그 없이 폴백 출석이 ROI에 반영되는지 확인한다.

5. **수술적 변경 범위** — `git diff`에서 요청과 무관한 라인(포맷팅, import 정렬, 이름 변경)이 섞였는지 확인한다. 섞였으면 지적한다.

## 점진적 실행

전체 기능이 끝난 뒤 한 번에 몰아서 하지 않는다. 화면 하나, 함수 하나가 완성될 때마다 위 5단계를 짧게 돈다 — 뒤늦게 몰아서 발견하면 원인 추적 비용이 커진다.

## 보고 형식

```
path:line: 문제 요약 — 근거 — 수정 제안
```
확실하지 않으면 "위반"이라 단정하지 말고 "확인 필요"로 표시한다. 문제가 없으면 각 항목에 대해 "위반 없음"이라고 명시적으로 답한다 — 침묵은 검증 누락과 구분되지 않는다.
