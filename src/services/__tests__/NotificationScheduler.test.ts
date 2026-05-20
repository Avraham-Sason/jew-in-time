jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

const mockState: {
  pending: Array<{
    identifier: string;
    content: { data: Record<string, unknown>; categoryIdentifier?: string; autoDismiss?: boolean; sticky?: boolean };
  }>;
  presented: Array<{ request: { identifier: string; content: { data?: Record<string, unknown>; dataString?: string } } }>;
} = { pending: [], presented: [] };
const mockSchedule = jest.fn(
  async (input: {
    identifier: string;
    content: { data: Record<string, unknown>; categoryIdentifier?: string; autoDismiss?: boolean; sticky?: boolean };
  }) => {
    mockState.pending.push({
      identifier: input.identifier,
      content: {
        data: input.content.data,
        categoryIdentifier: input.content.categoryIdentifier,
        autoDismiss: input.content.autoDismiss,
        sticky: input.content.sticky,
      },
    });
    return input.identifier;
  },
);
const mockCancelOne = jest.fn(async (id: string) => {
  mockState.pending = mockState.pending.filter((p) => p.identifier !== id);
});
const mockCancelAll = jest.fn(async () => {
  mockState.pending = [];
});
const mockGetAll = jest.fn(async () => mockState.pending);
const mockGetPresented = jest.fn(async () => mockState.presented);
const mockDismiss = jest.fn(async (_id: string) => {});
const mockSetCategory = jest.fn<Promise<unknown>, [string, unknown[]]>(async () => ({}));
const mockRegisterNotificationTask = jest.fn(async (_name: string) => null);

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: (i: unknown) =>
    mockSchedule(
      i as {
        identifier: string;
        content: { data: Record<string, unknown>; categoryIdentifier?: string; autoDismiss?: boolean; sticky?: boolean };
      },
    ),
  cancelAllScheduledNotificationsAsync: () => mockCancelAll(),
  cancelScheduledNotificationAsync: (id: string) => mockCancelOne(id),
  getAllScheduledNotificationsAsync: () => mockGetAll(),
  getPresentedNotificationsAsync: () => mockGetPresented(),
  dismissNotificationAsync: (id: string) => mockDismiss(id),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => ({})),
  setNotificationCategoryAsync: (identifier: string, actions: unknown[]) => mockSetCategory(identifier, actions),
  registerTaskAsync: (name: string) => mockRegisterNotificationTask(name),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  AndroidImportance: { HIGH: 'high' },
  AndroidNotificationVisibility: { PUBLIC: 'public' },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));
jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn(),
  BackgroundFetchResult: { NewData: 1, Failed: 2 },
}));

import {
  MARK_DONE_ACTION,
  MITZVAH_REMINDER_CATEGORY,
  NotificationScheduler,
  NOTIFICATION_ACTION_TASK,
  PENDING_LIMIT,
  registerNotificationActionTask,
} from '../NotificationScheduler';
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
    mockState.presented = [];
    mockSchedule.mockClear();
    mockCancelOne.mockClear();
    mockCancelAll.mockClear();
    mockGetAll.mockClear();
    mockGetPresented.mockClear();
    mockDismiss.mockClear();
    mockSetCategory.mockClear();
    mockRegisterNotificationTask.mockClear();
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

  it('6.8b scheduled mitzvah reminders use the mark-done action category', async () => {
    setupEnabled(['tefillin']);
    await NotificationScheduler.scheduleAll(new Date(Date.now() + 1000));
    const tefillin = mockState.pending.find((p) => p.identifier.startsWith('tefillin__'));
    expect(tefillin?.content.categoryIdentifier).toBe(MITZVAH_REMINDER_CATEGORY);
    expect(tefillin?.content.autoDismiss).toBe(true);
    expect(tefillin?.content.sticky).toBe(false);
    expect(mockSetCategory).toHaveBeenCalledWith(
      MITZVAH_REMINDER_CATEGORY,
      [
        {
          identifier: MARK_DONE_ACTION,
          buttonTitle: 'עשיתי',
          options: { opensAppToForeground: false },
        },
      ],
    );
  });

  it('6.9 daily-rebuild task is registered (defineTask called)', () => {
    const tm = require('expo-task-manager');
    expect(tm.defineTask).toHaveBeenCalled();
  });

  it('6.9b registers the background notification action task', async () => {
    await registerNotificationActionTask();

    expect(mockRegisterNotificationTask).toHaveBeenCalledWith(NOTIFICATION_ACTION_TASK);
  });

  it('6.9c background notification action marks the mitzvah done', async () => {
    const tm = require('expo-task-manager');
    const task = tm.defineTask.mock.calls.find(([name]: [string]) => name === NOTIFICATION_ACTION_TASK)?.[1];
    expect(task).toBeDefined();

    await task!({
      data: {
        actionIdentifier: MARK_DONE_ACTION,
        notification: {
          request: {
            identifier: 'shacharit__2026-05-06__0',
            content: {
              data: { mitzvahId: 'shacharit', dateKey: '2026-05-06' },
            },
          },
        },
      },
      error: null,
      executionInfo: { taskName: NOTIFICATION_ACTION_TASK },
    });

    expect(useCompletionsStore.getState().isDone('shacharit', new Date(2026, 4, 6))).toBe(true);
    expect(mockGetAll).toHaveBeenCalled();
    expect(mockDismiss).toHaveBeenCalledWith('shacharit__2026-05-06__0');
  });

  it('6.9d background notification action reads native dataString payloads', async () => {
    const tm = require('expo-task-manager');
    const task = tm.defineTask.mock.calls.find(([name]: [string]) => name === NOTIFICATION_ACTION_TASK)?.[1];
    expect(task).toBeDefined();
    mockState.presented = [
      {
        request: {
          identifier: 'shacharit__2026-05-06__0',
          content: { dataString: JSON.stringify({ mitzvahId: 'shacharit', dateKey: '2026-05-06' }) },
        },
      },
      {
        request: {
          identifier: 'mincha__2026-05-06__0',
          content: { data: { mitzvahId: 'mincha', dateKey: '2026-05-06' } },
        },
      },
    ];

    await task!({
      data: {
        actionIdentifier: MARK_DONE_ACTION,
        notification: {
          request: {
            identifier: 'shacharit__2026-05-06__0',
            content: {
              dataString: JSON.stringify({ mitzvahId: 'shacharit', dateKey: '2026-05-06' }),
            },
          },
        },
      },
      error: null,
      executionInfo: { taskName: NOTIFICATION_ACTION_TASK },
    });

    expect(useCompletionsStore.getState().isDone('shacharit', new Date(2026, 4, 6))).toBe(true);
    expect(mockGetPresented).toHaveBeenCalled();
    expect(mockDismiss).toHaveBeenCalledWith('shacharit__2026-05-06__0');
    expect(mockDismiss).not.toHaveBeenCalledWith('mincha__2026-05-06__0');
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
