import { HDate } from '@hebcal/core';
import { KavuaHint, Onah, PerishaOnah, PerishaReason, TaharahEvent, TaharahRules } from '@/types/taharah';
import { addOnot, hebrewDay, onahFromIndex, onahIndex, onsetCandidates } from './onot';
import { CycleRecord, replayCycles, sortedEvents } from './cycle';

type Onset = Extract<TaharahEvent, { type: 'onset' }>;

// Onsets of the current run: everything after the last pause, since a pregnancy or nursing break
// ends every expectation the earlier sightings created. A resume clears nothing, exactly as in
// deriveCycle, where an onset recorded after the pause already ended it.
export function activeOnsets(events: readonly TaharahEvent[]): Onset[] {
  const onsets: Onset[] = [];
  for (const event of sortedEvents(events)) {
    if (event.type === 'pause') onsets.length = 0;
    else if (event.type === 'onset') onsets.push(event);
  }
  return onsets;
}

// The hefsek the replay settled for an onset, for the Chabad haflaga; null when none counted. A
// hefsek the cycle rejected (too early, after a tevila, during a running count) is no anchor.
function settledHefsek(records: readonly CycleRecord[], onset: Onset): number | null {
  return records.find((record) => record.onsetId === onset.id)?.hefsekDay ?? null;
}

// The same Hebrew date next month, in the sighting's onah. A sighting on the 30th of a full
// month followed by a 29-day month is disputed; the day after the 29th stands in, flagged.
export function yomHachodeshOf(onah: Onah): { onah: Onah; disputed: boolean } {
  const hd = hebrewDay(onah.abs);
  const nextMonthStart = new HDate(1, hd.getMonth(), hd.getFullYear()).add(1, 'month');
  const daysInNext = nextMonthStart.daysInMonth();
  const date = hd.getDate();
  const target = date <= daysInNext ? nextMonthStart.abs() + date - 1 : nextMonthStart.abs() + daysInNext;
  return { onah: { abs: target, kind: onah.kind }, disputed: date > daysInNext };
}

// The interval between the last two sightings, counted inclusively, projected from the last one.
export function haflagaDays(previous: Onah, last: Onah): number {
  return last.abs - previous.abs + 1;
}

// The Chabad haflaga counts onot from the night that opens the first clean day after the previous
// hefsek through the onset onah, then lays the same count from the night after the new hefsek.
// Without the new hefsek it is not yet known (null); without the previous one the day count
// stands in.
function haflagaInOnot(
  records: readonly CycleRecord[],
  previous: Onset,
  last: Onset,
  candidate: Onah,
  prior: Onah,
): Onah | null {
  const previousHefsek = settledHefsek(records, previous);
  if (previousHefsek === null) {
    return { abs: candidate.abs + haflagaDays(prior, candidate) - 1, kind: candidate.kind };
  }
  const lastHefsek = settledHefsek(records, last);
  if (lastHefsek === null) return null;
  const count = onahIndex(candidate) - onahIndex({ abs: previousHefsek + 1, kind: 'night' }) + 1;
  return onahFromIndex(onahIndex({ abs: lastHefsek + 1, kind: 'night' }) + count - 1);
}

type Collector = Map<number, PerishaOnah>;

function add(collector: Collector, onah: Onah, reason: PerishaReason, disputed = false): void {
  const key = onahIndex(onah);
  const existing = collector.get(key);
  if (existing) {
    if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
    existing.disputed = existing.disputed || disputed;
  } else collector.set(key, { onah, reasons: [reason], disputed });
}

// The onot a woman without a veset kavua separates in after her last sighting: yom hachodesh,
// the haflaga and the onah beinonit, plus ohr zarua before each where the preset keeps it.
// Only the latest interval is kept; a confirmed kavua is out of scope and only hinted.
export function perishaOnot(events: readonly TaharahEvent[], rules: TaharahRules): PerishaOnah[] {
  const onsets = activeOnsets(events);
  const last = onsets[onsets.length - 1];
  if (!last) return [];
  const previous = onsets[onsets.length - 2];
  const collector: Collector = new Map();
  const records = rules.haflagaMethod === 'onot' ? replayCycles(events, rules) : [];

  for (const candidate of onsetCandidates(last.onah, Boolean(last.doubtful))) {
    const chodesh = yomHachodeshOf(candidate);
    add(collector, chodesh.onah, 'yomHachodesh', chodesh.disputed);

    // A doubtful previous sighting gives two possible intervals, and the shorter one must be kept.
    for (const prior of previous ? onsetCandidates(previous.onah, Boolean(previous.doubtful)) : []) {
      const haflaga =
        rules.haflagaMethod === 'onot'
          ? haflagaInOnot(records, previous!, last, candidate, prior)
          : { abs: candidate.abs + haflagaDays(prior, candidate) - 1, kind: candidate.kind };
      if (haflaga) add(collector, haflaga, 'haflaga');
    }

    for (const days of rules.onahBeinonitDays) {
      const abs = candidate.abs + days - 1;
      if (rules.onahBeinonitSpan === 'fullDay') {
        add(collector, { abs, kind: 'night' }, 'onahBeinonit');
        add(collector, { abs, kind: 'day' }, 'onahBeinonit');
      } else add(collector, { abs, kind: candidate.kind }, 'onahBeinonit');
    }
  }

  if (rules.ohrZarua) {
    const thirtyFirst = onsetCandidates(last.onah, Boolean(last.doubtful)).map((c) => c.abs + 30);
    for (const entry of [...collector.values()]) {
      const onlyThirtyFirst =
        entry.reasons.length === 1 && entry.reasons[0] === 'onahBeinonit' && thirtyFirst.includes(entry.onah.abs);
      if (!onlyThirtyFirst) add(collector, addOnot(entry.onah, -1), 'ohrZarua', entry.disputed);
    }
  }

  return [...collector.values()].sort((a, b) => onahIndex(a.onah) - onahIndex(b.onah));
}

const KAVUA_COUNT = 3;

// A pattern a rav may declare a veset kavua: the same Hebrew date and onah three times running,
// or three equal intervals in the same onah. The app only points it out.
export function kavuaHints(events: readonly TaharahEvent[]): KavuaHint[] {
  const active = activeOnsets(events);
  // A doubtful sighting has no single date or interval, so a run that includes one is no pattern.
  const onsets = active.slice(-(KAVUA_COUNT + 1)).some((o) => o.doubtful) ? [] : active.map((o) => o.onah);
  const hints: KavuaHint[] = [];
  if (onsets.length >= KAVUA_COUNT) {
    const recent = onsets.slice(-KAVUA_COUNT);
    const dates = recent.map((o) => hebrewDay(o.abs).getDate());
    if (dates.every((d) => d === dates[0]) && recent.every((o) => o.kind === recent[0].kind)) {
      hints.push({ kind: 'date', dayOfMonth: dates[0] });
    }
  }
  if (onsets.length >= KAVUA_COUNT + 1) {
    const recent = onsets.slice(-(KAVUA_COUNT + 1));
    const intervals = recent.slice(1).map((o, i) => haflagaDays(recent[i], o));
    if (intervals.every((n) => n === intervals[0]) && recent.every((o) => o.kind === recent[0].kind)) {
      hints.push({ kind: 'interval', days: intervals[0] });
    }
  }
  return hints;
}
