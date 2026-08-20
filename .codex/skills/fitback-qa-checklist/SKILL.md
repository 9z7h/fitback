---
name: fitback-qa-checklist
description: FitBack 변경사항 검증, PR/diff 리뷰, 토큰 위반과 FE-BE 경계면 확인 요청에서 사용한다.
---

# FitBack QA 방법론

1. `.codex/skills/fitback-qa-checklist/scripts/check-tokens.sh [base-ref]`로 기계적 후보를 찾고 맥락을 확인한다.
2. Edge Function 변경 시 반환 JSON과 이를 소비하는 `src/features/*/use*.ts` 타입을 나란히 읽어 필드, nullable, 단위를 비교한다.
3. ROI 변경 시 `fitback-roi-logic`과 비교해 세션권과 기간권 계산 및 분모 가드를 확인한다.
4. 체크인 변경 시 100m 지오펜스 우회, `visits.verify_status` 누락, 수동 출석의 ROI 제외 여부를 확인한다.
5. `git diff`에서 요청과 무관한 포맷 변경, 리팩토링, 이름 변경을 찾는다.

화면이나 함수 단위로 점진적으로 검사한다. 발견 사항은 `path:line: 문제 — 근거 — 수정 제안`으로 보고하고, 불확실하면 `확인 필요`, 문제가 없으면 `위반 없음`이라고 명시한다.
