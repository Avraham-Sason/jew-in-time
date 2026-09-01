# AGENTS.md

## Purpose

- Own release-facing written artifacts for stores, privacy, and public metadata.

## Ownership

- [APP_STORE_METADATA_HE.md](APP_STORE_METADATA_HE.md) and [APP_STORE_METADATA_EN.md](APP_STORE_METADATA_EN.md) own App Store listing copy.
- [PLAY_CONSOLE_METADATA.md](PLAY_CONSOLE_METADATA.md) owns Google Play listing copy.
- The published privacy policy lives in [../docs/privacy/index.html](../docs/privacy/index.html) and [../docs/privacy/en/index.html](../docs/privacy/en/index.html), not here. This folder owns store copy only.

## Local Contracts

- Keep release copy aligned with the current display name, package identifiers, privacy behavior, and offline-only architecture described in [../AGENTS.md](../AGENTS.md) and [../app.json](../app.json).
- Do not claim backend, account, sync, analytics, or cloud behavior unless current source code and config prove it.
- Hebrew copy should preserve Hebrew-first product positioning; English copy should be a faithful market-facing equivalent, not a literal machine translation.

## Work Guidance

- Update release documents when app behavior, permissions, data collection, branding, or store-visible features change.
- Store URLs and contact details must be real values. A placeholder in a field a store form consumes is a release blocker, not a note for later.

## Verification

- Run `pnpm test -- src/i18n/__tests__/i18n.test.ts` after changing the app name, which the brand regression test pins.
- Cross-check any permission or data claim against [../app.json](../app.json), the published policy in [../docs/](../docs), and the privacy behavior described in [../src/services/AGENTS.md](../src/services/AGENTS.md) before publishing.
- Confirm the display name here matches [../app.json](../app.json); the store listing, the on-device name and this copy must agree.

## Child DOX Index

- No child AGENTS.md files.
