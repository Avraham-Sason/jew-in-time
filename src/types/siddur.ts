import { Nusach } from './mitzvah';

export type SukkotOfferingFlag = `sukkotOffering${2 | 3 | 4 | 5 | 6 | 7}`;

export type DayFlag =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'shabbat'
  | 'yomTov'
  | 'yomKippur'
  | 'tishaBav'
  | 'shehecheyanu'
  | 'roshChodesh'
  | 'cholHamoedPesach'
  | 'cholHamoedSukkot'
  | 'inIsrael'
  | 'omer'
  | 'winter'
  | 'talUmatar'
  | 'aseretYemeiTeshuva'
  | 'ledavidSeason'
  | 'chanukah'
  | 'purim'
  | 'publicFast'
  | 'tachanunShacharit'
  | 'tachanunMincha'
  | 'tachanunDisputed'
  | 'motzaei'
  | 'motzaeiShabbat'
  | 'viHiNoam'
  | 'erevYomKippur'
  | 'erevPesach'
  | 'purimOrShushan'
  | 'purimKatan'
  | 'torahReading'
  | 'hallelWhole'
  | 'hallelHalf'
  | 'hallelDisputed'
  | 'musaf'
  | 'ulechaparatPesha'
  | 'lulavShehecheyanu'
  | 'hoshanaRabba'
  | 'dayAfterYomKippur'
  | 'tzomGedaliah'
  | 'asaraBTevet'
  | 'taanitEsther'
  | 'tzomTammuz'
  | SukkotOfferingFlag;

export type Place = {
  inIsrael: boolean;
  jerusalem: boolean;
};

export type DayFeatures = {
  flags: ReadonlySet<DayFlag>;
  omerDay: number | null;
};

export type Condition = {
  all?: DayFlag[];
  any?: DayFlag[];
  none?: DayFlag[];
  omerDay?: number;
};

export type Run = { t: string; s?: 'b' | 'n'; when?: Condition };

export type PassageLabel = { he: string; en: string; when?: Condition };

export type SiddurSegment = {
  he: Run[][];
  en?: string;
  when?: Condition;
  optional?: PassageLabel;
  minyan?: PassageLabel;
};

export type SiddurSection = {
  title: { he: string; en: string };
  optional?: PassageLabel;
  segments: SiddurSegment[];
};

export type SegmentBlock = {
  start: number;
  label?: PassageLabel;
  segments: SiddurSegment[];
};

export type SiddurCredit = {
  title: string;
  license: string;
  url: string;
};

export type SiddurText = {
  nusach: Nusach;
  id: string;
  sections: SiddurSection[];
  credits: SiddurCredit[];
};

export type SiddurTextId =
  | 'tefillin'
  | 'tzitzit'
  | 'birchot_hashachar'
  | 'krias_shma_shacharit'
  | 'candle_lighting'
  | 'havdalah'
  | 'sefirat_haomer'
  | 'shacharit'
  | 'mincha'
  | 'maariv';
