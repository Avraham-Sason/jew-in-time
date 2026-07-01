# AGENTS.md

## Purpose

- Own the first-run onboarding flow for welcome, nusach, location/notification setup, and ready state.

## Ownership

- [index.tsx](index.tsx) owns the onboarding entry route.
- [nusach.tsx](nusach.tsx), [location.tsx](location.tsx), and [ready.tsx](ready.tsx) own their respective onboarding steps.

## Local Contracts

- Onboarding state is stored through [../../stores/AGENTS.md](../../stores/AGENTS.md).
- Location and notification permission behavior must use [../../services/AGENTS.md](../../services/AGENTS.md) wrappers.
- User-facing copy must stay in [../../i18n/AGENTS.md](../../i18n/AGENTS.md).

## Work Guidance

- Keep permission explanations accurate to [../../../app.json](../../../app.json) native permission strings and actual local/offline behavior.
- Do not assume Expo Go can verify native notification/MMKV behavior.

## Verification

- Run `pnpm test -- src/app/__tests__/routes.test.ts` after onboarding route changes.
- Run `pnpm test -- src/i18n/__tests__/i18n.test.ts` after onboarding copy changes.
- Run `pnpm typecheck` after onboarding state or service changes.

## Child DOX Index

- No child AGENTS.md files.
