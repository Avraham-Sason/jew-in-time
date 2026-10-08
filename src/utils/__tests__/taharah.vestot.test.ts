import { HDate, months } from '@hebcal/core';
import { TAHARAH_PRESETS } from '@/data/taharahPresets';
import { Onah, PerishaOnah, TaharahEvent } from '@/types/taharah';
import { activeOnsets, haflagaDays, kavuaHints, perishaOnot, yomHachodeshOf } from '@/utils/taharah/vestot';

const ASHKENAZ = TAHARAH_PRESETS.ashkenaz;
const CHABAD = TAHARAH_PRESETS.chabad;
const OVADIA = TAHARAH_PRESETS.sephardi_ovadia;

const absOf = (y: number, m: number, d: number) => new HDate(new Date(y, m - 1, d)).abs();
// 19 Elul 5786 and 18 Tishrei 5787: 28 days apart, so an interval of 29 counted inclusively.
const P = absOf(2026, 9, 1);
const L = absOf(2026, 9, 29);

type Draft<E> = E extends unknown ? Omit<E, 'id' | 'recordedAt'> : never;

const log = (...drafts: Draft<TaharahEvent>[]): TaharahEvent[] =>
  drafts.map((draft, i) => ({ ...draft, id: `e${i + 1}`, recordedAt: i + 1 }) as TaharahEvent);

const onset = (abs: number, kind: 'night' | 'day' = 'day', doubtful?: boolean): Draft<TaharahEvent> => ({
  type: 'onset',
  onah: { abs, kind },
  ...(doubtful === undefined ? {} : { doubtful }),
});
const hefsek = (day: number): Draft<TaharahEvent> => ({ type: 'hefsek', day, result: 'clean' });

const day = (abs: number): Onah => ({ abs, kind: 'day' });
const night = (abs: number): Onah => ({ abs, kind: 'night' });
const entry = (onah: Onah, reasons: PerishaOnah['reasons'], disputed = false): PerishaOnah => ({
  onah,
  reasons,
  disputed,
});

