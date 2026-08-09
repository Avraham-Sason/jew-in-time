import { buildDayTimeline } from '../buildDayTimeline';
import { computeStats } from '../historyStats';
import { isSkipped, isSkippedAt, observanceFor } from '../skipRules';
import { findMitzvah } from '@/data/mitzvot';
import { CITIES } from '@/data/cities';
import { UserSettings } from '@/types/mitzvah';

const JERUSALEM = CITIES[0];
const SETTINGS: UserSettings = { nusach: 'ashkenaz', halachicOpinions: { ksSofZman: 'GRA' }, inIsrael: true };
const SHABBAT = new Date(2026, 3, 25); // Saturday, well clear of Pesach
const WEEKDAY = new Date(2026, 3, 23); // Thursday

const tefillin = findMitzvah('tefillin')!;
const shacharit = findMitzvah('shacharit')!;
const identity = (key: string) => key;

describe('skipRules', () => {
  it('recognises Shabbat and a plain weekday', () => {
    expect(observanceFor(SHABBAT, JERUSALEM)).toEqual({ isShabbat: true, isYomTov: false });
    expect(observanceFor(WEEKDAY, JERUSALEM)).toEqual({ isShabbat: false, isYomTov: false });
  });

  it('skips only mitzvot that opt in via skipOn', () => {
    const shabbat = observanceFor(SHABBAT, JERUSALEM);
    expect(tefillin.skipOn).toContain('shabbat');
    expect(isSkipped(tefillin, shabbat)).toBe(true);
    expect(isSkipped(tefillin, observanceFor(WEEKDAY, JERUSALEM))).toBe(false);
    expect(shacharit.skipOn).toEqual([]);
    expect(isSkipped(shacharit, shabbat)).toBe(false);
  });

  // Judged at the window's own start, so the answer never depends on when the caller asks.
  it('gives the same answer for a Shabbat window whenever it is asked', () => {
    const shabbatMorning = new Date(2026, 3, 25, 8, 0, 0);
    const motzaeiShabbat = new Date(2026, 3, 25, 22, 0, 0); // after tzeit — no longer Shabbat "now"
    expect(isSkippedAt(tefillin, shabbatMorning, JERUSALEM)).toBe(true);
    // The old code asked "is it Shabbat right now", so at 22:00 tefillin reappeared as missed.
    expect(observanceFor(motzaeiShabbat, JERUSALEM).isShabbat).toBe(false);
    expect(isSkippedAt(tefillin, shabbatMorning, JERUSALEM)).toBe(true);
  });

  it('skips a Friday-evening window that civil-day granularity would have allowed', () => {
    const eveningMitzvah = { skipOn: ['shabbat'] as const };
    const fridayMorning = new Date(2026, 3, 24, 8, 0, 0);
    const fridayEvening = new Date(2026, 3, 24, 20, 0, 0); // after shkia — already Shabbat
    expect(isSkippedAt({ skipOn: [...eveningMitzvah.skipOn] }, fridayMorning, JERUSALEM)).toBe(false);
    expect(isSkippedAt({ skipOn: [...eveningMitzvah.skipOn] }, fridayEvening, JERUSALEM)).toBe(true);
  });

  it('never consults the calendar for a mitzvah with no skipOn', () => {
    expect(isSkippedAt({ skipOn: [] }, SHABBAT, JERUSALEM)).toBe(false);
  });

  // The bug: the scheduler and history honoured skipOn while the timeline and home did not, so
  // tefillin was listed as an open mitzvah on Shabbat and then reported as missed.
  it('buildDayTimeline omits a Shabbat-skipped mitzvah but keeps it on a weekday', () => {
    const idsFor = (date: Date) =>
      buildDayTimeline(date, [tefillin, shacharit], {}, JERUSALEM, SETTINGS, 'he', identity)
        .filter((item) => item.type === 'mitzvah')
        .map((item) => item.mitzvahId);

    expect(idsFor(SHABBAT)).toEqual(['shacharit']);
    expect(idsFor(WEEKDAY)).toEqual(expect.arrayContaining(['tefillin', 'shacharit']));
  });

  it('every surface agrees about a Shabbat-skipped mitzvah', () => {
    const timelineIds = buildDayTimeline(SHABBAT, [tefillin, shacharit], {}, JERUSALEM, SETTINGS, 'he', identity)
      .filter((item) => item.type === 'mitzvah')
      .map((item) => item.mitzvahId);
    const stats = computeStats([tefillin, shacharit], {}, JERUSALEM, SETTINGS, 1, SHABBAT);

    expect(timelineIds).not.toContain('tefillin');
    expect(stats.perMitzvah.tefillin.eligible).toBe(0);
    expect(stats.missedYesterday).not.toContain('tefillin');
    // shacharit has no skipOn, so it stays eligible and visible on both surfaces.
    expect(timelineIds).toContain('shacharit');
    expect(stats.perMitzvah.shacharit.eligible).toBe(1);
  });
});
