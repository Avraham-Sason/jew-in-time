# AGENTS.md

## Purpose

- Own mitzvah detail routes for static and custom mitzvot.

## Ownership

- [[id].tsx](%5Bid%5D.tsx) renders mitzvah details, reminders, content blocks, and detail-level actions.

## Local Contracts

- Use [../../data/customMitzvotAdapter.ts](../../data/customMitzvotAdapter.ts), `getAllMitzvot()`, or `findAnyMitzvah()` when a detail route must include both static and custom mitzvot.
- Reminder edits must stay compatible with [../../services/AGENTS.md](../../services/AGENTS.md) scheduler contracts.
- Content block rendering must support text, blessing, and link blocks without breaking Hebrew-first layout.

## Work Guidance

- Keep detail-screen behavior state-driven through stores and services.
- When reminder behavior changes, update notification tests as well as screen behavior if applicable.

## Verification

- Run `pnpm test -- src/services/__tests__/NotificationScheduler.test.ts` after reminder scheduling behavior changes.
- Run `pnpm test -- src/data/__tests__/mitzvot.test.ts` after static mitzvah detail fields change.
- Run `pnpm typecheck` after route param, content block, or reminder type changes.

## Child DOX Index

- No child AGENTS.md files.
