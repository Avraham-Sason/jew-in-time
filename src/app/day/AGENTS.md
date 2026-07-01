# AGENTS.md

## Purpose

- Own date-specific schedule/history drilldown routes.

## Ownership

- [[date].tsx](%5Bdate%5D.tsx) renders a single ISO-date route from schedule/history navigation.

## Local Contracts

- Validate route dates before computing day content.
- Past-day views are read-only and must not write completion state.
- Day content should be built through [../../utils/buildDayTimeline.ts](../../utils/buildDayTimeline.ts), not duplicated in the route.

## Work Guidance

- Preserve clear distinction between today/future interaction and historical read-only state.
- Reuse [../../components/MitzvahCard.tsx](../../components/MitzvahCard.tsx) behavior instead of creating route-specific completion controls.

## Verification

- Run `pnpm test -- src/app/__tests__/routes.test.ts` after route filename or path changes.
- Run `pnpm test -- src/utils/__tests__/buildDayTimeline.test.ts` after day item logic changes.
- Run `pnpm typecheck` after route param or component prop changes.

## Child DOX Index

- No child AGENTS.md files.
