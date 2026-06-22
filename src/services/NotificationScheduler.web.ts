import { useUserStore } from '@/stores/useUserStore';

const DAILY_REBUILD_TASK = 'jew-in-time-daily-rebuild';
const NOTIFICATION_ACTION_TASK = 'jew-in-time-notification-actions';
const MITZVAH_REMINDER_CATEGORY = 'mitzvah_reminder';
const MARK_DONE_ACTION = 'MARK_DONE';
const PENDING_LIMIT = 60;
const IOS_MAX = 64;
const LAST_REBUILD_KEY = 'notifications:last-rebuild-date';

export type PendingNotificationMeta = {
  mitzvahId?: string;
  dateKey?: string;
  reminderIndex?: number;
  customId?: string;
  fullContent?: unknown[] | null;
};

export function pendingNotificationMetaFromContent(_content?: unknown): PendingNotificationMeta {
  return {};
}

export const NotificationScheduler = {
  async scheduleAll(): Promise<void> {},
  async cancelAll(): Promise<void> {},
  async cancelForMitzvah(): Promise<void> {},
  async rebuild(): Promise<void> {},
};

export async function markDoneFromNotificationData(_data?: unknown, _notificationId?: string): Promise<boolean> {
  return false;
}

export async function syncNotificationPermissionStatus(): Promise<boolean> {
  return false;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function registerDailyRebuildTask(): Promise<void> {}

export async function registerNotificationActionTask(): Promise<void> {}

export function initNotificationHandlers(): void {
  useUserStore.getState().setNotificationPermission('unknown');
}

export {
  PENDING_LIMIT,
  IOS_MAX,
  DAILY_REBUILD_TASK,
  NOTIFICATION_ACTION_TASK,
  LAST_REBUILD_KEY,
  MITZVAH_REMINDER_CATEGORY,
  MARK_DONE_ACTION,
};
