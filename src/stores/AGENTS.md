# AGENTS.md

## Purpose

- Own persisted Zustand stores and persistence middleware.

## Ownership

- [useUserStore.ts](useUserStore.ts) owns user profile, location, language, theme, permission, settings, onboarding state, and the reader text size.
- [useMitzvotStore.ts](useMitzvotStore.ts) owns enabled mitzvot and custom reminders, and `enabledAt`, the moment each was last switched on (`enabledSinceOf()`), so switching a mitzvah on never turns earlier days into misses. A missing `enabledAt` means since before it was recorded.
- [useCompletionsStore.ts](useCompletionsStore.ts) owns completions and skipped maps, finished check-ins (`checkIns`, keyed by a block's first holy day) and `archivedDays`, the runs of kept days that retention dropped.
- [useCustomMitzvotStore.ts](useCustomMitzvotStore.ts) owns user-created mitzvah definitions.
- [zustandMiddleware.ts](zustandMiddleware.ts) owns Zustand middleware interop.
- Store tests live in [__tests__/](__tests__/).

## Local Contracts

- Stores persist through MMKV using [../services/StorageService.ts](../services/StorageService.ts).
- Keep persisted defaults, reset behavior, and migrations/backward compatibility in sync when adding fields.
- Every `persist()` passes `version` and `onRehydrateStorage` from [persistOptions.ts](persistOptions.ts). A store whose state is a keyed map also needs a `merge` that unions the current defaults back in, or entries added in a later release never reach existing users.
- Completion maps are pruned to `RETENTION_DAYS` on hydrate and must never write empty day buckets. The days pruned away are folded into `archivedDays` first (`archiveMarkedDays()`), and finished check-ins are pruned with the same cutoff.
- `finishCheckIn()` is idempotent and withdraws the block's check-in reminders through the same queued `require()` the completion actions use. `markDone` and `markSkipped` also call `settleCheckIn()`, so the mark that empties a check-in withdraws its reminders too.
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
