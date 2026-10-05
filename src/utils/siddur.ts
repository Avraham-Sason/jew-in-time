import { HDate, HebrewCalendar, flags as hebcalFlags, months } from '@hebcal/core';
import { Condition, DayFeatures, DayFlag, Place, Run, SiddurSection, SiddurSegment, SiddurText } from '@/types/siddur';

const SHEHECHEYANU_DAYS: ReadonlyArray<readonly [month: number, day: number]> = [
  [months.TISHREI, 1],
  [months.TISHREI, 2],
  [months.TISHREI, 10],
  [months.TISHREI, 15],
  [months.TISHREI, 22],
  [months.NISAN, 15],
  [months.SIVAN, 6],
];
const DIASPORA_SHEHECHEYANU_DAYS: ReadonlyArray<readonly [month: number, day: number]> = [
  [months.TISHREI, 16],
  [months.TISHREI, 23],
  [months.NISAN, 16],
  [months.SIVAN, 7],
];
const NAMED_FASTS: ReadonlyArray<readonly [desc: string, flag: DayFlag]> = [
  ['Tzom Gedaliah', 'tzomGedaliah'],
  ["Asara B'Tevet", 'asaraBTevet'],
  ["Ta'anit Esther", 'taanitEsther'],
  ['Tzom Tammuz', 'tzomTammuz'],
];
const PUBLIC_FASTS = [...NAMED_FASTS.map(([desc]) => desc), "Tish'a B'Av"];
const WEEKDAYS: readonly DayFlag[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DISPUTED_HALLEL_DAYS = ["Yom HaAtzma'ut", 'Yom Yerushalayim'];
const SUKKOT_OFFERING_DAYS = [2, 3, 4, 5, 6, 7] as const;

function isOneOf(hd: HDate, days: ReadonlyArray<readonly [number, number]>): boolean {
  return days.some(([month, day]) => hd.getMonth() === month && hd.getDate() === day);
}

function omerDayOf(hd: HDate): number | null {
  const day = hd.abs() - new HDate(15, months.NISAN, hd.getFullYear()).abs();
  return day >= 1 && day <= 49 ? day : null;
}

function isGregorianLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function rainRequestStart(year: number, inIsrael: boolean): HDate {
  if (inIsrael) return new HDate(7, months.CHESHVAN, year);
  const civilYear = new HDate(1, months.TISHREI, year).greg().getFullYear();
  return new HDate(new Date(civilYear, 11, isGregorianLeapYear(civilYear + 1) ? 6 : 5));
}

function within(hd: HDate, from: HDate, to: HDate): boolean {
  return hd.abs() >= from.abs() && hd.abs() <= to.abs();
}

function observances(hd: HDate, inIsrael: boolean) {
  const events = HebrewCalendar.calendar({ start: hd, end: hd, il: inIsrael });
  const descs = events.map((event) => event.getDesc());
  const yomKippur = descs.includes('Yom Kippur');
  const yomTov = events.some((event) => {
    const mask = event.getFlags();
    return Boolean(mask & hebcalFlags.CHAG) && !(mask & hebcalFlags.CHOL_HAMOED) && event.getDesc() !== 'Yom Kippur';
  });
  const cholHamoed = events.filter((event) => event.getFlags() & hebcalFlags.CHOL_HAMOED).map((event) => event.getDesc());
  return { descs, yomKippur, yomTov, cholHamoed, shabbat: hd.getDay() === 6 };
}

export function liturgicalDay(windowDate: Date, evening: boolean): HDate {
  const base = new HDate(new Date(windowDate.getFullYear(), windowDate.getMonth(), windowDate.getDate()));
  return evening ? base.next() : base;
}

export function dayFeatures(hd: HDate, place: Place): DayFeatures {
  const today = observances(hd, place.inIsrael);
  const year = hd.getFullYear();
  const month = hd.getMonth();
  const date = hd.getDate();
  const flags = new Set<DayFlag>();
  const add = (flag: DayFlag, when: boolean) => when && flags.add(flag);
  const flagged = (...names: DayFlag[]) => names.some((name) => flags.has(name));

  const weekday = WEEKDAYS[hd.getDay()];
  if (weekday) flags.add(weekday);
  add('shabbat', today.shabbat);
  add('yomTov', today.yomTov);
  add('yomKippur', today.yomKippur);
  add('tishaBav', today.descs.some((desc) => desc.startsWith("Tish'a B'Av")));
  add('shehecheyanu', isOneOf(hd, SHEHECHEYANU_DAYS) || (!place.inIsrael && isOneOf(hd, DIASPORA_SHEHECHEYANU_DAYS)));
  add('roshChodesh', today.descs.some((desc) => desc.startsWith('Rosh Chodesh')));
  add('cholHamoedPesach', today.cholHamoed.some((desc) => desc.startsWith('Pesach')));
  add('cholHamoedSukkot', today.cholHamoed.some((desc) => desc.startsWith('Sukkot')));
  add('inIsrael', place.inIsrael);
  add('omer', omerDayOf(hd) !== null);
  add('winter', within(hd, new HDate(22, months.TISHREI, year), new HDate(14, months.NISAN, year)));
  add('talUmatar', within(hd, rainRequestStart(year, place.inIsrael), new HDate(14, months.NISAN, year)));
  add('aseretYemeiTeshuva', month === months.TISHREI && date <= 10);
  add('erevYomKippur', month === months.TISHREI && date === 9);
  add('ledavidSeason', month === months.ELUL || (month === months.AV && date === 30) || (month === months.TISHREI && date <= 21));
  add('chanukah', within(hd, new HDate(25, months.KISLEV, year), new HDate(25, months.KISLEV, year).add(7)));
  add('purim', today.descs.includes(place.jerusalem ? 'Shushan Purim' : 'Purim'));
  add('purimOrShushan', today.descs.includes('Purim') || today.descs.includes('Shushan Purim'));
  add('purimKatan', today.descs.includes('Purim Katan') || today.descs.includes('Shushan Purim Katan'));
  add('publicFast', today.descs.some((desc) => PUBLIC_FASTS.some((fast) => desc.startsWith(fast))));
  for (const [desc, flag] of NAMED_FASTS) add(flag, today.descs.includes(desc));
  add('dayAfterYomKippur', month === months.TISHREI && date === 11);
  add('hoshanaRabba', month === months.TISHREI && date === 21);
  add('erevPesach', month === months.NISAN && date === 14);
  add('musaf', flagged('roshChodesh', 'cholHamoedPesach', 'cholHamoedSukkot'));
  add('torahReading', flagged('monday', 'thursday', 'musaf', 'chanukah', 'purim', 'publicFast'));
  add('ulechaparatPesha', HDate.isLeapYear(year) && (month >= months.CHESHVAN || (month === months.TISHREI && date === 30)));

  const hallel = HebrewCalendar.hallel(hd, place.inIsrael);
  const disputedHallel = today.descs.some((desc) => DISPUTED_HALLEL_DAYS.includes(desc));
  add('hallelWhole', hallel === 2 && !disputedHallel);
  add('hallelHalf', hallel === 1);
  add('hallelDisputed', hallel > 0 && disputedHallel);

  const sukkotDay = month === months.TISHREI ? date - 14 : 0;
  add('lulavShehecheyanu', place.inIsrael && sukkotDay === 2 && hd.prev().getDay() === 6);
  for (const day of SUKKOT_OFFERING_DAYS) {
    add(`sukkotOffering${day}`, sukkotDay === day || (!place.inIsrael && sukkotDay === day + 1));
  }

  const tachanun = HebrewCalendar.tachanun(hd, place.inIsrael);
  add('tachanunShacharit', tachanun.shacharit);
  add('tachanunMincha', tachanun.mincha);
  add('tachanunDisputed', !tachanun.allCongs);

  const yesterday = observances(hd.prev(), place.inIsrael);
  add('motzaei', yesterday.shabbat || yesterday.yomTov || yesterday.yomKippur);
  if (yesterday.shabbat) {
    flags.add('motzaeiShabbat');
    const weekAhead = [0, 1, 2, 3, 4, 5].map((offset) => observances(hd.add(offset), place.inIsrael));
    add('viHiNoam', !flags.has('tishaBav') && !weekAhead.some((day) => day.yomTov || day.yomKippur));
  }

  return { flags, omerDay: omerDayOf(hd) };
}

export function matchesCondition(condition: Condition | undefined, features: DayFeatures): boolean {
  if (!condition) return true;
  if (condition.all?.some((flag) => !features.flags.has(flag))) return false;
  if (condition.any && !condition.any.some((flag) => features.flags.has(flag))) return false;
  if (condition.none?.some((flag) => features.flags.has(flag))) return false;
  if (condition.omerDay !== undefined && condition.omerDay !== features.omerDay) return false;
  return true;
}

function trimEdges(runs: Run[]): Run[] {
  const first = runs.findIndex((run) => run.t.trim());
  if (first < 0) return [];
  const last = runs.findLastIndex((run) => run.t.trim());
  return runs.slice(first, last + 1).map((run, index, kept) => {
    let t = index === 0 ? run.t.trimStart() : run.t;
    if (index === kept.length - 1) t = t.trimEnd();
    return t === run.t ? run : { ...run, t };
  });
}

function collapseJoins(runs: Run[]): Run[] {
  const kept: Run[] = [];
  for (const run of runs) {
    const previous = kept[kept.length - 1];
    const t = previous && /\s$/.test(previous.t) ? run.t.trimStart() : run.t;
    if (t) kept.push(t === run.t ? run : { ...run, t });
  }
  return kept;
}

function resolveSegment(segment: SiddurSegment, features: DayFeatures): SiddurSegment | null {
  if (!matchesCondition(segment.when, features)) return null;
  const he = segment.he
    .map((runs) => trimEdges(collapseJoins(runs.filter((run) => matchesCondition(run.when, features)))))
    .filter((runs) => runs.length > 0);
  return he.length ? { ...segment, he } : null;
}

export function resolveSiddurText(text: SiddurText, features: DayFeatures): SiddurSection[] {
  return text.sections
    .map((section) => ({
      ...section,
      segments: section.segments
        .map((segment) => resolveSegment(segment, features))
        .filter((segment): segment is SiddurSegment => segment !== null),
    }))
    .filter((section) => section.segments.length > 0);
}
