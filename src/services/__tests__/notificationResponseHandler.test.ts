const mockAddNotificationResponseReceivedListener = jest.fn();
const mockCancelForMitzvah = jest.fn<Promise<void>, [string, Date]>(async () => {});
const mockMarkDone = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: (listener: unknown) => mockAddNotificationResponseReceivedListener(listener),
}));

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
}));

jest.mock('@/services/NotificationScheduler', () => ({
  NotificationScheduler: {
    cancelForMitzvah: (id: string, date: Date) => mockCancelForMitzvah(id, date),
  },
}));

jest.mock('@/stores/useCompletionsStore', () => ({
  useCompletionsStore: {
    getState: () => ({ markDone: mockMarkDone }),
  },
}));

import {
  DEFAULT_NOTIFICATION_ACTION,
  initNotificationResponseHandler,
  MARK_DONE_ACTION,
} from '../notificationResponseHandler';

function response(actionIdentifier: string, data: Record<string, unknown>) {
  return {
    actionIdentifier,
    notification: {
      request: {
        content: { data },
      },
    },
  } as never;
}

describe('notificationResponseHandler', () => {
  beforeEach(() => {
    mockAddNotificationResponseReceivedListener.mockReset();
    mockCancelForMitzvah.mockClear();
    mockMarkDone.mockClear();
    mockRouterPush.mockClear();
  });

  it('marks a mitzvah done from the notification action', () => {
    initNotificationResponseHandler();
    const listener = mockAddNotificationResponseReceivedListener.mock.calls[0][0];

    listener(response(MARK_DONE_ACTION, { mitzvahId: 'shacharit', dateKey: '2026-05-06' }));

    expect(mockMarkDone).toHaveBeenCalledWith('shacharit', new Date(2026, 4, 6));
    expect(mockCancelForMitzvah).toHaveBeenCalledWith('shacharit', new Date(2026, 4, 6));
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
});
