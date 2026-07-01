# AGENTS.md

## Purpose

- Own non-React app logic and native-facing service wrappers.

## Ownership

- [ZmanimService.ts](ZmanimService.ts) owns kosher-zmanim calculations and caching.
- [HebcalService.ts](HebcalService.ts) owns Hebrew calendar, holidays, Shabbat, Daf Yomi, and Omer logic.
- [LocationService.ts](LocationService.ts) owns location access wrappers.
- [StorageService.ts](StorageService.ts) owns MMKV-backed storage helpers.
- [NotificationScheduler.ts](NotificationScheduler.ts) owns native notification scheduling, rebuilds, categories, and background tasks.
- [NotificationScheduler.web.ts](NotificationScheduler.web.ts) owns web shim parity for scheduler exports.
- [notificationResponseHandler.ts](notificationResponseHandler.ts) owns notification tap/action responses.
- [CompletionService.ts](CompletionService.ts) and [AppResetService.ts](AppResetService.ts) own completion/reset service behavior.
- Service tests live in [__tests__/](__tests__/).

## Local Contracts

- Keep `NotificationScheduler.ts` and `NotificationScheduler.web.ts` API-compatible.
- Preserve notification identifiers as `${mitzvahId}__${YYYY-MM-DD}__${reminderIndex}` unless all scheduler, response, and tests are updated together.
- `MARK_DONE` must stay aligned with [../../scripts/withMitzvahNotificationAction.js](../../scripts/withMitzvahNotificationAction.js).
- `scheduleAll()` and `rebuild()` must keep lock behavior so concurrent rebuilds share one in-flight run.
- `cancelForMitzvah(id, date)` must cancel all pending reminders for that mitzvah/date.
- Always pass `Location` to `HebcalService.isShabbat(date, location)` when halachic boundary behavior matters.
- Avoid UTC date shortcuts for mitzvah logic.

## Work Guidance

- Keep services framework-light and testable; route/component effects should call service APIs rather than duplicate service internals.
- For native-adjacent changes, account for Expo dev-client/native build requirements and web shims.
- When adding ESM or native-adjacent dependencies, check Jest `transformIgnorePatterns` in [../../package.json](../../package.json).

## Verification

- For notification changes, run `pnpm test -- src/services/__tests__/NotificationScheduler.test.ts src/services/__tests__/notificationResponseHandler.test.ts` and `pnpm typecheck`.
- For notification body variant changes, run `pnpm test -- src/services/__tests__/NotificationScheduler.bodyVariants.test.ts`.
- For zmanim/calendar changes, run `pnpm test -- src/services/__tests__/ZmanimService.test.ts src/services/__tests__/ZmanimService.extra.test.ts src/services/__tests__/HebcalService.test.ts` and `pnpm typecheck`.
- For storage/settings/location behavior, run the closest service tests under [__tests__/](__tests__/).

## Child DOX Index

- No child AGENTS.md files.
