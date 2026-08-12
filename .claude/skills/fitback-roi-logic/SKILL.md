---
name: fitback-roi-logic
description: FitBack의 ROI(본전 회수율) 계산, 회원권 타입 분기, 출석 검증, AI 코치 계약을 다룰 때 반드시 참조. 마이그레이션 추가, Edge Function 작성/수정, dashboard.ts류 위험도 계산 로직, 체크인/지오펜스 로직, coach 함수 작업에서 트리거.
---

# FitBack ROI 도메인 규칙

## Why

FitBack의 유일한 차별점은 "회원권 본전을 실제로 회수하는가"를 숫자(ROI)로 보여주는 것이다. 이 숫자가 신뢰를 잃으면(계산 자체가 틀리면) 앱의 존재 이유가 사라진다. ROI에 영향을 주는 모든 코드는 정확한 회당가치 계산을 지켜야 하고, verify_status는 표시용/신뢰도 지표용 구분일 뿐 ROI 반영 여부를 가르지 않는다.

## 회원권 타입 3종

- `free` (자유이용권) — 횟수 제한 없음. `maxVisits: null`, `remainingVisits: null`. ROI 위험도는 `neutral` 취급하되 만료 시엔 `danger` 표시. 단 `valueAtRisk = 0`이라 금액 영향은 없다 — 이 구분을 놓치면 free 회원에게 잘못된 손실 금액을 보여주게 된다.
- `session` (PT/횟수제) — `maxVisits` 존재. 남은 횟수 = `max_visits − visits.count`.
- `class` (클래스) — session과 동일 계산 체계를 공유.

## ROI 핵심 공식

```
valueAtRisk = remaining × (cost / max_visits)   // 만료 시 소멸 금액
costPerSession = cost / max_visits
valueUsed = used × (cost / max_visits)
```

`max_visits`가 0/null일 수 있으니 나눗셈 전 항상 가드한다. 기존 구현은 `src/features/membership/dashboard.ts`의 `computeRisk()`에 있다 — 새 계산 로직이 필요해도 이 함수를 확장하지, 병렬로 다른 공식을 만들지 않는다.

## 위험도(RiskLevel) — 페이스 기반

`danger` / `warning` / `safe` / `neutral` 4단계. 색 매핑은 `RISK_COLORS`(`Palette.loss`/`warning`/`profit`/`gray500`), 라벨+아이콘은 `RISK_META`에 이미 정의되어 있다. 새 화면에서 위험도를 표시할 땐 이 두 상수를 그대로 import해서 쓴다 — 로직 중복 생성 금지.

## 출석 검증 규칙 (확정)

- 체크인은 센터 **100m 이내**에서만 활성화된다. 지오펜스 판정은 `CheckInFlow`에 있고, 위치는 웹·앱 모두 `getPosition()`으로 취득한다.
- **자기신고(수동) 출석도 ROI에 반영한다(PRD §08, 현행 유지).** `visits.verify_status`(verified/unverified)로 검증 여부는 구분해 저장하되, `valueAtRisk`/`usedVisits`/`recoveredAmount` 계산은 verify_status와 무관하게 전체 visits를 반영한다. verified 필터링은 NSM 등 신뢰도 전용 집계(`analytics.*` 뷰)에서만 적용한다.
- 지오펜스 체크 없이 방문 카운트를 늘리는 코드 경로가 있으면 이 규칙 위반이다.

## AI 코치(coach Edge Function) 계약

- 입력: risk·pace 관련 데이터.
- 출력: `CoachTip` 1장.
- **6시간 캐시** — 매 렌더마다 재호출하지 않는다. 캐시 키/TTL을 바꿀 땐 `src/features/coach/useCoach.ts` 소비 측과 함께 수정해야 shape 불일치가 안 생긴다.

## 실제 테이블

`profiles`, `memberships`, `centers`, `visits`, `exercise_records`, `user_preferences`, `workout_logs`, `exercises`, `meals`, `food_favorites`. 새 컬럼/테이블 추가 시 이 목록에 없는 이름을 임의로 만들지 말고, 기존 마이그레이션 번호(01~34+) 뒤에 이어서 순번을 매긴다.

## 비핵심 기능

식단(`diet.tsx`/`meals`)·홈트는 ROI 비핵심 기능이다 — 코드는 유지하되, ROI 관련 작업과 우선순위가 충돌하면 ROI를 우선한다.
