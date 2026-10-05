jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

// The trigger is the one thing a reminder app must get right, so the mock records it (and the
// user-visible text) rather than only identifiers, and it replaces on duplicate identifier the way
// the real expo-notifications API does.
type ScheduleInput = {
  identifier: string;
  content: {
    title?: string;
    body?: string;
    data: Record<string, unknown>;
    categoryIdentifier?: string;
    autoDismiss?: boolean;
    sticky?: boolean;
  };
  trigger?: { type: string; date: Date; channelId?: string };
};

const mockState: {
  pending: ScheduleInput[];
  presented: Array<{ request: { identifier: string; content: { data?: Record<string, unknown>; dataString?: string } } }>;
} = { pending: [], presented: [] };
const mockSchedule = jest.fn(async (input: ScheduleInput) => {
  mockState.pending = mockState.pending.filter((p) => p.identifier !== input.identifier);
  mockState.pending.push(input);
  return input.identifier;
});
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
  scheduleNotificationAsync: (i: unknown) => mockSchedule(i as ScheduleInput),
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

import { DateTime } from 'luxon';
import {
  MARK_DONE_ACTION,
  MITZVAH_REMINDER_CATEGORY,
  MITZVAH_TEXT_CATEGORY,
  OPEN_TEXT_ACTION,
  NotificationScheduler,
  NOTIFICATION_ACTION_TASK,
  PENDING_LIMIT,
  registerNotificationActionTask,
  shouldSuppressForCompletion,
  initNotificationHandlers,
  syncNotificationPermissionStatus,
  refreshSchedulingOnForeground,
  LAST_REBUILD_KEY,
  SCHEDULE_FORMAT_KEY,
} from '../NotificationScheduler';
import { StorageService } from '@/services/StorageService';
import { useUserStore } from '@/stores/useUserStore';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useCompletionsStore, dateKey } from '@/stores/useCompletionsStore';
import { CITIES } from '@/data/cities';
import type { Mitzvah } from '@/types/mitzvah';

// Always strictly in the future, so `scheduleOne`'s `trigger <= Date.now()` guard cannot be the
// reason a notification is absent — otherwise these tests would pass for the wrong reason. Read on
// the clock of the user's LOCATION, with Luxon weekdays (Monday = 1, Saturday = 6): that is the day
// the scheduler resolves zmanim and Shabbat for. "Friday 20:00, after shkia" on the device's clock
// is Saturday morning in Jerusalem once the device sits in Los Angeles.
function nextWeekdayAt(weekday: number, hour: number): Date {
  const now = DateTime.now().setZone(useUserStore.getState().location.tz);
  let d = now.set({ hour, minute: 0, second: 0, millisecond: 0 });
  while (d.weekday !== weekday || d <= now) d = d.plus({ days: 1 });
  return d.toJSDate();
}

