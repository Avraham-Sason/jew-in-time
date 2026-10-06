const mockAddNotificationResponseReceivedListener = jest.fn();
const mockMarkDoneFromNotificationData = jest.fn<Promise<boolean>, [unknown, string?]>(async () => true);
const mockRouterPush = jest.fn();
const mockRouterNavigate = jest.fn();

jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: (listener: unknown) => mockAddNotificationResponseReceivedListener(listener),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { HIGH: 'high' },
  AndroidNotificationVisibility: { PUBLIC: 'public' },
}));

jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));
jest.mock('expo-background-fetch', () => ({ registerTaskAsync: jest.fn(), BackgroundFetchResult: {} }));

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
    navigate: (...args: unknown[]) => mockRouterNavigate(...args),
  },
}));

// Only `markDoneFromNotificationData` is stubbed. The parser used to be re-implemented here too —
// a looser copy with no isRecord guard and no try/catch — so the shipped one was never exercised on
// the tap path, which is precisely where Android delivers payloads as `dataString`.
jest.mock('@/services/NotificationScheduler', () => {
  const actual = jest.requireActual('@/services/NotificationScheduler');
  return {
    ...actual,
    markDoneFromNotificationData: (data: unknown, id?: string) => mockMarkDoneFromNotificationData(data, id),
  };
});

import {
  consumePendingNotificationRoute,
  DEFAULT_NOTIFICATION_ACTION,
  initNotificationResponseHandler,
  MARK_DONE_ACTION,
  OPEN_TEXT_ACTION,
} from '../notificationResponseHandler';
import { useUserStore } from '@/stores/useUserStore';
import { CITIES } from '@/data/cities';
import { at } from '@/testing/zmanim';

function response(actionIdentifier: string, data: Record<string, unknown>, identifier = 'notif-id', dataString?: string) {
  return {
    actionIdentifier,
    notification: {
      request: {
        identifier,
        content: dataString ? { dataString } : { data },
      },
    },
  } as never;
}

