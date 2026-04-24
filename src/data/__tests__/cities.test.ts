import { CITIES, findCityByName, getLocationName } from '../cities';

describe('cities', () => {
  it('5.x has at least 20 cities', () => {
    expect(CITIES.length).toBeGreaterThanOrEqual(20);
  });

  it('5.x first city is Jerusalem (default fallback)', () => {
    expect(CITIES[0].name).toBe('ירושלים');
    expect(CITIES[0].lat).toBeCloseTo(31.7683, 3);
    expect(CITIES[0].lng).toBeCloseTo(35.2137, 3);
    expect(CITIES[0].inIsrael).toBe(true);
    expect(CITIES[0].tz).toBe('Asia/Jerusalem');
  });

  it('5.x every city has all required fields', () => {
    for (const c of CITIES) {
      expect(c.name).toBeTruthy();
      expect(typeof c.lat).toBe('number');
      expect(typeof c.lng).toBe('number');
      expect(c.tz).toMatch(/[A-Z]/);
      expect(typeof c.inIsrael).toBe('boolean');
    }
  });

  it('5.x lat/lng within plausible bounds', () => {
    for (const c of CITIES) {
      expect(c.lat).toBeGreaterThanOrEqual(-90);
      expect(c.lat).toBeLessThanOrEqual(90);
      expect(c.lng).toBeGreaterThanOrEqual(-180);
      expect(c.lng).toBeLessThanOrEqual(180);
    }
  });

  it('5.x findCityByName works for Hebrew name', () => {
    expect(findCityByName('ירושלים')).toEqual(CITIES[0]);
    expect(findCityByName('xyz_unknown')).toBeUndefined();
  });

  it('15.7 BUG-006 — cities expose English fallback names', () => {
    for (const c of CITIES) {
      expect(c.name).toMatch(/[\u0590-\u05FF]/); // Hebrew range
      expect(c.nameEn).toBeTruthy();
      expect(getLocationName(c, 'en')).toBe(c.nameEn);
      expect(getLocationName(c, 'he')).toBe(c.name);
    }
  });

  it('all Israel cities use Asia/Jerusalem', () => {
    const israelCities = CITIES.filter((c) => c.inIsrael);
    for (const c of israelCities) {
      expect(c.tz).toBe('Asia/Jerusalem');
    }
  });

  it('non-Israel cities have non-Israel tz', () => {
    const diaspora = CITIES.filter((c) => !c.inIsrael);
    for (const c of diaspora) {
      expect(c.tz).not.toBe('Asia/Jerusalem');
    }
  });
});
