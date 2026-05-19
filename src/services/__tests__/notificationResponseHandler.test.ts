const mockAddNotificationResponseReceivedListener = jest.fn();
const mockMarkDoneFromNotificationData = jest.fn<Promise<boolean>, [unknown, string?]>(async () => true);
const mockRouterPush = jest.fn();

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: (listener: unknown) => mockAddNotificationResponseReceivedListener(listener),
}));

jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockRouterPush(...args) },
}));

jest.mock('@/services/NotificationScheduler', () => ({
  MARK_DONE_ACTION: 'MARK_DONE',
  markDoneFromNotificationData: (data: unknown, id?: string) => mockMarkDoneFromNotificationData(data, id),
  pendingNotificationMetaFromContent: (content?: { data?: unknown; dataString?: string }) => {
    if (content?.data) return content.data;
    if (content?.dataString) return JSON.parse(content.dataString);
    return {};
  },
}));

import {
  DEFAULT_NOTIFICATION_ACTION,
  initNotificationResponseHandler,
  MARK_DONE_ACTION,
} from '../notificationResponseHandler';

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
});
