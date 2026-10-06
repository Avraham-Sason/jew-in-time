import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { DateTime } from 'luxon';
import { ComputeContext, ContentBlock, Mitzvah, Reminder, UserSettings } from '@/types/mitzvah';
import { HolyBlock, Location } from '@/types/zmanim';
import { getAllMitzvot } from '@/data/customMitzvotAdapter';
import { omerDayFor } from '@/data/mitzvot';
import { hasSiddurText, siddurPlace } from '@/data/siddur';
import { HebcalService } from '@/services/HebcalService';
import { ZmanimService } from '@/services/ZmanimService';
import { StorageService } from '@/services/StorageService';
import { holyBlockLabelKeys, isSkippedAt, opensQuietBlock, reminderFires } from '@/utils/skipRules';
import { locationNoon } from '@/utils/locationDay';
import { t } from '@/i18n';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { useCustomMitzvotStore } from '@/stores/useCustomMitzvotStore';
import { useCompletionsStore, dateKey } from '@/stores/useCompletionsStore';

const DAILY_REBUILD_TASK = 'jew-in-time-daily-rebuild';
const NOTIFICATION_ACTION_TASK = 'jew-in-time-notification-actions';
const MITZVAH_REMINDER_CATEGORY = 'mitzvah_reminder';
const MITZVAH_TEXT_CATEGORY = 'mitzvah_reminder_text';
const MARK_DONE_ACTION = 'MARK_DONE';
const OPEN_TEXT_ACTION = 'OPEN_TEXT';
const ANDROID_CHANNEL_ID = 'default';
const PENDING_LIMIT = 60;
const IOS_MAX = 64;
const IOS_HEADROOM = 4;
const LAST_REBUILD_KEY = 'notifications:last-rebuild-date';
const SCHEDULE_FORMAT_KEY = 'notifications:schedule-format';
const SCHEDULE_FORMAT = 3;
const BLOCK_NOTICE_KIND = 'blockNotice';
const BLOCK_NOTICE_LEAD_MIN = 60;
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
  kind?: typeof BLOCK_NOTICE_KIND;
  mitzvahId?: string;
  dateKey?: string;
  reminderIndex?: number;
  customId?: string;
  skipIfDone?: boolean;
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

// `date` is a calendar day as every day-level surface holds it: the device-local midnight of the
// location's date, whose zmanim are read at the location's own noon.
function contextFor(date: Date, location: Location, settings: UserSettings): ComputeContext | null {
  const zmanim = ZmanimService.getZmanim(locationNoon(date, location), location);
  return zmanim ? { date, location, settings, zmanim } : null;
}

export function buildTriggerTime(reminder: Reminder, window: { start: Date; end: Date }): Date {
  const anchor = reminder.anchor === 'start' ? window.start : window.end;
  return new Date(anchor.getTime() + reminder.offsetMin * 60_000);
}

function remindersFor(mitzvah: Mitzvah): Reminder[] {
  const state = useMitzvotStore.getState().activeMitzvot[mitzvah.id];
  return state?.customReminders ?? mitzvah.defaultReminders;
}

function enabledMitzvot(): Mitzvah[] {
  const active = useMitzvotStore.getState().activeMitzvot;
  return getAllMitzvot(useUserStore.getState().nusach).filter((m) => active[m.id]?.enabled);
}

