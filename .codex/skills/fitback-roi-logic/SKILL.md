---
name: fitback-roi-logic
description: FitBack ROI 계산, 회원권 타입 분기, 출석 검증, AI coach 계약을 다룰 때 사용한다.
---

# FitBack ROI 도메인 규칙

루트 `CLAUDE.md`와 `docs/architecture.md`가 우선한다.

## 회원권 타입과 공식

- `session`: `max_visits`를 목표 방문 수로 사용한다.
- `period`: 주당 목표와 회원권 기간으로 목표 방문 수를 환산한다.
- 회당가치 = 원금 ÷ 목표 방문 수
- `valueAtRisk = 잔여 목표 방문 × 회당가치`
- 분모 0, null, 잘못된 기간을 계산 전에 가드한다.
- 기존 `src/features/membership/dashboard.ts`를 확장하고 병렬 공식을 만들지 않는다.
- 세션권은 소멸, 기간권은 정체 프레이밍을 사용한다.

## 출석 검증

- 체크인은 센터 100m 이내에서만 활성화하고 웹과 앱 모두 `getPosition()`을 사용한다.
- 수동 출석도 ROI, 회수 금액, 활용도에 반영한다.
- `visits.verify_status`로 검증 여부를 저장한다.
- verified 제한은 NSM 등 신뢰도 전용 집계에서만 사용한다.

## AI coach 계약

`coach` Edge Function은 risk와 pace를 받아 `CoachTip` 한 장을 반환하며 6시간 캐시한다. 입력, 출력, 캐시 계약을 바꾸면 `useCoach.ts` 소비 측도 함께 검토한다.

실제 테이블은 `profiles`, `memberships`, `centers`, `visits`, `exercise_records`, `user_preferences`, `workout_logs`, `exercises`, `meals`, `food_favorites`다. 식단과 홈트는 유지하되 신규 작업에서는 ROI를 우선한다.
