# AGENTS.md

## Purpose

- Own visual tokens, typography, colors, shadows, and theme provider behavior.

## Ownership

- [tokens.ts](tokens.ts), [colors.ts](colors.ts), [typography.ts](typography.ts), and [shadowStyle.ts](shadowStyle.ts) own theme primitives.
- [colors.ts](colors.ts) owns the six palettes (`THEMES`, `THEME_NAMES`, `ThemeName`): gold (`T_LIGHT`), pink, purple and blue on white, and two dark ones, dark (navy, gold accent) and plum (dark plum, rose accent), listed in `DARK_THEMES`, the one place `isDarkTheme()` reads.
- [ThemeProvider.tsx](ThemeProvider.tsx) owns runtime theme access: it resolves `useUserStore.theme` to `{ colors, isDark, name }` and syncs the OS appearance through `Appearance.setColorScheme`, so alerts, the keyboard and switches follow the palette.
- Theme tests live in [__tests__/](__tests__/).

## Local Contracts

- A new token is added to every palette in `THEMES`; the theme test pins identical key sets.
- `gold`, `onGold` and `goldLight` are the accent tokens of every palette, pink in the pink theme and so on, so a screen never assumes they are yellow. `headerAccent` is the accent as drawn on `headerBg` (the home counter, the history streak, the schedule view toggle, the logo star): the same value as `gold` in the gold and dark palettes and a pale tint in the others, because `gold` on the tinted headers reads under 2:1.
- The light palettes keep white surfaces and the shared status colours (urgent, warning, safe) and differ in `bg`, `border`, accent and header.
- The theme test also pins WCAG contrast floors (text/bg, text/surface, textMuted/surface, onGold/gold, headerText/headerBg and headerAccent/headerBg at 4.5 or more, textSub/surface at 4.0 or more), so a palette edit that breaks readability fails the suite; it reads hex tokens only, so `headerSub` (rgba) is checked by hand when a header changes. Every palette name has a `settings.theme.<name>` label in both dictionaries, pinned by the same suite.
- The theme picker is [ThemeSwatchRow](../components/ThemeSwatchRow.tsx), never a local copy.
- Keep typography compatible with the Heebo and Noto Serif Hebrew font loading in [../app/_layout.tsx](../app/_layout.tsx). Noto Serif Hebrew is the prayer-text family because it covers every nikud and cantillation mark; Heebo does not.
- New UI should use theme tokens and `useTheme()` instead of one-off styling.

## Work Guidance

- Prefer extending existing tokens over scattering hard-coded colors or spacing.
- Coordinate token changes with affected components and screenshots/manual checks when visual risk is high.

## Verification

- Run `pnpm test -- src/theme/__tests__/theme.test.ts` after token, color, typography, or provider changes.
- Run `pnpm typecheck` after theme type changes.

## Child DOX Index

- No child AGENTS.md files.
