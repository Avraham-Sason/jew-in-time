# AGENTS.md

## Purpose

- Own local workflow scripts and Expo config plugins that affect development startup or generated native behavior.

## Ownership

- [withExactAlarmPermissions.js](withExactAlarmPermissions.js) caps `SCHEDULE_EXACT_ALARM` at `maxSdkVersion=32` so exact alarms work on every Android version without triggering Google's exact-alarm declaration form.
- [free-port.js](free-port.js) frees a local TCP port before `pnpm web`, cross-platform.
- [jest-timezone-setup.js](jest-timezone-setup.js) applies `JEST_TZ` inside the Jest process; a `TZ=` command prefix is ignored by Node on Windows.
- [test-timezones.js](test-timezones.js) runs the whole suite across four zones.
- [withMitzvahNotificationAction.js](withMitzvahNotificationAction.js) is an Expo config plugin that injects Android notification action handling.

## Local Contracts

- Keep PowerShell scripts Windows-friendly and non-interactive unless the user asks otherwise.
- The notification config plugin must stay aligned with scheduler constants in [../src/services/AGENTS.md](../src/services/AGENTS.md), especially `MARK_DONE`.
- Generated native folders are not owned here; the plugin source is the durable artifact.

## Work Guidance

- Prefer narrow script changes over adding new tools.
- For config plugin changes, reason through both manifest mutations and generated Kotlin output.

## Verification

- Run `pnpm web` or `node scripts/free-port.js <port>` after changing [free-port.js](free-port.js).
- Run `pnpm test:tz` after changing date or timezone handling.
- Run `pnpm doctor` after changing Expo config plugin behavior.
- Use a dev client or native build to verify Android notification-action behavior.

## Child DOX Index

- No child AGENTS.md files.
