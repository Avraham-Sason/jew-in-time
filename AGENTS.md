# AGENTS.md

Canonical working notes for AI agents in this repository. Keep this file current when architecture, commands, routes, stores, notification behavior, or test strategy changes.

## Project Snapshot

- App: Hebrew-first Expo/React Native mobile app for daily mitzvah reminders inside halachic time windows. The current display name is configured in [app.json](app.json); the package/slug remains `jew-in-time`.
- EAS project: `@avraham-sason/jew-in-time`, ID `8cc2a377-fcc9-4c78-bdde-ec0fc8f2a84e`.
- Runtime model: local/offline first. Zmanim, Hebrew calendar, history, settings, completions, and reminders are computed on-device. There is no backend.
- Primary platforms: iOS, Android, and a web build for smoke/headless checks. Native notification/MMKV behavior requires a dev client or native build, not plain Expo Go.
- Package manager: [pnpm-lock.yaml](pnpm-lock.yaml) is present. Prefer `pnpm` for installs and scripts to avoid lockfile churn.

## Commands

```bash
pnpm start                         # expo start / Metro
pnpm start:dev                     # expo start --dev-client
pnpm prebuild:clean                # regenerate native folders from app.json (run after app.json identity changes)
pnpm android                       # expo run:android
pnpm android:device                # expo run:android --device
pnpm ios                           # expo run:ios
pnpm web                           # frees port 8081, then expo start --web
pnpm test                          # jest
pnpm test:tz                       # full suite across UTC, Jerusalem, LA and Kiritimati
pnpm test:tz -- path/file.test.ts  # one file across the same four zones
pnpm test -- path/to/file.test.ts  # single Jest file
pnpm test -- -t "name fragment"    # Jest test-name filter
pnpm typecheck                     # tsc --noEmit
pnpm check:dox                     # AGENTS.md links, section order and Child DOX Index
pnpm siddur:build                  # rebuild the bundled nusach texts from pinned Sefaria and Wikisource sources
pnpm doctor                        # expo-doctor
pnpm build:android:development     # EAS development APK
pnpm build:android:preview         # EAS internal preview APK
pnpm build:android:production      # EAS production AAB for the store
pnpm build:android:production-apk  # EAS production APK for direct install
pnpm build:ios:production          # EAS production build for App Store / TestFlight
pnpm submit:ios                    # upload the latest iOS build to App Store Connect
pnpm update:development            # EAS update to development channel
pnpm update:preview                # EAS update to preview channel
pnpm update:production             # EAS update to production — reaches installed users
```

`pnpm web` calls [scripts/free-port.js](scripts/free-port.js) (cross-platform) and may kill a listener on port 8081. Use a dev client/native build when verifying `react-native-mmkv`, background tasks, or notifications.

Jest ([package.json](package.json)), Metro ([metro.config.js](metro.config.js)) and `check:dox` all ignore [.claude/](.claude), where agent sessions keep full worktree copies of the repo. Without that, a worktree's tests run twice against the wrong module paths, its AGENTS.md files fail the DOX check, and a `pnpm install` inside it crashes Metro's file watcher.

## Release and Updates

Two different mechanisms ship this app, and the choice is not stylistic: one reaches everybody within a minute, the other reaches nobody until users install a new binary.

- **Anything Metro bundles** — TypeScript, JSX, i18n strings, and bundled assets (fonts and the siddur texts included) — ships as an over-the-air update: `pnpm update:preview`, or `pnpm update:production` for real users.
- **Anything native** — a dependency with native code, an Android permission, a config plugin under [scripts/](scripts), or an identity field in [app.json](app.json) — needs a build: `pnpm build:android:production`. EAS builds it on its own servers and runs prebuild there, which is why the native folders stay gitignored and are safe to delete locally.
- A native module that `expo` already links transitively (`expo-file-system`, `expo-keep-awake`) may be added as a direct dependency over OTA only at the exact version the shipped binary carries. Check the committed lockfile before raising one.

