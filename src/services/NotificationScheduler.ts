import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { DateTime } from 'luxon';
import { ComputeContext, ContentBlock, Mitzvah, Reminder, UserSettings } from '@/types/mitzvah';
import { HolyBlock, Location } from '@/types/zmanim';
import type { CycleState, OnahKind, TaharahTask, TaharahTaskKind } from '@/types/taharah';
import { getAllMitzvot } from '@/data/customMitzvotAdapter';
import { omerDayFor } from '@/data/mitzvot';
import { hasSiddurText, siddurPlace } from '@/data/siddur';
import { HebcalService } from '@/services/HebcalService';
import { ZmanimService } from '@/services/ZmanimService';
import { StorageService } from '@/services/StorageService';
import { holyBlockLabelKeys, isQuietAt, isSkippedAt, opensQuietBlock, quietBlockAt, reminderFires } from '@/utils/skipRules';
import { CheckInInput, blockForDay, blockOfCheckIn, checkInFor, checkInPhraseKey } from '@/utils/checkIn';
import { locationNoon } from '@/utils/locationDay';
import { deriveCycle } from '@/utils/taharah/cycle';
import { civilHebrewDayAt, hebrewDay } from '@/utils/taharah/onot';
import { taharahTasksFor } from '@/utils/taharah/tasks';
import { activeOnsets } from '@/utils/taharah/vestot';
import { t } from '@/i18n';
import { enabledSinceOf, useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { useCustomMitzvotStore } from '@/stores/useCustomMitzvotStore';
import { useCompletionsStore, dateKey } from '@/stores/useCompletionsStore';
import { TaharahLeads, useTaharahStore } from '@/stores/useTaharahStore';

const DAILY_REBUILD_TASK = 'jew-in-time-daily-rebuild';
const NOTIFICATION_ACTION_TASK = 'jew-in-time-notification-actions';
const MITZVAH_REMINDER_CATEGORY = 'mitzvah_reminder';
const MITZVAH_TEXT_CATEGORY = 'mitzvah_reminder_text';
const TAHARAH_BEDIKA_CATEGORY = 'taharah_bedika';
const MARK_DONE_ACTION = 'MARK_DONE';
const OPEN_TEXT_ACTION = 'OPEN_TEXT';
const ANDROID_CHANNEL_ID = 'default';
const PENDING_LIMIT = 60;
const IOS_MAX = 64;
const IOS_HEADROOM = 4;
const LAST_REBUILD_KEY = 'notifications:last-rebuild-date';
const SCHEDULE_FORMAT_KEY = 'notifications:schedule-format';
const SCHEDULE_FORMAT = 5;
const BLOCK_NOTICE_KIND = 'blockNotice';
const BLOCK_NOTICE_LEAD_MIN = 60;
const CHECK_IN_KIND = 'checkin';
const CHECK_IN_SECOND_NUDGE_MIN = 120;
const CHECK_IN_LAST_CALL_HOUR = 20;
const CHECK_IN_LAST_CALL_LEAD_MIN = 30;
const TAHARAH_KIND = 'taharah';
const TAHARAH_BEDIKA_MORNING_DELAY_MIN = 30;
const TAHARAH_BEDIKA_VESET_LEAD_MIN = 60;
const TAHARAH_EXPECT_ONSET_HOUR = 10;
const TAHARAH_BEFORE_QUIET_MIN = 10;
const TAHARAH_POST_BLOCK_DELAY_MIN = 15;
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
  kind?: typeof BLOCK_NOTICE_KIND | typeof CHECK_IN_KIND | typeof TAHARAH_KIND;
  taharah?: { task: TaharahTaskKind | 'tevilaPrep' | 'postBlock' | 'preBlock'; day: number; onah?: OnahKind };
  blockId?: string;
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
    await Notifications.setNotificationCategoryAsync(TAHARAH_BEDIKA_CATEGORY, [
      { ...markDone, buttonTitle: t('taharah.notify.markDone') },
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

function checkInInputFor(mitzvot: Mitzvah[], location: Location, settings: UserSettings): CheckInInput {
  const { completions, skipped, checkIns } = useCompletionsStore.getState();
  const enabledSince = enabledSinceOf(useMitzvotStore.getState().activeMitzvot);
  return { mitzvot, completions, skipped, checkIns, location, settings, enabledSince };
}

function currentSettings(): UserSettings {
  const { nusach, halachicOpinions, inIsrael } = useUserStore.getState();
  return { nusach, halachicOpinions, inIsrael };
}

// A check-in is over once the user finished it or nothing in it is left to mark.
function checkInSettled(blockId: string): boolean {
  if (useCompletionsStore.getState().checkIns[blockId]) return true;
  const location = useUserStore.getState().location;
  const block = blockOfCheckIn(blockId, location);
  if (!block) return true;
  const checkIn = checkInFor(block, checkInInputFor(enabledMitzvot(), location, currentSettings()), new Date());
  return !checkIn || checkIn.finished;
}

function isFinishedCheckIn(data: PendingNotificationMeta): boolean {
  return data.kind === CHECK_IN_KIND && Boolean(data.blockId) && checkInSettled(data.blockId!);
}

// Whether a clean day of the cycle that falls inside the block still lacks a bedika slot.
function bedikotMissingIn(state: CycleState, block: HolyBlock): boolean {
  return state.cleanDays.some(
    (day) => block.days.includes(dateKey(hebrewDay(day.day).greg())) && (day.morning === null || day.evening === null),
  );
}

// A taharah notification is settled once the cycle no longer waits for what it asks: read from the
// events as they are now, so a mark made in the app and one made from a notification agree.
export function taharahNotificationSettled(data: PendingNotificationMeta): boolean {
  const info = data.kind === TAHARAH_KIND ? data.taharah : undefined;
  if (!info) return false;
  const { events, settings } = useTaharahStore.getState();
  const { location } = useUserStore.getState();
  const state = deriveCycle(events, settings.rules, location, new Date());
  switch (info.task) {
    case 'bedikaMorning':
    case 'bedikaEvening': {
      const cleanDay = state.cleanDays.find((day) => day.day === info.day);
      return !cleanDay || cleanDay[info.task === 'bedikaMorning' ? 'morning' : 'evening'] !== null;
    }
    case 'hefsek':
      return state.stage !== 'niddah' && state.stage !== 'awaitingHefsek';
    case 'tevila':
    case 'tevilaPrep':
      return state.stage === 'tahor';
    case 'postBlock': {
      const block = blockOfCheckIn(dateKey(hebrewDay(info.day).greg()), location);
      return !block || !bedikotMissingIn(state, block);
    }
    case 'expectOnset': {
      const onsets = activeOnsets(events);
      const latest = onsets[onsets.length - 1];
      return latest !== undefined && latest.onah.abs >= info.day;
    }
    default:
      return false;
  }
}

function shouldSuppressForCompletion(data: PendingNotificationMeta, notificationId?: string): boolean {
  if (isFinishedCheckIn(data)) return true;
  if (data.kind === TAHARAH_KIND) return taharahNotificationSettled(data);
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
    if (isFinishedCheckIn(data) || taharahNotificationSettled(data)) ids.push(id);
  }
  await dismissNotificationIds(ids);
}

// Only a bedika can be marked from the notification: "done" on a hefsek or an immersion must be a
// conscious entry in the app. A slot the cycle no longer waits for is left alone, so a stale
// notification can never overwrite a result the user recorded in the app.
async function markTaharahBedikaDone(data: PendingNotificationMeta, notificationId?: string): Promise<boolean> {
  const info = data.taharah;
  if (info?.task !== 'bedikaMorning' && info?.task !== 'bedikaEvening') return false;
  if (!taharahNotificationSettled(data)) {
    useTaharahStore.getState().addEvent({
      type: 'bedika',
      day: info.day,
      slot: info.task === 'bedikaMorning' ? 'morning' : 'evening',
      result: 'clean',
    });
  }
  await dismissNotificationIds(notificationId ? [notificationId] : []);
  return true;
}

export async function markDoneFromNotificationData(
  data: PendingNotificationMeta,
  notificationId?: string,
): Promise<boolean> {
  if (data.kind === TAHARAH_KIND) return markTaharahBedikaDone(data, notificationId);
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

function checkInNotificationId(blockId: string, index: number): string {
  return `${CHECK_IN_KIND}:${blockId}:${index}`;
}

// 20:00 the day after the block — unless that evening already opens the next block (erev Yom Kippur
// right after Shabbat), when the last call comes half an hour before its candle lighting instead.
function lastCallFor(block: HolyBlock, location: Location): Date {
  const nextDay = DateTime.fromISO(block.days[block.days.length - 1]).plus({ days: 1 });
  const lastCall = new Date(nextDay.year, nextDay.month - 1, nextDay.day, CHECK_IN_LAST_CALL_HOUR);
  const next = HebcalService.holyBlockAt(lastCall, location);
  return next ? new Date(next.start.getTime() - CHECK_IN_LAST_CALL_LEAD_MIN * 60_000) : lastCall;
}

// The nudges to mark what was done inside a block: at its tzeit, again two hours later, and a last
// call the next evening before the check-in closes at midnight. None once the check-in is
// finished, or when every mitzvah of the block is already marked or skipped.
function checkInCandidates(block: HolyBlock, input: CheckInInput, now: Date): ScheduleCandidate[] {
  const checkIn = checkInFor(block, input, now);
  if (!checkIn || checkIn.finished) return [];
  const secondNudge = new Date(block.end.getTime() + CHECK_IN_SECOND_NUDGE_MIN * 60_000);
  const lastCall = lastCallFor(block, input.location);
  const triggers = [block.end, secondNudge, lastCall.getTime() > secondNudge.getTime() ? lastCall : null];
  const title = t('checkin.title', { in: t(checkInPhraseKey(block)) });
  return triggers.flatMap((trigger, index) => {
    if (!trigger || trigger.getTime() <= now.getTime() || trigger.getTime() >= checkIn.deadline.getTime()) return [];
    if (isQuietAt(trigger, input.location)) return [];
    const identifier = checkInNotificationId(checkIn.id, index);
    return [{
      trigger,
      input: {
        identifier,
        content: {
          title,
          body: t(`checkin.notify.${index}`),
          data: { kind: CHECK_IN_KIND, blockId: checkIn.id },
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
    }];
  });
}

// A block that ended a day or two ago may still owe its last check-in nudge.
function recentDaysBefore(days: Date[]): Date[] {
  return [3, 2, 1].map((back) => new Date(days[0].getFullYear(), days[0].getMonth(), days[0].getDate() - back));
}

type TaharahNotificationTask = NonNullable<PendingNotificationMeta['taharah']>['task'];

type TaharahDraft = {
  identifier: string;
  task: TaharahNotificationTask;
  day: number;
  onah?: OnahKind;
  trigger: Date;
  end: Date;
  params: { time?: string; day?: number; reasons?: string; in?: string };
  bodyKey?: string;
  disputed?: boolean;
  category?: string;
};

function shifted(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * 60_000);
}

// Nothing fires strictly inside a holy block, so a taharah reminder that would land there goes out
// ten minutes before candle lighting instead, while it can still be acted on — unless the task
// outlasts the block (a perisha night opening at motzaei Shabbat's shkia), when it waits for tzeit.
function beforeQuiet(trigger: Date, end: Date, location: Location): Date {
  const block = quietBlockAt(trigger, location);
  if (!block) return trigger;
  return end.getTime() > block.end.getTime() ? block.end : shifted(block.start, -TAHARAH_BEFORE_QUIET_MIN);
}

function firstDayAbs(block: HolyBlock, location: Location): number {
  const firstDay = DateTime.fromISO(block.days[0], { zone: location.tz }).set({ hour: 12 }).toJSDate();
  return civilHebrewDayAt(firstDay, location).abs();
}

function expectedOnsetCheck(netz: Date, location: Location): Date {
  return DateTime.fromJSDate(netz)
    .setZone(location.tz)
    .set({ hour: TAHARAH_EXPECT_ONSET_HOUR, minute: 0, second: 0, millisecond: 0 })
    .toJSDate();
}

function taharahDraftsFor(task: TaharahTask, civilAbs: number, location: Location, leads: TaharahLeads): TaharahDraft[] {
  const onah: OnahKind | undefined =
    task.kind === 'perisha' || task.kind === 'bedikaVeset' ? (task.day === civilAbs ? 'day' : 'night') : undefined;
  const reasons = task.reasons?.map((reason) => t(`taharah.reason.${reason}`)).join(' · ');
  const draft = (
    notification: TaharahNotificationTask,
    trigger: Date,
    time: string | undefined,
    extra: Partial<TaharahDraft> = {},
  ): TaharahDraft => ({
    identifier: `${TAHARAH_KIND}:${notification}:${task.day}${onah ? `:${onah}` : ''}`,
    task: notification,
    day: task.day,
    onah,
    trigger,
    end: notification === 'tevilaPrep' ? task.start : task.end,
    params: { time, day: task.cleanDayIndex, reasons },
    disputed: task.disputed,
    ...extra,
  });
  const until = formatClock(task.end);

  switch (task.kind) {
    case 'hefsek':
      return [draft('hefsek', shifted(task.end, -leads.hefsekLeadMin), until)];
    case 'bedikaMorning':
      return task.done
        ? []
        : [draft('bedikaMorning', shifted(task.start, TAHARAH_BEDIKA_MORNING_DELAY_MIN), until, { category: TAHARAH_BEDIKA_CATEGORY })];
    case 'bedikaEvening':
      return task.done
        ? []
        : [draft('bedikaEvening', shifted(task.end, -leads.bedikaEveningLeadMin), until, { category: TAHARAH_BEDIKA_CATEGORY })];
    case 'tevila': {
      const prep = shifted(task.start, -leads.tevilaPrepLeadMin);
      const block = quietBlockAt(task.start, location);
      if (block) {
        return [draft('tevilaPrep', prep, formatClock(block.start), { bodyKey: 'taharah.notify.body.tevilaPrepShabbat' })];
      }
      return [draft('tevilaPrep', prep, formatClock(task.start)), draft('tevila', task.start, formatClock(task.start))];
    }
    case 'perisha':
      return [draft('perisha', task.start, until)];
    case 'bedikaVeset':
      return task.required ? [draft('bedikaVeset', shifted(task.end, -TAHARAH_BEDIKA_VESET_LEAD_MIN), until)] : [];
    case 'expectOnset':
      return [draft('expectOnset', expectedOnsetCheck(task.start, location), undefined)];
  }
}

// The nudge to mark the bedikot a woman could not mark inside Shabbat / Yom Tov, once it ends.
function postBlockDrafts(blocks: HolyBlock[], state: CycleState, location: Location, now: Date): TaharahDraft[] {
  if (state.stage !== 'shivaNekiim' && state.stage !== 'safek') return [];
  return blocks
    .filter((block) => block.end.getTime() > now.getTime() && bedikotMissingIn(state, block))
    .map((block): TaharahDraft => ({
      identifier: `${TAHARAH_KIND}:postBlock:${block.days[0]}`,
      task: 'postBlock',
      day: firstDayAbs(block, location),
      trigger: shifted(block.end, TAHARAH_POST_BLOCK_DELAY_MIN),
      end: shifted(block.end, TAHARAH_POST_BLOCK_DELAY_MIN),
      params: { in: t(checkInPhraseKey(block)) },
    }));
}

function taharahText(draft: TaharahDraft, discreet: boolean): { title: string; body: string } {
  if (discreet) {
    return {
      title: t('taharah.notify.discreetTitle'),
      body: draft.params.time
        ? t('taharah.notify.discreet.untilBody', { time: draft.params.time })
        : t('taharah.notify.discreet.body'),
    };
  }
  const body = t(draft.bodyKey ?? `taharah.notify.body.${draft.task}`, draft.params);
  return {
    title: t(`taharah.notify.title.${draft.task}`, draft.params),
    body: draft.disputed ? `${body}\n${t('taharah.disputed')}` : body,
  };
}

function taharahCandidate(draft: TaharahDraft, trigger: Date, discreet: boolean): ScheduleCandidate {
  const { title, body } = taharahText(draft, discreet);
  const { task, day, onah } = draft;
  return {
    trigger,
    input: {
      identifier: draft.identifier,
      content: {
        title,
        body,
        data: { kind: TAHARAH_KIND, taharah: { task, day, ...(onah && { onah }) } },
        ...(draft.category && { categoryIdentifier: draft.category }),
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

type ShiftedTaharahGroup = { block: HolyBlock; trigger: Date; drafts: TaharahDraft[] };

// What a holy block pushed onto one instant reads as a single reminder: the tasks it left for
// before candle lighting, in the order they were due.
function preBlockCandidate(
  { block, trigger, drafts }: ShiftedTaharahGroup,
  location: Location,
  discreet: boolean,
): ScheduleCandidate {
  const phrase = { in: t(checkInPhraseKey(block)) };
  const lines = [...new Set(drafts.map((draft) => taharahText(draft, false).title))];
  if (drafts.some((draft) => draft.disputed)) lines.push(t('taharah.disputed'));
  const title = discreet ? t('taharah.notify.discreetTitle') : t('taharah.notify.title.preBlock', phrase);
  const body = discreet ? t('taharah.notify.discreet.preBlock', phrase) : lines.join('\n');
  return {
    trigger,
    input: {
      identifier: `${TAHARAH_KIND}:preBlock:${block.days[0]}`,
      content: {
        title,
        body,
        data: { kind: TAHARAH_KIND, taharah: { task: 'preBlock', day: firstDayAbs(block, location) } },
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

// Nothing here exists unless the user opted into the taharah feature.
function taharahCandidates(days: Date[], location: Location, now: Date): ScheduleCandidate[] {
  if (!useUserStore.getState().taharahEnabled) return [];
  const { events, settings, discreetNotifications, hefsekLeadMin, bedikaEveningLeadMin, tevilaPrepLeadMin } =
    useTaharahStore.getState();
  const leads = { hefsekLeadMin, bedikaEveningLeadMin, tevilaPrepLeadMin };
  const drafts = days.flatMap((day) => {
    const civilAbs = civilHebrewDayAt(locationNoon(day, location), location).abs();
    return taharahTasksFor(day, events, settings, location, now).flatMap((task) =>
      taharahDraftsFor(task, civilAbs, location, leads),
    );
  });
  if (settings.role === 'woman') {
    const blocks = holyBlocksWithin([...recentDaysBefore(days), ...days], location);
    drafts.push(...postBlockDrafts(blocks, deriveCycle(events, settings.rules, location, now), location, now));
  }
  const scheduled = new Set<string>();
  const unshifted: ScheduleCandidate[] = [];
  const shiftedGroups = new Map<string, ShiftedTaharahGroup>();
  for (const draft of drafts) {
    const trigger = beforeQuiet(draft.trigger, draft.end, location);
    if (trigger.getTime() <= now.getTime() || scheduled.has(draft.identifier)) continue;
    scheduled.add(draft.identifier);
    // Only a reminder pulled ahead of the block joins the merged pre-block notice; one deferred to
    // the block's end is its own reminder, at the first instant it can be acted on.
    if (trigger.getTime() >= draft.trigger.getTime()) {
      unshifted.push(taharahCandidate(draft, trigger, discreetNotifications));
      continue;
    }
    const block = quietBlockAt(draft.trigger, location)!;
    const group = shiftedGroups.get(block.days[0]) ?? { block, trigger, drafts: [] };
    group.drafts.push(draft);
    shiftedGroups.set(block.days[0], group);
  }
  // A lone pulled-ahead reminder is also sent as the pre-block notice: its own text would name a
  // deadline inside the block, where nothing can be done about it.
  const fromShifted = [...shiftedGroups.values()].map((group) => {
    group.drafts.sort((a, b) => a.trigger.getTime() - b.trigger.getTime());
    return preBlockCandidate(group, location, discreetNotifications);
  });
  return [...unshifted, ...fromShifted];
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
  const now = new Date();
  const checkInInput = checkInInputFor(activeMitzvot, location, settings);
  const recentDays = recentDaysBefore(days);

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
  for (const block of holyBlocksWithin([...recentDays, ...days], location)) {
    try {
      candidates.push(...checkInCandidates(block, checkInInput, now));
    } catch (err) {
      if (__DEV__) console.warn('[notifications] check-in reminders failed', block.days[0], err);
    }
  }
  try {
    candidates.push(...taharahCandidates(days, location, now));
  } catch (err) {
    if (__DEV__) console.warn('[notifications] taharah reminders failed', err);
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

  // A finished check-in clears its nudges from the tray and withdraws the rest through a rebuild:
  // one that is already running read the old state and would schedule them again, and the lock
  // re-runs it once with the new one.
  async cancelCheckIn(blockId: string): Promise<void> {
    const prefix = `${CHECK_IN_KIND}:${blockId}:`;
    const presented = await getPresentedNotificationsSafe();
    await dismissNotificationIds(
      presented.map((notification) => notification.request.identifier).filter((id) => id.startsWith(prefix)),
    );
    await this.rebuild();
  },

  // After a mark: if it settled the check-in of the block this day belongs to, its nudges go too.
  async settleCheckIn(date: Date): Promise<void> {
    const block = blockForDay(date, useUserStore.getState().location);
    if (!block || !checkInSettled(block.days[0])) return;
    const prefix = `${CHECK_IN_KIND}:${block.days[0]}:`;
    const pending = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
    if (pending.some((p) => p.identifier.startsWith(prefix))) await this.cancelCheckIn(block.days[0]);
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
      state.inIsrael !== prev.inIsrael ||
      state.taharahEnabled !== prev.taharahEnabled
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
  useTaharahStore.subscribe((state, prev) => {
    if (!useUserStore.getState().taharahEnabled) return;
    if (
      state.events !== prev.events ||
      state.settings !== prev.settings ||
      state.discreetNotifications !== prev.discreetNotifications ||
      state.hefsekLeadMin !== prev.hefsekLeadMin ||
      state.bedikaEveningLeadMin !== prev.bedikaEveningLeadMin ||
      state.tevilaPrepLeadMin !== prev.tevilaPrepLeadMin
    ) {
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
  TAHARAH_KIND,
  TAHARAH_BEDIKA_CATEGORY,
  MARK_DONE_ACTION,
  OPEN_TEXT_ACTION,
  shouldSuppressForCompletion,
};
