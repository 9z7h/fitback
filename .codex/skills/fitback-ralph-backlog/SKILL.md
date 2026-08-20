---
name: fitback-ralph-backlog
description: Ralph Loop으로 FitBack의 저위험이고 이미 확정된 백로그를 무인 반복 처리할 때 사용한다.
---

# FitBack Ralph 백로그

Ralph Loop 기능이 현재 환경에 실제로 제공되는지 먼저 확인하고, 없으면 실행하지 않는다.

허용 범위는 확정 패턴의 반복 구현, 기계적인 lint/type 수정, 확정된 QA 위반 수정, 기존 로직 테스트 보강이다. DB 스키마나 RLS 설계, 출석 정책 재정의, 주관적 디자인 반영, 스펙 없는 신규 화면, 최초 FE-BE 계약, 프로덕션 디버깅은 제외한다.

백로그는 `_workspace/ralph_backlog.md`에 번호, 범위, 파일, 완료 조건과 함께 기록하고 마지막에 전체 lint와 QA를 수행하는 `FINAL` 항목을 둔다. 모호한 질문이 생기면 추측하지 말고 해당 항목을 `SKIPPED`로 표시한 뒤 `_workspace/ralph_blocked.md`에 필요한 사람 결정을 기록한다.

자동 통과 조건은 `fitback-qa`의 `위반 없음`과 `npm run lint` 성공이다. `확인 필요`는 실패로 취급한다. 디자인 제안은 기록만 하고 자동 반영하지 않는다. push는 항상 사용자가 직접 승인하고 수행한다.
