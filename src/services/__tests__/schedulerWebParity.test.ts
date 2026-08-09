jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { HIGH: 'high' },
  AndroidNotificationVisibility: { PUBLIC: 'public' },
}));
jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));
jest.mock('expo-background-fetch', () => ({ registerTaskAsync: jest.fn(), BackgroundFetchResult: {} }));

import * as native from '../NotificationScheduler';
import * as web from '../NotificationScheduler.web';

// jest-expo resolves the native platform, so the web shim is never loaded by any other suite —
// it had already drifted out of parity (missing pickBodyForReminder and shouldSuppressForCompletion,
// and its payload type lacked skipIfDone). A missing export is a runtime crash on the web build
// with a fully green test run, which is exactly what AGENTS.md's parity rule exists to prevent.
describe('NotificationScheduler web shim parity', () => {
  it('exports everything the native module does', () => {
    const missing = Object.keys(native).filter((key) => !(key in web));
    expect(missing).toEqual([]);
  });

  it('exposes the same NotificationScheduler methods', () => {
    const missing = Object.keys(native.NotificationScheduler).filter(
      (key) => typeof (native.NotificationScheduler as Record<string, unknown>)[key] === 'function'
        && typeof (web.NotificationScheduler as Record<string, unknown>)[key] !== 'function',
    );
    expect(missing).toEqual([]);
  });

  it('is inert: scheduling on web resolves without touching anything', async () => {
    await expect(web.NotificationScheduler.rebuild()).resolves.toBeUndefined();
    await expect(web.NotificationScheduler.scheduleAll()).resolves.toBeUndefined();
    expect(web.initNotificationHandlers()).toBeInstanceOf(Function);
  });
});
