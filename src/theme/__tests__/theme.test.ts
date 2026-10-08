import {
  T_LIGHT,
  T_DARK,
  T_PINK,
  T_PURPLE,
  T_BLUE,
  T_PLUM,
  THEMES,
  THEME_NAMES,
  DARK_THEMES,
  isDarkTheme,
  ThemeColors,
} from '../colors';
import { ribbonThresholds, durations, spacing, radius } from '../tokens';
import he from '@/i18n/he.json';
import en from '@/i18n/en.json';

const COLOR = /^(#[0-9A-F]{6}|rgba\(.*\))$/i;

const STATUS_TOKENS = ['urgent', 'urgentBg', 'urgentBorder', 'warning', 'safe'] as const;
const IDENTITY_TOKENS = ['gold', 'headerBg', 'bg'] as const;

const READABLE_PAIRS: readonly (readonly [keyof ThemeColors, keyof ThemeColors, number])[] = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['textMuted', 'surface', 4.5],
  ['onGold', 'gold', 4.5],
  ['goldText', 'surface', 4.5],
  ['goldText', 'bg', 4.5],
  ['goldText', 'goldLight', 4.5],
  ['onUrgent', 'urgent', 4.5],
  ['headerText', 'headerBg', 4.5],
  ['headerAccent', 'headerBg', 4.5],
  ['textSub', 'surface', 4.0],
];

const pick = <K extends keyof ThemeColors>(palette: ThemeColors, keys: readonly K[]) =>
  Object.fromEntries(keys.map((key) => [key, palette[key]])) as Pick<ThemeColors, K>;

const linear = (channel: number) => {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string) => {
  if (!/^#[0-9A-F]{6}$/i.test(hex)) throw new Error(`contrast needs a hex colour, got ${hex}`);
  const [r, g, b] = [1, 3, 5].map((i) => linear(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};

describe('Theme', () => {
  it('THEMES lists exactly the named palettes, in order', () => {
    expect(THEME_NAMES).toEqual(['gold', 'pink', 'purple', 'blue', 'dark', 'plum']);
    expect(Object.keys(THEMES)).toEqual([...THEME_NAMES]);
    expect(THEMES.gold).toBe(T_LIGHT);
    expect(THEMES.pink).toBe(T_PINK);
    expect(THEMES.purple).toBe(T_PURPLE);
    expect(THEMES.blue).toBe(T_BLUE);
    expect(THEMES.dark).toBe(T_DARK);
    expect(THEMES.plum).toBe(T_PLUM);
  });

  it('every palette has the same token set as gold', () => {
    const goldKeys = Object.keys(T_LIGHT).sort();
    for (const name of THEME_NAMES) {
      expect({ name, keys: Object.keys(THEMES[name]).sort() }).toEqual({ name, keys: goldKeys });
    }
  });

  it('every token is a colour string', () => {
    for (const name of THEME_NAMES) {
      const invalid = Object.entries(THEMES[name])
        .filter(([, value]) => typeof value !== 'string' || !COLOR.test(value))
        .map(([token]) => token);
      expect({ name, invalid }).toEqual({ name, invalid: [] });
    }
  });

  it('dark and plum are the dark palettes', () => {
    expect(DARK_THEMES).toEqual(['dark', 'plum']);
    expect(THEME_NAMES.filter((name) => isDarkTheme(name))).toEqual([...DARK_THEMES]);
    expect(isDarkTheme('gold')).toBe(false);
  });

  it('the light palettes share the status colours and white surfaces', () => {
    for (const name of ['pink', 'purple', 'blue'] as const) {
      const palette = THEMES[name];
      expect({ name, surface: palette.surface, ...pick(palette, STATUS_TOKENS) }).toEqual({
        name,
        surface: '#FFFFFF',
        ...pick(T_LIGHT, STATUS_TOKENS),
      });
    }
    for (const token of IDENTITY_TOKENS) {
      const values = [T_LIGHT, T_PINK, T_PURPLE, T_BLUE].map((palette) => palette[token]);
      expect({ token, distinct: new Set(values).size }).toEqual({ token, distinct: values.length });
    }
  });

  it.each(THEME_NAMES)('text stays readable in the %s palette (WCAG contrast)', (name) => {
    const palette = THEMES[name];
    const failing = READABLE_PAIRS.map(([fg, bg, min]) => ({
      pair: `${fg}/${bg}`,
      ratio: contrast(palette[fg], palette[bg]),
      min,
    }))
      .filter(({ ratio, min }) => !(ratio >= min))
      .map(({ pair, ratio, min }) => `${pair} ${ratio.toFixed(2)} < ${min}`);
    expect(failing).toEqual([]);
  });

  it('every palette has a label in both dictionaries', () => {
    const tables: Record<string, Record<string, string>> = { he, en };
    for (const name of THEME_NAMES) {
      for (const [locale, table] of Object.entries(tables)) {
        const label = table[`settings.theme.${name}`];
        expect({ name, locale, label }).toEqual({ name, locale, label: expect.stringMatching(/\S/) });
      }
    }
  });

  it('8.3 ribbonThresholds are sane', () => {
    expect(ribbonThresholds.safe).toBeGreaterThan(ribbonThresholds.warning);
    expect(ribbonThresholds.safe).toBeLessThanOrEqual(1);
    expect(ribbonThresholds.warning).toBeGreaterThanOrEqual(0);
  });

  it('animation durations defined + ordered', () => {
    expect(durations.fast).toBeLessThan(durations.base);
    expect(durations.base).toBeLessThan(durations.slow);
    expect(durations.slow).toBeLessThan(durations.stamp);
  });

  it('spacing scale is monotonic', () => {
    const order = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const;
    for (let i = 1; i < order.length; i++) {
      expect(spacing[order[i]]).toBeGreaterThan(spacing[order[i - 1]]);
    }
  });

  it('radius scale is monotonic (excluding full)', () => {
    expect(radius.sm).toBeLessThan(radius.md);
    expect(radius.md).toBeLessThan(radius.lg);
    expect(radius.lg).toBeLessThan(radius.xl);
    expect(radius.full).toBeGreaterThan(radius.xl);
  });
});
