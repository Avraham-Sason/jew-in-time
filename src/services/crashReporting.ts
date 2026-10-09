// The web and Jest implementation: reports nothing. Metro picks crashReporting.native.ts on a device.
export const crashReportingEnabled = false;

export function captureException(error: unknown, context?: { scope: string }): void {}
