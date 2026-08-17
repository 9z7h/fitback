# Home data wiring — frontend summary

- Changed: `src/app/index.tsx` only.
- Replaced the home screen's membership, workout, diet, and recommendation placeholders with existing domain hooks.
- Added truthful empty membership state and CoachChat modal entry.
- Left checklist, notifications, and quick record outside the approved scope.
- Frontend verification: file lint, `git diff --check`, and `tsc --noEmit` passed. Whole-project lint retains pre-existing errors outside this change.
