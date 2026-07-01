# AGENTS.md

## Purpose

- Own local workflow scripts and Expo config plugins that affect development startup or generated native behavior.

## Ownership

- [free-port.ps1](free-port.ps1) frees a local TCP port before `pnpm web`.
- [withMitzvahNotificationAction.js](withMitzvahNotificationAction.js) is an Expo config plugin that injects Android notification action handling.

## Local Contracts

- Keep PowerShell scripts Windows-friendly and non-interactive unless the user asks otherwise.
- The notification config plugin must stay aligned with scheduler constants in [../src/services/AGENTS.md](../src/services/AGENTS.md), especially `MARK_DONE`.
- Generated native folders are not owned here; the plugin source is the durable artifact.

## Work Guidance

- Prefer narrow script changes over adding new tools.
- For config plugin changes, reason through both manifest mutations and generated Kotlin output.

## Verification

- Run `pnpm web` or `pnpm run free-port -- -Port <port>` after changing [free-port.ps1](free-port.ps1).
- Run `pnpm doctor` after changing Expo config plugin behavior.
- Use a dev client or native build to verify Android notification-action behavior.

## Child DOX Index

- No child AGENTS.md files.
