import { HDate, HebrewCalendar, flags } from '@hebcal/core';
import { DateTime } from 'luxon';
import { Onah } from '@/types/taharah';
import { Location, Zmanim } from '@/types/zmanim';
import { ZmanimService } from '@/services/ZmanimService';
import { locationNoon } from '@/utils/locationDay';

// Onot are numbered consecutively: the night onah of a Hebrew day comes first, its day onah second,
// so counting in onot (the Chabad haflaga) is integer arithmetic.
export function onahIndex(onah: Onah): number {
  return onah.abs * 2 + (onah.kind === 'night' ? 0 : 1);
}

export function onahFromIndex(index: number): Onah {
  return { abs: Math.floor(index / 2), kind: index % 2 === 0 ? 'night' : 'day' };
}

export function addOnot(onah: Onah, count: number): Onah {
  return onahFromIndex(onahIndex(onah) + count);
}

export function sameOnah(a: Onah, b: Onah): boolean {
  return a.abs === b.abs && a.kind === b.kind;
}

export function hebrewDay(abs: number): HDate {
  return new HDate(abs);
}

// The Hebrew day whose DAYTIME falls on the location's civil date of `instant`.
export function civilHebrewDayAt(instant: Date, location: Location): HDate {
  const { year, month, day } = DateTime.fromJSDate(instant).setZone(location.tz);
  return new HDate(new Date(year, month - 1, day, 12));
}

// Noon at the location on the civil date whose daytime is Hebrew day `abs`.
export function dayNoon(abs: number, location: Location): Date {
  return locationNoon(hebrewDay(abs).greg(), location);
}

export function zmanimOfDay(abs: number, location: Location): Zmanim | null {
  return ZmanimService.getZmanim(dayNoon(abs, location), location);
}

export type OnahBounds = { start: Date; end: Date };

// The day onah runs from sunrise to sunset; the night onah from the previous sunset to sunrise.
// Null where the sun neither rises nor sets.
export function onahBounds(onah: Onah, location: Location): OnahBounds | null {
  const today = zmanimOfDay(onah.abs, location);
  if (!today) return null;
  if (onah.kind === 'day') return { start: today.netzHaChama, end: today.shkia };
  const previous = zmanimOfDay(onah.abs - 1, location);
  return previous ? { start: previous.shkia, end: today.netzHaChama } : null;
}

export type OnahResolution = { onah: Onah; doubtful: boolean };

// The onah in effect at an instant. Between shkia and tzeit the Hebrew day is doubtful: the
// resolution names the day onah that is ending and flags it, and the alternative is the next onah.
export function onahAt(instant: Date, location: Location): OnahResolution | null {
  const civil = civilHebrewDayAt(instant, location);
  const zmanim = ZmanimService.getZmanim(instant, location);
  if (!zmanim) return null;
  const t = instant.getTime();
  if (t < zmanim.netzHaChama.getTime()) return { onah: { abs: civil.abs(), kind: 'night' }, doubtful: false };
  if (t < zmanim.shkia.getTime()) return { onah: { abs: civil.abs(), kind: 'day' }, doubtful: false };
  if (t < zmanim.tzeitHakochavim.getTime()) return { onah: { abs: civil.abs(), kind: 'day' }, doubtful: true };
  return { onah: { abs: civil.abs() + 1, kind: 'night' }, doubtful: false };
}

// Where zmanim are unavailable the civil clock stands in, so the engine always has a current onah.
export function currentOnah(now: Date, location: Location): Onah {
  const resolved = onahAt(now, location);
  if (resolved) return resolved.onah;
  const civil = civilHebrewDayAt(now, location);
  const hour = DateTime.fromJSDate(now).setZone(location.tz).hour;
  if (hour < 6) return { abs: civil.abs(), kind: 'night' };
  return hour < 18 ? { abs: civil.abs(), kind: 'day' } : { abs: civil.abs() + 1, kind: 'night' };
}

// Both onot a doubtful onset may belong to: the ending day onah and the opening night onah.
export function onsetCandidates(onah: Onah, doubtful: boolean): Onah[] {
  return doubtful ? [onah, addOnot(onah, 1)] : [onah];
}

const blockedNightCache = new Map<string, boolean>();

// No immersion on the night of Yom Kippur or of the Tisha B'Av fast (observed), the two major
// fasts hebcal flags. `abs` is the Hebrew day the night opens. hebcal gives "Erev Tish'a B'Av"
// the MAJOR_FAST flag too, so the erev flag must be excluded or 8 Av — and, in a year the fast is
// deferred, Shabbat 9 Av itself — would block a tevila night.
export function tevilaBlockedOnNight(abs: number, location: Location): boolean {
  const key = `${abs}|${location.inIsrael ? 'il' : 'chul'}`;
  const cached = blockedNightCache.get(key);
  if (cached !== undefined) return cached;
  const greg = hebrewDay(abs).greg();
  const events = HebrewCalendar.calendar({ start: greg, end: greg, il: location.inIsrael });
  const blocked = events.some(
    (event) => Boolean(event.getFlags() & flags.MAJOR_FAST) && !(event.getFlags() & flags.EREV),
  );
  blockedNightCache.set(key, blocked);
  return blocked;
}

export function nextTevilaNight(fromAbs: number, location: Location): number {
  let abs = fromAbs;
  while (tevilaBlockedOnNight(abs, location)) abs += 1;
  return abs;
}
