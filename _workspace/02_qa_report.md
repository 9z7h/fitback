# QA report — home data wiring

## Findings

- `src/app/index.tsx:53,63,175-181`: membership status treats the end date as active, while the ROI D-day badge treats it as expired. Align the shared expiry boundary before release.
- `src/app/index.tsx:67,87,271`: `useThisWeekWorkouts` counts days with activity, not workout sessions. Change the copy to "이번 주 N일 운동했어요" unless a session-count query is added.

## No violations found

- Existing hook contracts, nullable handling, and `CoachChat` props match their consumers.
- Session and period memberships are displayed through separate ROI paths.
- No new token-rule violations were found in the changed file.
- Scope remains limited to the approved home screen wiring.
- `git diff --check` and `npx eslint src/app/index.tsx` passed; TypeScript has no error associated with this file.