describe('perishaOnot', () => {
  it('anchors the fixtures on the Tishrei and Cheshvan dates they rely on', () => {
    expect(L - P).toBe(28);
    expect(L + 30).toBe(absOf(2026, 10, 29));
    expect(new HDate(L + 30).getDate()).toBe(18);
    expect(new HDate(L + 30).getMonthName()).toBe('Cheshvan');
  });

  describe('ashkenaz', () => {
    it('separates on the haflaga, the onah beinonit on day 30 and 31, and the yom hachodesh', () => {
      expect(perishaOnot(log(onset(P), onset(L)), ASHKENAZ)).toEqual([
        entry(day(L + 28), ['haflaga']),
        entry(day(L + 29), ['onahBeinonit']),
        entry(day(L + 30), ['yomHachodesh', 'onahBeinonit']),
      ]);
    });

    it('keeps both intervals a doubtful previous sighting allows', () => {
      const result = perishaOnot(log(onset(P, 'day', true), onset(L)), ASHKENAZ);
      expect(result.map((e) => [e.onah.abs, e.onah.kind, e.reasons])).toEqual([
        [L + 27, 'day', ['haflaga']],
        [L + 28, 'day', ['haflaga']],
        [L + 29, 'day', ['onahBeinonit']],
        [L + 30, 'day', ['yomHachodesh', 'onahBeinonit']],
      ]);
    });

    it('keeps only the latest interval', () => {
      const earlier = absOf(2026, 8, 1);
      const result = perishaOnot(log(onset(earlier), onset(P), onset(L)), ASHKENAZ);
      expect(result.map((e) => e.onah.abs)).toEqual([L + 28, L + 29, L + 30]);
    });

    it('has no haflaga for a single onset, but still the yom hachodesh and the onah beinonit', () => {
      const result = perishaOnot(log(onset(L)), ASHKENAZ);
      expect(result.some((e) => e.reasons.includes('haflaga'))).toBe(false);
      expect(result).toEqual([
        entry(day(L + 29), ['onahBeinonit']),
        entry(day(L + 30), ['yomHachodesh', 'onahBeinonit']),
      ]);
    });

    it('marks the yom hachodesh of a 30th as disputed when the next month has only 29 days', () => {
      const thirtyNisan = absOf(2026, 4, 17);
      const result = perishaOnot(log(onset(thirtyNisan)), ASHKENAZ);
      expect(result).toEqual([
        entry(day(absOf(2026, 5, 16)), ['onahBeinonit'], false),
        entry(day(absOf(2026, 5, 17)), ['yomHachodesh', 'onahBeinonit'], true),
      ]);
    });

    it('is empty without any onset', () => {
      expect(perishaOnot([], ASHKENAZ)).toEqual([]);
      expect(perishaOnot(log(hefsek(P + 4)), ASHKENAZ)).toEqual([]);
    });
  });

  describe('sephardi (Rav Ovadia)', () => {
    it('keeps the onah beinonit on day 30 only', () => {
      expect(perishaOnot(log(onset(P), onset(L)), OVADIA)).toEqual([
        entry(day(L + 28), ['haflaga']),
        entry(day(L + 29), ['onahBeinonit']),
        entry(day(L + 30), ['yomHachodesh']),
      ]);
    });

    it('separates in both onot of a doubtful onset', () => {
      expect(perishaOnot(log(onset(L, 'day', true)), OVADIA)).toEqual([
        entry(day(L + 29), ['onahBeinonit']),
        entry(night(L + 30), ['onahBeinonit']),
        entry(day(L + 30), ['yomHachodesh']),
        entry(night(L + 31), ['yomHachodesh']),
      ]);
    });
  });

  describe('chassidic', () => {
    it("adds ohr zarua before every onah except one that is only the thirty-first day's onah beinonit", () => {
      // Elul has 29 days, so the yom hachodesh falls on day 30 and the onah beinonit of day 31 stands alone.
      expect(perishaOnot(log(onset(P)), TAHARAH_PRESETS.chassidic)).toEqual([
        entry(night(P + 29), ['ohrZarua']),
        entry(day(P + 29), ['yomHachodesh', 'onahBeinonit']),
        entry(day(P + 30), ['onahBeinonit']),
      ]);
    });
  });

  describe('chabad', () => {
    it('counts the haflaga in onot from each hefsek and adds ohr zarua before every onah', () => {
      const events = log(onset(P), hefsek(P + 4), onset(L), hefsek(L + 4));
      expect(perishaOnot(events, CHABAD)).toEqual([
        entry(night(L + 28), ['ohrZarua']),
        entry(day(L + 28), ['haflaga', 'ohrZarua']),
        entry(night(L + 29), ['onahBeinonit', 'ohrZarua']),
        entry(day(L + 29), ['onahBeinonit']),
        entry(night(L + 30), ['ohrZarua']),
        entry(day(L + 30), ['yomHachodesh']),
      ]);
    });

    it('falls back to the day count without any hefsek', () => {
      const result = perishaOnot(log(onset(P), onset(L)), CHABAD);
      expect(result.find((e) => e.onah.abs === L + 28 && e.onah.kind === 'day')?.reasons).toContain('haflaga');
    });

    it('does not know the haflaga yet while the new hefsek is missing', () => {
      const result = perishaOnot(log(onset(P), hefsek(P + 4), onset(L)), CHABAD);
      expect(result.some((e) => e.reasons.includes('haflaga'))).toBe(false);
      expect(result.some((e) => e.reasons.includes('onahBeinonit'))).toBe(true);
      expect(result.some((e) => e.reasons.includes('yomHachodesh'))).toBe(true);
    });
  });
});

describe('yomHachodeshOf', () => {
  it('is the same Hebrew date next month in the same onah', () => {
    expect(yomHachodeshOf(night(L))).toEqual({ onah: night(absOf(2026, 10, 29)), disputed: false });
    expect(yomHachodeshOf(day(L))).toEqual({ onah: day(absOf(2026, 10, 29)), disputed: false });
  });

  it('puts a 30th after a 29-day month on the first of the month after, flagged as disputed', () => {
    expect(yomHachodeshOf(day(absOf(2026, 4, 17)))).toEqual({ onah: day(absOf(2026, 5, 17)), disputed: true });
  });
});

it('ignores a hefsek the cycle itself rejected, exactly as deriveCycle does', () => {
  // A hefsek on the third day is too early under the Chabad five-day rule, so the previous
  // cycle has no settled hefsek and the day count stands in, not an onot count from day 3.
  const events = log(onset(P), { type: 'hefsek', day: P + 2, result: 'clean' }, onset(L), {
    type: 'hefsek',
    day: L + 4,
    result: 'clean',
  });
  const result = perishaOnot(events, CHABAD);
  expect(result.find((e) => e.reasons.includes('haflaga'))?.onah).toEqual(day(L + 28));
  expect(result.filter((e) => e.reasons.includes('haflaga'))).toHaveLength(1);
});

