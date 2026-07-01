# AGENTS.md

## Purpose

- Own reusable React Native UI components shared across routes.

## Ownership

- Components include [MitzvahCard.tsx](MitzvahCard.tsx), [CompletedRow.tsx](CompletedRow.tsx), [ReminderEditor.tsx](ReminderEditor.tsx), [TimeRibbon.tsx](TimeRibbon.tsx), [BottomTabs.tsx](BottomTabs.tsx), [NavBar.tsx](NavBar.tsx), [HebrewDate.tsx](HebrewDate.tsx), and [AppLogo.tsx](AppLogo.tsx).
- Component tests live in [__tests__/](__tests__/).

## Local Contracts

- Use [../theme/AGENTS.md](../theme/AGENTS.md) tokens and `useTheme()` instead of hard-coded colors unless there is a narrow reason.
- Keep components reusable and prop-driven; business rules belong in [../services/AGENTS.md](../services/AGENTS.md), [../stores/AGENTS.md](../stores/AGENTS.md), [../data/AGENTS.md](../data/AGENTS.md), or [../utils/AGENTS.md](../utils/AGENTS.md).
- Preserve RTL and Hebrew-first layout behavior.

## Work Guidance

- Add focused tests for reusable behavior that can regress independently of a route.
- Avoid changing shared component semantics to satisfy one screen unless the new contract is valid for all callers.

## Verification

- Run `pnpm test -- src/components/__tests__/TimeRibbon.test.ts` after TimeRibbon changes.
- Run relevant route or service tests for components whose behavior is coupled to those domains.
- Run `pnpm typecheck` after component prop changes.

## Child DOX Index

- No child AGENTS.md files.