An update carries no native code, so shipping a native change as an update produces a bundle that calls into something the installed binary does not have. Prefer an update; reach for a build only when the change is actually native.

### Never raise `version` for a JS change

[app.json](app.json) sets `runtimeVersion` to the `appVersion` policy, so an update only reaches installs whose build carried the **same** `version`. Raising `version` therefore cuts every existing install off from over-the-air updates until a new build ships **and** each user installs it — the previous version keeps running the last bundle published under it, and nothing warns that the two diverged.

Bump `version` only in the change that also produces a native build, and update [package.json](package.json) in the same edit: nothing enforces that the two agree, and they were already one release apart at 1.0.12 / 1.0.13.

### Version codes are remote

[eas.json](eas.json) sets `appVersionSource` to `remote`, so EAS owns the Android `versionCode` and the iOS `buildNumber`, and every profile with `autoIncrement` raises them itself. Never hand-edit a version code or build number, and never add one to [app.json](app.json).

### Store submission is manual

`submit.production` in [eas.json](eas.json) is empty, so no submission runs unattended.

Android has no Google Play service account, so `eas submit` cannot upload at all: a production build produces an artifact and uploading it to the Play Console is a human step.

iOS has no stored credentials either, but `pnpm submit:ios` still works — `eas submit --latest` prompts for the Apple account and target app each run. Do not hardcode an Apple ID, team ID or ASC app ID into [eas.json](eas.json) unless the user supplies real values.

Store copy lives in [release/](release).

## Source Map

- [src/app/](src/app) - Expo Router routes. The router root is set in [app.json](app.json) via `extra.router.root`.
- [src/app/_layout.tsx](src/app/_layout.tsx) - Root providers, font loading, onboarding redirect guard, RTL bootstrap, notification handler init, and the exported `ErrorBoundary`.
- [src/app/(tabs)/](<src/app/(tabs)>) - Main tabs: home, schedule, history, library, settings; the hidden `index` redirects to home.
- [src/app/onboarding/](src/app/onboarding) - Onboarding flow: welcome, nusach, location/notifications, ready.
- [src/app/mitzvah/[id].tsx](<src/app/mitzvah/[id].tsx>) - Static and custom mitzvah details, reminders, content blocks.
- [src/app/siddur/[id].tsx](<src/app/siddur/[id].tsx>) - Nusach reader: the mitzvah's text in the user's nusach and language, resolved for the day.
- [src/app/day/[date].tsx](<src/app/day/[date].tsx>) - Read-only per-day route for schedule/history drilldown.
- [src/app/custom-mitzvah.tsx](src/app/custom-mitzvah.tsx) - Create/edit custom mitzvot.
- [src/data/](src/data) - Static registries: mitzvot, cities, nuschaot, and custom-to-static adapter.
- [src/services/](src/services) - Non-React logic and native wrappers: zmanim, Hebcal, location, storage, notifications, completions, reset, OS-settings deep links.
- [src/stores/](src/stores) - Zustand stores persisted through MMKV.
- [src/components/](src/components) - Reusable React Native UI.
- [src/theme/](src/theme) - Theme colors, typography, spacing, animation/radius tokens.
- [src/utils/](src/utils) - Pure helpers: day timeline, history stats, and the shared `skipOn` predicate.
- [src/i18n/](src/i18n) - Flat [he.json](src/i18n/he.json) and [en.json](src/i18n/en.json) dictionaries plus a tiny translation wrapper.
- [src/testing/](src/testing) - Test-only fixture helpers. Never imported by shipped code.
- [scripts/](scripts) - Local workflow scripts and Expo config plugins.
- [scripts/siddur/](scripts/siddur) - Build from pinned Sefaria and Wikisource sources to [assets/siddur/](assets/siddur), the generated nusach texts.
- [design/jew-in-time/](design/jew-in-time) - Claude Design handoff. Use it only for UI/design work; read its README and Hi-Fi prototype before porting visuals.
- [docs/](docs) - Public site published through GitHub Pages: support page and the privacy policy both stores link to.
- [release/](release) - Store listing and privacy policy drafts.
- [AUDIT.md](AUDIT.md) - Failure-point audit with per-finding status. Read before assuming a known defect is still open.

