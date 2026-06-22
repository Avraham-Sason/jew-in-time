jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

import he from '../he.json';
import en from '../en.json';
import { t, setLocale } from '../index';

describe('i18n', () => {
  it('0.4.a parity — same keys in he+en', () => {
    const heKeys = Object.keys(he).sort();
    const enKeys = Object.keys(en).sort();
    expect(heKeys).toEqual(enKeys);
    expect(heKeys.length).toBeGreaterThan(100);
  });

  it('0.4.b no key has empty value', () => {
    for (const k of Object.keys(he)) {
      expect((he as Record<string, string>)[k]).toBeTruthy();
      expect((en as Record<string, string>)[k]).toBeTruthy();
    }
  });

  it('15.7.a runtime — t("onboarding.welcomeTitle") must NOT return [missing ...] (BUG-011 regression)', () => {
    setLocale('he');
    const out = t('onboarding.welcomeTitle');
    expect(out).not.toMatch(/^\[missing/);
    expect(out).toBe((he as Record<string, string>)['onboarding.welcomeTitle']);
  });

  it('15.7.b runtime — every single translation key resolves (BUG-011 regression, all keys)', () => {
    setLocale('he');
    const broken: string[] = [];
    for (const k of Object.keys(he)) {
      const out = t(k);
      if (/^\[missing/.test(out)) broken.push(k);
    }
    expect(broken).toEqual([]);
  });

  it('15.7.c setLocale("en") resolves english keys (BUG-011 regression)', () => {
    setLocale('en');
    const out = t('onboarding.welcomeTitle');
    expect(out).not.toMatch(/^\[missing/);
    expect(out).toBe((en as Record<string, string>)['onboarding.welcomeTitle']);
  });

  it('brand rename has no old app name in translations', () => {
    const values = [...Object.values(he), ...Object.values(en)].join('\n');
    expect(values).not.toContain('יהודי כשר');
    expect(values).not.toContain('Jew In Time');
    expect((he as Record<string, string>)['app.name']).toBe('יהודי בזמן');
    expect((en as Record<string, string>)['app.name']).toBe('Jewish Time');
  });
});
