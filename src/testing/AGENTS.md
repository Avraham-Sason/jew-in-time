# AGENTS.md

## Purpose

- Own fixture helpers that exist only for the test suite.

## Ownership

- [zmanim.ts](zmanim.ts) resolves zmanim for a fixture and throws when they are unavailable, so a bad fixture fails loudly instead of returning `null` into an assertion.

## Local Contracts

- Nothing under [../](../) that ships in the app may import from this folder. It is test-only by contract, not by convention.
- Helpers here may throw. That is the point: in a fixture an impossible value is a broken test, whereas in production the same value is a state the app must survive — see the `null` contract in [../services/AGENTS.md](../services/AGENTS.md).
- Do not put these files under a `__tests__/` folder; Jest would collect them as suites with no tests.

## Work Guidance

- Add a helper only when the same fixture setup is repeated across suites, and keep it small enough to read at a glance.
- A helper must never encode expected behavior. Assertions belong in the test that makes the claim.

## Verification

- Run `pnpm test` after changing a helper; every suite that uses it must still pass.
- Run `pnpm typecheck` after changing a helper signature.

## Child DOX Index

- No child AGENTS.md files.
