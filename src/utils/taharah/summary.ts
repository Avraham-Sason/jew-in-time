import { CycleStage, CycleState, Onah, TaharahEvent, TaharahRole, TaharahRules } from '@/types/taharah';
import { Location } from '@/types/zmanim';
import { cleanDayIndex, husbandTevilaNight } from './cycle';
import { currentOnah, hebrewDay, onahIndex, zmanimOfDay } from './onot';
import { perishaOnot } from './vestot';

// A line the screens render with `t(key, params)`; `translate` names params that are themselves
// i18n keys. Pure, so the home card and the dashboard cannot drift apart.
export type Hint = {
  key: string;
  params?: Record<string, string | number>;
  translate?: Record<string, string>;
};

export type HintFormat = {
  date: (civil: Date) => string;
  clock: (instant: Date) => string;
};

type Translate = (key: string, params?: Record<string, unknown>) => string;

export function renderHint(hint: Hint | null, t: Translate): string {
  if (!hint) return '';
  const translated = Object.fromEntries(Object.entries(hint.translate ?? {}).map(([name, key]) => [name, t(key)]));
  return t(hint.key, { ...hint.params, ...translated });
}

// The civil day a perisha onah is shown on: a night onah on the evening it opens.
export function onahStartDate(onah: Onah): Date {
  return hebrewDay(onah.kind === 'night' ? onah.abs - 1 : onah.abs).greg();
}

export function nextPerishaOnah(events: readonly TaharahEvent[], rules: TaharahRules, now: Date, location: Location): Onah | null {
  const current = onahIndex(currentOnah(now, location));
  return perishaOnot(events, rules).find((entry) => onahIndex(entry.onah) >= current)?.onah ?? null;
}

const HUSBAND_STAGE: Record<CycleStage, CycleStage> = {
  unknown: 'unknown',
  niddah: 'niddah',
  awaitingHefsek: 'niddah',
  shivaNekiim: 'niddah',
  safek: 'niddah',
  tevilaNight: 'tevilaNight',
  awaitingTevila: 'awaitingTevila',
  tahor: 'tahor',
  paused: 'paused',
};

// The husband sees no count and no bedika: every stage inside the niddah days reads as niddah,
// except the estimated mikveh night, which he gets from the earliest hefsek day.
export function visibleStage(state: CycleState, role: TaharahRole, today?: Onah, location?: Location): CycleStage {
  if (role !== 'husband') return state.stage;
  if (today && location && (state.stage === 'niddah' || state.stage === 'awaitingHefsek')) {
    const night = husbandTevilaNight(state, today, location);
    if (night !== null) return today.kind === 'night' && today.abs === night ? 'tevilaNight' : 'awaitingTevila';
  }
  return HUSBAND_STAGE[state.stage];
}

export function stageHint(
  state: CycleState,
  events: readonly TaharahEvent[],
  rules: TaharahRules,
  role: TaharahRole,
  location: Location,
  now: Date,
  format: HintFormat,
): Hint | null {
  const today = currentOnah(now, location);
  const stage = visibleStage(state, role, today, location);
  const key = `taharah.stage.${stage}.hint`;
  switch (stage) {
    case 'unknown':
      return { key: role === 'husband' ? 'taharah.husband.hint' : key };
    case 'niddah':
      if (role === 'husband') return { key: 'taharah.husband.hint' };
      return state.hefsekEarliestDay === null ? null : { key, params: { date: format.date(hebrewDay(state.hefsekEarliestDay).greg()) } };
    case 'awaitingHefsek': {
      const shkia = zmanimOfDay(today.abs, location)?.shkia;
      return shkia ? { key, params: { time: format.clock(shkia) } } : null;
    }
    case 'shivaNekiim': {
      const day = cleanDayIndex(state, today.abs);
      return day === null ? { key: 'taharah.stage.shivaNekiim.startsTomorrow' } : { key, params: { day } };
    }
    case 'tevilaNight':
    case 'awaitingTevila': {
      if (role === 'husband' && state.tevilaDay === null) {
        const night = husbandTevilaNight(state, today, location);
        const tzeit = night === null ? null : zmanimOfDay(night - 1, location)?.tzeitHakochavim;
        return tzeit ? { key: 'taharah.stage.tevilaEstimated.hint', params: { time: format.clock(tzeit) } } : null;
      }
      if (state.tevilaDay === null) return null;
      const tonight = today.kind === 'night' ? today.abs : today.abs + 1;
      if (state.tevilaDay !== tonight) return { key: 'taharah.tevilaDeferred' };
      const tzeit = zmanimOfDay(state.tevilaDay - 1, location)?.tzeitHakochavim;
      return tzeit ? { key, params: { time: format.clock(tzeit) } } : null;
    }
    case 'tahor': {
      const next = nextPerishaOnah(events, rules, now, location);
      return next ? { key, params: { date: format.date(onahStartDate(next)) } } : { key: 'taharah.stage.tahor.none' };
    }
    case 'paused':
      return state.pauseReason ? { key, translate: { reason: `taharah.pause.${state.pauseReason}` } } : null;
    case 'safek':
      return state.safekReason ? { key: `taharah.safek.${state.safekReason}` } : null;
  }
}
