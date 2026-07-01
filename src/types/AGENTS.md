# AGENTS.md

## Purpose

- Own shared TypeScript domain types used across data, services, stores, and UI.

## Ownership

- [mitzvah.ts](mitzvah.ts) owns mitzvah, reminder, content block, and related domain shapes.
- [zmanim.ts](zmanim.ts) owns zmanim-related shared types.

## Local Contracts

- Type changes must be coordinated with all consumers in [../data/AGENTS.md](../data/AGENTS.md), [../services/AGENTS.md](../services/AGENTS.md), [../stores/AGENTS.md](../stores/AGENTS.md), and [../app/AGENTS.md](../app/AGENTS.md).
- Keep optional fields backward-compatible when persisted data or custom mitzvot may already exist.

## Work Guidance

- Favor explicit domain names over broad generic shapes.
- Avoid widening types just to suppress local errors; fix the caller or model the state precisely.

## Verification

- Run `pnpm typecheck` after any type change.
- Run affected domain tests when a type change changes runtime behavior.

## Child DOX Index

- No child AGENTS.md files.
