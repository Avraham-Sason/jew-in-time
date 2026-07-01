# AGENTS.md

## Purpose

- Own pure helper logic for timeline and history calculations.

## Ownership

- [buildDayTimeline.ts](buildDayTimeline.ts) owns day schedule item construction.
- [historyStats.ts](historyStats.ts) owns streak, daily, per-mitzvah, and missed-yesterday statistics.
- Utility tests live in [__tests__/](__tests__/).

## Local Contracts

- Keep utilities pure: no direct Zustand, MMKV, navigation, notifications, or native side effects.
- Accept required services/data as inputs instead of importing route state.
- Preserve local-date and halachic-location assumptions from [../services/AGENTS.md](../services/AGENTS.md) and [../data/AGENTS.md](../data/AGENTS.md).

## Work Guidance

- Put schedule/history calculations here when multiple screens need them.
- Keep edge cases covered with fixtures rather than embedding hidden assumptions in routes.

## Verification

- Run `pnpm test -- src/utils/__tests__/buildDayTimeline.test.ts` after timeline changes.
- Run `pnpm test -- src/utils/__tests__/historyStats.test.ts` after history/statistics changes.
- Run `pnpm typecheck` after utility API changes.

## Child DOX Index

- No child AGENTS.md files.
