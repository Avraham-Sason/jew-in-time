# AGENTS.md

## Purpose

- Own reusable React Native UI components shared across routes.

## Ownership

- Components include [MitzvahCard.tsx](MitzvahCard.tsx), [CompletedRow.tsx](CompletedRow.tsx), [ReminderEditor.tsx](ReminderEditor.tsx), [TimeRibbon.tsx](TimeRibbon.tsx), [BottomTabs.tsx](BottomTabs.tsx), [NavBar.tsx](NavBar.tsx), [HebrewDate.tsx](HebrewDate.tsx), [AppLogo.tsx](AppLogo.tsx), and [ShabbatScreen.tsx](ShabbatScreen.tsx).
- [ShabbatScreen.tsx](ShabbatScreen.tsx) renders an in-tree overlay above the navigator, never a native `Modal`, which on iOS cannot present over another one. Android back exits the app. The caller decides when it shows. The file also owns `QuietBlockContext` and `useQuietBlock()`.
- A component that renders a `Modal` gates it with `!useQuietBlock()`, as [ReminderEditor.tsx](ReminderEditor.tsx) does.
- Component tests live in [__tests__/](__tests__/).

## Local Contracts

- Use [../theme/AGENTS.md](../theme/AGENTS.md) tokens and `useTheme()` instead of hard-coded colors unless there is a narrow reason.
- Keep components reusable and prop-driven; business rules belong in [../services/AGENTS.md](../services/AGENTS.md), [../stores/AGENTS.md](../stores/AGENTS.md), [../data/AGENTS.md](../data/AGENTS.md), or [../utils/AGENTS.md](../utils/AGENTS.md).
- Preserve RTL and Hebrew-first layout behavior. Position with direction-relative `start`/`end`; never combine a `language`-driven rotation with physical `left`/`right`, which RN swaps by `I18nManager.isRTL` instead — two sources of truth that disagree on first launch.
- The same swap applies to `textAlign`: native RN flips `left`/`right` under `I18nManager.isRTL`, while react-native-web keeps them literal, so a web preview cannot catch it. Leave `textAlign` at its start default, or derive the physical edge from `I18nManager.isRTL`, as the siddur reader does.
- [MitzvahCard.tsx](MitzvahCard.tsx) renders the open-text button beside the check button only when the caller passes `onOpenText`; the caller decides availability through `hasSiddurText()`.
- Logic worth testing must be exported and imported by the test, never re-declared inside it.

## Work Guidance

- Add focused tests for reusable behavior that can regress independently of a route.
- Avoid changing shared component semantics to satisfy one screen unless the new contract is valid for all callers.

## Verification

- Run `pnpm test -- src/components/__tests__/TimeRibbon.test.ts` after TimeRibbon changes.
- Run relevant route or service tests for components whose behavior is coupled to those domains.
- Run `pnpm typecheck` after component prop changes.

## Child DOX Index

- No child AGENTS.md files.
