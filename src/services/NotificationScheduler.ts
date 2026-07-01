import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { ComputeContext, ContentBlock, Mitzvah, Reminder, UserSettings } from '@/types/mitzvah';
import { Location } from '@/types/zmanim';
import { getAllMitzvot } from '@/data/customMitzvotAdapter';
import { ZmanimService } from '@/services/ZmanimService';
import { HebcalService } from '@/services/HebcalService';
import { StorageService } from '@/services/StorageService';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { useCustomMitzvotStore } from '@/stores/useCustomMitzvotStore';
import { useCompletionsStore, dateKey } from '@/stores/useCompletionsStore';

const DAILY_REBUILD_TASK = 'jew-in-time-daily-rebuild';
const NOTIFICATION_ACTION_TASK = 'jew-in-time-notification-actions';
const MITZVAH_REMINDER_CATEGORY = 'mitzvah_reminder';
const MARK_DONE_ACTION = 'MARK_DONE';
const PENDING_LIMIT = 60;
const IOS_MAX = 64;
const LAST_REBUILD_KEY = 'notifications:last-rebuild-date';
const REBUILD_HOUR = 0;
const REBUILD_MINUTE = 15;
const BACKGROUND_NOTIFICATION_RESULT = {
  NoData: 1,
  NewData: 2,
  Failed: 3,
} as const;

function buildId(mitzvahId: string, date: Date, idx: number): string {
  return `${mitzvahId}__${dateKey(date)}__${idx}`;
}

function parseId(id: string): { mitzvahId: string; date: string; idx: number } | null {
  const parts = id.split('__');
  if (parts.length !== 3) return null;
  return { mitzvahId: parts[0], date: parts[1], idx: Number(parts[2]) };
}

export type PendingNotificationMeta = {
  mitzvahId?: string;
  dateKey?: string;
  reminderIndex?: number;
  customId?: string;
  fullContent?: ContentBlock[] | null;
};

