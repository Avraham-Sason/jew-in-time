import { HDate } from '@hebcal/core';
import { DateTime } from 'luxon';
import { ComputeContext, Mitzvah, MitzvahWindow, Nusach } from '@/types/mitzvah';
import { ZmanimService } from '@/services/ZmanimService';

const ALL_NUSCHAOT: Nusach[] = ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'];

function win(start: Date, end: Date): MitzvahWindow {
  if (end.getTime() <= start.getTime()) return null;
  return { start, end };
}

function sofZmanShma(ctx: ComputeContext): Date {
  return ctx.settings.halachicOpinions.ksSofZman === 'MA'
    ? ctx.zmanim.sofZmanShmaMA
    : ctx.zmanim.sofZmanShmaGra;
}

function isFriday(d: Date): boolean {
  return d.getDay() === 5;
}

function isSaturdayEvening(d: Date, shkia: Date): boolean {
  return d.getDay() === 6 && d.getTime() >= shkia.getTime();
}

function omerDayFor(date: Date, timeZone?: string): number | null {
  const zoned = timeZone ? DateTime.fromJSDate(date).setZone(timeZone) : DateTime.fromJSDate(date);
  const zone = zoned.zoneName ?? undefined;
  const calendarDate = new Date(zoned.year, zoned.month - 1, zoned.day);
  const hd = new HDate(calendarDate);
  const year = hd.getFullYear();
  const startGreg = new HDate(16, 'Nisan', year).greg();
  const endGreg = new HDate(5, 'Sivan', year).greg();
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
      { anchor: 'start', offsetMin: 0, label: 'הגיע זמן הנחת תפילין' },
      { anchor: 'start', offsetMin: 180, label: 'תזכורת — עדיין לא הנחת תפילין', skipIfDone: true },
      { anchor: 'end', offsetMin: -45, label: 'נותרה שעה להנחת תפילין', skipIfDone: true },
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
    defaultReminders: [{ anchor: 'start', offsetMin: 0, label: 'זמן לבישת ציצית' }],
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
      { anchor: 'start', offsetMin: 0, label: 'זמן ק"ש שחרית' },
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
      { anchor: 'start', offsetMin: 0, label: 'זמן תפילת שחרית' },
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
      { anchor: 'start', offsetMin: 0, label: 'זמן תפילת מנחה' },
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
      { anchor: 'start', offsetMin: 0, label: 'זמן תפילת ערבית' },
      { anchor: 'start', offsetMin: 120, label: 'תזכורת — ערבית', skipIfDone: true },
    ],
    computeWindow: ({ zmanim, date }) => {
      const end = new Date(zmanim.chatzot);
      end.setDate(end.getDate() + 1);
      return win(zmanim.tzeitHakochavim, end);
    },
  },
  {
    id: 'birchot_hashachar',
    name: { he: 'ברכות השחר', en: 'Birchot HaShachar' },
    icon: 'brachot',
    timeType: 'range-within-day',
    category: 'daily-morning',
    skipOn: [],
    nuschaotSupported: ALL_NUSCHAOT,
    defaultReminders: [{ anchor: 'start', offsetMin: 0, label: 'זמן ברכות השחר' }],
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
      { anchor: 'start', offsetMin: -20, label: 'עוד 20 דק\' להדלקת נרות' },
      { anchor: 'start', offsetMin: 0, label: 'זמן הדלקת נרות' },
    ],
    computeWindow: ({ date, location, zmanim }) => {
      if (!isFriday(date)) return null;
      const mins = location.inIsrael ? 18 : 20;
      const t = new Date(zmanim.shkia.getTime() - mins * 60_000);
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
    defaultReminders: [{ anchor: 'start', offsetMin: 0, label: 'זמן הבדלה' }],
    computeWindow: ({ date, zmanim }) => {
      if (date.getDay() !== 6) return null;
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
    defaultReminders: [
      { anchor: 'start', offsetMin: 0, label: 'זמן ספירת העומר' },
      { anchor: 'start', offsetMin: 60, label: 'תזכורת — ספירת העומר', skipIfDone: true },
    ],
    computeWindow: ({ date, location, zmanim }) => {
      if (omerDayFor(date, location.tz) === null) return null;
      const end = new Date(zmanim.chatzot);
      end.setDate(end.getDate() + 1);
      return win(zmanim.tzeitHakochavim, end);
    },
  },
];

export function findMitzvah(id: string): Mitzvah | undefined {
  return MITZVOT.find((m) => m.id === id);
}

export { omerDayFor };
