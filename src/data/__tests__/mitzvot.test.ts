import { HDate } from '@hebcal/core';
import { MITZVOT, findMitzvah, omerDayFor } from '../mitzvot';
import { ZmanimService } from '@/services/ZmanimService';
import { UserSettings } from '@/types/mitzvah';
import { CITIES } from '../cities';

const JERUSALEM = CITIES[0];
const SETTINGS: UserSettings = {
  nusach: 'ashkenaz',
  halachicOpinions: { ksSofZman: 'GRA' },
  inIsrael: true,
};

const DATES = [
  new Date('2026-04-23T12:00:00Z'),
  new Date('2026-05-15T12:00:00Z'),
];

function ctxFor(date: Date) {
  return { date, location: JERUSALEM, settings: SETTINGS, zmanim: ZmanimService.getZmanim(date, JERUSALEM) };
}

describe('mitzvot windows', () => {
  it('has all 10 MVP mitzvot', () => {
    const ids = [
      'tefillin', 'tzitzit', 'krias_shma_shacharit', 'shacharit', 'mincha',
      'maariv', 'birchot_hashachar', 'candle_lighting', 'havdalah', 'sefirat_haomer',
    ];
    for (const id of ids) {
      expect(findMitzvah(id)).toBeDefined();
    }
    expect(MITZVOT.length).toBeGreaterThanOrEqual(10);
  });

  it.each(DATES)('computes valid windows for all mitzvot on %s', (date) => {
    const ctx = ctxFor(date);
    for (const m of MITZVOT) {
      const w = m.computeWindow(ctx);
      if (w) {
        expect(w.end.getTime()).toBeGreaterThan(w.start.getTime());
      }
    }
  });

  it('tefillin window = misheyakir..shkia', () => {
    const ctx = ctxFor(DATES[0]);
    const w = findMitzvah('tefillin')!.computeWindow(ctx);
    expect(w).not.toBeNull();
    expect(w!.start.getTime()).toBe(ctx.zmanim.misheyakir.getTime());
    expect(w!.end.getTime()).toBe(ctx.zmanim.shkia.getTime());
  });

  it('omer day 10 is 25 Nisan', () => {
    const may2026 = new Date('2026-04-12T12:00:00Z');
    const day = omerDayFor(may2026);
    expect(day).toBe(10);
    const hd = new HDate(may2026);
    expect(hd.getMonthName()).toBe('Nisan');
    expect(hd.getDate()).toBe(25);
  });

  it('candle lighting returns null on non-Friday', () => {
    const monday = new Date('2026-04-20T12:00:00Z');
    const w = findMitzvah('candle_lighting')!.computeWindow(ctxFor(monday));
    expect(w).toBeNull();
  });
});
