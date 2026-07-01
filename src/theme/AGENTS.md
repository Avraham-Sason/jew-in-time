# AGENTS.md

## Purpose

- Own visual tokens, typography, colors, shadows, and theme provider behavior.

## Ownership

- [tokens.ts](tokens.ts), [colors.ts](colors.ts), [typography.ts](typography.ts), and [shadowStyle.ts](shadowStyle.ts) own theme primitives.
- [ThemeProvider.tsx](ThemeProvider.tsx) owns runtime theme access.
- Theme tests live in [__tests__/](__tests__/).

## Local Contracts

- Update both light and dark theme surfaces when adding tokens.
- Keep typography compatible with the Heebo font loading in [../app/_layout.tsx](../app/_layout.tsx).
- New UI should use theme tokens and `useTheme()` instead of one-off styling.

## Work Guidance

- Prefer extending existing tokens over scattering hard-coded colors or spacing.
- Coordinate token changes with affected components and screenshots/manual checks when visual risk is high.

## Verification

- Run `pnpm test -- src/theme/__tests__/theme.test.ts` after token, color, typography, or provider changes.
- Run `pnpm typecheck` after theme type changes.

## Child DOX Index

- No child AGENTS.md files.
