import { HDate } from '@hebcal/core';
import { CITIES } from '@/data/cities';
import { TAHARAH_PRESETS } from '@/data/taharahPresets';
import { at, zmanimFor } from '@/testing/zmanim';
import { TaharahEvent } from '@/types/taharah';
import { deriveCycle } from '@/utils/taharah/cycle';
import { nextPerishaOnah, onahStartDate, renderHint, stageHint, visibleStage } from '@/utils/taharah/summary';

const JERUSALEM = CITIES[0];
const RULES = TAHARAH_PRESETS.ashkenaz;
const absOf = (y: number, m: number, d: number) => new HDate(new Date(y, m - 1, d)).abs();
const O = absOf(2026, 10, 20);
const P = absOf(2026, 9, 1);
const L = absOf(2026, 9, 29);

type Draft<E> = E extends unknown ? Omit<E, 'id' | 'recordedAt'> : never;
const log = (...drafts: Draft<TaharahEvent>[]): TaharahEvent[] =>
  drafts.map((draft, i) => ({ ...draft, id: `e${i + 1}`, recordedAt: i + 1 }) as TaharahEvent);
const onset = (abs: number): Draft<TaharahEvent> => ({ type: 'onset', onah: { abs, kind: 'day' } });
const hefsek = (day: number): Draft<TaharahEvent> => ({ type: 'hefsek', day, result: 'clean' });
const morning = (day: number): Draft<TaharahEvent> => ({ type: 'bedika', day, slot: 'morning', result: 'clean' });
const tevila = (day: number): Draft<TaharahEvent> => ({ type: 'tevila', day });

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const clock = (instant: Date) => instant.toISOString();
const FORMAT = { date: iso, clock };
const hint = (events: TaharahEvent[], now: string, role: 'woman' | 'husband' = 'woman') => {
  const instant = at(JERUSALEM, now);
  return stageHint(deriveCycle(events, RULES, JERUSALEM, instant), events, RULES, role, JERUSALEM, instant, FORMAT);
};
const t = (key: string, params?: Record<string, unknown>) => `${key}${params ? ' ' + JSON.stringify(params) : ''}`;

