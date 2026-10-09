import { bannerPalette } from '../Banner';
import { THEMES, THEME_NAMES } from '@/theme/colors';

describe('bannerPalette', () => {
  it.each(THEME_NAMES)('%s: each tone reads its own status colours', (name) => {
    const colors = THEMES[name];
    expect(bannerPalette('warning', colors)).toEqual({
      border: colors.warning,
      background: `${colors.warning}18`,
      text: colors.text,
    });
    expect(bannerPalette('urgent', colors)).toEqual({
      border: colors.urgent,
      background: colors.urgentBg,
      text: colors.urgent,
    });
    expect(bannerPalette('safe', colors)).toEqual({
      border: colors.safe,
      background: `${colors.safe}18`,
      text: colors.text,
    });
    expect(bannerPalette('accent', colors)).toEqual({
      border: colors.gold,
      background: colors.goldLight,
      text: colors.goldText,
    });
    expect(bannerPalette('info', colors)).toEqual({
      border: colors.border,
      background: colors.surface2,
      text: colors.textSub,
    });
  });

  it.each(THEME_NAMES)('%s: warning and safe stay six-digit hex, so the appended alpha byte is valid', (name) => {
    const colors = THEMES[name];
    expect(colors.warning).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(colors.safe).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