[CLAUDE.md](CLAUDE.md) is the Claude Code compatibility bridge. This file remains the canonical cross-agent context.

## Architecture Rules

- TypeScript is strict. The `@/*` alias maps to `src/*` in both [tsconfig.json](tsconfig.json) and [babel.config.js](babel.config.js); update both if aliases change.
- Keep app logic in services/utils/stores where possible. Components and routes should mostly compose state, services, and UI.
- Do not add a backend or remote API call for calendar/zmanim behavior. Existing logic is local through `kosher-zmanim`, `@hebcal/core`, and `luxon`.
- Do not commit generated native folders unless the user explicitly asks for native project changes. `ios/` and `android/` are gitignored and normally generated by Expo prebuild/run.
- Treat an existing `ios/`/`android/` folder as disposable cache, never as state. Expo skips prebuild when the folder exists, so a stale one silently builds the wrong `applicationId`, scheme, update URL and app name. After any change to identity fields in [app.json](app.json), run `pnpm prebuild:clean`.
- Hebrew is primary. Do not replace Hebrew source strings with English. User-facing copy should usually go through i18n when it is normal UI text.

## Mitzvah Data Model

The central registry is [src/data/mitzvot.ts](src/data/mitzvot.ts).

Static mitzvah IDs currently include:

- `tefillin`
- `tzitzit`
- `krias_shma_shacharit`
- `shacharit`
- `mincha`
- `maariv`
- `birchot_hashachar`
- `candle_lighting`
- `havdalah`
- `sefirat_haomer`

Default enabled mitzvot are `tefillin`, `tzitzit`, `krias_shma_shacharit`, `shacharit`, `mincha`, and `maariv`.

Each `Mitzvah` has:

- `timeType`: `fixed-moment`, `range-within-day`, `all-day`, `sunset-trigger`, `date-range`, `monthly-window`, or `annual-seasonal`.
- `category`: daily/weekly/seasonal/learning grouping used by UI.
- `computeWindow(ctx)`: returns `{ start, end }` or `null`.
- `defaultReminders`: reminder definitions with `anchor`, `offsetMin`, `label`, optional `bodyVariants`, `includeContentInBody`, and `skipIfDone`.
- `skipOn`: skip contexts. The scheduler currently consumes `shabbat` and `yomtov`.
- `nuschaotSupported`: supported nusach IDs.
- optional `contentBlocks`: text/blessing/link blocks shown on detail screens and optionally included in notifications.

When adding or changing a mitzvah, update `MITZVOT`, any relevant i18n/UI labels, and tests under [src/data/__tests__/](src/data/__tests__), [src/services/__tests__/](src/services/__tests__), and any affected route/component tests.

Custom mitzvot live in `useCustomMitzvotStore` and are adapted through [customMitzvotAdapter.ts](src/data/customMitzvotAdapter.ts). Custom IDs are generated as `custom_<timestamp>_<suffix>`. Use `getAllMitzvot(nusach?)` or `findAnyMitzvah()` when a screen/service must include custom mitzvot. Passing the nusach applies `nuschaotSupported` filtering; every surface that lists mitzvot must filter the same way.

## Zmanim and Calendar

