# AGENTS.md

## Purpose

- Own React hooks shared by more than one screen or component.

## Ownership

- [useNow.ts](useNow.ts) owns the clock tick: `useNow(intervalMs = 30_000)` returns a `Date` that starts at mount, first moves at the next whole minute, then every `intervalMs`, and stops on unmount. Home, the taharah dashboard and the taharah log all read it, so a countdown, a stage, a task window and the sunset guard follow the same clock and the day rolls over on the minute.

## Local Contracts

- A hook here holds React state or effects. Pure computation belongs in [../utils/AGENTS.md](../utils/AGENTS.md), persisted state in [../stores/AGENTS.md](../stores/AGENTS.md).
- A screen that needs an exact instant reads `new Date()` where it decides; `useNow()` is the re-render trigger and a stable memo dependency, and may lag by up to `intervalMs`.
- Never re-implement the tick inline with `setInterval` in a screen.

## Work Guidance

- Add a hook only when a second caller exists; keep it small enough to read at a glance.

## Verification

- Run `pnpm typecheck` after changing a hook signature.

## Child DOX Index

- No child AGENTS.md files.
