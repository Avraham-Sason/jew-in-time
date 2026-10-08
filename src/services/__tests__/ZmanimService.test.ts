import { ZmanimService, antimeridianAdjustment } from '../ZmanimService';
import { zmanimFor } from '@/testing/zmanim';
import { CITIES } from '@/data/cities';
import { Location } from '@/types/zmanim';

const JERUSALEM: Location = {
  name: 'Jerusalem',
  lat: 31.7683,
  lng: 35.2137,
  tz: 'Asia/Jerusalem',
  inIsrael: true,
};

const TEL_AVIV: Location = {
  name: 'Tel Aviv',
  lat: 32.0853,
  lng: 34.7818,
  tz: 'Asia/Jerusalem',
  inIsrael: true,
};

const NEW_YORK: Location = {
  name: 'New York',
  lat: 40.7128,
  lng: -74.006,
  tz: 'America/New_York',
  inIsrael: false,
};

const DATES = [new Date('2026-04-23T12:00:00Z'), new Date('2026-06-21T12:00:00Z'), new Date('2026-12-21T12:00:00Z')];

function toLocalHHMM(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

function diffMinutes(a: Date, tz: string, expected: string): number {
  return Math.abs(hhmmToMinutes(toLocalHHMM(a, tz)) - hhmmToMinutes(expected));
}

// The day a zman falls on, on the location's own clock.
function localDate(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    d,
  );
}

describe('ZmanimService day resolution east of the zone meridian', () => {
  // kosher-zmanim 0.9.0 flips the sign of a DST zone's raw offset, so its antimeridian check took
  // Sydney and New Zealand for a zone 20 hours ahead and returned the next day's zmanim.
  const PLACES: Location[] = [
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney', inIsrael: false },
    { name: 'Auckland', lat: -36.8485, lng: 174.7633, tz: 'Pacific/Auckland', inIsrael: false },
    { name: 'Melbourne', lat: -37.8136, lng: 144.9631, tz: 'Australia/Melbourne', inIsrael: false },
    { name: 'Adak', lat: 51.88, lng: -176.65, tz: 'America/Adak', inIsrael: false },
    JERUSALEM,
    NEW_YORK,
  ];
  // Midday in both hemispheres' summer and winter, written as each place's own wall clock.
  const DAYS = ['2026-01-15', '2026-04-23', '2026-07-15', '2026-12-04'];

  it.each(PLACES.map((place) => [place.name, place] as const))(
    'gives %s the zmanim of the very day asked for',
    (_name, place) => {
      for (const day of DAYS) {
        const noon = new Date(new Date(`${day}T12:00:00Z`).getTime() - zoneOffsetMs(`${day}T12:00:00Z`, place.tz));
        expect(localDate(noon, place.tz)).toBe(day);
        const z = ZmanimService.getZmanim(noon, place);
        if (!z) throw new Error(`no zmanim for ${place.name} on ${day}`);
        expect(localDate(z.netzHaChama, place.tz)).toBe(day);
        expect(localDate(z.shkia, place.tz)).toBe(day);
        expect(localDate(z.alotHaShachar, place.tz)).toBe(day);
        expect(z.netzHaChama.getTime()).toBeLessThan(noon.getTime());
        expect(z.shkia.getTime()).toBeGreaterThan(noon.getTime());
      }
    },
  );

  it('still rolls the day for a zone across the antimeridian, as the library intends', () => {
    expect(
      antimeridianAdjustment({ name: 'Apia', lat: -13.83, lng: -171.76, tz: 'Pacific/Apia', inIsrael: false }),
    ).toBe(-1);
    expect(
      antimeridianAdjustment({ name: 'Kiritimati', lat: 1.87, lng: -157.4, tz: 'Pacific/Kiritimati', inIsrael: false }),
    ).toBe(-1);
    for (const place of PLACES) expect(antimeridianAdjustment(place)).toBe(0);
  });
});

function zoneOffsetMs(isoUtc: string, tz: string): number {
  const at = new Date(isoUtc);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  );
  const wall = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return wall - at.getTime();
}

