import { HDate } from '@hebcal/core';
import { findMitzvah, omerDayFor } from '../mitzvot';
import { CITIES } from '../cities';
import { zmanimFor } from '@/testing/zmanim';
import { UserSettings } from '@/types/mitzvah';

const JERUSALEM = CITIES[0];
const SETTINGS_GRA: UserSettings = { nusach: 'ashkenaz', halachicOpinions: { ksSofZman: 'GRA' }, inIsrael: true };
const SETTINGS_MA: UserSettings = { nusach: 'ashkenaz', halachicOpinions: { ksSofZman: 'MA' }, inIsrael: true };

const WEEKDAY = new Date('2026-04-23T12:00:00Z');
const FRIDAY = new Date('2026-04-24T12:00:00Z');
const SATURDAY = new Date('2026-04-25T12:00:00Z');

function ctx(date: Date, settings = SETTINGS_GRA, loc = JERUSALEM) {
  return { date, location: loc, settings, zmanim: zmanimFor(date, loc) };
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

  // Was `end > start`, which the old 18-hour window (tzeit → next-day MIDDAY chatzot) satisfied
  // happily. Maariv ends at chatzot halayla — never into the following morning.
  it('3.7 maariv: tzeit → chatzot halayla, and never past the next dawn', () => {
    const c = ctx(WEEKDAY);
    const w = findMitzvah('maariv')!.computeWindow(c)!;
    const nextDay = new Date(WEEKDAY.getFullYear(), WEEKDAY.getMonth(), WEEKDAY.getDate() + 1, 12);
    const nextAlot = zmanimFor(nextDay, JERUSALEM).alotHaShachar;

    expect(w.start.getTime()).toBe(c.zmanim.tzeitHakochavim.getTime());
    expect(w.end.getTime()).toBe(c.zmanim.chatzotLayla.getTime());
    expect(w.end.getTime()).toBeLessThan(nextAlot.getTime());
    const hours = (w.end.getTime() - w.start.getTime()) / 3_600_000;
    expect(hours).toBeGreaterThan(2);
    expect(hours).toBeLessThan(9);
  });

  it('3.7b sefirat haomer: tzeit → the next day\'s alot hashachar', () => {
    const omerNight = new Date(2026, 3, 12, 12); // evening of 25 Nisan, omer night 11
    const c = ctx(omerNight);
    const w = findMitzvah('sefirat_haomer')!.computeWindow(c)!;
    const nextDay = new Date(2026, 3, 13, 12);

    expect(w.start.getTime()).toBe(c.zmanim.tzeitHakochavim.getTime());
    expect(w.end.getTime()).toBe(zmanimFor(nextDay, JERUSALEM).alotHaShachar.getTime());
    expect(w.end.getTime()).toBeGreaterThan(c.zmanim.chatzotLayla.getTime());
  });

  it('3.8 birchot_hashachar: alot → sofZmanShma', () => {
    const c = ctx(WEEKDAY);
    const w = findMitzvah('birchot_hashachar')!.computeWindow(c);
    expect(w!.start.getTime()).toBe(c.zmanim.alotHaShachar.getTime());
    expect(w!.end.getTime()).toBe(c.zmanim.sofZmanShmaGra.getTime());
  });

  it('3.9 candle lighting follows the local minhag: 40 min in Jerusalem, 18 elsewhere in Israel', () => {
    const jerusalem = ctx(FRIDAY);
    const telAviv = ctx(FRIDAY, SETTINGS_GRA, CITIES.find((c) => c.nameEn === 'Tel Aviv')!);
    const minutesBefore = (c: ReturnType<typeof ctx>) => {
      const w = findMitzvah('candle_lighting')!.computeWindow(c)!;
      return (c.zmanim.shkia.getTime() - w.start.getTime()) / 60000;
    };

    expect(minutesBefore(jerusalem)).toBeCloseTo(40, 0);
    expect(minutesBefore(telAviv)).toBeCloseTo(18, 0);
  });

  // Candles are lit before Yom Tov too, not only on Friday. Pesach 5786 starts on a Wednesday
  // evening, which used to produce no reminder at all.
  it('3.9b candle lighting also fires on erev Yom Tov midweek', () => {
    const erevPesach = new Date(2026, 3, 1, 12); // 14 Nisan, a Wednesday
    expect(erevPesach.getDay()).not.toBe(5);
    expect(findMitzvah('candle_lighting')!.computeWindow(ctx(erevPesach))).not.toBeNull();
    const cholHamoed = new Date(2026, 3, 5, 12);
    expect(findMitzvah('candle_lighting')!.computeWindow(ctx(cholHamoed))).toBeNull();
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

  it('3.12 the evening of 25 Nisan opens omer night 11', () => {
    expect(omerDayFor(new Date('2026-04-12T12:00:00Z'))).toBe(11);
  });

  // The two ends of the count. Getting these wrong is silent: night 1 is the one most commonly
  // forgotten, and a window on the night of Shavuot carries a bracha with nothing to count.
  it('3.12b omer runs from the evening of 15 Nisan to the evening of 4 Sivan, and no further', () => {
    const year = new HDate(new Date(2026, 3, 10)).getFullYear();
    const eveningOf = (day: number, month: string) => omerDayFor(new HDate(day, month, year).greg(), JERUSALEM.tz);

    expect(eveningOf(14, 'Nisan')).toBeNull();
    expect(eveningOf(15, 'Nisan')).toBe(1);
    expect(eveningOf(4, 'Sivan')).toBe(49);
    expect(eveningOf(5, 'Sivan')).toBeNull(); // Shavuot night — the count is already finished
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
    expect(omerDayFor(instant, ny.tz)).toBe(11);
    expect(omerDayFor(instant, JERUSALEM.tz)).toBe(12);
  });

  it('3.15 tefillin on Saturday — skipOn shabbat (registry has skipOn)', () => {
    const m = findMitzvah('tefillin')!;
    expect(m.skipOn).toContain('shabbat');
  });
});
