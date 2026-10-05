# AGENTS.md

## Purpose

- Own local workflow scripts and Expo config plugins that affect development startup or generated native behavior.

## Ownership

- [withExactAlarmPermissions.js](withExactAlarmPermissions.js) caps `SCHEDULE_EXACT_ALARM` at `maxSdkVersion=32` so exact alarms work on every Android version without triggering Google's exact-alarm declaration form.
- [free-port.js](free-port.js) frees a local TCP port before `pnpm web`, cross-platform.
- [jest-timezone-setup.js](jest-timezone-setup.js) applies `JEST_TZ` inside the Jest process; a `TZ=` command prefix is ignored by Node on Windows.
- [test-timezones.js](test-timezones.js) runs the whole suite across four zones.
- [withMitzvahNotificationAction.js](withMitzvahNotificationAction.js) is an Expo config plugin that injects Android notification action handling.
- [check-dox.js](check-dox.js) enforces the mechanical half of the DOX contract: dead links, plain-text file references, section order, and Child DOX Index accuracy.
- [jest-asset-stub.js](jest-asset-stub.js) stands in for siddur asset modules under Jest, where Metro asset resolution does not exist.
- [siddur/AGENTS.md](siddur/AGENTS.md) owns the siddur content build.

## Local Contracts

- Scripts must be plain Node and cross-platform. A shell-specific script silently breaks every non-Windows contributor and CI runner; that is why `pnpm web` no longer shells out to PowerShell.
- Scripts must be non-interactive: they run from `pnpm` scripts and in CI, where nothing can answer a prompt.
- The notification config plugin must stay aligned with scheduler constants in [../src/services/AGENTS.md](../src/services/AGENTS.md), especially `MARK_DONE`.
- Generated native folders are not owned here; the plugin source is the durable artifact.

## Work Guidance

- Prefer narrow script changes over adding new tools.
- For config plugin changes, reason through both manifest mutations and generated Kotlin output.

## Verification

- Run `pnpm web` or `node scripts/free-port.js <port>` after changing [free-port.js](free-port.js).
- Run `pnpm test:tz` after changing date or timezone handling.
- Run `pnpm doctor` after changing Expo config plugin behavior.
- Run `pnpm check:dox` after changing [check-dox.js](check-dox.js) itself, and confirm it still fails on a deliberately broken link before trusting a pass.
- Use a dev client or native build to verify Android notification-action behavior.

## Child DOX Index

- [siddur/AGENTS.md](siddur/AGENTS.md) - Build from pinned Sefaria and Wikisource sources to the bundled, day-conditioned nusach texts.