- `ZmanimService.getZmanim(date, location)` wraps `kosher-zmanim` `ComplexZmanimCalendar`, resolves the calendar day in the location's timezone, caches up to 90 entries, and returns cloned `Date` objects. It returns `null` (never throws) when the sun neither rises nor sets.
- Sunrise/sunset use sea-level getters. `tzeitHakochavim` uses `getTzaisGeonim7Point083Degrees()`.
- Candle lighting uses the same sea-level sunset basis, via `candleLightingMinutes(location)`: 40 minutes in Jerusalem (local minhag), 18 elsewhere in Israel, 20 outside Israel, or `location.candleLightingMinutes` when set. It fires before Shabbat and before Yom Tov.
- `HebcalService` wraps `@hebcal/core` for Hebrew dates, parasha, holidays, yom tov, Daf Yomi, Omer, and Shabbat.
- Always pass `Location` to `HebcalService.isShabbat(date, location)` for halachic boundary behavior. Without a location it falls back to Gregorian Saturday only.
- Avoid UTC date shortcuts for mitzvah logic.
- Two calendars meet here, and they disagree whenever the device's zone is not the location's. A day the app shows or keys (`dateKey()`, schedule cells, history rows) is the device's calendar date. Zmanim, Shabbat, Yom Tov and the Hebrew date belong to the location's. Never answer a location question through device-local getters:
  - `ZmanimService` and `HebcalService.isShabbat` / `isYomTov` / `getHebrewDateAt` resolve an instant's civil day in the location's zone.
  - Static `computeWindow`s take their weekday, next day and Omer count from the day `ctx.zmanim` belong to, at its midday — never from `ctx.date`, whose clock time depends on the caller. See [src/data/AGENTS.md](src/data/AGENTS.md).
  - Day-level surfaces turn a device calendar day into the same date at the location with `locationNoon()` from [src/utils/locationDay.ts](src/utils/locationDay.ts). Device-local midnight is the previous day at a location west of the device.
  - Custom mitzvah windows put the device's calendar date of `ctx.date` on the location's clock through Luxon.

## Notification Engine

[NotificationScheduler.ts](src/services/NotificationScheduler.ts) is the scheduling brain. Keep API parity with [NotificationScheduler.web.ts](src/services/NotificationScheduler.web.ts).

Important constants and contracts:

- Categories: `mitzvah_reminder` (mark-done only) and `mitzvah_reminder_text` (open text + mark done), chosen per reminder by `hasSiddurText()`
- Actions: `MARK_DONE` (background) and `OPEN_TEXT` (opens the app to `/siddur/[id]?date=`)
- Scheduled identifier format: `${mitzvahId}__${YYYY-MM-DD}__${reminderIndex}`
- Pending guard: `PENDING_LIMIT = 60`, `IOS_MAX = 64`
- Normal horizon: today + tomorrow. Candidates are ordered by trigger time and capped at `IOS_MAX - 4` on iOS / `PENDING_LIMIT` elsewhere, so an overflow drops the furthest-out reminders rather than all of tomorrow.
- Daily rebuild task: `jew-in-time-daily-rebuild`, gated by `notifications:last-rebuild-date` and intended to run once per local day at/after 00:15.
- Background notification action task: `jew-in-time-notification-actions`.
- Delivery must stay EXACT. expo-notifications only calls `setExactAndAllowWhileIdle` when `AlarmManager.canScheduleExactAlarms()` is true, and there is no JS API to detect the fallback — so the manifest is the only guarantee. `USE_EXACT_ALARM` covers API 33+, `SCHEDULE_EXACT_ALARM` (capped at `maxSdkVersion=32` by [scripts/withExactAlarmPermissions.js](scripts/withExactAlarmPermissions.js)) covers Android 12. Pinned by [exactAlarmConfig.test.ts](src/services/__tests__/exactAlarmConfig.test.ts).

Behavior to preserve:

