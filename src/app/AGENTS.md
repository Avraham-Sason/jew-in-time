# AGENTS.md

## Purpose

- Own Expo Router routes, layouts, navigation, and screen-level composition.

## Ownership

- [_layout.tsx](_layout.tsx) owns root providers, fonts, RTL sync, onboarding redirect guard, notification handler initialization, the Shabbat gate, and the exported `ErrorBoundary` that expo-router installs at the root.
- The Shabbat gate (`useCurrentQuietBlock()` + [ShabbatScreen](../components/ShabbatScreen.tsx)) covers every route while `quietBlockAt()` holds, once onboarded — before that the location is only a default. It re-reads at the next `nextQuietBoundary()` and on every `AppState 'active'`, keeps the `Stack` mounted and hidden from accessibility so a notification tap still has a navigator, provides the block through `QuietBlockContext`, and unwinds the stack when a block starts and after any navigation inside it, so the reader's keep-awake never runs on Shabbat.
- Every screen `Modal` closes while `useQuietBlock()` holds: a native modal would sit above the in-tree Shabbat screen.
- [index.tsx](index.tsx) owns root redirects.
- [(tabs)/AGENTS.md](<(tabs)/AGENTS.md>) owns the main tab screens.
- [onboarding/AGENTS.md](onboarding/AGENTS.md) owns onboarding flow screens.
- [day/AGENTS.md](day/AGENTS.md) owns day drilldown routes.
- [mitzvah/AGENTS.md](mitzvah/AGENTS.md) owns mitzvah detail routes.
- [siddur/AGENTS.md](siddur/AGENTS.md) owns the nusach reader route.
- [taharah/AGENTS.md](taharah/AGENTS.md) owns the taharat hamishpacha dashboard, log, calendar and settings routes.
- [custom-mitzvah.tsx](custom-mitzvah.tsx) owns custom mitzvah create/edit UI.
- [checkin.tsx](checkin.tsx) owns the post-block check-in: the route that lists a block's past days for marking, because they could not be marked while they happened (the reader's "סיימתי" still marks its own window date). It keeps the block it opened with on screen after the last mark, refuses marks once the deadline has passed, and marks from a tap anywhere on a card, so a screen reader can mark too. Leaving with everything marked finishes the check-in. The root layout opens it by itself once per block, the first time the app is open after the block ends and onboarding is done; only the screen records `CHECK_IN_PROMPTED_KEY`, so a push that never landed is retried.

## Local Contracts

- The router root is configured in [../../app.json](../../app.json) as `extra.router.root = "./src/app"`.
- Keep route params validated before using them in services, stores, or navigation.
- Route-level user-facing copy should use [../i18n/AGENTS.md](../i18n/AGENTS.md) unless it is narrow, static, and intentionally local.
- Screens should compose services, stores, and reusable components rather than duplicating domain logic.
- A row of selectable pills is [ChipRow](../components/ChipRow.tsx), a settings card is [SettingsSection](../components/SettingsSection.tsx), a ticking clock is [useNow](../hooks/useNow.ts), and the stage line that home and the taharah dashboard show is `renderHint(stageHint(…))` from [summary.ts](../utils/taharah/summary.ts): a screen never keeps its own copy of any of them.

## Work Guidance

- New routes must update [__tests__/routes.test.ts](__tests__/routes.test.ts) when route discovery expectations change.
- New tab routes must be registered under [(tabs)/_layout.tsx](<(tabs)/_layout.tsx>) and include i18n labels.
- Keep native notification initialization centralized in [_layout.tsx](_layout.tsx).

## Verification

- Run `pnpm test -- src/app/__tests__/routes.test.ts` after route additions, deletions, or renames.
- Run `pnpm typecheck` after route/component prop changes.
- Run `pnpm test -- src/i18n/__tests__/i18n.test.ts` after route-visible copy key changes.

## Child DOX Index

- [(tabs)/AGENTS.md](<(tabs)/AGENTS.md>) - Main tab navigation and tab screens.
- [day/AGENTS.md](day/AGENTS.md) - Read-only per-day schedule/history drilldown.
- [mitzvah/AGENTS.md](mitzvah/AGENTS.md) - Static and custom mitzvah detail screens.
- [siddur/AGENTS.md](siddur/AGENTS.md) - Nusach reader opened from notifications and the mitzvah screen.
- [onboarding/AGENTS.md](onboarding/AGENTS.md) - Welcome, profile, nusach, location/notification, and ready flow.
- [taharah/AGENTS.md](taharah/AGENTS.md) - Taharat hamishpacha dashboard, logging form, month calendar, and settings.
