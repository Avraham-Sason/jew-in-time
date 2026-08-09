# AGENTS.md

## Purpose

- Own translation dictionaries and locale wrapper behavior.

## Ownership

- [he.json](he.json) is the primary Hebrew dictionary.
- [en.json](en.json) is the English dictionary.
- [index.ts](index.ts) owns `setLocale()` and `useI18n()`.
- Translation parity tests live in [__tests__/](__tests__/).

## Local Contracts

- Keep dictionaries flat, with key parity between Hebrew and English.
- Do not replace Hebrew source strings with English.
- Normal route/component copy should use i18n keys rather than local string literals.
- `currentLocale` tracks the user store through a subscription, so non-React callers (the notification scheduler) are never a render behind. `useI18n()` returns a `t` bound to the current render's language.

## Work Guidance

- Add both Hebrew and English values in the same change.
- Keep app-name and brand strings aligned with [../../app.json](../../app.json) and release docs under [../../release/AGENTS.md](../../release/AGENTS.md).

## Verification

- Run `pnpm test -- src/i18n/__tests__/i18n.test.ts` after any dictionary or locale wrapper change.
- Run `pnpm typecheck` after [index.ts](index.ts) changes.

## Child DOX Index

- No child AGENTS.md files.
