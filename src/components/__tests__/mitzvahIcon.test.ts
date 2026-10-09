import { ICON_NAMES, ICON_VARIANT, iconFor } from '../MitzvahIcon';
import { MITZVOT } from '@/data/mitzvot';
import { SIDDUR_GROUPS } from '@/data/siddur';

describe('MitzvahIcon', () => {
  it('lists every icon name once', () => {
    expect(new Set(ICON_NAMES).size).toBe(ICON_NAMES.length);
  });

  it.each([...MITZVOT.map((m) => m.icon), 'custom'])('iconFor(%s) keeps a registered icon', (icon) => {
    expect(iconFor(icon)).toBe(icon);
  });

  it('falls back to the custom icon for an unknown name', () => {
    expect(iconFor('nonsense')).toBe('custom');
  });

  it.each(SIDDUR_GROUPS)('has an icon for the %s siddur group', (group) => {
    expect(ICON_NAMES).toContain(group);
  });

  it('uses a known variant', () => {
    expect(['outline', 'duotone']).toContain(ICON_VARIANT);
  });
});
