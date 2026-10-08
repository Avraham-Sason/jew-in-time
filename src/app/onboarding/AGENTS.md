# AGENTS.md

## Purpose

- Own the first-run onboarding flow for welcome, profile, nusach, location/notification setup, and ready state.

## Ownership

- [index.tsx](index.tsx) owns the onboarding entry route.
- [profile.tsx](profile.tsx) owns the second step: gender, and the opt-in to taharat hamishpacha tracking.
- [nusach.tsx](nusach.tsx), [location.tsx](location.tsx), and [ready.tsx](ready.tsx) own their respective onboarding steps.
- Every step draws its progress with [OnboardingDots](../../components/OnboardingDots.tsx) and `ONBOARDING_STEPS`; a new step raises that constant and shifts the later steps' indexes.

## Local Contracts

- Onboarding state is stored through [../../stores/AGENTS.md](../../stores/AGENTS.md).
- Continue on the profile step stays disabled until a gender is chosen. The gender, the tracking switch and the nusach choice go through [taharahOptIn.ts](../../stores/taharahOptIn.ts) (`chooseGender`, `setTaharahTracking`, `chooseNusach`), never straight to the stores: switching tracking on sets the taharah role from the gender and the preset from the nusach chosen so far; changing the gender while tracking is on updates the role; picking a nusach with tracking on adopts its preset. The guard that protects a worked preset lives in `useTaharahStore` (no events and rules identical to the current preset's), so a later nusach pick never overwrites a recorded cycle or a hand-edited rule.
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
