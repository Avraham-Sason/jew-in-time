import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  MARK_DONE_ACTION,
  markDoneFromNotificationData,
  pendingNotificationMetaFromContent,
  PendingNotificationMeta,
} from '@/services/NotificationScheduler';

export const DEFAULT_NOTIFICATION_ACTION = 'expo.modules.notifications.actions.DEFAULT';
export { MARK_DONE_ACTION };

function getData(response: Notifications.NotificationResponse): PendingNotificationMeta {
  return pendingNotificationMetaFromContent(response.notification.request.content);
}

function openMitzvahDetail(data: PendingNotificationMeta) {
  if (!data.mitzvahId) return;
  router.push({
    pathname: '/mitzvah/[id]',
    params: {
      id: data.mitzvahId,
      highlightContent: data.fullContent?.length ? '1' : '0',
    },
  });
}

export function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const data = getData(response);
  if (response.actionIdentifier === MARK_DONE_ACTION) {
    markDoneFromNotificationData(data, response.notification.request.identifier).catch(() => {});
    return;
  }

  if (response.actionIdentifier === DEFAULT_NOTIFICATION_ACTION) {
    openMitzvahDetail(data);
  }
}

export function initNotificationResponseHandler(): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
}