- `scheduleAll()` and `rebuild()` go through `withLock()`, which coalesces on the trailing edge: a request arriving mid-run queues exactly one re-run so the newest state is always applied.
- `rebuild()` cancels all scheduled notifications and schedules enabled mitzvot again. Only `rebuildForNewDay()` records the last rebuild date, so a settings-driven rebuild cannot suppress the nightly recovery run.
- `scheduleOne()` skips disabled/no-permission cases, Shabbat/Yom Tov skips, `null` windows, skipped or completed mitzvot for that date, and past triggers.
- `cancelForMitzvah(id, date)` cancels all pending reminders for that mitzvah/date and dismisses the presented ones, so marking a mitzvah done anywhere clears it from the tray and prevents later same-day notifications.
- A language change rebuilds the schedule, because notification text and button titles are translated at scheduling time.
- `SCHEDULE_FORMAT` is raised whenever a scheduled notification changes shape, so the first foreground after an update rebuilds once.
- `useCompletionsStore.markDone`, `markSkipped`, and `unmark` also trigger notification cancellation/rebuild through a queued `require()` to avoid import cycles.
- `initNotificationHandlers()` is called from [_layout.tsx](src/app/_layout.tsx) after fonts load and returns a teardown the layout runs on unmount. It also calls `refreshSchedulingOnForeground()`, which home repeats on `AppState 'active'` so the horizon cannot silently expire. It sets the foreground handler, registers category/action tasks, syncs permission, dismisses already-completed presented notifications, subscribes to store changes, and registers the daily rebuild task.
- Tapping the notification body routes to `/mitzvah/[id]`; tapping `OPEN_TEXT` routes to `/siddur/[id]` with the notification's `dateKey`, buffered like the body tap on a cold start; tapping `MARK_DONE` marks completion without foregrounding the app.
- [withMitzvahNotificationAction.js](scripts/withMitzvahNotificationAction.js) is an Expo config plugin that writes an Android Kotlin service to dismiss a notification after the mark-done action. Keep this in mind when changing notification action IDs.
- Both `TaskManager.defineTask` calls live at [NotificationScheduler.ts](src/services/NotificationScheduler.ts) module scope, and the bundle entry is the root [index.js](index.js) (the `main` field in [package.json](package.json)), which imports that module. A killed-state `MARK_DONE` tap and background fetch arrive as headless launches that never load route modules — a `defineTask` reachable only through the router tree never runs and the OS-invoked event is silently dropped. Pinned by [backgroundTaskEntry.test.ts](src/services/__tests__/backgroundTaskEntry.test.ts).

The web scheduler file is intentionally a no-op shim. If adding exported scheduler helpers, add matching exports to both native and web files.

## State and Persistence

All primary stores use Zustand with MMKV persistence through `StorageService.createZustandStorage()`.

- `useUserStore` (`user-store`): nusach, location, theme, language, notification permission/toggle, profile fields, halachic opinions, in-Israel flag, onboarding flag.
- `useMitzvotStore` (`mitzvot-store`): enabled state and custom reminders per mitzvah.
- `useCompletionsStore` (`completions-store`): `completions[YYYY-MM-DD][mitzvahId] = timestamp` and parallel `skipped` map.
- `useCustomMitzvotStore` (`custom-mitzvot-store`): user-created mitzvah definitions.

[zustandMiddleware.ts](src/stores/zustandMiddleware.ts) deliberately requires `../../node_modules/zustand/middleware.js`. Do not replace it with a direct ESM import unless Metro and Jest are both verified.

`AppResetService.reset()` cancels notifications, resets all stores, and clears MMKV on native.

## UI, Theme, RTL, and i18n

- The app loads Heebo font weights in [_layout.tsx](src/app/_layout.tsx).
- Use `useTheme()` and `src/theme/*` tokens. Avoid hard-coded colors in new UI unless there is a narrow reason.
- Translation tables are flat JSON dictionaries in [he.json](src/i18n/he.json) and [en.json](src/i18n/en.json); tests enforce key parity and non-empty values.
- `setLocale()` and `useI18n()` are lightweight wrappers. The `i18n-js` package is installed but the current app does not rely on the normal `i18n-js` runtime API.
- RTL is dynamic based on `useUserStore.language`. `_layout.tsx` calls `I18nManager.allowRTL/forceRTL`; native language direction changes can require a reload.
- Web also sets `document.documentElement.dir/lang` and `body.dir`.
- Main reusable UI components: `MitzvahCard`, `CompletedRow`, `ReminderEditor`, `TimeRibbon`, `BottomTabs`, `NavBar`, `HebrewDate`, and `AppLogo`.