describe('ZmanimService accuracy', () => {
  it.each([
    ['Jerusalem', JERUSALEM],
    ['Tel Aviv', TEL_AVIV],
    ['New York', NEW_YORK],
  ])('returns full zmanim set for %s × 3 dates', (_name, loc) => {
    for (const d of DATES) {
      const z = ZmanimService.getZmanim(d, loc);
      if (!z) throw new Error(`expected zmanim for ${_name} on ${d.toISOString()}`);
      expect(z.netzHaChama).toBeInstanceOf(Date);
      expect(z.shkia).toBeInstanceOf(Date);
      expect(z.alotHaShachar.getTime()).toBeLessThan(z.netzHaChama.getTime());
      expect(z.netzHaChama.getTime()).toBeLessThan(z.shkia.getTime());
      expect(z.shkia.getTime()).toBeLessThan(z.tzeitHakochavim.getTime());
      expect(z.sofZmanShmaMA.getTime()).toBeLessThan(z.sofZmanShmaGra.getTime());
      expect(z.sofZmanShmaGra.getTime()).toBeLessThan(z.sofZmanTfilaGra.getTime());
    }
  });

  // Regression: getAlosHashachar (16.1°) and getMisheyakir11Point5Degrees have no solution above
  // ~50°N around midsummer. London, Antwerp and Moscow are all shipped, and getZmanim used to
  // throw for them — crashing every screen and wiping every scheduled notification.
  it('returns a complete zmanim set for every shipped city across the whole year', () => {
    for (const city of CITIES) {
      for (let offset = 0; offset < 365; offset += 7) {
        const date = new Date(2026, 0, 1);
        date.setDate(date.getDate() + offset);
        const z = ZmanimService.getZmanim(date, city);
        if (!z) throw new Error(`null zmanim for ${city.nameEn} on ${date.toDateString()}`);
        for (const [key, value] of Object.entries(z)) {
          if (Number.isNaN(value.getTime())) throw new Error(`NaN ${key} for ${city.nameEn} on ${date.toDateString()}`);
        }
        expect(z.alotHaShachar.getTime()).toBeLessThanOrEqual(z.misheyakir.getTime());
        expect(z.misheyakir.getTime()).toBeLessThan(z.netzHaChama.getTime());
        expect(z.netzHaChama.getTime()).toBeLessThan(z.shkia.getTime());
        expect(z.shkia.getTime()).toBeLessThan(z.tzeitHakochavim.getTime());
      }
    }
  });

  it.each([
    ['London', '2026-06-21'],
    ['Antwerp', '2026-06-21'],
    ['Moscow', '2026-06-21'],
  ])('%s midsummer falls back to fixed-minute alot/misheyakir instead of throwing', (nameEn, iso) => {
    const city = CITIES.find((c) => c.nameEn === nameEn)!;
    const [y, m, d] = iso.split('-').map(Number);
    const z = zmanimFor(new Date(y, m - 1, d), city);
    const minutesBeforeNetz = (value: Date) => (z.netzHaChama.getTime() - value.getTime()) / 60_000;
    expect(minutesBeforeNetz(z.alotHaShachar)).toBeCloseTo(72, 0);
    // Misheyakir must land inside (alot, netz) even when its own degree value is unsolvable or,
    // as in London/Antwerp, still solvable but earlier than the fixed-minute alot.
    expect(minutesBeforeNetz(z.misheyakir)).toBeCloseTo(52, 0);
  });

  it('returns null (never throws) where the sun neither rises nor sets', () => {
    const tromso: Location = { name: 'Tromso', lat: 69.6492, lng: 18.9553, tz: 'Europe/Oslo', inIsrael: false };
    expect(() => ZmanimService.getZmanim(new Date(2026, 5, 21), tromso)).not.toThrow();
    expect(ZmanimService.getZmanim(new Date(2026, 5, 21), tromso)).toBeNull();
  });

  it('Jerusalem 2026-04-23 matches published zmanim within 2 minutes', () => {
    const z = zmanimFor(DATES[0], JERUSALEM);
    expect(diffMinutes(z.misheyakir, JERUSALEM.tz, '05:08')).toBeLessThanOrEqual(2);
    expect(diffMinutes(z.netzHaChama, JERUSALEM.tz, '06:01')).toBeLessThanOrEqual(2);
    expect(diffMinutes(z.shkia, JERUSALEM.tz, '19:13')).toBeLessThanOrEqual(2);
    expect(diffMinutes(z.sofZmanShmaGra, JERUSALEM.tz, '09:19')).toBeLessThanOrEqual(2);
  });
});
