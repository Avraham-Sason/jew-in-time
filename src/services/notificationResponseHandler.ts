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

let pendingDeepLink: PendingNotificationMeta | null = null;

// When the app is launched BY the tap, this listener can fire before the router tree is mounted
// and expo-router silently drops the navigation. Buffer it and let the root replay it once
// navigation is ready.
export function consumePendingNotificationRoute(): void {
  const data = pendingDeepLink;
  pendingDeepLink = null;
  if (data) openMitzvahDetail(data);
}

function openMitzvahDetail(data: PendingNotificationMeta) {
  if (!data.mitzvahId) return;
  try {
    router.push({
      pathname: '/mitzvah/[id]',
      params: {
        id: data.mitzvahId,
        highlightContent: data.fullContent?.length ? '1' : '0',
      },
    });
  } catch {
    pendingDeepLink = data;
  }
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
