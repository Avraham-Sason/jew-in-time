# AGENTS.md

## Purpose

- Own persisted Zustand stores and persistence middleware.

## Ownership

- [useUserStore.ts](useUserStore.ts) owns user profile, location, language, theme, permission, settings, and onboarding state.
- [useMitzvotStore.ts](useMitzvotStore.ts) owns enabled mitzvot and custom reminders.
- [useCompletionsStore.ts](useCompletionsStore.ts) owns completions and skipped maps.
- [useCustomMitzvotStore.ts](useCustomMitzvotStore.ts) owns user-created mitzvah definitions.
- [zustandMiddleware.ts](zustandMiddleware.ts) owns Zustand middleware interop.
- Store tests live in [__tests__/](__tests__/).

## Local Contracts

- Stores persist through MMKV using [../services/StorageService.ts](../services/StorageService.ts).
- Keep persisted defaults, reset behavior, and migrations/backward compatibility in sync when adding fields.
- `useCompletionsStore.markDone`, `markSkipped`, and `unmark` must preserve notification cancellation/rebuild side effects.
- Do not replace the deliberate `../../node_modules/zustand/middleware.js` require in [zustandMiddleware.ts](zustandMiddleware.ts) unless Metro and Jest are both verified.

## Work Guidance

- Keep store actions small and explicit.
- Avoid putting pure derived calculations in stores when [../utils/AGENTS.md](../utils/AGENTS.md) can own them.

## Verification

- Run `pnpm test -- src/stores/__tests__/stores.test.ts src/stores/__tests__/completions.extra.test.ts` after store behavior changes.
- Run notification scheduler tests after completion/skipped state changes that affect reminders.
- Run `pnpm typecheck` after store type changes.

## Child DOX Index

- No child AGENTS.md files.
