import * as Sentry from '@sentry/react-native';
import { Platform } from 'react-native';
import * as Updates from 'expo-updates';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const crashReportingEnabled = Platform.OS !== 'web' && !__DEV__ && Boolean(dsn);

Sentry.init({
  dsn,
  enabled: crashReportingEnabled,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  // Touch and console breadcrumbs can carry what the user tapped or logged, taharah screens included.
  beforeBreadcrumb: (crumb) => (crumb.category === 'touch' || crumb.category === 'console' ? null : crumb),
  initialScope: { user: { ip_address: '0.0.0.0' } },
});

Sentry.setTags({
  updateId: Updates.updateId ?? 'embedded',
  channel: Updates.channel ?? 'none',
  runtimeVersion: Updates.runtimeVersion ?? '',
});

export function captureException(error: unknown, context?: { scope: string }): void {
  if (!crashReportingEnabled) return;
  Sentry.captureException(error, context ? { tags: { scope: context.scope } } : undefined);
}
