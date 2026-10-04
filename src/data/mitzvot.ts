import { HDate } from '@hebcal/core';
import { DateTime } from 'luxon';
import { ComputeContext, Mitzvah, MitzvahWindow, Nusach } from '@/types/mitzvah';
import { Location, Zmanim } from '@/types/zmanim';
import { HebcalService } from '@/services/HebcalService';
import { ZmanimService } from '@/services/ZmanimService';

const ALL_NUSCHAOT: Nusach[] = ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'];
const FRIDAY = 5;
const SATURDAY = 6;

function win(start: Date, end: Date): MitzvahWindow {
  if (end.getTime() <= start.getTime()) return null;
  return { start, end };
}

function sofZmanShma(ctx: ComputeContext): Date {
  return ctx.settings.halachicOpinions.ksSofZman === 'MA'
    ? ctx.zmanim.sofZmanShmaMA
    : ctx.zmanim.sofZmanShmaGra;
}

// The LOCATION's calendar day that ctx.zmanim were computed for, at its midday. Calendar questions
// go through it, so neither the device's zone nor the clock time ctx.date carries can move the
// answer: device-local getters on ctx.date picked a different day whenever the zones disagreed,
// and an evening ctx.date already sits in the next Hebrew day.
function dayOf(zmanim: Zmanim, location: Location): DateTime {
  return DateTime.fromJSDate(zmanim.chatzot).setZone(location.tz);
}

// Jerusalem's near-universal minhag is 40 minutes, and it is the app's default city — 18 minutes
// there is simply the wrong time.
const JERUSALEM_CANDLE_MINUTES = 40;

export function candleLightingMinutes(location: Location): number {
  if (location.candleLightingMinutes) return location.candleLightingMinutes;
  if (location.inIsrael) return location.nameEn === 'Jerusalem' ? JERUSALEM_CANDLE_MINUTES : 18;
  return 20;
}

// The Omer is counted at nightfall, and that night belongs to the NEXT Hebrew day. So the count
// due on the night that opens at tzeit of Gregorian day D is the count of Hebrew day D+1: night 1
// falls on the evening of 15 Nisan and night 49 on the evening of 4 Sivan. Anchoring to 16 Nisan
// shifted every night one day late — no window at all on the first night, and a window (with the
// bracha in the body) on the night of Shavuot, when there is nothing left to count.
function omerDayFor(date: Date, timeZone?: string): number | null {
  const zoned = timeZone ? DateTime.fromJSDate(date).setZone(timeZone) : DateTime.fromJSDate(date);
  const zone = zoned.zoneName ?? undefined;
  const calendarDate = new Date(zoned.year, zoned.month - 1, zoned.day);
  const hd = new HDate(calendarDate);
  const year = hd.getFullYear();
  const startGreg = new HDate(15, 'Nisan', year).greg();
  const endGreg = new HDate(4, 'Sivan', year).greg();
  const start = DateTime.fromObject(
    { year: startGreg.getFullYear(), month: startGreg.getMonth() + 1, day: startGreg.getDate() },
    { zone },
  ).startOf('day');
  const end = DateTime.fromObject(
    { year: endGreg.getFullYear(), month: endGreg.getMonth() + 1, day: endGreg.getDate() },
    { zone },
  ).startOf('day');
  const current = zoned.startOf('day');
  if (current < start || current > end) return null;
  const days = Math.floor(current.diff(start, 'days').days) + 1;
  return days >= 1 && days <= 49 ? days : null;
}

// Counting is valid all night, at the latest until alot hashachar. Falls back to chatzot halayla if
// the next day's zmanim cannot be computed.
function endOfOmerNight({ location, zmanim }: ComputeContext): Date {
  const nextDay = dayOf(zmanim, location).plus({ days: 1 }).toJSDate();
  return ZmanimService.getZmanim(nextDay, location)?.alotHaShachar ?? zmanim.chatzotLayla;
}

