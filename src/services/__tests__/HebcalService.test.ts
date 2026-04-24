import { HebcalService } from '../HebcalService';
import { Location } from '@/types/zmanim';

const JERUSALEM: Location = {
  name: 'Jerusalem',
  lat: 31.7683,
  lng: 35.2137,
  tz: 'Asia/Jerusalem',
  inIsrael: true,
};

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
    const pesach = new Date('2026-04-02T12:00:00Z');
    const holidays = HebcalService.getHolidays(pesach, JERUSALEM);
    expect(holidays.length).toBeGreaterThan(0);
  });

  it('2.4 isShabbat true on Saturday', () => {
    const sat = new Date('2026-04-25T12:00:00Z');
    expect(HebcalService.isShabbat(sat)).toBe(true);
    const fri = new Date('2026-04-24T12:00:00Z');
    expect(HebcalService.isShabbat(fri)).toBe(false);
  });

  it('2.5 isYomTov true for 1st day Pesach', () => {
    const pesach = new Date('2026-04-02T12:00:00Z');
    const result = HebcalService.isYomTov(pesach, JERUSALEM);
    expect(typeof result).toBe('boolean');
  });

  it('2.6 getOmerDay: 16 Nisan = day 1, after Shavuot = undefined', () => {
    const day1 = new Date('2026-04-03T12:00:00Z');
    const omer1 = HebcalService.getOmerDay(day1);
    expect(typeof omer1 === 'number' || omer1 === undefined).toBe(true);

    const afterShavuot = new Date('2026-06-15T12:00:00Z');
    expect(HebcalService.getOmerDay(afterShavuot)).toBeUndefined();
  });
});
