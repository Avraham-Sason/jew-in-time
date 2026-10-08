import { HDate } from '@hebcal/core';
import { CITIES } from '@/data/cities';
import { at, zmanimFor } from '@/testing/zmanim';
import { Location } from '@/types/zmanim';
import {
  addOnot,
  civilHebrewDayAt,
  currentOnah,
  dayNoon,
  hebrewDay,
  nextTevilaNight,
  onahAt,
  onahBounds,
  onahFromIndex,
  onahIndex,
  onsetCandidates,
  sameOnah,
  tevilaBlockedOnNight,
  zmanimOfDay,
} from '@/utils/taharah/onot';

const JERUSALEM = CITIES[0];
const NEW_YORK = CITIES.find((c) => c.nameEn === 'New York')!;
const LONGYEARBYEN: Location = { name: 'Longyearbyen', lat: 78.2232, lng: 15.6267, tz: 'Arctic/Longyearbyen', inIsrael: false };

const absOf = (y: number, m: number, d: number) => new HDate(new Date(y, m - 1, d)).abs();
// 9 Cheshvan 5787, a Tuesday.
const O = absOf(2026, 10, 20);
const MINUTE = 60_000;

describe('taharah onot', () => {
  it('anchors the fixtures on 9 Cheshvan 5787', () => {
    const day = new HDate(O);
    expect([day.getDate(), day.getMonthName(), day.getFullYear()]).toEqual([9, 'Cheshvan', 5787]);
  });

  describe('onahAt', () => {
    it('puts midday on the day onah of the civil date', () => {
      expect(onahAt(at(JERUSALEM, '2026-10-20T10:00'), JERUSALEM)).toEqual({ onah: { abs: O, kind: 'day' }, doubtful: false });
    });

    it('keeps the hours before sunrise on the night onah of the same Hebrew day', () => {
      expect(onahAt(at(JERUSALEM, '2026-10-20T03:00'), JERUSALEM)).toEqual({ onah: { abs: O, kind: 'night' }, doubtful: false });
    });

    it('moves the evening to the night onah of the next Hebrew day', () => {
      expect(onahAt(at(JERUSALEM, '2026-10-20T20:00'), JERUSALEM)).toEqual({ onah: { abs: O + 1, kind: 'night' }, doubtful: false });
    });

    it('flags the stretch between shkia and tzeit as the doubtful end of the day onah', () => {
      const { shkia, tzeitHakochavim } = zmanimFor(at(JERUSALEM, '2026-10-20T12:00'), JERUSALEM);
      const shkiaPlus = new Date(shkia.getTime() + 5 * MINUTE);
      expect(shkiaPlus.getTime()).toBeLessThan(tzeitHakochavim.getTime());
      expect(onahAt(shkiaPlus, JERUSALEM)).toEqual({ onah: { abs: O, kind: 'day' }, doubtful: true });
    });

    it('is no longer doubtful one minute after tzeit', () => {
      const { tzeitHakochavim } = zmanimFor(at(JERUSALEM, '2026-10-20T12:00'), JERUSALEM);
      expect(onahAt(new Date(tzeitHakochavim.getTime() + MINUTE), JERUSALEM)).toEqual({
        onah: { abs: O + 1, kind: 'night' },
        doubtful: false,
      });
    });

    it('takes the Hebrew day from the location\'s civil date, not the device\'s', () => {
      expect(onahAt(at(NEW_YORK, '2026-10-20T10:00'), NEW_YORK)).toEqual({ onah: { abs: O, kind: 'day' }, doubtful: false });
      expect(onahAt(at(NEW_YORK, '2026-10-20T03:00'), NEW_YORK)).toEqual({ onah: { abs: O, kind: 'night' }, doubtful: false });
      // Already the next morning in Jerusalem, so a device-local reading would name the next Hebrew day.
      expect(onahAt(at(NEW_YORK, '2026-10-20T23:00'), NEW_YORK)).toEqual({ onah: { abs: O + 1, kind: 'night' }, doubtful: false });
    });

    it('answers null where the sun neither rises nor sets', () => {
      expect(onahAt(at(LONGYEARBYEN, '2026-06-21T12:00'), LONGYEARBYEN)).toBeNull();
    });
  });

  describe('currentOnah', () => {
    it('is the onah in effect', () => {
      expect(currentOnah(at(JERUSALEM, '2026-10-20T10:00'), JERUSALEM)).toEqual({ abs: O, kind: 'day' });
      expect(currentOnah(at(JERUSALEM, '2026-10-20T20:00'), JERUSALEM)).toEqual({ abs: O + 1, kind: 'night' });
      expect(currentOnah(at(NEW_YORK, '2026-10-20T10:00'), NEW_YORK)).toEqual({ abs: O, kind: 'day' });
    });

    it('falls back to the civil clock where zmanim are unavailable', () => {
      expect(currentOnah(at(LONGYEARBYEN, '2026-06-21T03:00'), LONGYEARBYEN).kind).toBe('night');
      expect(currentOnah(at(LONGYEARBYEN, '2026-06-21T12:00'), LONGYEARBYEN).kind).toBe('day');
      const evening = currentOnah(at(LONGYEARBYEN, '2026-06-21T20:00'), LONGYEARBYEN);
      const noon = currentOnah(at(LONGYEARBYEN, '2026-06-21T12:00'), LONGYEARBYEN);
      expect(evening).toEqual({ abs: noon.abs + 1, kind: 'night' });
    });
  });

  describe('onahBounds', () => {
    it('runs a night onah from the previous shkia to the next sunrise', () => {
      const bounds = onahBounds({ abs: O + 1, kind: 'night' }, JERUSALEM)!;
      expect(bounds.start.getTime()).toBe(zmanimFor(at(JERUSALEM, '2026-10-20T12:00'), JERUSALEM).shkia.getTime());
      expect(bounds.end.getTime()).toBe(zmanimFor(at(JERUSALEM, '2026-10-21T12:00'), JERUSALEM).netzHaChama.getTime());
    });

    it('runs a day onah from sunrise to sunset of its own day', () => {
      const bounds = onahBounds({ abs: O, kind: 'day' }, JERUSALEM)!;
      const zmanim = zmanimFor(at(JERUSALEM, '2026-10-20T12:00'), JERUSALEM);
      expect(bounds.start.getTime()).toBe(zmanim.netzHaChama.getTime());
      expect(bounds.end.getTime()).toBe(zmanim.shkia.getTime());
    });

    it('lays consecutive onot edge to edge', () => {
      const day = onahBounds({ abs: O, kind: 'day' }, JERUSALEM)!;
      const nextNight = onahBounds({ abs: O + 1, kind: 'night' }, JERUSALEM)!;
      const night = onahBounds({ abs: O, kind: 'night' }, JERUSALEM)!;
      expect(nextNight.start.getTime()).toBe(day.end.getTime());
      expect(night.end.getTime()).toBe(day.start.getTime());
    });

    it('is null where the sun neither rises nor sets', () => {
      const midsummer = new HDate(new Date(2026, 5, 21)).abs();
      expect(onahBounds({ abs: midsummer, kind: 'day' }, LONGYEARBYEN)).toBeNull();
      expect(onahBounds({ abs: midsummer, kind: 'night' }, LONGYEARBYEN)).toBeNull();
    });
  });

  describe('onot arithmetic', () => {
    it('numbers the night onah before the day onah of the same Hebrew day', () => {
      expect(onahIndex({ abs: O, kind: 'night' })).toBe(O * 2);
      expect(onahIndex({ abs: O, kind: 'day' })).toBe(O * 2 + 1);
      expect(onahIndex({ abs: O + 1, kind: 'night' })).toBe(O * 2 + 2);
    });

    it.each([{ kind: 'night' as const }, { kind: 'day' as const }])('round-trips a $kind onah through its index', ({ kind }) => {
      const onah = { abs: O + 17, kind };
      expect(onahFromIndex(onahIndex(onah))).toEqual(onah);
    });

    it('steps across the day boundary in both directions', () => {
      expect(addOnot({ abs: O, kind: 'day' }, 1)).toEqual({ abs: O + 1, kind: 'night' });
      expect(addOnot({ abs: O, kind: 'night' }, -1)).toEqual({ abs: O - 1, kind: 'day' });
      expect(addOnot({ abs: O, kind: 'night' }, 1)).toEqual({ abs: O, kind: 'day' });
      expect(addOnot({ abs: O, kind: 'day' }, 2)).toEqual({ abs: O + 1, kind: 'day' });
      expect(addOnot({ abs: O, kind: 'day' }, 0)).toEqual({ abs: O, kind: 'day' });
    });

    it('compares onot by day and kind', () => {
      expect(sameOnah({ abs: O, kind: 'day' }, { abs: O, kind: 'day' })).toBe(true);
      expect(sameOnah({ abs: O, kind: 'day' }, { abs: O, kind: 'night' })).toBe(false);
      expect(sameOnah({ abs: O, kind: 'day' }, { abs: O + 1, kind: 'day' })).toBe(false);
    });

    it('offers one candidate for a certain onset and the ending day plus the opening night for a doubtful one', () => {
      const day = { abs: O, kind: 'day' as const };
      expect(onsetCandidates(day, false)).toEqual([day]);
      expect(onsetCandidates(day, true)).toEqual([day, { abs: O + 1, kind: 'night' }]);
    });
  });

  describe('day lookups', () => {
    it('names the Hebrew day whose daytime falls on the location\'s civil date', () => {
      expect(hebrewDay(O).abs()).toBe(O);
      expect(civilHebrewDayAt(at(NEW_YORK, '2026-10-20T23:00'), NEW_YORK).abs()).toBe(O);
      expect(civilHebrewDayAt(at(JERUSALEM, '2026-10-20T03:00'), JERUSALEM).abs()).toBe(O);
    });

    it('resolves a Hebrew day to noon and zmanim at the location', () => {
      expect(dayNoon(O, JERUSALEM).getTime()).toBe(at(JERUSALEM, '2026-10-20T12:00').getTime());
      expect(dayNoon(O, NEW_YORK).getTime()).toBe(at(NEW_YORK, '2026-10-20T12:00').getTime());
      expect(zmanimOfDay(O, JERUSALEM)!.shkia.getTime()).toBe(zmanimFor(at(JERUSALEM, '2026-10-20T12:00'), JERUSALEM).shkia.getTime());
    });
  });

  describe('tevila nights', () => {
    it('forbids immersion on the night of Yom Kippur and of Tisha B\'Av', () => {
      expect(tevilaBlockedOnNight(absOf(2026, 9, 21), JERUSALEM)).toBe(true);
      expect(tevilaBlockedOnNight(absOf(2026, 7, 23), JERUSALEM)).toBe(true);
      // hebcal flags "Erev Tish'a B'Av" as a major fast too; 8 Av, erev Yom Kippur, and a Shabbat
      // 9 Av whose fast is deferred to Sunday are all ordinary tevila nights.
      expect(tevilaBlockedOnNight(absOf(2026, 7, 22), JERUSALEM)).toBe(false);
      expect(tevilaBlockedOnNight(absOf(2026, 9, 20), JERUSALEM)).toBe(false);
      expect(tevilaBlockedOnNight(absOf(2025, 8, 2), JERUSALEM)).toBe(false);
      expect(tevilaBlockedOnNight(absOf(2025, 8, 3), JERUSALEM)).toBe(true);
    });

    it('allows an ordinary night', () => {
      expect(tevilaBlockedOnNight(O, JERUSALEM)).toBe(false);
      expect(tevilaBlockedOnNight(absOf(2026, 9, 22), JERUSALEM)).toBe(false);
    });

    it('skips a blocked night to the next one', () => {
      expect(nextTevilaNight(absOf(2026, 9, 21), JERUSALEM)).toBe(absOf(2026, 9, 22));
      expect(nextTevilaNight(O, JERUSALEM)).toBe(O);
    });
  });
});
