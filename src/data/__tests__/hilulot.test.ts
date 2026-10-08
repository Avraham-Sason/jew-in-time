import { HDate, months } from '@hebcal/core';
import { HILULOT, hilulaDateLabel, hilulaDayIn, hilulotOn, upcomingHilulot } from '../hilulot';

const ids = (hilulot: { id: string }[]) => hilulot.map((hilula) => hilula.id);
const find = (id: string) => HILULOT.find((hilula) => hilula.id === id)!;

describe('HILULOT registry', () => {
  it('gives every hilula a unique id and a name in both languages', () => {
    expect(new Set(ids([...HILULOT])).size).toBe(HILULOT.length);
    for (const hilula of HILULOT) {
      expect(hilula.name.he.trim()).not.toBe('');
      expect(hilula.name.en.trim()).not.toBe('');
    }
  });

  it('places every hilula on exactly one day of every year, Israel and abroad', () => {
    for (let year = 5786; year <= 5806; year++) {
      for (const inIsrael of [true, false]) {
        const total = HILULOT.reduce((count, hilula) => count + (hilulaDayIn(hilula, year, inIsrael) ? 1 : 0), 0);
        expect(total).toBe(HILULOT.length);
      }
    }
  });

  it('keeps the recorded day and month', () => {
    const day = hilulaDayIn(find('rashbi'), 5786, true)!;
    expect([day.getDate(), day.getMonth()]).toEqual([18, months.IYYAR]);
  });
});

describe('hilulotOn', () => {
  it('names every hilula of a day, and nothing on a day with none', () => {
    expect(ids(hilulotOn(new HDate(18, months.IYYAR, 5786), true))).toEqual(['rashbi', 'rema']);
    expect(ids(hilulotOn(new HDate(3, months.CHESHVAN, 5787), false))).toEqual(['yisrael_of_ruzhin', 'ovadia_yosef']);
    expect(hilulotOn(new HDate(2, months.CHESHVAN, 5787), true)).toEqual([]);
  });

  it('moves a plain Adar date to Adar II in Israel and to Adar I abroad in a leap year', () => {
    expect(ids(hilulotOn(new HDate(7, months.ADAR_II, 5787), true))).toEqual(['moshe_rabbeinu']);
    expect(hilulotOn(new HDate(7, months.ADAR_I, 5787), true)).toEqual([]);
    expect(ids(hilulotOn(new HDate(7, months.ADAR_I, 5787), false))).toEqual(['moshe_rabbeinu']);
    expect(hilulotOn(new HDate(7, months.ADAR_II, 5787), false)).toEqual([]);
  });

  it('keeps a plain Adar date in Adar in a regular year', () => {
    expect(ids(hilulotOn(new HDate(7, months.ADAR_I, 5786), true))).toEqual(['moshe_rabbeinu']);
    expect(ids(hilulotOn(new HDate(7, months.ADAR_I, 5786), false))).toEqual(['moshe_rabbeinu']);
  });

  it('keeps a death in a leap year Adar in the same Adar everywhere', () => {
    for (const inIsrael of [true, false]) {
      expect(ids(hilulotOn(new HDate(13, months.ADAR_II, 5787), inIsrael))).toEqual(['moshe_feinstein']);
      expect(ids(hilulotOn(new HDate(20, months.ADAR_I, 5787), inIsrael))).toEqual(['shlomo_zalman_auerbach']);
      expect(ids(hilulotOn(new HDate(13, months.ADAR_I, 5786), inIsrael))).toEqual(['moshe_feinstein']);
      expect(ids(hilulotOn(new HDate(20, months.ADAR_I, 5786), inIsrael))).toEqual(['shlomo_zalman_auerbach']);
    }
  });
});

describe('upcomingHilulot', () => {
  it('lists every hilula once, from today on, soonest first', () => {
    const today = new HDate(3, months.CHESHVAN, 5787);
    const upcoming = upcomingHilulot(today, true);
    expect(upcoming).toHaveLength(HILULOT.length);
    expect(new Set(upcoming.map(({ hilula }) => hilula.id)).size).toBe(HILULOT.length);
    expect(ids(upcoming.slice(0, 2).map(({ hilula }) => hilula))).toEqual(['yisrael_of_ruzhin', 'ovadia_yosef']);
    expect(upcoming[0].day.abs()).toBe(today.abs());
    upcoming.forEach(({ day }, index) => {
      expect(day.abs()).toBeGreaterThanOrEqual(today.abs());
      expect(day.abs() - today.abs()).toBeLessThan(385);
      if (index > 0) expect(day.abs()).toBeGreaterThanOrEqual(upcoming[index - 1].day.abs());
    });
  });

  it('moves a hilula that already passed this year to next year', () => {
    const today = new HDate(4, months.CHESHVAN, 5787);
    const ovadia = upcomingHilulot(today, true).find(({ hilula }) => hilula.id === 'ovadia_yosef')!;
    expect(ovadia.day.getFullYear()).toBe(5788);
    expect([ovadia.day.getDate(), ovadia.day.getMonth()]).toEqual([3, months.CHESHVAN]);
  });
});

describe('hilulaDateLabel', () => {
  it('names the day and month without the year', () => {
    expect(hilulaDateLabel(new HDate(18, months.IYYAR, 5786), 'he')).toBe('י״ח אייר');
    expect(hilulaDateLabel(new HDate(7, months.ADAR_II, 5787), 'he')).toBe('ז׳ אדר ב׳');
    expect(hilulaDateLabel(new HDate(18, months.IYYAR, 5786), 'en')).toBe('18th of Iyyar');
  });
});