## Tests

Jest uses the `jest-expo` preset configured in [package.json](package.json).

Coverage areas:

- [src/data/__tests__/](src/data/__tests__) - registry integrity, windows, city data, skip metadata, nusach filtering, and siddur content per nusach on dated days.
- [src/services/__tests__/](src/services/__tests__) - zmanim, Hebcal, location, storage, scheduler, notification responses, settings logic, web-shim parity, exact-alarm config.
- [src/stores/__tests__/](src/stores/__tests__) - store behavior and completion/skipped edge cases.
- [src/utils/__tests__/](src/utils/__tests__) - day timeline, history stats, cross-surface `skipOn` agreement, and liturgical day flags.
- [src/i18n/__tests__/](src/i18n/__tests__) - translation parity and brand regression checks.
- [src/theme/__tests__/](src/theme/__tests__) - token/key sanity.
- [src/app/__tests__/routes.test.ts](src/app/__tests__/routes.test.ts) - Expo Router route discovery/regression tests.
- [src/components/__tests__/](src/components/__tests__) - reusable component behavior.

Test rules that exist because the suite once passed while the app was broken:

- A test must import the shipped implementation. Re-declaring the logic under test asserts only that the test agrees with itself.
- Assert values, not types. `expect(typeof x).toBe('boolean')` passes for both answers.
- A test must be able to fail for the reason it claims. `scheduleOne` compares triggers against the real clock, so fixtures in the past pass vacuously; derive dates from `Date.now()` instead.
- A fixture must mean the same moment in every zone. `new Date(2026, 3, 24, 20)` is 20:00 on the device's clock, so build an instant for an instant API with `at(location, '2026-04-24T20:00')` from [src/testing/zmanim.ts](src/testing/zmanim.ts). Calendar-day APIs (`dateKey`, `getHebrewDate`, `getHolidays`, and `isShabbat` / `omerDayFor` without a location) read device-local dates, so they take local-component dates.
- Run [pnpm test:tz](scripts/test-timezones.js) after touching date or timezone logic. It runs every suite in four real zones, and a setup guard fails any run whose zone did not take effect.

When adding ESM or native-adjacent dependencies, check `transformIgnorePatterns` in [package.json](package.json); Jest may need the dependency allowlisted.

For notification changes, run at least:

```bash
pnpm test -- src/services/__tests__/NotificationScheduler.test.ts
pnpm test -- src/services/__tests__/notificationResponseHandler.test.ts
pnpm typecheck
```

For mitzvah/zmanim changes, run at least:

```bash
pnpm test -- src/data/__tests__/mitzvot.test.ts
pnpm test -- src/data/__tests__/mitzvot.windows.test.ts
pnpm test -- src/services/__tests__/ZmanimService.test.ts
pnpm test -- src/services/__tests__/HebcalService.test.ts
pnpm typecheck
```

## Common Change Checklist

