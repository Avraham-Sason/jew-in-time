# AGENTS.md

## Purpose

- Own pure helper logic for timeline, history, and liturgical-day calculations.

## Ownership

- [buildDayTimeline.ts](buildDayTimeline.ts) owns day schedule item construction and `currentOrNextWindow()`, which checks yesterday too, because night windows (omer, maariv) stay open past midnight, and looks up to nine days ahead past skipped windows (Sukkot in Israel keeps tefillin off for a week). It steps days exactly as the scheduler does (device-local `setDate`), so the date it returns keys the same day as that window's notification.
- [historyStats.ts](historyStats.ts) owns streak, daily, per-mitzvah, and missed-yesterday statistics.
- [skipRules.ts](skipRules.ts) owns the single `skipOn` predicate shared by the scheduler, timeline, home, and history, including `keepsCholHamoed()` (tefillin on chol hamoed only for nusach Ashkenaz abroad), and the quiet window: `quietBlockAt()` / `isQuietAt()` (strictly inside a holy block), `opensQuietBlock()` for a trigger on a block's opening edge, `nextQuietBoundary()` for live switching, `reminderFires()` (ahead, inside its window, not quiet) shared by the scheduler and the next-reminder preview, and `holyBlockLabelKeys()` naming a block for the notice and the Shabbat screen.
- [siddur.ts](siddur.ts) owns the liturgical day of a text (`liturgicalDay()`), the day flags derived from Hebcal (`dayFeatures()`), condition matching, and resolving a text for a day. Resolution trims the whitespace a filtered-out alternative leaves at a paragraph's edges, and drops an optional or minyan label whose own `when` does not hold that day. `segmentBlocks(segments, field, offset)` groups consecutive segments that share one kind of label into one block. The reader groups a section by `optional` first, then each block by `minyan`; `offset` keeps the inner blocks' start indices in section terms.
- [locationDay.ts](locationDay.ts) owns `locationNoon()`, which maps a device calendar day to the same date at the location.
- Utility tests live in [__tests__/](__tests__/).

## Local Contracts

- Keep utilities pure: no direct Zustand, MMKV, navigation, notifications, or native side effects.
- Accept required services/data as inputs instead of importing route state.
- Preserve local-date and halachic-location assumptions from [../services/AGENTS.md](../services/AGENTS.md) and [../data/AGENTS.md](../data/AGENTS.md).
- [buildDayTimeline.ts](buildDayTimeline.ts) and [historyStats.ts](historyStats.ts) take device calendar days, the day `dateKey()` names. They resolve zmanim and the day's observance from `locationNoon(day, location)`, never from the day's device-local midnight, which is the previous day at a location west of the device.
- Zmanim can be unavailable: [buildDayTimeline.ts](buildDayTimeline.ts) returns an empty timeline and [historyStats.ts](historyStats.ts) records a zero-eligibility day when `getZmanim()` returns `null`.
- Never re-implement the `skipOn` check. Any surface that decides whether a mitzvah applies must call `isSkippedAt()` from [skipRules.ts](skipRules.ts), or the surfaces disagree with each other.
- Never re-implement the quiet window either. The scheduler and the Shabbat screen both read `quietBlockAt()`; its edges stay open so the candle-lighting reminder and havdalah fire.
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
