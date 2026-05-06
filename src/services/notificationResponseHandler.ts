import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { NotificationScheduler, PendingNotificationMeta } from '@/services/NotificationScheduler';
import { useCompletionsStore } from '@/stores/useCompletionsStore';

export const MARK_DONE_ACTION = 'MARK_DONE';
export const DEFAULT_NOTIFICATION_ACTION = 'expo.modules.notifications.actions.DEFAULT';

function parseDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getData(response: Notifications.NotificationResponse): PendingNotificationMeta {
  return (response.notification.request.content.data ?? {}) as PendingNotificationMeta;
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
    if (!data.mitzvahId || !data.dateKey) return;
    const date = parseDateKey(data.dateKey);
    if (!date) return;
    useCompletionsStore.getState().markDone(data.mitzvahId, date);
    NotificationScheduler.cancelForMitzvah(data.mitzvahId, date).catch(() => {});
    return;
  }

  if (response.actionIdentifier === DEFAULT_NOTIFICATION_ACTION) {
    openMitzvahDetail(data);
  }
}

export function initNotificationResponseHandler(): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
}