describe('notificationResponseHandler', () => {
  beforeEach(() => {
    mockAddNotificationResponseReceivedListener.mockReset();
    mockMarkDoneFromNotificationData.mockClear();
    mockRouterPush.mockClear();
    mockRouterNavigate.mockClear();
  });

  it('marks a mitzvah done from the notification action', () => {
    initNotificationResponseHandler();
    const listener = mockAddNotificationResponseReceivedListener.mock.calls[0][0];

    listener(response(MARK_DONE_ACTION, { mitzvahId: 'shacharit', dateKey: '2026-05-06' }, 'shacharit__2026-05-06__0'));

    expect(mockMarkDoneFromNotificationData).toHaveBeenCalledWith(
      { mitzvahId: 'shacharit', dateKey: '2026-05-06' },
      'shacharit__2026-05-06__0',
    );
  });

  it('reads mitzvah metadata from native dataString notification payloads', () => {
    initNotificationResponseHandler();
    const listener = mockAddNotificationResponseReceivedListener.mock.calls[0][0];

    listener(response(MARK_DONE_ACTION, {}, 'shacharit__2026-05-06__0', JSON.stringify({ mitzvahId: 'shacharit', dateKey: '2026-05-06' })));

    expect(mockMarkDoneFromNotificationData).toHaveBeenCalledWith(
      { mitzvahId: 'shacharit', dateKey: '2026-05-06' },
      'shacharit__2026-05-06__0',
    );
  });

  it('opens mitzvah detail from the default notification tap', () => {
    initNotificationResponseHandler();
    const listener = mockAddNotificationResponseReceivedListener.mock.calls[0][0];

    listener(response(DEFAULT_NOTIFICATION_ACTION, { mitzvahId: 'sefirat_haomer', fullContent: [{ type: 'blessing', he: 'ברכה' }] }));

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/mitzvah/[id]',
      params: { id: 'sefirat_haomer', highlightContent: '1' },
    });
  });

  it('opens the nusach text for the notification date from the open-text action, without marking done', () => {
    initNotificationResponseHandler();
    const listener = mockAddNotificationResponseReceivedListener.mock.calls[0][0];

    listener(response(OPEN_TEXT_ACTION, {}, 'tefillin__2026-05-06__0', JSON.stringify({ mitzvahId: 'tefillin', dateKey: '2026-05-06' })));

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/siddur/[id]',
      params: { id: 'tefillin', date: '2026-05-06' },
    });
    expect(mockMarkDoneFromNotificationData).not.toHaveBeenCalled();
  });

  it('takes the date from the notification identifier when the payload lacks it', () => {
    initNotificationResponseHandler();
    const listener = mockAddNotificationResponseReceivedListener.mock.calls[0][0];

    listener(response(OPEN_TEXT_ACTION, { mitzvahId: 'havdalah' }, 'havdalah__2026-10-10__0'));

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/siddur/[id]',
      params: { id: 'havdalah', date: '2026-10-10' },
    });
  });

  it('falls back to the mitzvah screen when no date can be recovered', () => {
    initNotificationResponseHandler();
    const listener = mockAddNotificationResponseReceivedListener.mock.calls[0][0];

    listener(response(OPEN_TEXT_ACTION, { mitzvahId: 'havdalah' }, 'not-a-mitzvah-id'));

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/mitzvah/[id]',
      params: { id: 'havdalah', highlightContent: '0' },
    });
  });

  it('replays an open-text tap that arrived before the router was mounted', () => {
    initNotificationResponseHandler();
    const listener = mockAddNotificationResponseReceivedListener.mock.calls[0][0];
    mockRouterPush.mockImplementationOnce(() => {
      throw new Error('navigator not mounted');
    });

    listener(response(OPEN_TEXT_ACTION, { mitzvahId: 'sefirat_haomer', dateKey: '2026-04-20' }));
    consumePendingNotificationRoute();

    expect(mockRouterPush).toHaveBeenCalledTimes(2);
    expect(mockRouterPush).toHaveBeenLastCalledWith({
      pathname: '/siddur/[id]',
      params: { id: 'sefirat_haomer', date: '2026-04-20' },
    });
    consumePendingNotificationRoute();
    expect(mockRouterPush).toHaveBeenCalledTimes(2);
  });

  it('opens home from the pre-block notice, never a mitzvah lookup', () => {
    initNotificationResponseHandler();
    const listener = mockAddNotificationResponseReceivedListener.mock.calls[0][0];

    listener(response(DEFAULT_NOTIFICATION_ACTION, { kind: 'blockNotice' }, 'blockNotice:2026-11-14'));

    expect(mockRouterNavigate).toHaveBeenCalledWith('/(tabs)/home');
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockMarkDoneFromNotificationData).not.toHaveBeenCalled();
  });

  describe('inside a Shabbat block', () => {
    const jerusalem = CITIES[0];
    beforeAll(() => {
      jest.useFakeTimers({
        now: at(jerusalem, '2026-11-14T10:00'),
        doNotFake: ['nextTick', 'queueMicrotask', 'setImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
      });
    });
    afterAll(() => jest.useRealTimers());
    beforeEach(() => {
      useUserStore.getState().setLocation(jerusalem);
      useUserStore.getState().setOnboarded(true);
    });
    afterEach(() => useUserStore.getState().reset());

    // The route would mount under the Shabbat screen and stay there — the reader keeping the screen
    // awake — until tzeit.
    it('opens nothing from a tap, but still honours "done"', () => {
      initNotificationResponseHandler();
      const listener = mockAddNotificationResponseReceivedListener.mock.calls[0][0];

      listener(response(OPEN_TEXT_ACTION, { mitzvahId: 'candle_lighting', dateKey: '2026-11-13' }, 'candle_lighting__2026-11-13__0'));
      listener(response(DEFAULT_NOTIFICATION_ACTION, { mitzvahId: 'candle_lighting' }, 'candle_lighting__2026-11-13__0'));
      listener(response(DEFAULT_NOTIFICATION_ACTION, { kind: 'blockNotice' }, 'blockNotice:2026-11-14'));
      expect(mockRouterPush).not.toHaveBeenCalled();
      expect(mockRouterNavigate).not.toHaveBeenCalled();

      listener(response(MARK_DONE_ACTION, { mitzvahId: 'candle_lighting', dateKey: '2026-11-13' }, 'candle_lighting__2026-11-13__0'));
      expect(mockMarkDoneFromNotificationData).toHaveBeenCalledTimes(1);
    });

    it('drops a tap buffered before the block began instead of replaying it into Shabbat', () => {
      useUserStore.getState().setOnboarded(false);
      initNotificationResponseHandler();
      const listener = mockAddNotificationResponseReceivedListener.mock.calls[0][0];
      mockRouterPush.mockImplementationOnce(() => {
        throw new Error('navigator not mounted');
      });
      listener(response(DEFAULT_NOTIFICATION_ACTION, { mitzvahId: 'shacharit' }));

      useUserStore.getState().setOnboarded(true);
      consumePendingNotificationRoute();
      expect(mockRouterPush).toHaveBeenCalledTimes(1);
    });
  });
});