function hasNotificationPermission(): boolean {
  const s = useUserStore.getState();
  if (s.notificationsEnabled === false) return false;
  return s.notificationPermission !== 'denied';
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: t('notifications.channelName'),
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
    const markDone = {
      identifier: MARK_DONE_ACTION,
      buttonTitle: t('notifications.markDone'),
      options: { opensAppToForeground: false },
    };
    await Notifications.setNotificationCategoryAsync(MITZVAH_REMINDER_CATEGORY, [markDone]);
    await Notifications.setNotificationCategoryAsync(MITZVAH_TEXT_CATEGORY, [
      {
        identifier: OPEN_TEXT_ACTION,
        buttonTitle: t('siddur.open'),
        options: { opensAppToForeground: true },
      },
      markDone,
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

function isEnglish(): boolean {
  return useUserStore.getState().language === 'en';
}

function mitzvahTitle(mitzvah: Mitzvah): string {
  return isEnglish() && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he;
}

export function pickBodyForReminder(reminder: Reminder, mitzvah: Mitzvah, trigger: Date): string {
  // Registry labels and bodyVariants are Hebrew-only. Rather than deliver unreadable text to an
  // English user, fall back to a translated line built from the English mitzvah name.
  const english = isEnglish() && mitzvah.name.en;
  const variants = reminder.bodyVariants?.filter((value) => value.trim().length > 0) ?? [];
  const source = variants.length ? variants : [reminder.label];
  const idx = Math.floor(trigger.getTime() / 86_400_000) % source.length;
  const base = english
    ? t('notifications.timeFor', { name: mitzvah.name.en })
    : (source[idx] ?? reminder.label);
  if (!reminder.includeContentInBody || !mitzvah.contentBlocks?.length) return base;
  const content = mitzvah.contentBlocks
    .filter((block) => block.type === 'text' || block.type === 'blessing')
    .map((block) => (english ? (block.en ?? block.he) : block.he).trim())
    .filter(Boolean)
    .join('\n');
  return content ? `${base}\n${content}` : base;
}

type ScheduleCandidate = {
  trigger: Date;
  input: Notifications.NotificationRequestInput;
};

function candidatesFor(
  mitzvah: Mitzvah,
  date: Date,
  location: Location,
  settings: UserSettings,
): ScheduleCandidate[] {
  const ctx = contextFor(date, location, settings);
  if (!ctx) return [];
  const window = mitzvah.computeWindow(ctx);
  if (!window) return [];
  if (isSkippedAt(mitzvah, window.start, location, settings)) return [];
  const completions = useCompletionsStore.getState();
  if (completions.isDone(mitzvah.id, date) || completions.isSkipped(mitzvah.id, date)) return [];

  const now = new Date();
  const reminders = remindersFor(mitzvah);
  const hasText = hasSiddurText(mitzvah, settings.nusach, date, siddurPlace(location, settings.inIsrael));
  const candidates: ScheduleCandidate[] = [];

  for (let i = 0; i < reminders.length; i++) {
    const r = reminders[i];
    const trigger = buildTriggerTime(r, window);
    // The reminder editor rejects out-of-window offsets up front; this is the backstop for
    // already-persisted ones, and the same rule drops anything inside a Shabbat / Yom Tov block.
    if (!reminderFires(trigger, window, location, now)) continue;
    // Candle lighting fires on the block's opening edge: its text would open only the Shabbat screen.
    const category = hasText && !opensQuietBlock(trigger, location) ? MITZVAH_TEXT_CATEGORY : MITZVAH_REMINDER_CATEGORY;
    candidates.push({
      trigger,
      input: {
        identifier: buildId(mitzvah.id, date, i),
        content: {
          title: mitzvahTitle(mitzvah),
          body: pickBodyForReminder(r, mitzvah, trigger),
          data: {
            mitzvahId: mitzvah.id,
            windowEnd: window.end.toISOString(),
            dateKey: dateKey(date),
            reminderIndex: i,
            customId: buildId(mitzvah.id, date, i),
            skipIfDone: r.skipIfDone === true,
            fullContent: mitzvah.contentBlocks ?? null,
          },
          categoryIdentifier: category,
          autoDismiss: true,
          sticky: false,
          sound: 'default',
        },
        // Android resolves the channel from the trigger. Without it every reminder lands on
        // expo's "Miscellaneous" fallback channel and the configured one is dead.
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: trigger,
          channelId: ANDROID_CHANNEL_ID,
        },
      },
    });
  }

  return candidates;
}

export function notificationTargetFromData(
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

function shouldSuppressForCompletion(data: PendingNotificationMeta, notificationId?: string): boolean {
  if (!data.skipIfDone) return false;
  const target = notificationTargetFromData(data, notificationId);
  if (!target) return false;
  const completions = useCompletionsStore.getState();
  return completions.isDone(target.mitzvahId, target.date) || completions.isSkipped(target.mitzvahId, target.date);
}

export async function dismissCompletedPresentedNotifications(): Promise<void> {
  const ids: string[] = [];
  const completions = useCompletionsStore.getState();
  const presented = await getPresentedNotificationsSafe();
  for (const notification of presented) {
    const id = notification.request.identifier;
    const data = pendingNotificationMetaFromContent(notification.request.content as NotificationContentLike);
    const target = notificationTargetFromData(data, id);
    // Skipped counts as resolved, exactly like scheduleOne and shouldSuppressForCompletion treat
    // it — otherwise a mitzvah the user deliberately skipped keeps nagging from the tray.
    if (target && (completions.isDone(target.mitzvahId, target.date) || completions.isSkipped(target.mitzvahId, target.date))) {
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

// The location's calendar days from the one `fromDate` falls on: today and tomorrow, then on through
// any Shabbat / Yom Tov block that is reached or starts the next day, up to the first weekday after
// it. Nothing reopens the app inside a block — the user does not touch the phone — so a schedule
// that stopped at the block left Sunday morning with no reminders whenever background fetch did not
// run. Stepping by the location's dates, never by 24-hour device steps, keeps a DST change in
// either zone from skipping or repeating a day, and keys every reminder by the date its window
// belongs to — the same day the reader's liturgical flags and the history read.
function horizonDays(fromDate: Date, location: Location): Date[] {
  const first = DateTime.fromJSDate(fromDate).setZone(location.tz).startOf('day');
  const dayAt = (offset: number) => {
    const day = first.plus({ days: offset });
    return new Date(day.year, day.month - 1, day.day);
  };
  const isHoly = (day: Date) => HebcalService.isHolyDay(locationNoon(day, location), location);
  const days = [dayAt(0), dayAt(1)];
  while (isHoly(days[days.length - 1]) || isHoly(dayAt(days.length))) days.push(dayAt(days.length));
  return days;
}

function holyBlocksWithin(days: Date[], location: Location): HolyBlock[] {
  const blocks = new Map<string, HolyBlock>();
  for (const day of days) {
    const block = HebcalService.holyBlockOn(locationNoon(day, location), location);
    if (block) blocks.set(block.days[0], block);
  }
  return [...blocks.values()];
}

function formatClock(instant: Date): string {
  return DateTime.fromJSDate(instant).toFormat('HH:mm');
}

type OmerNight = { evening: DateTime; count: number };

// The Omer counts due on the nights inside the block, when no reminder can fire, each with the
// evening it is counted on. The erev's night may have none (the first Seder), so a count is never
// assumed to be tonight's. The last day's night opens at the block's own tzeit, where the regular
// Omer reminder fires as usual.
function omerNightsWithin(block: HolyBlock, location: Location): OmerNight[] {
  const evenings = [DateTime.fromISO(block.days[0], { zone: location.tz }).minus({ days: 1 })];
  for (const day of block.days.slice(0, -1)) evenings.push(DateTime.fromISO(day, { zone: location.tz }));
  return evenings.flatMap((evening) => {
    const count = omerDayFor(evening.set({ hour: 12 }).toJSDate(), location.tz);
    return count === null ? [] : [{ evening, count }];
  });
}

function omerLine(block: HolyBlock, nights: OmerNight[]): string | null {
  if (!nights.length) return null;
  const erev = DateTime.fromISO(block.days[0]).minus({ days: 1 }).toISODate();
  if (nights.length === 1 && nights[0].evening.toISODate() === erev) {
    return t('holyBlock.notice.omerTonight', { count: nights[0].count });
  }
  const locale = isEnglish() ? 'en' : 'he';
  const counts = nights.map(({ evening, count }) =>
    t('holyBlock.notice.omerOn', { count, day: evening.setLocale(locale).toFormat('cccc') }),
  );
  return t('holyBlock.notice.omerNights', { counts: counts.join(', ') });
}

function blockNoticeCandidate(block: HolyBlock, location: Location, countsOmer: boolean): ScheduleCandidate | null {
  const trigger = new Date(block.start.getTime() - BLOCK_NOTICE_LEAD_MIN * 60_000);
  if (trigger.getTime() <= Date.now()) return null;
  const labels = holyBlockLabelKeys(block);
  const lines = [t('holyBlock.notice.body', { start: formatClock(block.start), exit: t(labels.exit), end: formatClock(block.end) })];
  const omer = countsOmer ? omerLine(block, omerNightsWithin(block, location)) : null;
  if (omer) lines.push(omer);
  const identifier = `${BLOCK_NOTICE_KIND}:${block.days[0]}`;
  return {
    trigger,
    input: {
      identifier,
      content: {
        title: t(labels.title),
        body: lines.join('\n'),
        data: { kind: BLOCK_NOTICE_KIND },
        autoDismiss: true,
        sticky: false,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
        channelId: ANDROID_CHANNEL_ID,
      },
    },
  };
}

async function scheduleAllImpl(
  fromDate: Date,
  activeMitzvot: Mitzvah[],
  location: Location,
  settings: UserSettings,
): Promise<void> {
  if (!hasNotificationPermission()) return;
  await ensureNotificationCategory();
  const days = horizonDays(fromDate, location);

  const candidates: ScheduleCandidate[] = [];
  const countsOmer = activeMitzvot.some((m) => m.id === 'sefirat_haomer');
  for (const block of holyBlocksWithin(days, location)) {
    try {
      const notice = blockNoticeCandidate(block, location, countsOmer);
      if (notice) candidates.push(notice);
    } catch (err) {
      if (__DEV__) console.warn('[notifications] block notice failed', block.days[0], err);
    }
  }
  for (const d of days) {
    for (const m of activeMitzvot) {
      // Isolate per mitzvah: one failure must never abort the rest of the batch, or a single
      // bad computation leaves the user with an empty schedule (cancelAll already ran).
      try {
        candidates.push(...candidatesFor(m, d, location, settings));
      } catch (err) {
        if (__DEV__) console.warn('[notifications] scheduling failed', m.id, err);
      }
    }
  }

  // iOS keeps only the 64 soonest pending requests and silently discards the rest. Order by
  // trigger and cap deliberately, so what gets dropped is the furthest away rather than —
  // as with a day-major loop — all of tomorrow.
  candidates.sort((a, b) => a.trigger.getTime() - b.trigger.getTime());
  const cap = Platform.OS === 'ios' ? IOS_MAX - IOS_HEADROOM : PENDING_LIMIT;
  if (candidates.length > cap) {
    console.warn(`[notifications] ${candidates.length - cap} reminder(s) beyond the ${cap} slot cap were not scheduled`);
  }

  for (const candidate of candidates.slice(0, cap)) {
    try {
      await Notifications.scheduleNotificationAsync(candidate.input);
    } catch (err) {
      if (__DEV__) console.warn('[notifications] schedule failed', candidate.input.identifier, err);
    }
  }
}

export const NotificationScheduler = {
  inFlight: null as Promise<void> | null,

  rerunQueued: false,

  // Trailing-edge coalescing, not drop-on-conflict. A rebuild reads the store INSIDE the locked
  // task, so a request arriving mid-run reflects state the running task never saw; dropping it
  // left the newest toggle or city change unscheduled until the next day.
  async withLock(task: () => Promise<void>): Promise<void> {
    if (this.inFlight) {
      this.rerunQueued = true;
      return this.inFlight;
    }
    const run = (async () => {
      try {
        await task();
      } finally {
        while (this.rerunQueued) {
          this.rerunQueued = false;
          await task();
        }
      }
    })().finally(() => {
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
    await dismissPresentedNotificationsForMitzvah(mitzvahId, key);
  },

  async rebuild(): Promise<void> {
    if (schedulingSuspended) return;
    return this.withLock(async () => {
      StorageService.delete(SCHEDULE_FORMAT_KEY);
      await this.cancelAll();
      await scheduleAllImpl(
        new Date(),
        enabledMitzvot(),
        useUserStore.getState().location,
        (({ nusach, halachicOpinions, inIsrael }) => ({ nusach, halachicOpinions, inIsrael }))(useUserStore.getState()),
      );
      StorageService.set(SCHEDULE_FORMAT_KEY, SCHEDULE_FORMAT);
    });
  },

  // Only the day-rollover path stamps LAST_REBUILD_KEY. A settings-driven rebuild used to stamp it
  // too, which suppressed that night's recovery run for the rest of the day.
  async rebuildForNewDay(): Promise<void> {
    await this.rebuild();
    StorageService.set(LAST_REBUILD_KEY, dateKey(new Date()));
  },
};

export async function syncNotificationPermissionStatus(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  const granted = status === 'granted';
  const previous = useUserStore.getState().notificationPermission;
  useUserStore.getState().setNotificationPermission(granted ? 'granted' : 'denied');
  // Nothing else reacts to this field, so without an explicit rebuild a user who grants permission
  // in OS settings (which the home banner invites them to do) never gets a single reminder.
  if (granted && previous !== 'granted') {
    NotificationScheduler.rebuild().catch(() => {});
  }
  return granted;
}

// Extends the today+tomorrow horizon whenever the app is opened. Background fetch is opportunistic
// — iOS runs it never for a force-quit app — so it must not be the only path that keeps reminders
// alive, or they simply stop after two days with no signal.
export async function refreshSchedulingOnForeground(): Promise<void> {
  if (!useUserStore.getState().isOnboarded) return;
  if (shouldRunDailyRebuild()) {
    await NotificationScheduler.rebuildForNewDay();
    return;
  }
  const pending = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  const staleFormat = StorageService.get<number>(SCHEDULE_FORMAT_KEY) !== SCHEDULE_FORMAT;
  if (!pending.length || staleFormat) await NotificationScheduler.rebuild();
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
      await NotificationScheduler.rebuildForNewDay();
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

// Returns a teardown. The caller owns it — without one, a remount (fast refresh, or a second
// mount) stacks another full set of store subscriptions and every change fans out N rebuilds.
export function initNotificationHandlers(): () => void {
  if (teardownHandlers) teardownHandlers();
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = pendingNotificationMetaFromContent(notification.request.content as NotificationContentLike);
      if (shouldSuppressForCompletion(data, notification.request.identifier)) {
        return {
          shouldShowAlert: false,
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
      return {
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
  });
  ensureNotificationCategory().catch(() => {});
  registerNotificationActionTask().catch(() => {});
  syncNotificationPermissionStatus().catch(() => {});
  dismissCompletedPresentedNotifications().catch(() => {});
  refreshSchedulingOnForeground().catch(() => {});
  const unsubscribers = [
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
      state.language !== prev.language ||
      state.location !== prev.location ||
      state.nusach !== prev.nusach ||
      state.halachicOpinions !== prev.halachicOpinions ||
      state.inIsrael !== prev.inIsrael
    ) {
      NotificationScheduler.rebuild().catch(() => {});
    }
  }),
  useMitzvotStore.subscribe((state, prev) => {
    if (state.activeMitzvot === prev.activeMitzvot) return;
    if (mitzvotConfigChanged(state.activeMitzvot, prev.activeMitzvot)) {
      NotificationScheduler.rebuild().catch(() => {});
    }
  }),
  useCustomMitzvotStore.subscribe((state, prev) => {
    if (state.items !== prev.items) {
      NotificationScheduler.rebuild().catch(() => {});
    }
  }),
  ];
  registerDailyRebuildTask().catch(() => {});
  teardownHandlers = () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    teardownHandlers = null;
  };
  return teardownHandlers;
}

let teardownHandlers: (() => void) | null = null;

// App reset resets four stores in a row, and every one of them fires the subscriptions above.
// Without this the reset would re-arm a full schedule from the freshly restored defaults —
// reminders at Jerusalem zmanim for a profile the user just deleted.
let schedulingSuspended = false;

export function setSchedulingSuspended(value: boolean): void {
  schedulingSuspended = value;
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
  SCHEDULE_FORMAT_KEY,
  MITZVAH_REMINDER_CATEGORY,
  MITZVAH_TEXT_CATEGORY,
  MARK_DONE_ACTION,
  OPEN_TEXT_ACTION,
  shouldSuppressForCompletion,
};
