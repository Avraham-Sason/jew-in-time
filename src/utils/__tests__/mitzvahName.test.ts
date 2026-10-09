import { mitzvahName } from '../mitzvahName';

describe('mitzvahName', () => {
  const both = { name: { he: 'תפילין', en: 'Tefillin' } };
  const hebrewOnly = { name: { he: 'משימה שלי' } };

  it('gives the English name in English when there is one', () => {
    expect(mitzvahName(both, 'en')).toBe('Tefillin');
  });

  it('gives the Hebrew name in Hebrew', () => {
    expect(mitzvahName(both, 'he')).toBe('תפילין');
  });

  it('falls back to Hebrew in English when the English name is missing or empty', () => {
    expect(mitzvahName(hebrewOnly, 'en')).toBe('משימה שלי');
    expect(mitzvahName({ name: { he: 'משימה שלי', en: '' } }, 'en')).toBe('משימה שלי');
  });
});
