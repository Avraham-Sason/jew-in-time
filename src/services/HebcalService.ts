import { HDate, HebrewCalendar, Location as HebcalLocation, flags } from '@hebcal/core';
import { DateTime } from 'luxon';
import { CalendarInfo, HebrewDate, Location } from '@/types/zmanim';
import { ZmanimService } from '@/services/ZmanimService';

function toHDate(date: Date): HDate {
  return new HDate(date);
}

// The civil day at the LOCATION, matching the zmanim ZmanimService resolves for it. HDate reads a
// Date through device-local getters, so it gets a local Date carrying the location's calendar date.
function civilDayAt(instant: Date, loc: Location): HDate {
  const { year, month, day } = DateTime.fromJSDate(instant).setZone(loc.tz);
  return toHDate(new Date(year, month - 1, day, 12));
}

function buildLocation(loc: Location): HebcalLocation {
  return new HebcalLocation(loc.lat, loc.lng, loc.inIsrael, loc.tz, loc.name, 'XX');
}

// A Hebrew day runs nightfall to nightfall, so an instant after sunset already belongs to the next
// Hebrew date. Between shkia and tzeit (bein hashmashot) the day is doubtful, so both candidates
// are returned and an observance counts if EITHER carries it — the stringency the original
// isShabbat encoded by hand (enter at shkia, leave at tzeit), now shared with isYomTov.
function hebrewDaysAt(instant: Date, loc?: Location): HDate[] {
  if (!loc) return [toHDate(instant)];
  const civilDay = civilDayAt(instant, loc);
  const zmanim = ZmanimService.getZmanim(instant, loc);
  if (!zmanim) return [civilDay];
  const afterShkia = instant.getTime() >= zmanim.shkia.getTime();
  const afterTzeit = instant.getTime() >= zmanim.tzeitHakochavim.getTime();
  if (afterShkia === afterTzeit) return [afterShkia ? civilDay.next() : civilDay];
  return [civilDay, civilDay.next()];
}

function isYomTovOnHebrewDay(hd: HDate, loc: Location): boolean {
  const greg = hd.greg();
  const events = HebrewCalendar.calendar({
    start: greg,
    end: greg,
    location: buildLocation(loc),
    il: loc.inIsrael,
  });
  return events.some((e) => {
    const f = e.getFlags();
    return Boolean(f & flags.CHAG) && !(f & flags.CHOL_HAMOED);
  });
}

function renderHebrewDate(hd: HDate): HebrewDate {
  return {
    year: hd.getFullYear(),
    month: hd.getMonth(),
    day: hd.getDate(),
    hebrewYearStr: hd.renderGematriya().split(' ').slice(-1)[0] ?? '',
    hebrewDateStr: hd.renderGematriya(),
  };
}

export const HebcalService = {
  // The Hebrew date whose DAYTIME falls on this civil day. Right for calendar grids, where each
  // cell is a civil day.
  getHebrewDate(date: Date): HebrewDate {
    return renderHebrewDate(toHDate(date));
  },

  // The Hebrew date in effect AT this instant — it advances at shkia. Use this for "today", or the
  // header shows yesterday's date all evening.
  getHebrewDateAt(instant: Date, loc?: Location): HebrewDate {
    const days = hebrewDaysAt(instant, loc);
    return renderHebrewDate(days[days.length - 1]);
  },

  getParasha(date: Date, loc: Location): string | undefined {
    const events = HebrewCalendar.calendar({
      start: date,
      end: date,
      location: buildLocation(loc),
      sedrot: true,
      il: loc.inIsrael,
    });
    const parasha = events.find((e) => e.getFlags() & flags.PARSHA_HASHAVUA);
    return parasha?.render('he');
  },

  getHolidays(date: Date, loc: Location): string[] {
    const events = HebrewCalendar.calendar({
      start: date,
      end: date,
      location: buildLocation(loc),
      il: loc.inIsrael,
    });
    return events
      .filter((e) => {
        const f = e.getFlags();
        return (
          f & flags.CHAG ||
          f & flags.MAJOR_FAST ||
          f & flags.MINOR_FAST ||
          f & flags.ROSH_CHODESH ||
          f & flags.MINOR_HOLIDAY ||
          f & flags.MODERN_HOLIDAY
        );
      })
      .map((e) => e.render('he'));
  },

  isShabbat(date: Date, loc?: Location): boolean {
    return hebrewDaysAt(date, loc).some((hd) => hd.getDay() === 6);
  },

  isYomTov(date: Date, loc: Location): boolean {
    return hebrewDaysAt(date, loc).some((hd) => isYomTovOnHebrewDay(hd, loc));
  },

  getDafYomi(date: Date): string | undefined {
    const events = HebrewCalendar.calendar({
      start: date,
      end: date,
      dailyLearning: { dafYomi: true },
    });
    const daf = events.find((e) => e.getFlags() & flags.DAF_YOMI);
    return daf?.render('he');
  },

  getOmerDay(date: Date): number | undefined {
    const events = HebrewCalendar.calendar({
      start: date,
      end: date,
      omer: true,
    });
    const omer = events.find((e) => e.getFlags() & flags.OMER_COUNT);
    if (!omer) return undefined;
    const day = (omer as unknown as { omer?: number }).omer;
    return typeof day === 'number' ? day : undefined;
  },

  getCalendarInfo(date: Date, loc: Location): CalendarInfo {
    return {
      hebrew: this.getHebrewDateAt(date, loc),
      parasha: this.getParasha(date, loc),
      holidays: this.getHolidays(date, loc),
      isShabbat: this.isShabbat(date, loc),
      isYomTov: this.isYomTov(date, loc),
      omerDay: this.getOmerDay(date),
      dafYomi: this.getDafYomi(date),
    };
  },
};
