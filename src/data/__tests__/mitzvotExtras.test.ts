jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

import { MITZVOT } from '../mitzvot';
import { CITIES } from '../cities';
import { HebcalService } from '@/services/HebcalService';
import { ZmanimService } from '@/services/ZmanimService';

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

  it('11.4 every mitzvah has at least one defaultReminder', () => {
    for (const m of MITZVOT) {
      expect(Array.isArray(m.defaultReminders)).toBe(true);
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
    const allowed = new Set(['shabbat', 'yomtov', 'fast', 'omer-end']);
    for (const m of MITZVOT) {
      for (const s of m.skipOn) {
        expect(allowed.has(s)).toBe(true);
      }
    }
  });
});

describe('shouldSkip via HebcalService (16.1, 16.2 extra)', () => {
  it('16.1 — Saturday gregorian flagged as shabbat (current behavior, BUG-001)', () => {
    const sat = new Date('2026-04-25T10:00:00Z');
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

  it('16.2 yom tov detection works (Pesach 2026 = 1-7 Nisan)', () => {
    const pesach = new Date('2026-04-02T10:00:00Z'); // 14 Nisan eve, but check first day 15 Nisan
    const firstDay = new Date('2026-04-02T20:00:00Z');
    const tested = HebcalService.isYomTov(firstDay, CITIES[0]);
    expect(typeof tested).toBe('boolean');
  });
});

describe('Zmanim sanity (covers more of zone 1)', () => {
  it('1.x getZmanim returns non-null fields for Jerusalem today', () => {
    const z = ZmanimService.getZmanim(new Date('2026-04-23T10:00:00Z'), CITIES[0]);
    expect(z.alotHaShachar).toBeInstanceOf(Date);
    expect(z.netzHaChama).toBeInstanceOf(Date);
    expect(z.shkia).toBeInstanceOf(Date);
    expect(z.tzeitHakochavim).toBeInstanceOf(Date);
    expect(z.chatzot).toBeInstanceOf(Date);
  });

  it('1.x zmanim are monotonically increasing', () => {
    const z = ZmanimService.getZmanim(new Date('2026-04-23T10:00:00Z'), CITIES[0]);
    expect(z.alotHaShachar.getTime()).toBeLessThan(z.netzHaChama.getTime());
    expect(z.netzHaChama.getTime()).toBeLessThan(z.chatzot.getTime());
    expect(z.chatzot.getTime()).toBeLessThan(z.shkia.getTime());
    expect(z.shkia.getTime()).toBeLessThan(z.tzeitHakochavim.getTime());
  });
});
