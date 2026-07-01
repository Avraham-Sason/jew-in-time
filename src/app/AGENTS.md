# AGENTS.md

## Purpose

- Own Expo Router routes, layouts, navigation, and screen-level composition.

## Ownership

- [_layout.tsx](_layout.tsx) owns root providers, fonts, RTL sync, onboarding redirect guard, and notification handler initialization.
- [index.tsx](index.tsx) owns root redirects.
- [(tabs)/AGENTS.md](<(tabs)/AGENTS.md>) owns the main tab screens.
- [onboarding/AGENTS.md](onboarding/AGENTS.md) owns onboarding flow screens.
- [day/AGENTS.md](day/AGENTS.md) owns day drilldown routes.
- [mitzvah/AGENTS.md](mitzvah/AGENTS.md) owns mitzvah detail routes.
- [custom-mitzvah.tsx](custom-mitzvah.tsx) owns custom mitzvah create/edit UI.

## Local Contracts

- The router root is configured in [../../app.json](../../app.json) as `extra.router.root = "./src/app"`.
- Keep route params validated before using them in services, stores, or navigation.
- Route-level user-facing copy should use [../i18n/AGENTS.md](../i18n/AGENTS.md) unless it is narrow, static, and intentionally local.
- Screens should compose services, stores, and reusable components rather than duplicating domain logic.

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
- [onboarding/AGENTS.md](onboarding/AGENTS.md) - Welcome, nusach, location/notification, and ready flow.
