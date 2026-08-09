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
- [deviceSettings.ts](deviceSettings.ts) owns OS-settings deep links (battery optimisation exemption).
- Service tests live in [__tests__/](__tests__/).

## Local Contracts

- Keep `NotificationScheduler.ts` and `NotificationScheduler.web.ts` API-compatible.
- Preserve notification identifiers as `${mitzvahId}__${YYYY-MM-DD}__${reminderIndex}` unless all scheduler, response, and tests are updated together.
- `MARK_DONE` must stay aligned with [../../scripts/withMitzvahNotificationAction.js](../../scripts/withMitzvahNotificationAction.js).
- `cancelForMitzvah(id, date)` must cancel all pending reminders for that mitzvah/date.
- Always pass `Location` to `HebcalService.isShabbat(date, location)` when halachic boundary behavior matters.
- `isShabbat` and `isYomTov` both derive from one internal `hebrewDaysAt(instant, loc)` primitive: a Hebrew day turns over at shkia, and between shkia and tzeit both candidate days are returned so an observance counts if either carries it. Do not reintroduce a Gregorian-day check for either.
- Use `getHebrewDateAt(instant, loc)` for "today" displays (it advances at shkia) and `getHebrewDate(date)` only for calendar grids, where each cell is a civil day.
- Avoid UTC date shortcuts for mitzvah logic.
- `Zmanim.chatzotLayla` is chatzot halayla (solar midnight) for the night FOLLOWING that day, so it falls on the next civil date. It is the correct end for night windows.
- Battery-optimisation exemption is the user's half of reliable delivery; route it through `openBatteryOptimizationSettings()` and never request `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`, which Google Play restricts to a narrow set of app categories.
- Exact-alarm delivery depends on the Android manifest, not on any runtime call; see the root AGENTS.md notification section before touching `android.permissions` or the config plugins.
- `ZmanimService` resolves the calendar day in the LOCATION's zone (`setDate` with a zoned Luxon DateTime, cache keyed on that ISO date). Never hand it a bare `Date`.
- `initNotificationHandlers()` returns a teardown; the caller must run it on unmount, or store subscriptions stack up and one change fans out N rebuilds.
- `withLock()` coalesces on the trailing edge: a request arriving mid-run queues exactly one re-run. Never make it drop-on-conflict.
- Only `rebuildForNewDay()` stamps `LAST_REBUILD_KEY`; a settings-driven `rebuild()` must not, or it suppresses that night's recovery run.
- Scheduling is capped and ordered by trigger time (`IOS_MAX`/`PENDING_LIMIT`), every candidate carries `channelId` on the trigger, and a trigger outside its own window is dropped.
- `AppResetService` wraps its work in `setSchedulingSuspended(true)` so resetting the stores cannot re-arm a schedule from the restored defaults.
- `ZmanimService.getZmanim()` must never throw. It returns `Zmanim | null`, where `null` means the sun neither rises nor sets that day; every caller must handle `null` instead of assuming a value. Depression-angle zmanim that have no solution fall back to their fixed-minute shita (alot 72 min, misheyakir 52 min before sunrise), and misheyakir is always kept inside `(alot, netz)`.
- `scheduleAllImpl()` must isolate each `scheduleOne()` in try/catch so one failing mitzvah cannot empty the whole schedule.
- `skipOn` decisions come from `isSkippedAt()` in [../utils/skipRules.ts](../utils/skipRules.ts), evaluated at the computed window's `start`. Do not add a local copy of that predicate here, and do not judge the skip from `fromDate` — that instant carries the rebuild's clock time.

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
