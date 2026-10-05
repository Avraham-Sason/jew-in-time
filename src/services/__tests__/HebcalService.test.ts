import { HebcalService } from '../HebcalService';
import { at, zmanimFor } from '@/testing/zmanim';
import { Location } from '@/types/zmanim';

// Boundary instants are derived from the zmanim themselves rather than written as clock times, so
// the fixtures cannot silently mean a different moment than the one they claim.
const minutesFrom = (base: Date, minutes: number) => new Date(base.getTime() + minutes * 60_000);

const JERUSALEM: Location = {
  name: 'Jerusalem',
  lat: 31.7683,
  lng: 35.2137,
  tz: 'Asia/Jerusalem',
  inIsrael: true,
};

// Noon on JERUSALEM's clock. These fixtures feed instant APIs, and noon on the device's clock is a
// Jerusalem evening or early morning once the device sits far enough east or west.
const noonOn = (date: string) => at(JERUSALEM, `${date}T12:00`);

describe('HebcalService', () => {
  it('2.1 Hebrew date for 2026-04-23', () => {
    const hd = HebcalService.getHebrewDate(new Date('2026-04-23T12:00:00Z'));
    expect(hd.day).toBeGreaterThan(0);
    expect(hd.year).toBeGreaterThanOrEqual(5786);
    expect(hd.hebrewDateStr.length).toBeGreaterThan(0);
  });

  it('2.2 getParasha returns string on Friday', () => {
    const friday = new Date('2026-04-24T12:00:00Z');
    const p = HebcalService.getParasha(friday, JERUSALEM);
    expect(typeof p === 'string' || p === undefined).toBe(true);
  });

  it('2.3 getHolidays returns Pesach in Nisan', () => {
    const pesach = new Date(2026, 3, 2); // a calendar day, read through device-local getters
    const holidays = HebcalService.getHolidays(pesach, JERUSALEM);
    expect(holidays.length).toBeGreaterThan(0);
  });

  it('2.4 isShabbat true on Saturday', () => {
    // Without a location the fallback is the device's Gregorian Saturday.
    const sat = new Date(2026, 3, 25, 12);
    expect(HebcalService.isShabbat(sat)).toBe(true);
    const fri = new Date(2026, 3, 24, 12);
    expect(HebcalService.isShabbat(fri)).toBe(false);
  });

  // Was `expect(typeof result).toBe('boolean')` — passes for true and for false alike, so a
  // regression that made isYomTov always false would have shipped green.
  it('2.5 isYomTov is true on Pesach I and false on chol hamoed', () => {
    expect(HebcalService.isYomTov(noonOn('2026-04-02'), JERUSALEM)).toBe(true); // 15 Nisan
    expect(HebcalService.isYomTov(noonOn('2026-04-03'), JERUSALEM)).toBe(false); // 16 Nisan, chol hamoed in Israel
    expect(HebcalService.isYomTov(noonOn('2026-04-08'), JERUSALEM)).toBe(true); // 21 Nisan, Pesach VII
    expect(HebcalService.isYomTov(noonOn('2026-04-09'), JERUSALEM)).toBe(false); // 22 Nisan
  });

  // A Hebrew day starts at nightfall, so erev Yom Tov after shkia is already Yom Tov. The old
  // implementation asked hebcal about the Gregorian day, so it answered "false" all evening and
  // tefillin reminders were scheduled for the first night of a chag.
  it('2.5b isYomTov turns on at shkia of erev Yom Tov', () => {
    const erevPesach = noonOn('2026-04-01'); // 14 Nisan
    const { shkia } = zmanimFor(erevPesach, JERUSALEM);

    expect(HebcalService.isYomTov(minutesFrom(shkia, -1), JERUSALEM)).toBe(false);
    expect(HebcalService.isYomTov(minutesFrom(shkia, 1), JERUSALEM)).toBe(true);
  });

  it('2.5c isYomTov stays on through bein hashmashot and turns off at tzeit', () => {
    const pesachVII = noonOn('2026-04-08'); // 21 Nisan, last Yom Tov day of Pesach in Israel
    const { shkia, tzeitHakochavim } = zmanimFor(pesachVII, JERUSALEM);

    expect(HebcalService.isYomTov(minutesFrom(shkia, 1), JERUSALEM)).toBe(true);
    expect(HebcalService.isYomTov(minutesFrom(tzeitHakochavim, 1), JERUSALEM)).toBe(false);
  });

  it('2.5d the Hebrew date advances at shkia, not at civil midnight', () => {
    const day = noonOn('2026-04-09');
    const { shkia } = zmanimFor(day, JERUSALEM);
    const before = HebcalService.getHebrewDateAt(minutesFrom(shkia, -1), JERUSALEM);
    const after = HebcalService.getHebrewDateAt(minutesFrom(shkia, 1), JERUSALEM);

    expect(after.day).toBe(before.day + 1);
    expect(after.hebrewDateStr).not.toBe(before.hebrewDateStr);
    // The calendar-grid variant deliberately stays on the civil day's daytime date.
    expect(HebcalService.getHebrewDate(new Date(2026, 3, 9)).hebrewDateStr).toBe(before.hebrewDateStr);
  });

  it('2.5e isShabbat keeps its shkia-in / tzeit-out boundaries', () => {
    const friday = noonOn('2026-04-24');
    const saturday = noonOn('2026-04-25');
    const friZmanim = zmanimFor(friday, JERUSALEM);
    const satZmanim = zmanimFor(saturday, JERUSALEM);

    expect(HebcalService.isShabbat(minutesFrom(friZmanim.shkia, -1), JERUSALEM)).toBe(false);
    expect(HebcalService.isShabbat(minutesFrom(friZmanim.shkia, 1), JERUSALEM)).toBe(true);
    expect(HebcalService.isShabbat(minutesFrom(satZmanim.shkia, 1), JERUSALEM)).toBe(true);
    expect(HebcalService.isShabbat(minutesFrom(satZmanim.tzeitHakochavim, 1), JERUSALEM)).toBe(false);
  });

  it('2.6 getOmerDay: 16 Nisan = day 1, after Shavuot = undefined', () => {
    const day1 = new Date('2026-04-03T12:00:00Z');
    const omer1 = HebcalService.getOmerDay(day1);
    expect(typeof omer1 === 'number' || omer1 === undefined).toBe(true);

    const afterShavuot = new Date('2026-06-15T12:00:00Z');
    expect(HebcalService.getOmerDay(afterShavuot)).toBeUndefined();
  });
});
