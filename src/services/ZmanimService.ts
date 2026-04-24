import { ComplexZmanimCalendar, GeoLocation } from 'kosher-zmanim';
import { Location, Zmanim } from '@/types/zmanim';

function toDate(d: unknown): Date {
  if (!d) throw new Error('Zmanim computation returned null');
  if (d instanceof Date) return d;
  if (typeof (d as { toDate?: () => Date }).toDate === 'function') {
    return (d as { toDate: () => Date }).toDate();
  }
  if (typeof (d as { toJSDate?: () => Date }).toJSDate === 'function') {
    return (d as { toJSDate: () => Date }).toJSDate();
  }
  const s = String(d);
  const parsed = new Date(s);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Cannot parse zman: ${s}`);
  return parsed;
}

function buildCalendar(date: Date, loc: Location): ComplexZmanimCalendar {
  const geo = new GeoLocation(
    loc.name,
    loc.lat,
    loc.lng,
    loc.elevation ?? 0,
    loc.tz,
  );
  const cal = new ComplexZmanimCalendar(geo);
  cal.setDate(date);
  return cal;
}

export type CandleLightingOptions = {
  isFriday: boolean;
  isErevYomTov: boolean;
  minutesBefore?: number;
};

export const ZmanimService = {
  getZmanim(date: Date, loc: Location): Zmanim {
    const cal = buildCalendar(date, loc);
    const sunrise = cal.getSeaLevelSunrise();
    const sunset = cal.getSeaLevelSunset();
    return {
      alotHaShachar: toDate(cal.getAlosHashachar()),
      misheyakir: toDate(cal.getMisheyakir11Point5Degrees() ?? cal.getMisheyakir11Degrees()),
      netzHaChama: toDate(sunrise),
      sofZmanShmaGra: toDate(cal.getSofZmanShmaGRA()),
      sofZmanShmaMA: toDate(cal.getSofZmanShmaMGA()),
      sofZmanTfilaGra: toDate(cal.getSofZmanTfilaGRA()),
      chatzot: toDate(cal.getChatzos()),
      minchaGedola: toDate(cal.getMinchaGedola()),
      minchaKetana: toDate(cal.getMinchaKetana(sunrise, sunset)),
      plagHaMincha: toDate(cal.getPlagHamincha(sunrise, sunset)),
      shkia: toDate(sunset),
      tzeitHakochavim: toDate(cal.getTzaisGeonim7Point083Degrees()),
    };
  },

  getCandleLighting(date: Date, loc: Location, opts: CandleLightingOptions): Date {
    const cal = buildCalendar(date, loc);
    const shkia = toDate(cal.getSeaLevelSunset());
    const minutes = opts.minutesBefore ?? (loc.inIsrael ? 18 : 20);
    return new Date(shkia.getTime() - minutes * 60_000);
  },

  getHavdalah(date: Date, loc: Location): Date {
    const cal = buildCalendar(date, loc);
    return toDate(cal.getTzaisGeonim7Point083Degrees());
  },
};
