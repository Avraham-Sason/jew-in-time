import { ComplexZmanimCalendar, GeoLocation } from 'kosher-zmanim';
import { Location, Zmanim } from '@/types/zmanim';

const ZMANIM_CACHE_LIMIT = 90;
const zmanimCache = new Map<string, Zmanim>();

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

function cacheKey(date: Date, loc: Location): string {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    loc.lat,
    loc.lng,
    loc.elevation ?? 0,
    loc.tz,
  ].join('|');
}

function cloneZmanim(zmanim: Zmanim): Zmanim {
  return {
    alotHaShachar: new Date(zmanim.alotHaShachar),
    misheyakir: new Date(zmanim.misheyakir),
    netzHaChama: new Date(zmanim.netzHaChama),
    sofZmanShmaGra: new Date(zmanim.sofZmanShmaGra),
    sofZmanShmaMA: new Date(zmanim.sofZmanShmaMA),
    sofZmanTfilaGra: new Date(zmanim.sofZmanTfilaGra),
    chatzot: new Date(zmanim.chatzot),
    minchaGedola: new Date(zmanim.minchaGedola),
    minchaKetana: new Date(zmanim.minchaKetana),
    plagHaMincha: new Date(zmanim.plagHaMincha),
    shkia: new Date(zmanim.shkia),
    tzeitHakochavim: new Date(zmanim.tzeitHakochavim),
  };
}

function cacheZmanim(key: string, value: Zmanim): void {
  if (zmanimCache.size >= ZMANIM_CACHE_LIMIT) {
    const oldest = zmanimCache.keys().next().value;
    if (oldest) zmanimCache.delete(oldest);
  }
  zmanimCache.set(key, cloneZmanim(value));
}

export type CandleLightingOptions = {
  isFriday: boolean;
  isErevYomTov: boolean;
  minutesBefore?: number;
};

export const ZmanimService = {
  getZmanim(date: Date, loc: Location): Zmanim {
    const key = cacheKey(date, loc);
    const cached = zmanimCache.get(key);
    if (cached) return cloneZmanim(cached);
    const cal = buildCalendar(date, loc);
    const sunrise = cal.getSeaLevelSunrise();
    const sunset = cal.getSeaLevelSunset();
    const zmanim = {
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
    cacheZmanim(key, zmanim);
    return cloneZmanim(zmanim);
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
