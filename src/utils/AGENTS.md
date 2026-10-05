# AGENTS.md

## Purpose

- Own pure helper logic for timeline, history, and liturgical-day calculations.

## Ownership

- [buildDayTimeline.ts](buildDayTimeline.ts) owns day schedule item construction and `currentOrNextWindow()`, which checks yesterday too, because night windows (omer, maariv) stay open past midnight. It steps days exactly as the scheduler does (device-local `setDate`), so the date it returns keys the same day as that window's notification.
- [historyStats.ts](historyStats.ts) owns streak, daily, per-mitzvah, and missed-yesterday statistics.
- [skipRules.ts](skipRules.ts) owns the single `skipOn` predicate shared by the scheduler, timeline, home, and history.
- [siddur.ts](siddur.ts) owns the liturgical day of a text (`liturgicalDay()`), the day flags derived from Hebcal (`dayFeatures()`), condition matching, and resolving a text for a day. Resolution trims the whitespace a filtered-out alternative leaves at a paragraph's edges.
- [locationDay.ts](locationDay.ts) owns `locationNoon()`, which maps a device calendar day to the same date at the location.
- Utility tests live in [__tests__/](__tests__/).

## Local Contracts

- Keep utilities pure: no direct Zustand, MMKV, navigation, notifications, or native side effects.
- Accept required services/data as inputs instead of importing route state.
- Preserve local-date and halachic-location assumptions from [../services/AGENTS.md](../services/AGENTS.md) and [../data/AGENTS.md](../data/AGENTS.md).
- [buildDayTimeline.ts](buildDayTimeline.ts) and [historyStats.ts](historyStats.ts) take device calendar days, the day `dateKey()` names. They resolve zmanim and the day's observance from `locationNoon(day, location)`, never from the day's device-local midnight, which is the previous day at a location west of the device.
- Zmanim can be unavailable: [buildDayTimeline.ts](buildDayTimeline.ts) returns an empty timeline and [historyStats.ts](historyStats.ts) records a zero-eligibility day when `getZmanim()` returns `null`.
- Never re-implement the `skipOn` check. Any surface that decides whether a mitzvah applies must call `isSkippedAt()` from [skipRules.ts](skipRules.ts), or the surfaces disagree with each other.
- Every decision about which liturgical insert applies on a day goes through `dayFeatures()` and `matchesCondition()` in [siddur.ts](siddur.ts). Never add a second copy of a day rule elsewhere.
- Judge the skip at the mitzvah window's own `start` instant, after `computeWindow()`, never at "now" and never at civil midnight. `HebcalService.isShabbat` is instant-sensitive, so any other instant makes the answer depend on when the caller happened to ask.

## Work Guidance

- Put schedule/history calculations here when multiple screens need them.
- Keep edge cases covered with fixtures rather than embedding hidden assumptions in routes.

## Verification

- Run `pnpm test -- src/utils/__tests__/buildDayTimeline.test.ts` after timeline changes.
- Run `pnpm test -- src/utils/__tests__/historyStats.test.ts` after history/statistics changes.
- Run `pnpm test -- src/utils/__tests__/siddur.test.ts` after day-flag or resolution changes, then `pnpm test:tz`.
- Run `pnpm test:tz -- src/utils` after changing how a day maps to the location.
- Run `pnpm typecheck` after utility API changes.

## Child DOX Index

- No child AGENTS.md files.
