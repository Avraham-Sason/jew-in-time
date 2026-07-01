# AGENTS.md

## Purpose

- Own the main bottom-tab experience: home, schedule, history, library, settings, and tab layout.

## Ownership

- [_layout.tsx](_layout.tsx) owns tab registration and tab bar behavior.
- [home.tsx](home.tsx), [schedule.tsx](schedule.tsx), [history.tsx](history.tsx), [library.tsx](library.tsx), and [settings.tsx](settings.tsx) own their respective tab screens.
- [index.tsx](index.tsx) redirects hidden tab index traffic.

## Local Contracts

- Tab labels and normal UI copy must stay in [../../i18n/AGENTS.md](../../i18n/AGENTS.md).
- Schedule and history views should reuse pure helpers from [../../utils/AGENTS.md](../../utils/AGENTS.md) instead of duplicating day computation.
- Day navigation should route to [../day/AGENTS.md](../day/AGENTS.md) for drilldown behavior.

## Work Guidance

- Keep tab screens scannable and mobile-first; avoid turning operational app screens into marketing layouts.
- Preserve Hebrew-first and RTL ergonomics.
- If a tab consumes notification, location, completion, or settings state, use the owning store/service APIs instead of reaching into persistence directly.

## Verification

- Run `pnpm test -- src/app/__tests__/routes.test.ts` after tab route changes.
- Run `pnpm test -- src/utils/__tests__/buildDayTimeline.test.ts src/utils/__tests__/historyStats.test.ts` after schedule/history logic changes.
- Run `pnpm typecheck` after screen state or navigation changes.

## Child DOX Index

- No child AGENTS.md files.
