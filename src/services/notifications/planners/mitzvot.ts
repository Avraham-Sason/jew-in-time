import type { ComputeContext, Mitzvah, Reminder, UserSettings } from '@/types/mitzvah';
import type { Location } from '@/types/zmanim';
import { hasSiddurText, siddurPlace } from '@/data/siddur';
import { ZmanimService } from '@/services/ZmanimService';
import { isSkippedAt, opensQuietBlock, reminderFires } from '@/utils/skipRules';
import { locationNoon } from '@/utils/locationDay';
import { t } from '@/i18n';
import { dateKey, type Completions } from '@/stores/useCompletionsStore';
import { MITZVAH_REMINDER_CATEGORY, MITZVAH_TEXT_CATEGORY, buildId } from '@/services/notifications/ids';
import type { PlanInput, ScheduleCandidate } from '@/services/notifications/types';
import type { Horizon } from '@/services/notifications/planners/horizon';

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

function mitzvahTitle(mitzvah: Mitzvah, english: boolean): string {
  return english && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he;
}

export function bodyForReminder(reminder: Reminder, mitzvah: Mitzvah, trigger: Date, englishUi: boolean): string {
  // Registry labels and bodyVariants are Hebrew-only. Rather than deliver unreadable text to an
  // English user, fall back to a translated line built from the English mitzvah name.
  const english = englishUi && mitzvah.name.en;
  const variants = reminder.bodyVariants?.filter((value) => value.trim().length > 0) ?? [];
  const source = variants.length ? variants : [reminder.label];
  const idx = Math.floor(trigger.getTime() / 86_400_000) % source.length;
  const base = english ? t('notifications.timeFor', { name: mitzvah.name.en }) : (source[idx] ?? reminder.label);
  if (!reminder.includeContentInBody || !mitzvah.contentBlocks?.length) return base;
  const content = mitzvah.contentBlocks
    .filter((block) => block.type === 'text' || block.type === 'blessing')
    .map((block) => (english ? (block.en ?? block.he) : block.he).trim())
    .filter(Boolean)
    .join('\n');
  return content ? `${base}\n${content}` : base;
}

function isMarked(marks: Completions, mitzvahId: string, date: Date): boolean {
  return Boolean(marks[dateKey(date)]?.[mitzvahId]);
}

function candidatesFor(mitzvah: Mitzvah, date: Date, input: PlanInput): ScheduleCandidate[] {
  const { location, settings, now } = input;
  const ctx = contextFor(date, location, settings);
  if (!ctx) return [];
  const window = mitzvah.computeWindow(ctx);
  if (!window) return [];
  if (isSkippedAt(mitzvah, window.start, location, settings)) return [];
  if (isMarked(input.completions, mitzvah.id, date) || isMarked(input.skipped, mitzvah.id, date)) return [];

  const english = input.language === 'en';
  const reminders = input.reminderOverrides[mitzvah.id] ?? mitzvah.defaultReminders;
  const hasText = hasSiddurText(mitzvah, settings.nusach, date, siddurPlace(location, settings.inIsrael));
  const candidates: ScheduleCandidate[] = [];

  for (let i = 0; i < reminders.length; i++) {
    const r = reminders[i];
    const trigger = buildTriggerTime(r, window);
    // The reminder editor rejects out-of-window offsets up front; this is the backstop for
    // already-persisted ones, and the same rule drops anything inside a Shabbat / Yom Tov block.
    if (!reminderFires(trigger, window, location, now)) continue;
    // Candle lighting fires on the block's opening edge: its text would open only the Shabbat screen.
    const offersText = hasText && !opensQuietBlock(trigger, location);
    const id = buildId(mitzvah.id, date, i);
    candidates.push({
      id,
      trigger,
      channel: 'mitzvot',
      categoryIdentifier: offersText ? MITZVAH_TEXT_CATEGORY : MITZVAH_REMINDER_CATEGORY,
      title: mitzvahTitle(mitzvah, english),
      body: bodyForReminder(r, mitzvah, trigger, english),
      data: {
        mitzvahId: mitzvah.id,
        windowEnd: window.end.toISOString(),
        dateKey: dateKey(date),
        reminderIndex: i,
        customId: id,
        skipIfDone: r.skipIfDone === true,
        hasText: offersText,
        fullContent: mitzvah.contentBlocks ?? null,
      },
    });
  }

  return candidates;
}

export function planMitzvot(input: PlanInput, horizon: Horizon): ScheduleCandidate[] {
  const candidates: ScheduleCandidate[] = [];
  for (const day of horizon.days) {
    for (const mitzvah of input.mitzvot) {
      // Isolate per mitzvah: one failure must never abort the rest of the batch, or a single
      // bad computation leaves the user with an empty schedule (cancelAll already ran).
      try {
        candidates.push(...candidatesFor(mitzvah, day, input));
      } catch (err) {
        if (__DEV__) console.warn('[notifications] scheduling failed', mitzvah.id, err);
      }
    }
  }
  return candidates;
}
