import { Mitzvah } from '@/types/mitzvah';
import { Location } from '@/types/zmanim';
import { HebcalService } from '@/services/HebcalService';

export type DayObservance = { isShabbat: boolean; isYomTov: boolean };

export function observanceFor(instant: Date, location: Location): DayObservance {
  return {
    isShabbat: HebcalService.isShabbat(instant, location),
    isYomTov: HebcalService.isYomTov(instant, location),
  };
}

export function isSkipped(mitzvah: Pick<Mitzvah, 'skipOn'>, observance: DayObservance): boolean {
  if (!mitzvah.skipOn.length) return false;
  if (mitzvah.skipOn.includes('shabbat') && observance.isShabbat) return true;
  if (mitzvah.skipOn.includes('yomtov') && observance.isYomTov) return true;
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
): boolean {
  if (!mitzvah.skipOn.length) return false;
  return isSkipped(mitzvah, observanceFor(windowStart, location));
}
