import { HDate, HebrewCalendar, Location as HebcalLocation, flags } from '@hebcal/core';
import { CalendarInfo, HebrewDate, Location } from '@/types/zmanim';

function toHDate(date: Date): HDate {
  return new HDate(date);
}

function buildLocation(loc: Location): HebcalLocation {
  return new HebcalLocation(loc.lat, loc.lng, loc.inIsrael, loc.tz, loc.name, 'XX');
}

export const HebcalService = {
  getHebrewDate(date: Date): HebrewDate {
    const hd = toHDate(date);
    return {
      year: hd.getFullYear(),
      month: hd.getMonth(),
      day: hd.getDate(),
      hebrewYearStr: hd.renderGematriya().split(' ').slice(-1)[0] ?? '',
      hebrewDateStr: hd.renderGematriya(),
    };
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

  isShabbat(date: Date): boolean {
    return date.getDay() === 6;
  },

  isYomTov(date: Date, loc: Location): boolean {
    const events = HebrewCalendar.calendar({
      start: date,
      end: date,
      location: buildLocation(loc),
      il: loc.inIsrael,
    });
    return events.some((e) => {
      const f = e.getFlags();
      return (f & flags.CHAG) && !(f & flags.CHOL_HAMOED);
    });
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
      hebrew: this.getHebrewDate(date),
      parasha: this.getParasha(date, loc),
      holidays: this.getHolidays(date, loc),
      isShabbat: this.isShabbat(date),
      isYomTov: this.isYomTov(date, loc),
      omerDay: this.getOmerDay(date),
      dafYomi: this.getDafYomi(date),
    };
  },
};
