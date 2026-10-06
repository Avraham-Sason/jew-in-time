import { DateTime } from 'luxon';
import { Mitzvah, UserSettings } from '@/types/mitzvah';
import { HolyBlock, Location } from '@/types/zmanim';
import { HebcalService } from '@/services/HebcalService';

export type DayObservance = { isShabbat: boolean; isYomTov: boolean; isCholHamoed: boolean };

export type SkipSettings = Pick<UserSettings, 'nusach' | 'inIsrael'>;

export function observanceFor(instant: Date, location: Location): DayObservance {
  return {
    isShabbat: HebcalService.isShabbat(instant, location),
    isYomTov: HebcalService.isYomTov(instant, location),
    isCholHamoed: HebcalService.isCholHamoed(instant, location),
  };
}

// Tefillin on chol hamoed: never in Israel, and in the diaspora only by Ashkenazi minhag.
export function keepsCholHamoed(settings: SkipSettings): boolean {
  return !settings.inIsrael && settings.nusach === 'ashkenaz';
}

export function isSkipped(
  mitzvah: Pick<Mitzvah, 'skipOn'>,
  observance: DayObservance,
  settings: SkipSettings,
): boolean {
  if (!mitzvah.skipOn.length) return false;
  if (mitzvah.skipOn.includes('shabbat') && observance.isShabbat) return true;
  if (mitzvah.skipOn.includes('yomtov') && observance.isYomTov) return true;
  if (mitzvah.skipOn.includes('cholHamoed') && observance.isCholHamoed && !keepsCholHamoed(settings)) return true;
  return false;
}

// Single source of truth for `skipOn`, for every surface that decides whether a mitzvah applies:
// scheduler, schedule/day timeline, home, history. Skip is judged at the window's OWN start
// instant, never at "now" and never at the civil day. `isShabbat` is instant-sensitive, so judging
// by the caller's clock made the answer depend on when a rebuild happened to run, and judging by
// civil midnight would clear an evening window on Friday that is already Shabbat.
// Cheap for the common case: mitzvot with an empty `skipOn` never reach the calendar lookup.
export function isSkippedAt(
  mitzvah: Pick<Mitzvah, 'skipOn'>,
  windowStart: Date,
  location: Location,
  settings: SkipSettings,
): boolean {
  if (!mitzvah.skipOn.length) return false;
  return isSkipped(mitzvah, observanceFor(windowStart, location), settings);
}

// The app is never active inside a Shabbat / Yom Tov block: no notification fires and only the
// Shabbat screen renders. The edges themselves stay open, so the candle-lighting reminder at the
// block's start and havdalah or maariv at its end still go out.
export function quietBlockAt(instant: Date, location: Location): HolyBlock | null {
  const block = HebcalService.holyBlockAt(instant, location);
  const inside = block && instant.getTime() > block.start.getTime() && instant.getTime() < block.end.getTime();
  return inside ? block : null;
}

export function isQuietAt(instant: Date, location: Location): boolean {
  return quietBlockAt(instant, location) !== null;
}

// The instant a block opens: still open itself, but everything after it is quiet, so nothing a
// notification fired here offers to open can be reached.
export function opensQuietBlock(instant: Date, location: Location): boolean {
  return HebcalService.holyBlockAt(instant, location)?.start.getTime() === instant.getTime();
}

// Whether a reminder goes out at all: still ahead, inside its own window — "time for X" after X
// has closed does nothing — and outside the quiet window. The scheduler and every preview of the
// next reminder share it, so a preview never promises one the scheduler drops.
export function reminderFires(
  trigger: Date,
  window: { start: Date; end: Date },
  location: Location,
  now: Date = new Date(),
): boolean {
  const at = trigger.getTime();
  if (at <= now.getTime()) return false;
  if (at < window.start.getTime() || at > window.end.getTime()) return false;
  return !isQuietAt(trigger, location);
}

const BOUNDARY_LOOKAHEAD_DAYS = 2;

// The next instant at which isQuietAt can change its answer, for a screen that must switch the
// moment candle lighting or tzeit passes. Null when no block starts within the lookahead.
export function nextQuietBoundary(now: Date, location: Location): Date | null {
  const current = HebcalService.holyBlockAt(now, location);
  if (current) return now.getTime() <= current.start.getTime() ? current.start : current.end;
  for (let days = 0; days <= BOUNDARY_LOOKAHEAD_DAYS; days++) {
    const block = HebcalService.holyBlockOn(new Date(now.getTime() + days * 86_400_000), location);
    if (block && block.start.getTime() > now.getTime()) return block.start;
  }
  return null;
}

// i18n keys naming a block and its end, shared by the pre-block notice and the Shabbat screen.
export function holyBlockLabelKeys(block: HolyBlock): { title: string; exit: string } {
  const lastDay = DateTime.fromISO(block.days[block.days.length - 1]);
  const exit = lastDay.weekday === 6 ? 'shabbat' : block.kind === 'yomKippur' ? 'yomKippur' : 'chag';
  return { title: `holyBlock.title.${block.kind}`, exit: `holyBlock.exit.${exit}` };
}
