// A Hebrew day runs from nightfall to nightfall and splits into two onot: the night onah first,
// then the day onah. `abs` is the hebcal absolute day number of the Hebrew day, so arithmetic on
// days and onot never passes through a civil date or a zone.
export type OnahKind = 'night' | 'day';

export type Onah = {
  abs: number;
  kind: OnahKind;
};

export type TaharahPresetId = 'ashkenaz' | 'chassidic' | 'chabad' | 'sephardi_ovadia' | 'sephardi_eliyahu';

export type MochDachukRule = 'required' | 'recommended' | 'optional';

export type HaflagaMethod = 'days' | 'onot';

// Every halachic parameter the engine reads. A preset fills them; the user may override any one
// on a rav's instruction. The onset day counts as day 1 everywhere below.
export type TaharahRules = {
  hefsekEarliestDay: 4 | 5;
  mochDachuk: MochDachukRule;
  onahBeinonitDays: readonly number[];
  onahBeinonitSpan: 'onah' | 'fullDay';
  ohrZarua: boolean;
  haflagaMethod: HaflagaMethod;
};

export type TaharahRole = 'woman' | 'husband';

export type TaharahSettings = {
  preset: TaharahPresetId;
  rules: TaharahRules;
  role: TaharahRole;
};

export type BedikaSlot = 'morning' | 'evening';

export type BedikaResult = 'clean' | 'notClean' | 'doubtful';

export type PauseReason = 'pregnancy' | 'postpartum' | 'menopause' | 'other';

export type RulingDecision = 'continue' | 'restart';

type EventBase = { id: string; recordedAt: number };

// Raw input only. Everything the screens show is derived from these by replay, so a corrected
// rule never needs a migration.
export type TaharahEvent =
  | (EventBase & { type: 'onset'; onah: Onah; doubtful?: boolean; instant?: number })
  | (EventBase & { type: 'hefsek'; day: number; result: BedikaResult; moch?: boolean })
  | (EventBase & { type: 'bedika'; day: number; slot: BedikaSlot; result: BedikaResult })
  | (EventBase & { type: 'tevila'; day: number })
  | (EventBase & { type: 'pause'; day: number; reason: PauseReason })
  | (EventBase & { type: 'resume'; day: number })
  | (EventBase & { type: 'ruling'; day: number; decision: RulingDecision });

export type TaharahEventType = TaharahEvent['type'];

export type CycleStage =
  | 'unknown'
  | 'niddah'
  | 'awaitingHefsek'
  | 'shivaNekiim'
  | 'tevilaNight'
  | 'awaitingTevila'
  | 'safek'
  | 'tahor'
  | 'paused';

export type SafekReason = 'doubtfulBedika' | 'missedFirstDayBedika' | 'missedSeventhDayBedika';

export type CleanDay = {
  index: number;
  day: number;
  morning: BedikaResult | null;
  evening: BedikaResult | null;
};

export type CycleState = {
  stage: CycleStage;
  onset: Onah | null;
  onsetDoubtful: boolean;
  hefsekEarliestDay: number | null;
  hefsekDay: number | null;
  cleanDays: CleanDay[];
  tevilaDay: number | null;
  tevilaDeferred: boolean;
  tevilaEstimatedDay: number | null;
  safekReason: SafekReason | null;
  pauseReason: PauseReason | null;
};

export type PerishaReason = 'yomHachodesh' | 'haflaga' | 'onahBeinonit' | 'ohrZarua';

export type PerishaOnah = {
  onah: Onah;
  reasons: PerishaReason[];
  disputed: boolean;
};

export type KavuaHint = { kind: 'date'; dayOfMonth: number } | { kind: 'interval'; days: number };

export type TaharahTaskKind =
  'hefsek' | 'bedikaMorning' | 'bedikaEvening' | 'tevila' | 'perisha' | 'bedikaVeset' | 'expectOnset';

export type TaharahTask = {
  kind: TaharahTaskKind;
  start: Date;
  end: Date;
  day: number;
  done: boolean;
  required: boolean;
  reasons?: PerishaReason[];
  disputed?: boolean;
  cleanDayIndex?: number;
};