type NotificationContentLike = {
  data?: unknown;
  dataString?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function asPendingNotificationMeta(value: unknown): PendingNotificationMeta {
  return isRecord(value) ? (value as PendingNotificationMeta) : {};
}

export function pendingNotificationMetaFromContent(content?: NotificationContentLike | null): PendingNotificationMeta {
  if (!content) return {};
  if (isRecord(content.data)) return asPendingNotificationMeta(content.data);
  if (typeof content.dataString === 'string') {
    try {
      return asPendingNotificationMeta(JSON.parse(content.dataString));
    } catch {
      return {};
    }
  }
  return {};
}

function parseDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function contextFor(date: Date, location: Location, settings: UserSettings): ComputeContext {
  return { date, location, settings, zmanim: ZmanimService.getZmanim(date, location) };
}

function buildTriggerTime(reminder: Reminder, window: { start: Date; end: Date }): Date {
  const anchor = reminder.anchor === 'start' ? window.start : window.end;
  return new Date(anchor.getTime() + reminder.offsetMin * 60_000);
}

function shouldSkip(mitzvah: Mitzvah, date: Date, location: Location): boolean {
  if (!mitzvah.skipOn.length) return false;
  if (mitzvah.skipOn.includes('shabbat') && HebcalService.isShabbat(date, location)) return true;
  if (mitzvah.skipOn.includes('yomtov') && HebcalService.isYomTov(date, location)) return true;
  return false;
}

function remindersFor(mitzvah: Mitzvah): Reminder[] {
  const state = useMitzvotStore.getState().activeMitzvot[mitzvah.id];
  return state?.customReminders ?? mitzvah.defaultReminders;
}

function enabledMitzvot(): Mitzvah[] {
  const active = useMitzvotStore.getState().activeMitzvot;
  return getAllMitzvot().filter((m) => active[m.id]?.enabled);
}

function hasNotificationPermission(): boolean {
  const s = useUserStore.getState();
  if (s.notificationsEnabled === false) return false;
  return s.notificationPermission !== 'denied';
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'מצוות',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#C9922A',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

async function ensureNotificationCategory(): Promise<void> {
  if (typeof Notifications.setNotificationCategoryAsync !== 'function') return;
  try {
    await ensureAndroidChannel();
    await Notifications.setNotificationCategoryAsync(MITZVAH_REMINDER_CATEGORY, [
      {
        identifier: MARK_DONE_ACTION,
        buttonTitle: 'עשיתי',
        options: { opensAppToForeground: false },
      },
    ]);
  } catch (err) {
    if (__DEV__) {
      console.warn('[notifications] category registration failed', err);
    }
  }
}

function shouldRunDailyRebuild(now: Date = new Date()): boolean {
  const last = StorageService.get<string>(LAST_REBUILD_KEY);
  const today = dateKey(now);
  if (last === today) return false;
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours > REBUILD_HOUR || (hours === REBUILD_HOUR && minutes >= REBUILD_MINUTE);
}

export function pickBodyForReminder(reminder: Reminder, mitzvah: Mitzvah, trigger: Date): string {
  const variants = reminder.bodyVariants?.filter((value) => value.trim().length > 0) ?? [];
  const source = variants.length ? variants : [reminder.label];
  const idx = Math.floor(trigger.getTime() / 86_400_000) % source.length;
  const base = source[idx] ?? reminder.label;
  if (!reminder.includeContentInBody || !mitzvah.contentBlocks?.length) return base;
  const content = mitzvah.contentBlocks
    .filter((block) => block.type === 'text' || block.type === 'blessing')
    .map((block) => block.he.trim())
    .filter(Boolean)
    .join('\n');
  return content ? `${base}\n${content}` : base;
}

async function scheduleOne(
  mitzvah: Mitzvah,
  date: Date,
  location: Location,
  settings: UserSettings,
): Promise<void> {
  if (shouldSkip(mitzvah, date, location)) return;
  const ctx = contextFor(date, location, settings);
  const window = mitzvah.computeWindow(ctx);
  if (!window) return;
  const now = Date.now();
  const completed = useCompletionsStore.getState().isDone(mitzvah.id, date);
  const skipped = useCompletionsStore.getState().isSkipped(mitzvah.id, date);
  if (completed || skipped) return;
  const reminders = remindersFor(mitzvah);

  for (let i = 0; i < reminders.length; i++) {
    const r = reminders[i];
    const trigger = buildTriggerTime(r, window);
    if (trigger.getTime() <= now) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: buildId(mitzvah.id, date, i),
      content: {
        title: mitzvah.name.he,
        body: pickBodyForReminder(r, mitzvah, trigger),
        data: {
          mitzvahId: mitzvah.id,
          windowEnd: window.end.toISOString(),
          dateKey: dateKey(date),
          reminderIndex: i,
          customId: buildId(mitzvah.id, date, i),
          fullContent: mitzvah.contentBlocks ?? null,
        },
        categoryIdentifier: MITZVAH_REMINDER_CATEGORY,
        autoDismiss: true,
        sticky: false,
        sound: 'default',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
    });
  }
}

function notificationTargetFromData(
  data: PendingNotificationMeta,
  notificationId?: string,
): { mitzvahId: string; date: Date; key: string } | null {
  const idTarget = notificationId ? parseId(notificationId) : null;
  const customTarget = typeof data.customId === 'string' ? parseId(data.customId) : null;
  const mitzvahId = data.mitzvahId ?? idTarget?.mitzvahId ?? customTarget?.mitzvahId;
  const key = data.dateKey ?? idTarget?.date ?? customTarget?.date;
  if (!mitzvahId || !key) return null;
  const date = parseDateKey(key);
  if (!date) return null;
  return { mitzvahId, date, key };
}

function notificationMatchesTarget(
  notificationId: string,
  data: PendingNotificationMeta,
  mitzvahId: string,
  key: string,
): boolean {
  const target = notificationTargetFromData(data, notificationId);
  return Boolean(target && target.mitzvahId === mitzvahId && target.key === key);
}

async function getPresentedNotificationsSafe(): Promise<Notifications.Notification[]> {
  if (typeof Notifications.getPresentedNotificationsAsync !== 'function') return [];
  try {
    return await Notifications.getPresentedNotificationsAsync();
  } catch {
    return [];
  }
}

async function dismissNotificationIds(ids: Iterable<string>): Promise<void> {
  if (typeof Notifications.dismissNotificationAsync !== 'function') return;
  await Promise.all(
    [...new Set(ids)].map((id) => Notifications.dismissNotificationAsync(id).catch(() => {})),
  );
}

async function dismissPresentedNotificationsForMitzvah(
  mitzvahId: string,
  key: string,
  notificationId?: string,
): Promise<void> {
  const ids = new Set<string>();
  if (notificationId) ids.add(notificationId);

  const presented = await getPresentedNotificationsSafe();
  for (const notification of presented) {
    const id = notification.request.identifier;
    const data = pendingNotificationMetaFromContent(notification.request.content as NotificationContentLike);
    if (notificationMatchesTarget(id, data, mitzvahId, key)) {
      ids.add(id);
    }
  }

  await dismissNotificationIds(ids);
}

async function dismissCompletedPresentedNotifications(): Promise<void> {
  const ids: string[] = [];
  const completions = useCompletionsStore.getState();
  const presented = await getPresentedNotificationsSafe();
  for (const notification of presented) {
    const id = notification.request.identifier;
    const data = pendingNotificationMetaFromContent(notification.request.content as NotificationContentLike);
    const target = notificationTargetFromData(data, id);
    if (target && completions.isDone(target.mitzvahId, target.date)) {
      ids.push(id);
    }
  }
  await dismissNotificationIds(ids);
}

export async function markDoneFromNotificationData(
  data: PendingNotificationMeta,
  notificationId?: string,
): Promise<boolean> {
  const target = notificationTargetFromData(data, notificationId);
  if (!target) return false;
  useCompletionsStore.getState().markDone(target.mitzvahId, target.date);
  await Promise.all([
    NotificationScheduler.cancelForMitzvah(target.mitzvahId, target.date).catch(() => {}),
    dismissPresentedNotificationsForMitzvah(target.mitzvahId, target.key, notificationId),
  ]);
  return true;
}

function isNotificationResponse(
  data: Notifications.NotificationTaskPayload,
): data is Notifications.NotificationResponse {
  return Boolean(data && typeof data === 'object' && 'actionIdentifier' in data && 'notification' in data);
}

async function scheduleAllImpl(
  fromDate: Date,
  activeMitzvot: Mitzvah[],
  location: Location,
  settings: UserSettings,
): Promise<void> {
  if (!hasNotificationPermission()) return;
  await ensureNotificationCategory();
  const today = new Date(fromDate);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const days = pending.length > PENDING_LIMIT ? [today] : [today, tomorrow];

  for (const d of days) {
    for (const m of activeMitzvot) {
      await scheduleOne(m, d, location, settings);
    }
  }
}

export const NotificationScheduler = {
  inFlight: null as Promise<void> | null,

  async withLock(task: () => Promise<void>): Promise<void> {
    if (this.inFlight) return this.inFlight;
    const run = task().finally(() => {
      if (this.inFlight === run) {
        this.inFlight = null;
      }
    });
    this.inFlight = run;
    return run;
  },

  async scheduleAll(
    fromDate: Date = new Date(),
    activeMitzvot: Mitzvah[] = enabledMitzvot(),
    location: Location = useUserStore.getState().location,
    settings: UserSettings = (({ nusach, halachicOpinions, inIsrael }) => ({ nusach, halachicOpinions, inIsrael }))(useUserStore.getState()),
  ): Promise<void> {
    return this.withLock(() => scheduleAllImpl(fromDate, activeMitzvot, location, settings));
  },

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async cancelForMitzvah(mitzvahId: string, date: Date = new Date()): Promise<void> {
    const key = dateKey(date);
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    for (const p of pending) {
      const rawData = pendingNotificationMetaFromContent(p.content as NotificationContentLike);
      const parsed =
        (p.identifier ? parseId(p.identifier) : null) ??
        (rawData.customId ? parseId(rawData.customId) : null) ??
        null;
      const parsedMitzvahId = parsed?.mitzvahId ?? rawData.mitzvahId;
      const parsedDate = parsed?.date ?? rawData.dateKey;
      if (parsedMitzvahId !== mitzvahId) continue;
      if (parsedDate !== key) continue;
      await Notifications.cancelScheduledNotificationAsync(p.identifier);
    }
  },

  async rebuild(): Promise<void> {
    return this.withLock(async () => {
      await this.cancelAll();
      await scheduleAllImpl(
        new Date(),
        enabledMitzvot(),
        useUserStore.getState().location,
        (({ nusach, halachicOpinions, inIsrael }) => ({ nusach, halachicOpinions, inIsrael }))(useUserStore.getState()),
      );
      StorageService.set(LAST_REBUILD_KEY, dateKey(new Date()));
    });
  },
};

export async function syncNotificationPermissionStatus(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  const granted = status === 'granted';
  useUserStore.getState().setNotificationPermission(granted ? 'granted' : 'denied');
  return granted;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  await ensureAndroidChannel();
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') {
    useUserStore.getState().setNotificationPermission('granted');
    return true;
  }
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  const granted = req.status === 'granted';
  useUserStore.getState().setNotificationPermission(granted ? 'granted' : 'denied');
  return granted;
}

