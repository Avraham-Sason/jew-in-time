import { findMitzvah, omerDayFor } from '../mitzvot';
import { CITIES } from '../cities';
import { ZmanimService } from '@/services/ZmanimService';
import { UserSettings } from '@/types/mitzvah';

const JERUSALEM = CITIES[0];
const SETTINGS_GRA: UserSettings = { nusach: 'ashkenaz', halachicOpinions: { ksSofZman: 'GRA' }, inIsrael: true };
const SETTINGS_MA: UserSettings = { nusach: 'ashkenaz', halachicOpinions: { ksSofZman: 'MA' }, inIsrael: true };

const WEEKDAY = new Date('2026-04-23T12:00:00Z');
const FRIDAY = new Date('2026-04-24T12:00:00Z');
const SATURDAY = new Date('2026-04-25T12:00:00Z');

function ctx(date: Date, settings = SETTINGS_GRA, loc = JERUSALEM) {
  return { date, location: loc, settings, zmanim: ZmanimService.getZmanim(date, loc) };
}

describe('mitzvot windows extra', () => {
  it('3.1 tefillin: misheyakir → shkia', () => {
    const c = ctx(WEEKDAY);
    const w = findMitzvah('tefillin')!.computeWindow(c);
    expect(w!.start.getTime()).toBe(c.zmanim.misheyakir.getTime());
    expect(w!.end.getTime()).toBe(c.zmanim.shkia.getTime());
  });

  it('3.2 tzitzit: misheyakir → shkia', () => {
    const c = ctx(WEEKDAY);
    const w = findMitzvah('tzitzit')!.computeWindow(c);
    expect(w!.start.getTime()).toBe(c.zmanim.misheyakir.getTime());
    expect(w!.end.getTime()).toBe(c.zmanim.shkia.getTime());
  });

  it('3.3 krias_shma_shacharit GRA: netz → sofZmanShmaGra', () => {
    const c = ctx(WEEKDAY, SETTINGS_GRA);
    const w = findMitzvah('krias_shma_shacharit')!.computeWindow(c);
    expect(w!.start.getTime()).toBe(c.zmanim.netzHaChama.getTime());
    expect(w!.end.getTime()).toBe(c.zmanim.sofZmanShmaGra.getTime());
  });

  it('3.4 krias_shma_shacharit MA differs from GRA', () => {
    const cGra = ctx(WEEKDAY, SETTINGS_GRA);
    const cMa = ctx(WEEKDAY, SETTINGS_MA);
    const wGra = findMitzvah('krias_shma_shacharit')!.computeWindow(cGra);
    const wMa = findMitzvah('krias_shma_shacharit')!.computeWindow(cMa);
    expect(wGra!.end.getTime()).not.toBe(wMa!.end.getTime());
  });

  it('3.5 shacharit: netz → sofZmanTfila', () => {
    const c = ctx(WEEKDAY);
    const w = findMitzvah('shacharit')!.computeWindow(c);
    expect(w!.start.getTime()).toBe(c.zmanim.netzHaChama.getTime());
    expect(w!.end.getTime()).toBe(c.zmanim.sofZmanTfilaGra.getTime());
  });

  it('3.6 mincha: minchaGedola → shkia', () => {
    const c = ctx(WEEKDAY);
    const w = findMitzvah('mincha')!.computeWindow(c);
    expect(w!.start.getTime()).toBe(c.zmanim.minchaGedola.getTime());
    expect(w!.end.getTime()).toBe(c.zmanim.shkia.getTime());
  });

  it('3.7 maariv: tzeit → chatzot+1day', () => {
    const c = ctx(WEEKDAY);
    const w = findMitzvah('maariv')!.computeWindow(c);
    expect(w!.start.getTime()).toBe(c.zmanim.tzeitHakochavim.getTime());
    expect(w!.end.getTime()).toBeGreaterThan(c.zmanim.tzeitHakochavim.getTime());
  });

  it('3.8 birchot_hashachar: alot → sofZmanShma', () => {
    const c = ctx(WEEKDAY);
    const w = findMitzvah('birchot_hashachar')!.computeWindow(c);
    expect(w!.start.getTime()).toBe(c.zmanim.alotHaShachar.getTime());
    expect(w!.end.getTime()).toBe(c.zmanim.sofZmanShmaGra.getTime());
  });

  it('3.9 candle lighting Israel: -18 min on Friday', () => {
    const c = ctx(FRIDAY);
    const w = findMitzvah('candle_lighting')!.computeWindow(c);
    expect(w).not.toBeNull();
    const diff = (c.zmanim.shkia.getTime() - w!.start.getTime()) / 60000;
    expect(diff).toBeCloseTo(18, 0);
  });

  it('3.10 candle lighting outside Israel: -20 min', () => {
    const NY = CITIES.find((c) => c.name === 'ניו יורק')!;
    const c = ctx(FRIDAY, { ...SETTINGS_GRA, inIsrael: false }, NY);
    const w = findMitzvah('candle_lighting')!.computeWindow(c);
    expect(w).not.toBeNull();
    const diff = (c.zmanim.shkia.getTime() - w!.start.getTime()) / 60000;
    expect(diff).toBeCloseTo(20, 0);
  });

  it('3.11 havdalah on Saturday only', () => {
    const cSat = ctx(SATURDAY);
    const wSat = findMitzvah('havdalah')!.computeWindow(cSat);
    expect(wSat).not.toBeNull();
    const cWed = ctx(WEEKDAY);
    const wWed = findMitzvah('havdalah')!.computeWindow(cWed);
    expect(wWed).toBeNull();
  });

  it('3.12 omer day 10 = 25 Nisan', () => {
    expect(omerDayFor(new Date('2026-04-12T12:00:00Z'))).toBe(10);
  });

  it('3.13 omer before 16 Nisan = null', () => {
    expect(omerDayFor(new Date('2026-04-01T12:00:00Z'))).toBeNull();
  });

  it('3.14 omer after Shavuot = null', () => {
    expect(omerDayFor(new Date('2026-06-15T12:00:00Z'))).toBeNull();
  });

  it('3.14b BUG-008 — omer respects location timezone at UTC day boundary', () => {
    const ny = CITIES.find((c) => c.name === 'ניו יורק')!;
    const instant = new Date('2026-04-13T01:30:00Z');
    expect(omerDayFor(instant, ny.tz)).toBe(10);
    expect(omerDayFor(instant, JERUSALEM.tz)).toBe(11);
  });

  it('3.15 tefillin on Saturday — skipOn shabbat (registry has skipOn)', () => {
    const m = findMitzvah('tefillin')!;
    expect(m.skipOn).toContain('shabbat');
  });
});
