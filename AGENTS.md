# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# FitBack project instructions

Before starting any task, read and follow the root `CLAUDE.md`. It is the shared source of truth for FitBack domain rules, code conventions, design tokens, and harness policy. Interpret Claude-specific names as their Codex equivalents:

- `.claude/CLAUDE.md` → this `AGENTS.md` plus the shared root `CLAUDE.md`
- `.claude/agents/*.md` → `.codex/agents/*.toml`
- `.claude/skills/*` → `.codex/skills/*`
- Claude `Agent`/team tools → Codex collaboration agents when available

For implementation work, also read the matching skill under `.codex/skills/`. If a copied skill conflicts with the root `CLAUDE.md`, the root document wins.

The `fitback-harness` skill is mandatory when any of these are true:

- Three or more files are expected to change.
- A component, hook, or route is added under `src/components/`, `src/features/`, or `src/app/`.
- An existing screen section or layout is substantially rebuilt.

Clear, non-destructive bounded changes may proceed through implementation and verification without an intermediate approval gate. Ask only for destructive actions, commits or pushes, DB/RLS policy changes, ambiguous requirements, or product decisions that materially change scope.

One- or two-line token, copy, asset, or existing prop adjustments may be handled directly. Never commit or push without explicit user approval.
