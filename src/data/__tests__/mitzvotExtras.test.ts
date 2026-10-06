jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

import { MITZVOT } from '../mitzvot';
import { CITIES } from '../cities';
import { HebcalService } from '@/services/HebcalService';
import { at, zmanimFor } from '@/testing/zmanim';

describe('Mitzvot extras', () => {
  it('7.2 nusach options match supported set', () => {
    const all = ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'];
    for (const m of MITZVOT) {
      for (const n of m.nuschaotSupported) {
        expect(all).toContain(n);
      }
      expect(m.nuschaotSupported.length).toBeGreaterThan(0);
    }
  });

  // Named "at least one" but only asserted `Array.isArray`, so `defaultReminders: []` passed — a
  // mitzvah that shows up everywhere in the UI and can never notify.
  it('11.4 every mitzvah has at least one usable defaultReminder', () => {
    for (const m of MITZVOT) {
      expect(m.defaultReminders.length).toBeGreaterThan(0);
      for (const reminder of m.defaultReminders) {
        expect(reminder.label.trim().length).toBeGreaterThan(0);
        expect(['start', 'end']).toContain(reminder.anchor);
        expect(Number.isFinite(reminder.offsetMin)).toBe(true);
      }
    }
  });

  // A duration in the text that disagrees with the offset tells the user they have more time than
  // they do — tefillin promised "an hour" while firing 45 minutes before the window closed.
  it('11.4b end-anchored labels that name a duration match their offset', () => {
    for (const m of MITZVOT) {
      for (const reminder of m.defaultReminders) {
        if (reminder.anchor !== 'end') continue;
        const stated = /(\d+)\s*דק/.exec(reminder.label);
        if (stated) expect(Number(stated[1])).toBe(Math.abs(reminder.offsetMin));
        if (/נותרה שעה/.test(reminder.label)) expect(Math.abs(reminder.offsetMin)).toBe(60);
      }
    }
  });

  it('every mitzvah has unique id', () => {
    const ids = MITZVOT.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every mitzvah has both he+en name', () => {
    for (const m of MITZVOT) {
      expect(m.name.he).toBeTruthy();
      expect(m.name.en).toBeTruthy();
    }
  });

  it('skipOn values are recognized tokens', () => {
    const allowed = new Set(['shabbat', 'yomtov', 'cholHamoed', 'fastDay']);
    for (const m of MITZVOT) {
      for (const s of m.skipOn) {
        expect(allowed.has(s)).toBe(true);
      }
    }
  });
});

describe('shouldSkip via HebcalService (16.1, 16.2 extra)', () => {
  it('16.1 — Saturday gregorian flagged as shabbat (current behavior, BUG-001)', () => {
    const sat = new Date(2026, 3, 25, 12); // no location: the device's Gregorian Saturday
    expect(HebcalService.isShabbat(sat)).toBe(true);
  });

  it('16.1 BUG-001 — isShabbat halachic with location (Friday after shkia = true)', () => {
    // With location, detect Friday-after-shkia as Shabbat.
    const friday = new Date('2026-04-24T20:00:00Z'); // Friday, 23:00 Jerusalem — past shkia
    expect(HebcalService.isShabbat(friday, CITIES[0])).toBe(true);
    // Saturday midday still Shabbat
    const sat = new Date('2026-04-25T10:00:00Z');
    expect(HebcalService.isShabbat(sat, CITIES[0])).toBe(true);
    // Sunday not Shabbat
    const sun = new Date('2026-04-26T10:00:00Z');
    expect(HebcalService.isShabbat(sun, CITIES[0])).toBe(false);
  });

  // Was `expect(typeof tested).toBe('boolean')` — a tautology. The boundary behaviour now lives in
  // HebcalService.test.ts (2.5b/2.5c); this one guards the `il` flag, which decides whether the
  // second day of a chag is Yom Tov at all.
  it('16.2 16 Nisan is chol hamoed in Israel and second-day Yom Tov in chu"l', () => {
    const sixteenNisan = '2026-04-03T12:00';
    const newYork = CITIES.find((c) => c.nameEn === 'New York')!;

    expect(HebcalService.isYomTov(at(CITIES[0], sixteenNisan), CITIES[0])).toBe(false);
    expect(HebcalService.isYomTov(at(newYork, sixteenNisan), newYork)).toBe(true);
  });
});

describe('Zmanim sanity (covers more of zone 1)', () => {
  it('1.x getZmanim returns non-null fields for Jerusalem today', () => {
    const z = zmanimFor(new Date('2026-04-23T10:00:00Z'), CITIES[0]);
    expect(z.alotHaShachar).toBeInstanceOf(Date);
    expect(z.netzHaChama).toBeInstanceOf(Date);
    expect(z.shkia).toBeInstanceOf(Date);
    expect(z.tzeitHakochavim).toBeInstanceOf(Date);
    expect(z.chatzot).toBeInstanceOf(Date);
  });

  it('1.x zmanim are monotonically increasing', () => {
    const z = zmanimFor(new Date('2026-04-23T10:00:00Z'), CITIES[0]);
    expect(z.alotHaShachar.getTime()).toBeLessThan(z.netzHaChama.getTime());
    expect(z.netzHaChama.getTime()).toBeLessThan(z.chatzot.getTime());
    expect(z.chatzot.getTime()).toBeLessThan(z.shkia.getTime());
    expect(z.shkia.getTime()).toBeLessThan(z.tzeitHakochavim.getTime());
  });
});

describe('nusach filtering', () => {
  it('getAllMitzvot honours nuschaotSupported and returns everything when unfiltered', () => {
    const { getAllMitzvot } = require('@/data/customMitzvotAdapter');
    const all = getAllMitzvot();
    expect(all.length).toBeGreaterThan(0);
    expect(getAllMitzvot('ashkenaz').length).toBe(all.filter((m: { nuschaotSupported: string[] }) =>
      m.nuschaotSupported.includes('ashkenaz')).length);

    const restricted = { ...all[0], id: 'chabad_only', nuschaotSupported: ['chabad'] };
    const filter = (nusach: string) =>
      [...all, restricted].filter((m: { nuschaotSupported: string[] }) => m.nuschaotSupported.includes(nusach));
    expect(filter('chabad').map((m: { id: string }) => m.id)).toContain('chabad_only');
    expect(filter('ashkenaz').map((m: { id: string }) => m.id)).not.toContain('chabad_only');
  });
});
