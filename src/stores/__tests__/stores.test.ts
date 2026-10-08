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

import { STORE_VERSION } from '../persistOptions';
import { SIDDUR_SCROLL_SPEEDS, scrollSpeedLevel, useUserStore } from '../useUserStore';
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

describe('useUserStore auto-scroll', () => {
  beforeEach(() => useUserStore.getState().reset());

  it('starts off at the middle speed and resets to it', () => {
    expect(useUserStore.getState().siddurAutoScroll).toBe(false);
    expect(useUserStore.getState().siddurScrollSpeed).toBe(5);
    useUserStore.getState().setSiddurAutoScroll(true);
    useUserStore.getState().setSiddurScrollSpeed(8);
    expect(useUserStore.getState().siddurAutoScroll).toBe(true);
    expect(useUserStore.getState().siddurScrollSpeed).toBe(8);
    useUserStore.getState().reset();
    expect(useUserStore.getState().siddurAutoScroll).toBe(false);
    expect(useUserStore.getState().siddurScrollSpeed).toBe(5);
  });

  it('keeps a stored speed inside the offered levels', () => {
    useUserStore.getState().setSiddurScrollSpeed(0);
    expect(useUserStore.getState().siddurScrollSpeed).toBe(1);
    useUserStore.getState().setSiddurScrollSpeed(SIDDUR_SCROLL_SPEEDS.length + 3);
    expect(useUserStore.getState().siddurScrollSpeed).toBe(SIDDUR_SCROLL_SPEEDS.length);
    useUserStore.getState().setSiddurScrollSpeed(3.4);
    expect(useUserStore.getState().siddurScrollSpeed).toBe(3);
    useUserStore.getState().setSiddurScrollSpeed(Number.NaN);
    expect(useUserStore.getState().siddurScrollSpeed).toBe(5);
  });

  it('reads any saved speed as an offered level', () => {
    expect(scrollSpeedLevel(Number.POSITIVE_INFINITY)).toBe(5);
    expect(scrollSpeedLevel(-4)).toBe(1);
    expect(scrollSpeedLevel(10)).toBe(10);
  });

  it('offers speeds that rise from level to level', () => {
    SIDDUR_SCROLL_SPEEDS.forEach((pace, index) => {
      if (index > 0) expect(pace).toBeGreaterThan(SIDDUR_SCROLL_SPEEDS[index - 1]);
    });
  });
});

describe('useUserStore theme', () => {
  beforeEach(() => useUserStore.getState().reset());

  const coldStart = (state: object, colorScheme: 'light' | 'dark' | null = null) => {
    let started: ReturnType<typeof useUserStore.getState> | undefined;
    jest.isolateModules(() => {
      const { Appearance } = require('react-native');
      const appearance = jest.spyOn(Appearance, 'getColorScheme').mockReturnValue(colorScheme);
      try {
        const { storage: freshStorage } = require('@/services/StorageService');
        freshStorage.set('user-store', JSON.stringify({ version: STORE_VERSION, state }));
        started = require('../useUserStore').useUserStore.getState();
      } finally {
        appearance.mockRestore();
      }
    });
    return started!;
  };

  it('defaults to gold and resets to it', () => {
    expect(useUserStore.getState().theme).toBe('gold');
    useUserStore.getState().setTheme('pink');
    expect(useUserStore.getState().theme).toBe('pink');
    useUserStore.getState().reset();
    expect(useUserStore.getState().theme).toBe('gold');
  });

  it('a cold start keeps a saved palette name', () => {
    expect(coldStart({ theme: 'purple' }).theme).toBe('purple');
  });

  it('a cold start maps the legacy light theme to gold', () => {
    expect(coldStart({ theme: 'light' }, 'dark').theme).toBe('gold');
  });

  it('a cold start keeps the legacy dark theme', () => {
    expect(coldStart({ theme: 'dark' }, 'light').theme).toBe('dark');
  });

  it('a cold start maps the legacy system theme by the OS appearance', () => {
    expect(coldStart({ theme: 'system' }, 'dark').theme).toBe('dark');
    expect(coldStart({ theme: 'system' }, 'light').theme).toBe('gold');
  });

  it('a cold start maps an unknown theme to gold', () => {
    expect(coldStart({ theme: 'neon' }).theme).toBe('gold');
    expect(coldStart({ theme: 'toString' }).theme).toBe('gold');
    expect(coldStart({ theme: 7 }).theme).toBe('gold');
  });

  it('a payload without a theme keeps the default', () => {
    const started = coldStart({ nusach: 'sefard' });
    expect(started.theme).toBe('gold');
    expect(started.nusach).toBe('sefard');
  });
});
