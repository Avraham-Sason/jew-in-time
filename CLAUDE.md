# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Hebrew-first React Native + Expo app ("יהודי כשר") that reminds shomer-mitzvot users to perform daily mitzvot inside their halachic time windows. All zmanim and Hebrew calendar logic runs locally — no backend.

Authoritative design + scope docs (read these before non-trivial changes):
- [PRD.md](PRD.md) — product spec, time-type taxonomy, screens
- [PLAN.md](PLAN.md) — phased build plan with task IDs (`Phase X.Y`)
- [tests.md](tests.md) — full QA matrix; flags known gaps
- [bugs.md](bugs.md) — open bugs (referenced as `BUG-NNN`)
- [design/kosher-jew/project/hifi/](design/kosher-jew/project/hifi/) — Hi-Fi reference components/screens that the RN UI ports

## Commands

```bash
npm start                          # expo start (Metro)
npm run start:dev                  # dev-client build (needed for native modules: MMKV, notifications)
npm run android / android:device   # expo run:android (local native build)
npm run ios                        # expo run:ios
npm run web                        # web bundle — useful for headless verification

npm test                           # jest --passWithNoTests
npm test -- path/to/file.test.ts   # single file
npm test -- -t "name fragment"     # filter by test name
npm run typecheck                  # tsc --noEmit (strict)
npm run doctor                     # expo-doctor

npm run build:android:development  # EAS dev client APK
npm run build:android:preview      # EAS internal preview APK
```

`expo start` (no `--dev-client`) won't load `react-native-mmkv` or `expo-notifications` — use `start:dev` against an installed dev client.

## Architecture

### Layered structure (`src/`)

```
data/        Static registries (mitzvot, nuschaot, cities)
types/       Shared TS contracts (Mitzvah, Zmanim, ComputeContext)
services/    Pure logic + native wrappers (no React)
stores/      Zustand state (persisted via MMKV)
components/  Presentational RN components
app/         expo-router file-based routes
theme/       T_LIGHT / T_DARK token sets + ThemeProvider
i18n/        he.json (primary) + en.json
```

Path alias `@/*` → `src/*` is configured in **both** `tsconfig.json` and `babel.config.js` (module-resolver). Update both if adding aliases.

### Mitzvah registry — central abstraction

[src/data/mitzvot.ts](src/data/mitzvot.ts) is the single source of truth for what the app schedules. Each entry:
- `timeType`: `fixed-moment | range-within-day | all-day | sunset-trigger | date-range | monthly-window | annual-seasonal`
- `computeWindow(ctx: ComputeContext)` → `{start, end} | null` (null = no window today, e.g. Omer outside Nisan-Sivan)
- `defaultReminders[]`: `{anchor: 'start'|'end', offsetMin, label, skipIfDone?}`
- `skipOn`: `('shabbat'|'yomtov')[]` consulted by the scheduler before queueing
- `nuschaotSupported` + halachic-opinion branching inside `computeWindow` (see `sofZmanShma(ctx)` for GRA vs MA)

Adding a mitzvah = append to `MITZVOT`, supply `computeWindow`, add `defaultReminders`, update tests (`src/data/__tests__/mitzvot*.test.ts`).

### Zmanim + Hebrew calendar

- [ZmanimService](src/services/ZmanimService.ts) wraps `kosher-zmanim`'s `ComplexZmanimCalendar`. `getZmanim()` returns the canonical map consumed by `computeWindow`. Sunrise/sunset use `getSeaLevel*`; `tzeitHakochavim` uses `getTzaisGeonim7Point083Degrees` (≈8.5°). Custom getters (e.g. `getCandleLighting`) live here too.
- [HebcalService](src/services/HebcalService.ts) wraps `@hebcal/core`. **`isShabbat` has a known bug** ([BUG-001](bugs.md)): uses `getDay()===6` only, doesn't handle Friday-night/Saturday-night transitions correctly. Affects `skipOn: ['shabbat']` accuracy at boundaries.
- Both libraries are pure JS — fully offline.

### Notification engine

[src/services/NotificationScheduler.ts](src/services/NotificationScheduler.ts) is the brain that connects mitzvot → zmanim → OS-scheduled notifications.