describe('stageHint', () => {
  it('names the earliest hefsek day while waiting', () => {
    expect(hint(log(onset(O)), '2026-10-22T12:00')).toEqual({
      key: 'taharah.stage.niddah.hint',
      params: { date: '2026-10-24' },
    });
  });

  it('gives the husband his own line instead of the hefsek date', () => {
    expect(hint(log(onset(O)), '2026-10-22T12:00', 'husband')).toEqual({ key: 'taharah.husband.hint' });
    expect(hint([], '2026-10-22T12:00', 'husband')).toEqual({ key: 'taharah.husband.hint' });
    expect(hint([], '2026-10-22T12:00')).toEqual({ key: 'taharah.stage.unknown.hint' });
  });

  it("names today's shkia once the hefsek is possible", () => {
    const shkia = zmanimFor(at(JERUSALEM, '2026-10-24T12:00'), JERUSALEM).shkia;
    expect(hint(log(onset(O)), '2026-10-24T12:00')).toEqual({
      key: 'taharah.stage.awaitingHefsek.hint',
      params: { time: clock(shkia) },
    });
  });

  it('counts the clean day, and says the count starts tomorrow on the hefsek day itself', () => {
    const events = log(onset(O), hefsek(O + 4), morning(O + 5));
    expect(hint(events, '2026-10-26T12:00')).toEqual({ key: 'taharah.stage.shivaNekiim.hint', params: { day: 2 } });
    // The hefsek day's own daytime; its evening already opens clean day 1.
    expect(hint(events, '2026-10-24T15:00')).toEqual({ key: 'taharah.stage.shivaNekiim.startsTomorrow' });
    expect(hint(events, '2026-10-24T19:00')).toEqual({ key: 'taharah.stage.shivaNekiim.hint', params: { day: 1 } });
  });

  it("names tonight's tzeit on the tevila night and the deferral when the night has passed", () => {
    const events = log(onset(O), hefsek(O + 4), morning(O + 5), morning(O + 11));
    const tzeit = zmanimFor(at(JERUSALEM, '2026-10-31T12:00'), JERUSALEM).tzeitHakochavim;
    expect(hint(events, '2026-10-31T20:00')).toEqual({
      key: 'taharah.stage.tevilaNight.hint',
      params: { time: clock(tzeit) },
    });
    const nextTzeit = zmanimFor(at(JERUSALEM, '2026-11-01T12:00'), JERUSALEM).tzeitHakochavim;
    expect(hint(events, '2026-11-01T12:00')).toEqual({
      key: 'taharah.stage.awaitingTevila.hint',
      params: { time: clock(nextTzeit) },
    });
    // Hefsek on 2026-09-13: the eighth night is Yom Kippur, so on the seventh day's evening the
    // line says the tevila is deferred rather than naming tonight's tzeit.
    const H = absOf(2026, 9, 13);
    const deferred = log(onset(H - 4), hefsek(H), ...Array.from({ length: 7 }, (_, i) => morning(H + 1 + i)));
    expect(hint(deferred, '2026-09-20T20:00')).toEqual({ key: 'taharah.tevilaDeferred' });
    expect(hint(deferred, '2026-09-21T20:00')).toEqual({
      key: 'taharah.stage.tevilaNight.hint',
      params: { time: clock(zmanimFor(at(JERUSALEM, '2026-09-21T12:00'), JERUSALEM).tzeitHakochavim) },
    });
  });

  it('points at the next perisha onah when tahor, on the evening a night onah opens', () => {
    const events = log(
      onset(P),
      onset(L),
      hefsek(L + 4),
      ...Array.from({ length: 7 }, (_, i) => morning(L + 5 + i)),
      tevila(L + 12),
    );
    expect(hint(events, '2026-10-20T12:00')).toEqual({
      key: 'taharah.stage.tahor.hint',
      params: { date: '2026-10-27' },
    });
    expect(nextPerishaOnah(events, RULES, at(JERUSALEM, '2026-10-20T12:00'), JERUSALEM)).toEqual({
      abs: L + 28,
      kind: 'day',
    });
    expect(hint(events, '2026-12-20T12:00')).toEqual({ key: 'taharah.stage.tahor.none' });
    expect(iso(onahStartDate({ abs: L + 29, kind: 'night' }))).toBe('2026-10-27');
  });

  it('names the pause reason as a key to translate and the safek reason as the line itself', () => {
    const paused = hint(log(onset(O), { type: 'pause', day: O + 2, reason: 'pregnancy' }), '2026-10-25T12:00');
    expect(paused).toEqual({ key: 'taharah.stage.paused.hint', translate: { reason: 'taharah.pause.pregnancy' } });
    expect(renderHint(paused, t)).toBe('taharah.stage.paused.hint {"reason":"taharah.pause.pregnancy"}');
    expect(hint(log(onset(O), hefsek(O + 4)), '2026-10-26T12:00')).toEqual({
      key: 'taharah.safek.missedFirstDayBedika',
    });
    expect(renderHint(null, t)).toBe('');
  });

  it('folds every niddah-side stage into niddah for the husband', () => {
    const events = log(onset(O), hefsek(O + 4));
    const state = deriveCycle(events, RULES, JERUSALEM, at(JERUSALEM, '2026-10-26T12:00'));
    expect(state.stage).toBe('safek');
    expect(visibleStage(state, 'husband')).toBe('niddah');
    expect(visibleStage(state, 'woman')).toBe('safek');
    expect(hint(events, '2026-10-26T12:00', 'husband')).toEqual({ key: 'taharah.husband.hint' });
  });

  it('shows the husband an estimated mikveh night from the earliest hefsek day', () => {
    const events = log(onset(O));
    const tzeit = zmanimFor(at(JERUSALEM, '2026-10-31T12:00'), JERUSALEM).tzeitHakochavim;
    expect(hint(events, '2026-10-31T12:00', 'husband')).toEqual({
      key: 'taharah.stage.tevilaEstimated.hint',
      params: { time: clock(tzeit) },
    });
    expect(hint(events, '2026-10-31T20:00', 'husband')).toEqual({
      key: 'taharah.stage.tevilaEstimated.hint',
      params: { time: clock(tzeit) },
    });
    const at31 = deriveCycle(events, RULES, JERUSALEM, at(JERUSALEM, '2026-10-31T20:00'));
    expect(at31.tevilaEstimatedDay).toBe(O + 12);
    expect(visibleStage(at31, 'husband', { abs: O + 12, kind: 'night' }, JERUSALEM)).toBe('tevilaNight');
    expect(visibleStage(at31, 'husband', { abs: O + 12, kind: 'day' }, JERUSALEM)).toBe('awaitingTevila');
    expect(visibleStage(at31, 'husband', { abs: O + 15, kind: 'night' }, JERUSALEM)).toBe('niddah');
    expect(visibleStage(at31, 'woman', { abs: O + 12, kind: 'night' }, JERUSALEM)).toBe('awaitingHefsek');
    expect(hint(events, '2026-11-04T12:00', 'husband')).toEqual({ key: 'taharah.husband.hint' });
  });
});