- New route: add the file under [src/app/](src/app), update navigation/tabs if needed, then update [routes.test.ts](src/app/__tests__/routes.test.ts).
- New UI copy: update both [he.json](src/i18n/he.json) and [en.json](src/i18n/en.json), then run i18n tests.
- New theme token: update both `T_LIGHT` and `T_DARK` in [colors.ts](src/theme/colors.ts), then run theme tests.
- New mitzvah: update the registry, default enabled behavior, detail/schedule/history expectations, and tests. A mitzvah added after release needs the `merge` in [useMitzvotStore.ts](src/stores/useMitzvotStore.ts) to reach existing users.
- New scheduler export: update [NotificationScheduler.web.ts](src/services/NotificationScheduler.web.ts) too; [schedulerWebParity.test.ts](src/services/__tests__/schedulerWebParity.test.ts) enforces it.
- New notification action/category ID: update scheduler constants, response handling, the [Android config plugin](scripts/withMitzvahNotificationAction.js), and notification tests.
- New background task (`TaskManager.defineTask`): define it in a module imported from the root [index.js](index.js), never only behind a route module — headless launches do not load the router tree.
- New persisted store field: add a default, reset behavior, and a `version`/`migrate` step in [persistOptions.ts](src/stores/persistOptions.ts) if old persisted data may exist.
- New decision about whether a mitzvah applies to a day: extend [skipRules.ts](src/utils/skipRules.ts). Never add a second copy of that predicate.
- New nusach text or day-dependent insert: follow [scripts/siddur/AGENTS.md](scripts/siddur/AGENTS.md) — registry in [siddur.ts](src/data/siddur.ts), day flags in [siddur.ts](src/utils/siddur.ts), manifest, `pnpm siddur:build`, dated content tests.
- New Android permission or config plugin: re-run [pnpm prebuild:clean](package.json) and check the generated manifest, then [pnpm check:dox](scripts/check-dox.js).
- New or moved AGENTS.md: run [pnpm check:dox](scripts/check-dox.js) — it verifies links, section order, and every Child DOX Index.
- Version bump: raise `version` in [app.json](app.json) and [package.json](package.json) in the same edit, and only in a change that also produces a native build. See [Release and Updates](#release-and-updates) for why a bump on its own strands every installed user.

## Documentation Notes

Older docs and prototypes may still use earlier branding or assumptions. Treat the current code, [app.json](app.json), [AUDIT.md](AUDIT.md), and this file as authoritative unless the user says otherwise.

## DOX Framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Links

- Every reference to a project file or folder must be a relative Markdown link to that path, not plain text, so any reader can open it directly
- This applies to every Child DOX Index entry and to any inline mention of a concrete file or folder in a DOX doc
- Link targets are relative to the directory of the AGENTS.md that contains them, so they resolve when the doc is opened in place
- Child DOX Index entry format: `- [<relative-path>](<relative-path>) — <scope description>`
- Before editing or indexing a linked target, read it first (see Read Before Editing); a link must always point at a file that exists

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run `pnpm check:dox`, plus the verification named by the docs you touched
6. Report any docs intentionally left unchanged and why

`pnpm check:dox` ([scripts/check-dox.js](scripts/check-dox.js)) enforces the mechanical half of this
contract: dead links, missing or misordered sections, and a Child DOX Index that disagrees with the
tree. It cannot judge whether the prose is still true — that part is still the closeout's job.

## User Preferences

- Answers and work products should be high quality and verified as far as practical for the requested scope.
- Agents should choose and use relevant skills on their own when the request calls for them.
- Task queues, PRDs, planning files, and similar planning artifacts must be written in English unless the user explicitly asks for another language.
- In coding tasks, apply YAGNI: favor simple, concise solutions, including one-liners when they genuinely improve clarity without sacrificing quality, readability, maintainability, or design.
- DOX indexes and durable file references should use Markdown links to the referenced files whenever practical.

## Child DOX Index

- [assets/AGENTS.md](assets/AGENTS.md) - Static image assets for icons, splash, favicon, and notifications.
- [design/AGENTS.md](design/AGENTS.md) - Design handoff materials and prototype boundaries.
- [docs/AGENTS.md](docs/AGENTS.md) - Public GitHub Pages site: support page and privacy policy.
- [release/AGENTS.md](release/AGENTS.md) - Store metadata, privacy copy, and release-facing documents.
- [scripts/AGENTS.md](scripts/AGENTS.md) - Local utility scripts and Expo config plugins.
- [src/AGENTS.md](src/AGENTS.md) - Application source, routes, services, stores, data, i18n, theme, and tests.
