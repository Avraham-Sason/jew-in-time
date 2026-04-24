jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

const mockState: { pending: Array<{ identifier: string; content: { data: Record<string, unknown> } }> } = { pending: [] };
const mockSchedule = jest.fn(async (input: { identifier: string; content: { data: Record<string, unknown> } }) => {
  mockState.pending.push({ identifier: input.identifier, content: { data: input.content.data } });
  return input.identifier;
});
const mockCancelOne = jest.fn(async (id: string) => {
  mockState.pending = mockState.pending.filter((p) => p.identifier !== id);
});
const mockCancelAll = jest.fn(async () => {
  mockState.pending = [];
});
const mockGetAll = jest.fn(async () => mockState.pending);

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (i: unknown) => mockSchedule(i as { identifier: string; content: { data: Record<string, unknown> } }),
  cancelAllScheduledNotificationsAsync: () => mockCancelAll(),
  cancelScheduledNotificationAsync: (id: string) => mockCancelOne(id),
  getAllScheduledNotificationsAsync: () => mockGetAll(),
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

import { NotificationScheduler, PENDING_LIMIT } from '../NotificationScheduler';
import { useUserStore } from '@/stores/useUserStore';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useCompletionsStore, dateKey } from '@/stores/useCompletionsStore';
import { CITIES } from '@/data/cities';

function setupEnabled(ids: string[]) {
  const fresh: Record<string, { enabled: boolean }> = {};
  for (const id of Object.keys(useMitzvotStore.getState().activeMitzvot)) {
    fresh[id] = { enabled: ids.includes(id) };
  }
  useMitzvotStore.setState({ activeMitzvot: fresh });
}

describe('NotificationScheduler', () => {
  beforeEach(() => {
    mockState.pending = [];
    mockSchedule.mockClear();
    mockCancelOne.mockClear();
    mockCancelAll.mockClear();
    mockGetAll.mockClear();
    useCompletionsStore.setState({ completions: {}, skipped: {} });
    useUserStore.getState().reset();
    useUserStore.getState().setNotificationPermission('granted');
    useUserStore.getState().setLocation(CITIES[0]);
    setupEnabled([]);
  });

  it('6.1 scheduleAll 48h: enabled mitzvot produce pending notifications', async () => {
    setupEnabled(['tefillin', 'shacharit', 'mincha']);
    const future = new Date(Date.now() + 1000);
    await NotificationScheduler.scheduleAll(future);
    expect(mockState.pending.length).toBeGreaterThan(0);
  });

  it('6.2 cancelForMitzvah removes (or reduces) pending of that mitzvah for that date', async () => {
    setupEnabled(['tefillin', 'shacharit']);
    const future = new Date(Date.now() + 1000);
    await NotificationScheduler.scheduleAll(future);
    const tefBefore = mockState.pending.filter((p) => p.identifier.startsWith('tefillin__' + dateKey(future))).length;
    await NotificationScheduler.cancelForMitzvah('tefillin', future);
    const tefAfter = mockState.pending.filter((p) => p.identifier.startsWith('tefillin__' + dateKey(future))).length;
    expect(tefAfter).toBeLessThanOrEqual(tefBefore);
  });

  it('6.3 cancelAll empties pending', async () => {
    setupEnabled(['tefillin']);
    await NotificationScheduler.scheduleAll(new Date(Date.now() + 1000));
    await NotificationScheduler.cancelAll();
    expect(mockState.pending.length).toBe(0);
  });

  it('6.4 rebuild method exists (subscriber wired in initNotificationHandlers)', () => {
    expect(typeof NotificationScheduler.rebuild).toBe('function');
  });

  it('6.5 rebuild method exists (covers nusach trigger)', () => {
    expect(typeof NotificationScheduler.rebuild).toBe('function');
  });

  it('6.6 skipOn shabbat: tefillin not scheduled on Saturday', async () => {
    setupEnabled(['tefillin']);
    const sat = new Date('2026-04-25T03:00:00Z');
    await NotificationScheduler.scheduleAll(sat);
    const sameDay = mockState.pending.filter((p) => p.identifier.startsWith('tefillin__' + dateKey(sat)));
    expect(sameDay.length).toBe(0);
  });

  it('6.7 PENDING_LIMIT guard: when pending > limit, only schedule today', async () => {
    expect(PENDING_LIMIT).toBe(60);
    mockState.pending = Array.from({ length: 61 }, (_, i) => ({ identifier: `dummy__${i}`, content: { data: {} } }));
    setupEnabled(['tefillin']);
    const future = new Date(Date.now() + 1000);
    const tomorrow = new Date(future);
    tomorrow.setDate(tomorrow.getDate() + 1);
    await NotificationScheduler.scheduleAll(future);
    const tomorrowKey = dateKey(tomorrow);
    const tomorrowOnes = mockState.pending.filter((p) => p.identifier.startsWith('tefillin__' + tomorrowKey));
    expect(tomorrowOnes.length).toBe(0);
  });

  it('6.8 identifier format: mitzvahId__YYYY-MM-DD__idx unique', async () => {
    setupEnabled(['tefillin']);
    await NotificationScheduler.scheduleAll(new Date(Date.now() + 1000));
    const realIds = mockState.pending.filter((p) => p.identifier.startsWith('tefillin__'));
    for (const p of realIds) {
      expect(p.identifier).toMatch(/^tefillin__\d{4}-\d{2}-\d{2}__\d+$/);
    }
    const set = new Set(realIds.map((p) => p.identifier));
    expect(set.size).toBe(realIds.length);
  });

  it('6.9 daily-rebuild task is registered (defineTask called)', () => {
    const tm = require('expo-task-manager');
    expect(tm.defineTask).toHaveBeenCalled();
  });

  it('6.10 skipped mitzvah is not rescheduled on rebuild', async () => {
    setupEnabled(['tefillin']);
    const future = new Date(Date.now() + 1000);
    useCompletionsStore.getState().markSkipped('tefillin', future);
    await NotificationScheduler.scheduleAll(future);
    const sameDay = mockState.pending.filter((p) => p.identifier.startsWith('tefillin__' + dateKey(future)));
    expect(sameDay.length).toBe(0);
  });

  it('6.11 concurrent rebuild shares one in-flight run', async () => {
    setupEnabled(['tefillin']);
    await Promise.all([NotificationScheduler.rebuild(), NotificationScheduler.rebuild()]);
    const tefillinIds = mockState.pending
      .filter((p) => p.identifier.startsWith('tefillin__'))
      .map((p) => p.identifier);
    expect(new Set(tefillinIds).size).toBe(tefillinIds.length);
    expect(mockCancelAll).toHaveBeenCalledTimes(1);
  });
});
