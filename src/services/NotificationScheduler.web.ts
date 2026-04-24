import { useUserStore } from '@/stores/useUserStore';

const DAILY_REBUILD_TASK = 'kosher-jew-daily-rebuild';
const PENDING_LIMIT = 60;
const IOS_MAX = 64;
const LAST_REBUILD_KEY = 'notifications:last-rebuild-date';

export const NotificationScheduler = {
  async scheduleAll(): Promise<void> {},
  async cancelAll(): Promise<void> {},
  async cancelForMitzvah(): Promise<void> {},
  async rebuild(): Promise<void> {},
};

export async function syncNotificationPermissionStatus(): Promise<boolean> {
  return false;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function registerDailyRebuildTask(): Promise<void> {}

export function initNotificationHandlers(): void {
  useUserStore.getState().setNotificationPermission('unknown');
}

export { PENDING_LIMIT, IOS_MAX, DAILY_REBUILD_TASK, LAST_REBUILD_KEY };
