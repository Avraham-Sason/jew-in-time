import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  MARK_DONE_ACTION,
  OPEN_TEXT_ACTION,
  markDoneFromNotificationData,
  notificationTargetFromData,
  pendingNotificationMetaFromContent,
  PendingNotificationMeta,
} from '@/services/NotificationScheduler';

export const DEFAULT_NOTIFICATION_ACTION = 'expo.modules.notifications.actions.DEFAULT';
export { MARK_DONE_ACTION, OPEN_TEXT_ACTION };

function getData(response: Notifications.NotificationResponse): PendingNotificationMeta {
  return pendingNotificationMetaFromContent(response.notification.request.content);
}

let pendingNavigation: (() => void) | null = null;

// When the app is launched BY the tap, this listener can fire before the router tree is mounted
// and expo-router silently drops the navigation. Buffer it and let the root replay it once
// navigation is ready.
export function consumePendingNotificationRoute(): void {
  const pending = pendingNavigation;
  pendingNavigation = null;
  if (pending) navigate(pending);
}

function navigate(go: () => void) {
  try {
    go();
  } catch {
    pendingNavigation = go;
  }
}

function openMitzvahDetail(data: PendingNotificationMeta) {
  const { mitzvahId } = data;
  if (!mitzvahId) return;
  navigate(() =>
    router.push({
      pathname: '/mitzvah/[id]',
      params: {
        id: mitzvahId,
        highlightContent: data.fullContent?.length ? '1' : '0',
      },
    }),
  );
}

function openSiddur(data: PendingNotificationMeta, notificationId: string) {
  const target = notificationTargetFromData(data, notificationId);
  if (!target) {
    openMitzvahDetail(data);
    return;
  }
  navigate(() =>
    router.push({
      pathname: '/siddur/[id]',
      params: { id: target.mitzvahId, date: target.key },
    }),
  );
}

export function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const data = getData(response);
  if (response.actionIdentifier === MARK_DONE_ACTION) {
    markDoneFromNotificationData(data, response.notification.request.identifier).catch(() => {});
    return;
  }

  if (response.actionIdentifier === OPEN_TEXT_ACTION) {
    openSiddur(data, response.notification.request.identifier);
    return;
  }

  if (response.actionIdentifier === DEFAULT_NOTIFICATION_ACTION) {
    openMitzvahDetail(data);
  }
}

export function initNotificationResponseHandler(): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
}
