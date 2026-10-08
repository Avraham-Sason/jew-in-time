import { TIME_PATTERN, timeToMinutes } from '../clock';

describe('TIME_PATTERN', () => {
  it.each(['00:00', '08:05', '12:00', '19:59', '23:59'])('accepts %s', (value) => {
    expect(TIME_PATTERN.test(value)).toBe(true);
  });

  it.each(['24:00', '12:60', '8:00', '08:5', '0800', '08:00:00', ' 08:00', '', 'ab:cd'])('rejects "%s"', (value) => {
    expect(TIME_PATTERN.test(value)).toBe(false);
  });
});

describe('timeToMinutes', () => {
  it('counts minutes since midnight', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('00:01')).toBe(1);
    expect(timeToMinutes('08:30')).toBe(510);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('orders a window the way the custom mitzvah form compares it', () => {
    expect(timeToMinutes('12:00')).toBeGreaterThan(timeToMinutes('08:00'));
    expect(timeToMinutes('09:59')).toBeLessThan(timeToMinutes('10:00'));
  });
});