describe('haflagaDays', () => {
  it('counts the interval inclusively', () => {
    expect(haflagaDays(day(P), day(L))).toBe(29);
    expect(haflagaDays(day(P), day(P))).toBe(1);
  });
});

describe('activeOnsets', () => {
  it('keeps every onset when nothing paused', () => {
    expect(activeOnsets(log(onset(P), onset(L))).map((e) => e.onah.abs)).toEqual([P, L]);
  });

  it('drops everything up to the pause and keeps what follows it', () => {
    const afterResume = P + 60;
    const events = log(
      onset(P),
      { type: 'pause', day: P + 10, reason: 'pregnancy' },
      { type: 'resume', day: P + 40 },
      onset(afterResume),
    );
    expect(activeOnsets(events).map((e) => e.onah.abs)).toEqual([afterResume]);
  });

  // An onset recorded after the pause already ended it in deriveCycle, so a later resume must not
  // erase it here or the two would disagree about the same events.
  it('keeps an onset dated between the pause and its resume', () => {
    const betweenPauseAndResume = P + 28;
    const events = log(
      onset(P),
      { type: 'pause', day: P + 10, reason: 'pregnancy' },
      { type: 'resume', day: P + 40 },
      onset(betweenPauseAndResume),
    );
    expect(activeOnsets(events).map((e) => e.onah.abs)).toEqual([betweenPauseAndResume]);
  });

  it('drops the sightings from before a pause that has not ended', () => {
    const events = log(onset(P), onset(L), { type: 'pause', day: L + 5, reason: 'postpartum' });
    expect(activeOnsets(events)).toEqual([]);
  });

  it('reads the events in the order of their days, not as listed', () => {
    const events = log(onset(P), onset(L));
    expect(activeOnsets([...events].reverse()).map((e) => e.onah.abs)).toEqual([P, L]);
  });
});

describe('kavuaHints', () => {
  it('hints a date pattern for the same Hebrew date three months running', () => {
    const fifth = [months.CHESHVAN, months.KISLEV, months.TEVET].map((month) => new HDate(5, month, 5787).abs());
    expect(fifth).toEqual([absOf(2026, 10, 16), absOf(2026, 11, 15), absOf(2026, 12, 15)]);
    expect(kavuaHints(log(...fifth.map((abs) => onset(abs))))).toEqual([{ kind: 'date', dayOfMonth: 5 }]);
  });

  it('gives no hint when a sighting in the run is doubtful', () => {
    const fifth = [months.CHESHVAN, months.KISLEV, months.TEVET].map((month) => new HDate(5, month, 5787).abs());
    expect(kavuaHints(log(onset(fifth[0]), onset(fifth[1], 'day', true), onset(fifth[2])))).toEqual([]);
    const X = absOf(2026, 10, 20);
    expect(kavuaHints(log(onset(X), onset(X + 28, 'day', true), onset(X + 56), onset(X + 84)))).toEqual([]);
  });

  it('gives no date hint when the onah differs', () => {
    const [a, b, c] = [months.CHESHVAN, months.KISLEV, months.TEVET].map((month) => new HDate(5, month, 5787).abs());
    expect(kavuaHints(log(onset(a), onset(b), onset(c, 'night')))).toEqual([]);
  });

  it('hints an interval for three equal intervals in the same onah', () => {
    const X = absOf(2026, 10, 20);
    const hints = kavuaHints(log(onset(X), onset(X + 28), onset(X + 56), onset(X + 84)));
    expect(hints).toContainEqual({ kind: 'interval', days: 29 });
  });

  it('gives no interval hint when the last onset is in the other onah', () => {
    const X = absOf(2026, 10, 20);
    const hints = kavuaHints(log(onset(X), onset(X + 28), onset(X + 56), onset(X + 84, 'night')));
    expect(hints.filter((hint) => hint.kind === 'interval')).toEqual([]);
  });

  it('gives no interval hint when the intervals differ', () => {
    const X = absOf(2026, 10, 20);
    expect(
      kavuaHints(log(onset(X), onset(X + 28), onset(X + 56), onset(X + 90))).filter((h) => h.kind === 'interval'),
    ).toEqual([]);
  });

  it('needs at least three onsets', () => {
    expect(kavuaHints(log(onset(P), onset(L)))).toEqual([]);
    expect(kavuaHints(log(onset(P)))).toEqual([]);
    expect(kavuaHints([])).toEqual([]);
  });
});
