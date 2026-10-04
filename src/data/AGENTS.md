# AGENTS.md

## Purpose

- Own static app registries and conversion logic for mitzvot, cities, nuschaot, and custom mitzvah adaptation.

## Ownership

- [mitzvot.ts](mitzvot.ts) owns the central static mitzvah registry.
- [cities.ts](cities.ts) owns supported city/location presets.
- [nuschaot.ts](nuschaot.ts) owns nusach metadata.
- [customMitzvotAdapter.ts](customMitzvotAdapter.ts) adapts persisted custom mitzvot into the shared mitzvah shape.
- Tests live in [__tests__/](__tests__/).

## Local Contracts

- Static mitzvah changes must preserve the `Mitzvah` contract from [../types/mitzvah.ts](../types/mitzvah.ts).
- Mitzvah windows must avoid UTC date shortcuts and stay compatible with [../services/ZmanimService.ts](../services/ZmanimService.ts) and [../services/HebcalService.ts](../services/HebcalService.ts).
- In a static `computeWindow`, ask every calendar question (weekday, next day, `isYomTov`, Omer count) about `dayOf(ctx.zmanim, location)`: the location's day those zmanim belong to, at its midday. Never use `ctx.date`. Its device-local getters read the wrong day once the zones differ, and its clock time depends on the caller (midnight, now, or a rebuild's evening). An evening `ctx.date` already sits in the next Hebrew day, which once erased erev-Yom-Tov candle lighting.
- Never build a night-time window end with `Date.setDate(+1)` on `zmanim.chatzot` — that is midday chatzot and yields the next day's noon. Use `zmanim.chatzotLayla` (solar midnight, already the next civil date) or the next day's `alotHaShachar`.
- `omerDayFor()` returns the count due on the night that OPENS at tzeit of the given day, which belongs to the next Hebrew day: night 1 on the evening of 15 Nisan, night 49 on the evening of 4 Sivan. Do not re-anchor it to the daytime Hebrew date.
- When a screen or service must include custom mitzvot, use `getAllMitzvot()` or `findAnyMitzvah()`.
- New user-facing labels or text must be reflected in [../i18n/AGENTS.md](../i18n/AGENTS.md) when they are normal UI copy.

## Work Guidance

- Keep registry entries explicit and testable.
- For new mitzvot, update skip behavior, reminders, content blocks, default enabled behavior, and tests together.

## Verification

- Run `pnpm test -- src/data/__tests__/mitzvot.test.ts src/data/__tests__/mitzvot.windows.test.ts src/data/__tests__/mitzvotExtras.test.ts` after mitzvah registry changes.
- Run `pnpm test:tz -- src/data` after changing how a window resolves its day.
- Run `pnpm test -- src/data/__tests__/cities.test.ts` after city data changes.
- Run `pnpm typecheck` after data shape changes.

## Child DOX Index

- No child AGENTS.md files.
