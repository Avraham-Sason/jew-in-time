jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));
jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn(),
  BackgroundFetchResult: { NewData: 1, Failed: 2 },
}));

import { useUserStore } from '../useUserStore';
import { useMitzvotStore } from '../useMitzvotStore';
import { useCompletionsStore, dateKey } from '../useCompletionsStore';

describe('stores', () => {
  beforeEach(() => {
    useUserStore.getState().reset();
    useCompletionsStore.setState({ completions: {}, skipped: {} });
  });

  it('4.1 useUserStore setNusach persists', () => {
    useUserStore.getState().setNusach('sefard');
    expect(useUserStore.getState().nusach).toBe('sefard');
  });

  it('4.2 setEnabled tefillin → enabled', () => {
    useMitzvotStore.getState().setEnabled('tefillin', true);
    expect(useMitzvotStore.getState().activeMitzvot.tefillin.enabled).toBe(true);
  });

  it('4.3 resetToDefault drops customReminders', () => {
    useMitzvotStore.getState().setReminders('tefillin', [{ anchor: 'start', offsetMin: 0, label: 'x' }]);
    expect(useMitzvotStore.getState().activeMitzvot.tefillin.customReminders).toBeDefined();
    useMitzvotStore.getState().resetToDefault('tefillin');
    expect(useMitzvotStore.getState().activeMitzvot.tefillin.customReminders).toBeUndefined();
  });

  it('4.4 markDone → isDone true', () => {
    useCompletionsStore.getState().markDone('tefillin');
    expect(useCompletionsStore.getState().isDone('tefillin')).toBe(true);
  });

  it('4.5 unmark → isDone false', () => {
    useCompletionsStore.getState().markDone('tefillin');
    useCompletionsStore.getState().unmark('tefillin');
    expect(useCompletionsStore.getState().isDone('tefillin')).toBe(false);
  });

  it('4.6 markDone today != markDone tomorrow', () => {
    const today = new Date('2026-04-23T10:00:00Z');
    const tomorrow = new Date('2026-04-24T10:00:00Z');
    useCompletionsStore.getState().markDone('tefillin', today);
    expect(useCompletionsStore.getState().isDone('tefillin', today)).toBe(true);
    expect(useCompletionsStore.getState().isDone('tefillin', tomorrow)).toBe(false);
    expect(dateKey(today)).not.toBe(dateKey(tomorrow));
  });

  it('4.7 markSkipped tracks skip without counting as done', () => {
    const today = new Date('2026-04-23T10:00:00Z');
    useCompletionsStore.getState().markSkipped('tefillin', today);
    expect(useCompletionsStore.getState().isSkipped('tefillin', today)).toBe(true);
    expect(useCompletionsStore.getState().isDone('tefillin', today)).toBe(false);
    expect(useCompletionsStore.getState().countForDate(today)).toBe(0);
  });
});
