# AGENTS.md

## Purpose

- Own pure helper logic for timeline and history calculations.

## Ownership

- [buildDayTimeline.ts](buildDayTimeline.ts) owns day schedule item construction.
- [historyStats.ts](historyStats.ts) owns streak, daily, per-mitzvah, and missed-yesterday statistics.
- [skipRules.ts](skipRules.ts) owns the single `skipOn` predicate shared by the scheduler, timeline, home, and history.
- Utility tests live in [__tests__/](__tests__/).

## Local Contracts

- Keep utilities pure: no direct Zustand, MMKV, navigation, notifications, or native side effects.
- Accept required services/data as inputs instead of importing route state.
- Preserve local-date and halachic-location assumptions from [../services/AGENTS.md](../services/AGENTS.md) and [../data/AGENTS.md](../data/AGENTS.md).
- Zmanim can be unavailable: [buildDayTimeline.ts](buildDayTimeline.ts) returns an empty timeline and [historyStats.ts](historyStats.ts) records a zero-eligibility day when `getZmanim()` returns `null`.
- Never re-implement the `skipOn` check. Any surface that decides whether a mitzvah applies must call `isSkippedAt()` from [skipRules.ts](skipRules.ts), or the surfaces disagree with each other.
- Judge the skip at the mitzvah window's own `start` instant, after `computeWindow()`, never at "now" and never at civil midnight. `HebcalService.isShabbat` is instant-sensitive, so any other instant makes the answer depend on when the caller happened to ask.

## Work Guidance

- Put schedule/history calculations here when multiple screens need them.
- Keep edge cases covered with fixtures rather than embedding hidden assumptions in routes.

## Verification

- Run `pnpm test -- src/utils/__tests__/buildDayTimeline.test.ts` after timeline changes.
- Run `pnpm test -- src/utils/__tests__/historyStats.test.ts` after history/statistics changes.
- Run `pnpm typecheck` after utility API changes.

## Child DOX Index

- No child AGENTS.md files.
