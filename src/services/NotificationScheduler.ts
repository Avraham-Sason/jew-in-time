import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { ComputeContext, Mitzvah, Reminder, UserSettings } from '@/types/mitzvah';
import { Location } from '@/types/zmanim';
import { getAllMitzvot, findAnyMitzvah } from '@/data/customMitzvotAdapter';
import { ZmanimService } from '@/services/ZmanimService';
import { HebcalService } from '@/services/HebcalService';
import { StorageService } from '@/services/StorageService';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { useCustomMitzvotStore } from '@/stores/useCustomMitzvotStore';
import { useCompletionsStore, dateKey } from '@/stores/useCompletionsStore';

const DAILY_REBUILD_TASK = 'kosher-jew-daily-rebuild';
const PENDING_LIMIT = 60;
const IOS_MAX = 64;
const LAST_REBUILD_KEY = 'notifications:last-rebuild-date';
const REBUILD_HOUR = 0;
const REBUILD_MINUTE = 15;

function buildId(mitzvahId: string, date: Date, idx: number): string {
  return `${mitzvahId}__${dateKey(date)}__${idx}`;
}

function parseId(id: string): { mitzvahId: string; date: string; idx: number } | null {
  const parts = id.split('__');
  if (parts.length !== 3) return null;
  return { mitzvahId: parts[0], date: parts[1], idx: Number(parts[2]) };
}

type PendingNotificationMeta = {
  mitzvahId?: string;
  dateKey?: string;
  reminderIndex?: number;
  customId?: string;
};

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

function shouldRunDailyRebuild(now: Date = new Date()): boolean {
  const last = StorageService.get<string>(LAST_REBUILD_KEY);
  const today = dateKey(now);
  if (last === today) return false;
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours > REBUILD_HOUR || (hours === REBUILD_HOUR && minutes >= REBUILD_MINUTE);
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
  if (skipped) return;
  const reminders = remindersFor(mitzvah);

  for (let i = 0; i < reminders.length; i++) {
    const r = reminders[i];
    if (completed && r.skipIfDone) continue;
    const trigger = buildTriggerTime(r, window);
    if (trigger.getTime() <= now) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: buildId(mitzvah.id, date, i),
      content: {
        title: mitzvah.name.he,
        body: r.label,
        data: {
          mitzvahId: mitzvah.id,
          windowEnd: window.end.toISOString(),
          dateKey: dateKey(date),
          reminderIndex: i,
          customId: buildId(mitzvah.id, date, i),
        },
        sound: 'default',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
    });
  }
}

async function scheduleAllImpl(
  fromDate: Date,
  activeMitzvot: Mitzvah[],
  location: Location,
  settings: UserSettings,
): Promise<void> {
  if (!hasNotificationPermission()) return;
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
    const mitzvah = findAnyMitzvah(mitzvahId);
    const reminders = mitzvah ? remindersFor(mitzvah) : [];
    for (const p of pending) {
      const rawData = (p.content.data ?? {}) as PendingNotificationMeta;
      const parsed =
        (p.identifier ? parseId(p.identifier) : null) ??
        (rawData.customId ? parseId(rawData.customId) : null) ??
        null;
      const parsedMitzvahId = parsed?.mitzvahId ?? rawData.mitzvahId;
      const parsedDate = parsed?.date ?? rawData.dateKey;
      const parsedIdx = parsed?.idx ?? rawData.reminderIndex;
      if (parsedMitzvahId !== mitzvahId) continue;
      if (parsedDate !== key) continue;
      const reminder = typeof parsedIdx === 'number' ? reminders[parsedIdx] : undefined;
      if (!reminder || reminder.skipIfDone) {
        await Notifications.cancelScheduledNotificationAsync(p.identifier);
      }
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
  ensureAndroidChannel().catch(() => {});
  syncNotificationPermissionStatus().catch(() => {});
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

export { PENDING_LIMIT, IOS_MAX, DAILY_REBUILD_TASK, LAST_REBUILD_KEY };