TaskManager.defineTask(DAILY_REBUILD_TASK, async () => {
  try {
    if (shouldRunDailyRebuild()) {
      await NotificationScheduler.rebuild();
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.warn('[daily-rebuild] failed', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

TaskManager.defineTask<Notifications.NotificationTaskPayload>(NOTIFICATION_ACTION_TASK, async ({ data, error }) => {
  if (error) {
    if (__DEV__) console.warn('[notifications] action task failed', error);
    return BACKGROUND_NOTIFICATION_RESULT.Failed;
  }
  if (!isNotificationResponse(data) || data.actionIdentifier !== MARK_DONE_ACTION) {
    return BACKGROUND_NOTIFICATION_RESULT.NoData;
  }
  const handled = await markDoneFromNotificationData(
    pendingNotificationMetaFromContent(data.notification.request.content as NotificationContentLike),
    data.notification.request.identifier,
  );
  return handled ? BACKGROUND_NOTIFICATION_RESULT.NewData : BACKGROUND_NOTIFICATION_RESULT.NoData;
});

export async function registerDailyRebuildTask(): Promise<void> {
  try {
    await BackgroundFetch.registerTaskAsync(DAILY_REBUILD_TASK, {
      minimumInterval: 60 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (err) {
    console.warn('[daily-rebuild] register failed', err);
  }
}

export async function registerNotificationActionTask(): Promise<void> {
  try {
    await Notifications.registerTaskAsync(NOTIFICATION_ACTION_TASK);
  } catch (err) {
    if (__DEV__) console.warn('[notifications] action task register failed', err);
  }
}

export function initNotificationHandlers(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  ensureNotificationCategory().catch(() => {});
  registerNotificationActionTask().catch(() => {});
  syncNotificationPermissionStatus().catch(() => {});
  dismissCompletedPresentedNotifications().catch(() => {});
  useUserStore.subscribe((state, prev) => {
    if (state.notificationsEnabled !== prev.notificationsEnabled) {
      if (state.notificationsEnabled) {
        NotificationScheduler.rebuild().catch(() => {});
      } else {
        NotificationScheduler.cancelAll().catch(() => {});
      }
      return;
    }
    if (
      state.location !== prev.location ||
      state.nusach !== prev.nusach ||
      state.halachicOpinions !== prev.halachicOpinions ||
      state.inIsrael !== prev.inIsrael
    ) {
      NotificationScheduler.rebuild().catch(() => {});
    }
  });
  useMitzvotStore.subscribe((state, prev) => {
    if (state.activeMitzvot === prev.activeMitzvot) return;
    if (mitzvotConfigChanged(state.activeMitzvot, prev.activeMitzvot)) {
      NotificationScheduler.rebuild().catch(() => {});
    }
  });
  useCustomMitzvotStore.subscribe((state, prev) => {
    if (state.items !== prev.items) {
      NotificationScheduler.rebuild().catch(() => {});
    }
  });
  registerDailyRebuildTask().catch(() => {});
}

function mitzvotConfigChanged(
  next: Record<string, { enabled: boolean; customReminders?: Reminder[] }>,
  prev: Record<string, { enabled: boolean; customReminders?: Reminder[] }>,
): boolean {
  const keys = new Set([...Object.keys(next), ...Object.keys(prev)]);
  for (const id of keys) {
    const a = next[id];
    const b = prev[id];
    if ((a?.enabled ?? false) !== (b?.enabled ?? false)) return true;
    if (a?.customReminders !== b?.customReminders) return true;
  }
  return false;
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