- **Identifier format**: `${mitzvahId}__${YYYY-MM-DD}__${reminderIndex}` (parsed both ways for cancellation).
- **Horizon**: 48h ahead, dropped to 24h when `pending > PENDING_LIMIT (60)` to stay under iOS's 64-notification cap.
- **`withLock`**: in-flight promise gate. All public mutations (`scheduleAll`, `rebuild`) go through it — don't bypass.
- **`scheduleOne`** skips: missing permission, `shouldSkip` (Shabbat/YT), `null` window, completed-with-`skipIfDone`, explicitly skipped, triggers in the past.
- **`cancelForMitzvah(id, date)`** only cancels reminders whose `skipIfDone` is true — non-skip reminders survive marking done. Called from `useCompletionsStore.markDone` via `CompletionService`.
- **Subscribers** ([_layout.tsx](src/app/_layout.tsx) calls `initNotificationHandlers()` once after fonts load): `useUserStore` subscription triggers `rebuild()` whenever `location | nusach | halachicOpinions | inIsrael` change.
- **Daily rebuild**: `TaskManager.defineTask(DAILY_REBUILD_TASK)` registered with `BackgroundFetch`; `shouldRunDailyRebuild` gates by `LAST_REBUILD_KEY` in MMKV so it fires once per local day at/after 00:15.
- **Web platform**: [NotificationScheduler.web.ts](src/services/NotificationScheduler.web.ts) is a no-op shim — Metro picks it up via the `.web.ts` suffix. Keep web parity in mind when extending the API.

### Storage + state

- [StorageService](src/services/StorageService.ts) wraps a single MMKV instance (`id: 'kosher-jew'`) with JSON encode/decode + a `createZustandStorage()` adapter for `persist` middleware.
- [zustandMiddleware.ts](src/stores/zustandMiddleware.ts) is a deliberate `require()` shim around `zustand/middleware` — needed because the package's ESM exports trip up some bundler paths. Don't replace with a direct import without verifying both Metro and Jest still resolve it.
- Three stores, all persisted: `useUserStore` (settings + onboarding flag), `useMitzvotStore` (per-mitzvah enabled + custom reminders), `useCompletionsStore` (`completions[YYYY-MM-DD][mitzvahId] = timestamp` + `skipped` map).

### Routing + RTL

- expo-router v6 with `extra.router.root = "./src/app"` (configured in [app.json](app.json)). Typed routes are enabled — TS will error on bad hrefs.
- Onboarding guard lives in `RootInner` in [_layout.tsx](src/app/_layout.tsx): redirects to `/onboarding` until `isOnboarded`, then to `/(tabs)/home`.
- **RTL is dynamic per language**: `syncLayoutDirection` in `_layout.tsx` calls `I18nManager.allowRTL` + `forceRTL` and (web only) sets `document.documentElement.dir`. Hebrew is the default UI language. Note: `forceRTL` requires a JS reload to take effect on native — switching he↔en in-app may need a relaunch.

### Theming

[src/theme/colors.ts](src/theme/colors.ts) exports `T_LIGHT` / `T_DARK`. Consume via `useTheme()` from [ThemeProvider.tsx](src/theme/ThemeProvider.tsx) — never hard-code colors. `tokens.ts` has `ribbonThresholds = { safe: 0.5, warning: 0.25 }` driving the `TimeRibbon` color logic.

## Conventions

- **Hebrew strings in source are intentional** — labels in [mitzvot.ts](src/data/mitzvot.ts) and i18n keys are authoritative in Hebrew. Don't "fix" them.
- **Tests live next to code** in `__tests__/` siblings (e.g. `src/services/__tests__/NotificationScheduler.test.ts`). Jest's `transformIgnorePatterns` in [package.json](package.json) is curated — when adding a native/Hebcal-adjacent dep, append it to the allowlist or tests will fail with `Cannot use import statement outside a module`.
- **No backend, no network calls.** Everything is local + offline. If you reach for `fetch`, reconsider.
- `android/` and `ios/` are gitignored — generated by `expo prebuild` / `expo run:*`. Don't commit native dirs.
