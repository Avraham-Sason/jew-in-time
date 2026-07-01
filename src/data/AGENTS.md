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
- When a screen or service must include custom mitzvot, use `getAllMitzvot()` or `findAnyMitzvah()`.
- New user-facing labels or text must be reflected in [../i18n/AGENTS.md](../i18n/AGENTS.md) when they are normal UI copy.

## Work Guidance

- Keep registry entries explicit and testable.
- For new mitzvot, update skip behavior, reminders, content blocks, default enabled behavior, and tests together.

## Verification

- Run `pnpm test -- src/data/__tests__/mitzvot.test.ts src/data/__tests__/mitzvot.windows.test.ts src/data/__tests__/mitzvotExtras.test.ts` after mitzvah registry changes.
- Run `pnpm test -- src/data/__tests__/cities.test.ts` after city data changes.
- Run `pnpm typecheck` after data shape changes.

## Child DOX Index

- No child AGENTS.md files.