export const MITZVOT: Mitzvah[] = [
  {
    id: 'tefillin',
    name: { he: 'הנחת תפילין', en: 'Tefillin' },
    icon: 'tefillin',
    timeType: 'range-within-day',
    category: 'daily-morning',
    skipOn: ['shabbat', 'yomtov'],
    nuschaotSupported: ALL_NUSCHAOT,
    defaultReminders: [
      {
        anchor: 'start',
        offsetMin: 0,
        label: 'הגיע זמן הנחת תפילין',
        bodyVariants: ['הגיע זמן הנחת תפילין', 'תפילין מחכות לך עכשיו', 'עוד יום קדוש מתחיל עם תפילין'],
      },
      { anchor: 'start', offsetMin: 180, label: 'תזכורת — עדיין לא הנחת תפילין', skipIfDone: true },
      { anchor: 'end', offsetMin: -45, label: 'נותרו 45 דק\' להנחת תפילין', skipIfDone: true },
    ],
    computeWindow: ({ zmanim }) => win(zmanim.misheyakir, zmanim.shkia),
  },
  {
    id: 'tzitzit',
    name: { he: 'ציצית', en: 'Tzitzit' },
    icon: 'tzitzit',
    timeType: 'all-day',
    category: 'daily-allday',
    skipOn: [],
    nuschaotSupported: ALL_NUSCHAOT,
    defaultReminders: [
      {
        anchor: 'start',
        offsetMin: 0,
        label: 'זמן לבישת ציצית',
        bodyVariants: ['זמן לבישת ציצית', 'ציצית לכל היום מתחילה עכשיו', 'עוד רגע של מצווה עם ציצית'],
      },
    ],
    computeWindow: ({ zmanim }) => win(zmanim.misheyakir, zmanim.shkia),
  },
  {
    id: 'krias_shma_shacharit',
    name: { he: 'קריאת שמע שחרית', en: 'Krias Shema (morning)' },
    icon: 'shema',
    timeType: 'range-within-day',
    category: 'daily-morning',
    skipOn: [],
    nuschaotSupported: ALL_NUSCHAOT,
    defaultReminders: [
      {
        anchor: 'start',
        offsetMin: 0,
        label: 'זמן ק"ש שחרית',
        bodyVariants: ['זמן קריאת שמע של שחרית', 'שמע ישראל של הבוקר מחכה לך', 'אל תפספס את זמן קריאת שמע'],
      },
      { anchor: 'end', offsetMin: -30, label: 'נותרו 30 דק\' לק"ש', skipIfDone: true },
    ],
    computeWindow: (ctx) => win(ctx.zmanim.netzHaChama, sofZmanShma(ctx)),
  },
  {
    id: 'shacharit',
    name: { he: 'תפילת שחרית', en: 'Shacharit' },
    icon: 'shacharit',
    timeType: 'range-within-day',
    category: 'daily-morning',
    skipOn: [],
    nuschaotSupported: ALL_NUSCHAOT,
    defaultReminders: [
      {
        anchor: 'start',
        offsetMin: 0,
        label: 'זמן תפילת שחרית',
        bodyVariants: ['צדיק, זמן שחרית הגיע', 'תפילת שחרית פותחת את היום', 'זמן שחרית — תפילה לפני היום שלך'],
      },
      { anchor: 'end', offsetMin: -45, label: 'נותרו 45 דק\' לשחרית', skipIfDone: true },
    ],
    computeWindow: ({ zmanim }) => win(zmanim.netzHaChama, zmanim.sofZmanTfilaGra),
  },
  {
    id: 'mincha',
    name: { he: 'תפילת מנחה', en: 'Mincha' },
    icon: 'mincha',
    timeType: 'range-within-day',
    category: 'daily-afternoon',
    skipOn: [],
    nuschaotSupported: ALL_NUSCHAOT,
    defaultReminders: [
      {
        anchor: 'start',
        offsetMin: 0,
        label: 'זמן תפילת מנחה',
        bodyVariants: ['צדיק, זמן מנחה הגיע', 'עצירה קטנה לתפילת מנחה', 'זמן מנחה — רגע של תפילה באמצע היום'],
      },
      { anchor: 'end', offsetMin: -60, label: 'נותרה שעה למנחה', skipIfDone: true },
    ],
    computeWindow: ({ zmanim }) => win(zmanim.minchaGedola, zmanim.shkia),
  },
  {
    id: 'maariv',
    name: { he: 'תפילת ערבית', en: 'Maariv' },
    icon: 'maariv',
    timeType: 'range-within-day',
    category: 'daily-evening',
    skipOn: [],
    nuschaotSupported: ALL_NUSCHAOT,
    defaultReminders: [
      {
        anchor: 'start',
        offsetMin: 0,
        label: 'זמן תפילת ערבית',
        bodyVariants: ['צדיק, זמן ערבית הגיע', 'תפילת ערבית 15 דקות ויש לך מצווה', 'זמן ערבית — מעמדך מול הקב״ה'],
      },
      { anchor: 'start', offsetMin: 120, label: 'תזכורת — ערבית', skipIfDone: true },
    ],
    computeWindow: ({ zmanim }) => win(zmanim.tzeitHakochavim, zmanim.chatzotLayla),
  },
  {
    id: 'birchot_hashachar',
    name: { he: 'ברכות השחר', en: 'Birchot HaShachar' },
    icon: 'brachot',
    timeType: 'range-within-day',
    category: 'daily-morning',
    skipOn: [],
    nuschaotSupported: ALL_NUSCHAOT,
    defaultReminders: [
      {
        anchor: 'start',
        offsetMin: 0,
        label: 'זמן ברכות השחר',
        bodyVariants: ['זמן ברכות השחר', 'פתח את הבוקר בברכות השחר', 'ברכות השחר מחכות לך'],
      },
    ],
    computeWindow: (ctx) => win(ctx.zmanim.alotHaShachar, sofZmanShma(ctx)),
  },
  {
    id: 'candle_lighting',
    name: { he: 'הדלקת נרות שבת', en: 'Candle Lighting' },
    icon: 'candles',
    timeType: 'fixed-moment',
    category: 'weekly',
    skipOn: [],
    nuschaotSupported: ALL_NUSCHAOT,
    defaultReminders: [
      {
        anchor: 'start',
        offsetMin: -20,
        label: 'עוד 20 דק\' להדלקת נרות',
        bodyVariants: ['עוד 20 דק\' להדלקת נרות', 'שבת מתקרבת — זמן להכין נרות', 'עוד מעט מדליקים נרות שבת'],
      },
      { anchor: 'start', offsetMin: 0, label: 'זמן הדלקת נרות' },
    ],
    computeWindow: ({ location, zmanim }) => {
      // Candles are lit before Shabbat AND before Yom Tov. Weekday-only meant no reminder at all
      // for any chag that does not happen to start on a Friday — Sukkot and Pesach 5786 both begin
      // midweek. When Yom Tov starts on motzaei Shabbat, lighting is from an existing flame after
      // tzeit rather than at this time, so that case is excluded.
      const day = dayOf(zmanim, location);
      const erevYomTov =
        HebcalService.isYomTov(day.plus({ days: 1 }).toJSDate(), location) &&
        !HebcalService.isYomTov(day.toJSDate(), location);
      if (day.weekday !== FRIDAY && !erevYomTov) return null;
      if (day.weekday === SATURDAY) return null;
      const t = new Date(zmanim.shkia.getTime() - candleLightingMinutes(location) * 60_000);
      return win(t, zmanim.shkia);
    },
  },
  {
    id: 'havdalah',
    name: { he: 'הבדלה', en: 'Havdalah' },
    icon: 'havdalah',
    timeType: 'fixed-moment',
    category: 'weekly',
    skipOn: [],
    nuschaotSupported: ALL_NUSCHAOT,
    defaultReminders: [
      {
        anchor: 'start',
        offsetMin: 0,
        label: 'זמן הבדלה',
        bodyVariants: ['זמן הבדלה', 'מבדילים בין קודש לחול', 'צאת שבת — זמן הבדלה'],
      },
    ],
    computeWindow: ({ location, zmanim }) => {
      if (dayOf(zmanim, location).weekday !== SATURDAY) return null;
      const end = new Date(zmanim.tzeitHakochavim.getTime() + 90 * 60_000);
      return win(zmanim.tzeitHakochavim, end);
    },
  },
  {
    id: 'sefirat_haomer',
    name: { he: 'ספירת העומר', en: 'Sefirat HaOmer' },
    icon: 'omer',
    timeType: 'date-range',
    category: 'seasonal',
    skipOn: [],
    nuschaotSupported: ALL_NUSCHAOT,
    contentBlocks: [
      {
        type: 'blessing',
        he: 'ברוך אתה ה׳ אלוקינו מלך העולם אשר קדשנו במצוותיו וצוונו על ספירת העומר',
      },
    ],
    defaultReminders: [
      {
        anchor: 'start',
        offsetMin: 0,
        label: 'זמן ספירת העומר',
        includeContentInBody: true,
        bodyVariants: ['זמן ספירת העומר', 'אל תשכח לספור את העומר', 'ספירת העומר של הערב מחכה לך'],
      },
      { anchor: 'start', offsetMin: 60, label: 'תזכורת — ספירת העומר', skipIfDone: true },
    ],
    computeWindow: (ctx) => {
      if (omerDayFor(ctx.zmanim.chatzot, ctx.location.tz) === null) return null;
      return win(ctx.zmanim.tzeitHakochavim, endOfOmerNight(ctx));
    },
  },
];

export function findMitzvah(id: string): Mitzvah | undefined {
  return MITZVOT.find((m) => m.id === id);
}

export { omerDayFor };
