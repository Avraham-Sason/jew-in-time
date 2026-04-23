import { ZmanimService } from '../ZmanimService';
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

const DATES = [
  new Date('2026-04-23T12:00:00Z'),
  new Date('2026-06-21T12:00:00Z'),
  new Date('2026-12-21T12:00:00Z'),
];

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

describe('ZmanimService accuracy', () => {
  it.each([
    ['Jerusalem', JERUSALEM],
    ['Tel Aviv', TEL_AVIV],
    ['New York', NEW_YORK],
  ])('returns full zmanim set for %s × 3 dates', (_name, loc) => {
    for (const d of DATES) {
      const z = ZmanimService.getZmanim(d, loc);
      expect(z.netzHaChama).toBeInstanceOf(Date);
      expect(z.shkia).toBeInstanceOf(Date);
      expect(z.alotHaShachar.getTime()).toBeLessThan(z.netzHaChama.getTime());
      expect(z.netzHaChama.getTime()).toBeLessThan(z.shkia.getTime());
      expect(z.shkia.getTime()).toBeLessThan(z.tzeitHakochavim.getTime());
      expect(z.sofZmanShmaMA.getTime()).toBeLessThan(z.sofZmanShmaGra.getTime());
      expect(z.sofZmanShmaGra.getTime()).toBeLessThan(z.sofZmanTfilaGra.getTime());
    }
  });

  it('Jerusalem 2026-04-23 matches published zmanim within 2 minutes', () => {
    const z = ZmanimService.getZmanim(DATES[0], JERUSALEM);
    expect(diffMinutes(z.misheyakir, JERUSALEM.tz, '05:08')).toBeLessThanOrEqual(2);
    expect(diffMinutes(z.netzHaChama, JERUSALEM.tz, '06:01')).toBeLessThanOrEqual(2);
    expect(diffMinutes(z.shkia, JERUSALEM.tz, '19:13')).toBeLessThanOrEqual(2);
    expect(diffMinutes(z.sofZmanShmaGra, JERUSALEM.tz, '09:19')).toBeLessThanOrEqual(2);
  });
});