function idsFor(mitzvahId: string, key: string) {
  return mockState.pending.filter((p) => p.identifier.startsWith(`${mitzvahId}__${key}__`));
}

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

  it('6.2 cancelForMitzvah removes every pending reminder for that mitzvah and date', async () => {
    const date = new Date(2026, 4, 6);
    const key = dateKey(date);
    mockState.pending = [
      { identifier: `shacharit__${key}__0`, content: { data: { mitzvahId: 'shacharit', dateKey: key, reminderIndex: 0 } } },
      { identifier: `shacharit__${key}__1`, content: { data: { mitzvahId: 'shacharit', dateKey: key, reminderIndex: 1 } } },
      { identifier: `shacharit__${key}__2`, content: { data: { mitzvahId: 'shacharit', dateKey: key, reminderIndex: 2 } } },
      { identifier: `mincha__${key}__0`, content: { data: { mitzvahId: 'mincha', dateKey: key, reminderIndex: 0 } } },
      {
        identifier: 'shacharit__2026-05-07__0',
        content: { data: { mitzvahId: 'shacharit', dateKey: '2026-05-07', reminderIndex: 0 } },
      },
    ];

    await NotificationScheduler.cancelForMitzvah('shacharit', date);

    expect(mockState.pending.map((p) => p.identifier)).toEqual([`mincha__${key}__0`, 'shacharit__2026-05-07__0']);
    expect(mockCancelOne).toHaveBeenCalledWith(`shacharit__${key}__0`);
    expect(mockCancelOne).toHaveBeenCalledWith(`shacharit__${key}__1`);
    expect(mockCancelOne).toHaveBeenCalledWith(`shacharit__${key}__2`);
  });

  it('6.2b cancelForMitzvah also clears that mitzvah and date from the notification tray', async () => {
    const date = new Date(2026, 4, 6);
    mockState.presented = [
      { request: { identifier: 'tefillin__2026-05-06__0', content: { data: { mitzvahId: 'tefillin', dateKey: '2026-05-06' } } } },
      { request: { identifier: 'tefillin__2026-05-07__0', content: { data: { mitzvahId: 'tefillin', dateKey: '2026-05-07' } } } },
      { request: { identifier: 'shacharit__2026-05-06__0', content: { data: { mitzvahId: 'shacharit', dateKey: '2026-05-06' } } } },
    ];

    await NotificationScheduler.cancelForMitzvah('tefillin', date);

    expect(mockDismiss.mock.calls.map(([id]) => id)).toEqual(['tefillin__2026-05-06__0']);
  });

  it('6.2c a schedule written by an older build is rebuilt once when the app comes to the foreground', async () => {
    useUserStore.getState().setOnboarded(true);
    setupEnabled(['tefillin']);
    StorageService.set(LAST_REBUILD_KEY, dateKey(new Date()));
    StorageService.delete(SCHEDULE_FORMAT_KEY);
    mockState.pending = [
      {
        identifier: 'tefillin__2026-05-06__0',
        content: { data: { mitzvahId: 'tefillin', dateKey: '2026-05-06' }, categoryIdentifier: MITZVAH_REMINDER_CATEGORY },
      },
    ];

    await refreshSchedulingOnForeground();
    expect(mockCancelAll).toHaveBeenCalledTimes(1);
    expect(mockState.pending.every((p) => p.content.categoryIdentifier === MITZVAH_TEXT_CATEGORY)).toBe(true);

    await refreshSchedulingOnForeground();
    expect(mockCancelAll).toHaveBeenCalledTimes(1);
  });

  it('6.2d a rebuild clears the format stamp before touching the schedule, so an interrupted one is redone', async () => {
    StorageService.set(SCHEDULE_FORMAT_KEY, 2);
    const running = NotificationScheduler.rebuild();
    expect(StorageService.get(SCHEDULE_FORMAT_KEY)).toBeUndefined();
    await running;
    expect(StorageService.get(SCHEDULE_FORMAT_KEY)).toBe(2);
  });

  it('6.3 cancelAll empties pending', async () => {
    setupEnabled(['tefillin']);
    await NotificationScheduler.scheduleAll(new Date(Date.now() + 1000));
    await NotificationScheduler.cancelAll();
    expect(mockState.pending.length).toBe(0);
  });

  // 6.4 and 6.5 were byte-identical `typeof rebuild === 'function'` assertions standing in for
  // subscription coverage; initNotificationHandlers was never actually invoked by any test.
  it('6.4 store changes drive a rebuild, and the teardown unsubscribes them', async () => {
    const rebuild = jest.spyOn(NotificationScheduler, 'rebuild').mockResolvedValue();
    const cancelAll = jest.spyOn(NotificationScheduler, 'cancelAll').mockResolvedValue();
    const teardown = initNotificationHandlers();
    rebuild.mockClear();

    useUserStore.getState().setLocation(CITIES[1]);
    expect(rebuild).toHaveBeenCalledTimes(1);

    useUserStore.getState().setNusach('sefard');
    expect(rebuild).toHaveBeenCalledTimes(2);

    useMitzvotStore.getState().setEnabled('tefillin', true);
    expect(rebuild).toHaveBeenCalledTimes(3);

    useUserStore.getState().setLanguage('en');
    expect(rebuild).toHaveBeenCalledTimes(4);

    useUserStore.getState().setNotificationsEnabled(false);
    expect(cancelAll).toHaveBeenCalled();

    teardown();
    rebuild.mockClear();
    useUserStore.getState().setLocation(CITIES[2]);
    expect(rebuild).not.toHaveBeenCalled();

    rebuild.mockRestore();
    cancelAll.mockRestore();
  });

  it('6.5 granting permission after a denial triggers a rebuild', async () => {
    useUserStore.getState().setNotificationPermission('denied');
    const rebuild = jest.spyOn(NotificationScheduler, 'rebuild').mockResolvedValue();

    await syncNotificationPermissionStatus();

    expect(useUserStore.getState().notificationPermission).toBe('granted');
    expect(rebuild).toHaveBeenCalledTimes(1);

    rebuild.mockClear();
    await syncNotificationPermissionStatus();
    expect(rebuild).not.toHaveBeenCalled(); // already granted — no repeat rebuild

    rebuild.mockRestore();
  });

  it('6.6 skipOn shabbat: tefillin not scheduled on Saturday', async () => {
    setupEnabled(['tefillin', 'shacharit']);
    const saturday = nextWeekdayAt(6, 0); // upcoming Saturday 00:00, so all of Shabbat morning is ahead
    const saturdayKey = dateKey(saturday);

    await NotificationScheduler.scheduleAll(saturday);

    expect(idsFor('tefillin', saturdayKey)).toHaveLength(0);
    // Proves the run reached Saturday at all: shacharit has no skipOn and is still scheduled.
    expect(idsFor('shacharit', saturdayKey).length).toBeGreaterThan(0);
  });

  // Replaces the old "when pending > PENDING_LIMIT only schedule today" test. That guard could
  // never fire in production (rebuild cancels everything first, so pending was always 0) and the
  // test picked tefillin, whose skipOn made it vacuous whenever the suite ran on a Friday.
  it('6.7 caps the schedule and drops the furthest-out reminders, not tomorrow wholesale', async () => {
    expect(PENDING_LIMIT).toBe(60);
    const window = { start: new Date(Date.now() + 60_000), end: new Date(Date.now() + 40 * 60_000) };
    const many: Mitzvah[] = Array.from({ length: 40 }, (_, index) => ({
      id: `bulk_${index}`,
      name: { he: `בדיקה ${index}` },
      icon: 'custom',
      timeType: 'range-within-day',
      category: 'daily-morning',
      skipOn: [],
      nuschaotSupported: ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'],
      defaultReminders: [
        { anchor: 'start', offsetMin: 1, label: 'a' },
        { anchor: 'start', offsetMin: 2, label: 'b' },
      ],
      computeWindow: () => window,
    }));

    await NotificationScheduler.scheduleAll(new Date(Date.now() + 1000), many);

    expect(mockState.pending.length).toBeLessThanOrEqual(PENDING_LIMIT);
    expect(mockState.pending.length).toBeGreaterThan(0);
    const triggers = mockSchedule.mock.calls.map((call) => call[0].trigger!.date.getTime());
    expect([...triggers].sort((a, b) => a - b)).toEqual(triggers);
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

  it('6.8b a reminder with a nusach text carries the open-text category; both categories are registered', async () => {
    setupEnabled(['tefillin']);
    await NotificationScheduler.scheduleAll(new Date(Date.now() + 1000));
    const tefillin = mockState.pending.find((p) => p.identifier.startsWith('tefillin__'));
    expect(tefillin?.content.categoryIdentifier).toBe(MITZVAH_TEXT_CATEGORY);
    expect(tefillin?.content.autoDismiss).toBe(true);
    expect(tefillin?.content.sticky).toBe(false);
    const markDone = { identifier: MARK_DONE_ACTION, buttonTitle: 'עשיתי', options: { opensAppToForeground: false } };
    expect(mockSetCategory).toHaveBeenCalledWith(MITZVAH_REMINDER_CATEGORY, [markDone]);
    expect(mockSetCategory).toHaveBeenCalledWith(MITZVAH_TEXT_CATEGORY, [
      { identifier: OPEN_TEXT_ACTION, buttonTitle: 'פתח נוסח', options: { opensAppToForeground: true } },
      markDone,
    ]);
  });

  it('6.8c a reminder with no text keeps the mark-done-only category', async () => {
    const window = { start: new Date(Date.now() + 30 * 60_000), end: new Date(Date.now() + 90 * 60_000) };
    const plain = bulkMitzvah('no_text', [{ anchor: 'start', offsetMin: 1, label: 'x' }], window);
    const withText = {
      ...bulkMitzvah('custom_text', [{ anchor: 'start', offsetMin: 1, label: 'x' }], window),
      isCustom: true,
      contentBlocks: [{ type: 'blessing' as const, he: 'ברוך' }],
    };
    const withLinkOnly = {
      ...bulkMitzvah('custom_link', [{ anchor: 'start', offsetMin: 1, label: 'x' }], window),
      isCustom: true,
      contentBlocks: [{ type: 'link' as const, he: 'קישור', url: 'https://example.org' }],
    };

    await NotificationScheduler.scheduleAll(new Date(Date.now() + 1000), [plain, withText, withLinkOnly]);

    const categoryOf = (id: string) => mockState.pending.find((p) => p.identifier.startsWith(`${id}__`))?.content.categoryIdentifier;
    expect(categoryOf('no_text')).toBe(MITZVAH_REMINDER_CATEGORY);
    expect(categoryOf('custom_text')).toBe(MITZVAH_TEXT_CATEGORY);
    expect(categoryOf('custom_link')).toBe(MITZVAH_REMINDER_CATEGORY);
  });

  it('6.8d the open-text button label follows the app language', async () => {
    useUserStore.getState().setLanguage('en');
    setupEnabled(['tefillin']);
    await NotificationScheduler.scheduleAll(new Date(Date.now() + 1000));
    expect(mockSetCategory).toHaveBeenCalledWith(MITZVAH_TEXT_CATEGORY, [
      { identifier: OPEN_TEXT_ACTION, buttonTitle: 'Open text', options: { opensAppToForeground: true } },
      { identifier: MARK_DONE_ACTION, buttonTitle: 'Done', options: { opensAppToForeground: false } },
    ]);
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

  it('6.10b completed mitzvah is not rescheduled for that date', async () => {
    const today = new Date(Date.now() + 60_000);
    const key = dateKey(today);
    const doneMitzvah: Mitzvah = {
      id: 'synthetic_done',
      name: { he: 'בדיקת השלמה', en: 'Completed test' },
      icon: 'custom',
      timeType: 'range-within-day',
      category: 'daily-morning',
      skipOn: [],
      nuschaotSupported: ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'],
      defaultReminders: [
        { anchor: 'start', offsetMin: 0, label: 'first' },
        { anchor: 'start', offsetMin: 5, label: 'second' },
      ],
      computeWindow: ({ date }) => ({
        start: new Date(date.getTime() + 60_000),
        end: new Date(date.getTime() + 20 * 60_000),
      }),
    };
    useCompletionsStore.setState({
      completions: { [key]: { synthetic_done: Date.now() } },
      skipped: {},
    });

    await NotificationScheduler.scheduleAll(today, [doneMitzvah]);

    const sameDay = mockState.pending.filter((p) => p.identifier.startsWith(`synthetic_done__${key}`));
    expect(sameDay.length).toBe(0);
  });

  it('6.10c skipIfDone flag is carried into the scheduled notification payload', async () => {
    const future = new Date(Date.now() + 60_000);
    const mitzvah: Mitzvah = {
      id: 'flag_test',
      name: { he: 'בדיקה', en: 'Flag test' },
      icon: 'custom',
      timeType: 'range-within-day',
      category: 'daily-morning',
      skipOn: [],
      nuschaotSupported: ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'],
      defaultReminders: [
        { anchor: 'start', offsetMin: 1, label: 'primary' },
        { anchor: 'start', offsetMin: 2, label: 'nudge', skipIfDone: true },
      ],
      computeWindow: ({ date }) => ({
        start: new Date(date.getTime() + 60_000),
        end: new Date(date.getTime() + 20 * 60_000),
      }),
    };

    await NotificationScheduler.scheduleAll(future, [mitzvah]);

    const scheduled = mockState.pending.filter((p) => p.identifier.startsWith('flag_test__'));
    const primary = scheduled.find((p) => p.content.data.reminderIndex === 0);
    const nudge = scheduled.find((p) => p.content.data.reminderIndex === 1);
    expect(primary?.content.data.skipIfDone).toBe(false);
    expect(nudge?.content.data.skipIfDone).toBe(true);
  });

  it('6.10d delivery is suppressed for a skipIfDone reminder once the mitzvah is done', () => {
    const date = new Date(2026, 4, 6);
    const key = dateKey(date);
    const data = { mitzvahId: 'shacharit', dateKey: key, skipIfDone: true };

    expect(shouldSuppressForCompletion(data, `shacharit__${key}__1`)).toBe(false);

    useCompletionsStore.getState().markDone('shacharit', date);
    expect(shouldSuppressForCompletion(data, `shacharit__${key}__1`)).toBe(true);

    // A reminder without skipIfDone still fires even when done.
    expect(shouldSuppressForCompletion({ mitzvahId: 'shacharit', dateKey: key }, `shacharit__${key}__0`)).toBe(false);
  });

  // The skip decision must come from the mitzvah's own window, not from the clock time the rebuild
  // happened to run at. `isShabbat` is instant-sensitive, so a Friday-evening rebuild used to see
  // "Saturday 20:00" (past tzeit) as not-Shabbat and queue tefillin for Shabbat morning.
  it('6.13 a Friday-evening rebuild schedules nothing for Shabbat', async () => {
    setupEnabled(['tefillin', 'shacharit']);
    const fridayEvening = nextWeekdayAt(5, 20); // upcoming Friday 20:00, after shkia
    const saturday = new Date(fridayEvening);
    saturday.setDate(saturday.getDate() + 1);
    const saturdayKey = dateKey(saturday);

    await NotificationScheduler.scheduleAll(fridayEvening);

    expect(idsFor('tefillin', saturdayKey)).toHaveLength(0);
    // Proves the run reached Saturday at all: shacharit has no skipOn and is still scheduled.
    expect(idsFor('shacharit', saturdayKey).length).toBeGreaterThan(0);
  });

  it('6.13b a Thursday-evening rebuild still schedules Friday morning', async () => {
    setupEnabled(['tefillin']);
    const thursdayEvening = nextWeekdayAt(4, 20); // upcoming Thursday 20:00, after shkia
    const friday = new Date(thursdayEvening);
    friday.setDate(friday.getDate() + 1);

    await NotificationScheduler.scheduleAll(thursdayEvening);

    expect(idsFor('tefillin', dateKey(friday)).length).toBeGreaterThan(0);
  });

  function bulkMitzvah(id: string, reminders: Mitzvah['defaultReminders'], window: { start: Date; end: Date }): Mitzvah {
    return {
      id,
      name: { he: 'בדיקה', en: 'Test' },
      icon: 'custom',
      timeType: 'range-within-day',
      category: 'daily-morning',
      skipOn: [],
      nuschaotSupported: ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'],
      defaultReminders: reminders,
      computeWindow: () => window,
    };
  }

  it('6.14 the trigger is a date trigger at the exact anchor offset, on the app channel', async () => {
    const start = new Date(Date.now() + 30 * 60_000);
    const end = new Date(Date.now() + 120 * 60_000);
    const mitzvah = bulkMitzvah('trigger_test', [
      { anchor: 'start', offsetMin: 10, label: 'from start' },
      { anchor: 'end', offsetMin: -45, label: 'before end' },
    ], { start, end });

    await NotificationScheduler.scheduleAll(new Date(Date.now() + 1000), [mitzvah]);

    const byIndex = (i: number) => mockState.pending.find((p) => p.content.data.reminderIndex === i)!;
    expect(byIndex(0).trigger).toMatchObject({ type: 'date', channelId: 'default' });
    expect(byIndex(0).trigger!.date.getTime()).toBe(start.getTime() + 10 * 60_000);
    expect(byIndex(1).trigger!.date.getTime()).toBe(end.getTime() - 45 * 60_000);
    for (const pending of mockState.pending) {
      expect(pending.trigger!.date.getTime()).toBeGreaterThan(Date.now());
    }
  });

  it('6.15 a reminder whose trigger falls outside its own window is never scheduled', async () => {
    const start = new Date(Date.now() + 30 * 60_000);
    const end = new Date(Date.now() + 90 * 60_000); // a one-hour window
    const mitzvah = bulkMitzvah('outside_test', [
      { anchor: 'start', offsetMin: 15, label: 'inside' },
      { anchor: 'start', offsetMin: 600, label: 'hours after the window closed' },
    ], { start, end });

    await NotificationScheduler.scheduleAll(new Date(Date.now() + 1000), [mitzvah]);

    expect(mockState.pending.filter((p) => p.content.data.reminderIndex === 0).length).toBeGreaterThan(0);
    expect(mockState.pending.filter((p) => p.content.data.reminderIndex === 1)).toHaveLength(0);
  });

  it('6.16 notification text follows the app language', async () => {
    const window = { start: new Date(Date.now() + 30 * 60_000), end: new Date(Date.now() + 90 * 60_000) };
    const mitzvah = bulkMitzvah('lang_test', [{ anchor: 'start', offsetMin: 1, label: 'טקסט עברי' }], window);

    useUserStore.getState().setLanguage('en');
    await NotificationScheduler.scheduleAll(new Date(Date.now() + 1000), [mitzvah]);
    expect(mockState.pending[0].content.title).toBe('Test');
    expect(mockState.pending[0].content.body).not.toMatch(/[֐-׿]/);

    mockState.pending = [];
    useUserStore.getState().setLanguage('he');
    await NotificationScheduler.scheduleAll(new Date(Date.now() + 1000), [mitzvah]);
    expect(mockState.pending[0].content.title).toBe('בדיקה');
    expect(mockState.pending[0].content.body).toBe('טקסט עברי');
  });

  it('6.12 one mitzvah throwing does not abort scheduling for the rest', async () => {
    const future = new Date(Date.now() + 1000);
    const window = { start: new Date(Date.now() + 60_000), end: new Date(Date.now() + 20 * 60_000) };
    const base = {
      name: { he: 'בדיקה' },
      icon: 'custom',
      timeType: 'range-within-day' as const,
      category: 'daily-morning' as const,
      skipOn: [],
      nuschaotSupported: ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'] as Mitzvah['nuschaotSupported'],
      defaultReminders: [{ anchor: 'start' as const, offsetMin: 1, label: 'x' }],
    };
    const exploding: Mitzvah = {
      ...base,
      id: 'exploding',
      computeWindow: () => {
        throw new Error('zmanim blew up');
      },
    };
    const healthy: Mitzvah = { ...base, id: 'healthy', computeWindow: () => window };

    await expect(NotificationScheduler.scheduleAll(future, [exploding, healthy])).resolves.toBeUndefined();
    expect(mockState.pending.some((p) => p.identifier.startsWith('healthy__'))).toBe(true);
    expect(mockState.pending.some((p) => p.identifier.startsWith('exploding__'))).toBe(false);
  });

  // Previously asserted that the second rebuild was simply dropped — which was the bug: a toggle
  // made while a rebuild was running never reached the schedule. It must be coalesced into exactly
  // one trailing re-run instead.
  it('6.11 a rebuild requested mid-run is re-run once, not dropped', async () => {
    setupEnabled(['tefillin']);
    await Promise.all([NotificationScheduler.rebuild(), NotificationScheduler.rebuild()]);

    expect(mockCancelAll).toHaveBeenCalledTimes(2);
    const tefillinIds = mockState.pending
      .filter((p) => p.identifier.startsWith('tefillin__'))
      .map((p) => p.identifier);
    expect(new Set(tefillinIds).size).toBe(tefillinIds.length);
  });

  it('6.11b the trailing re-run observes state changed during the in-flight run', async () => {
    setupEnabled(['tefillin']);
    const first = NotificationScheduler.rebuild();
    setupEnabled(['tefillin', 'shacharit']);
    const second = NotificationScheduler.rebuild();
    await Promise.all([first, second]);

    expect(mockState.pending.some((p) => p.identifier.startsWith('shacharit__'))).toBe(true);
  });
});
