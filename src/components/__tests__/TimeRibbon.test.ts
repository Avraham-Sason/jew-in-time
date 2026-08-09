import { ribbonColor } from '../TimeRibbon';
import { ribbonThresholds } from '@/theme/tokens';
import { T_LIGHT } from '@/theme/colors';

// This suite used to re-declare `colorOf` and a `sortByEnd` "extracted from home.tsx" and assert
// against those copies — it never imported TimeRibbon at all, so flipping the real thresholds
// shipped green. It now exercises the shipped function.
describe('TimeRibbon colour thresholds', () => {
  it('moves safe → warning → urgent as the window drains', () => {
    expect(ribbonColor(1, T_LIGHT)).toBe(T_LIGHT.safe);
    expect(ribbonColor(0.75, T_LIGHT)).toBe(T_LIGHT.safe);
    expect(ribbonColor(0.4, T_LIGHT)).toBe(T_LIGHT.warning);
    expect(ribbonColor(0.1, T_LIGHT)).toBe(T_LIGHT.urgent);
  });

  it('treats each threshold as exclusive at the boundary', () => {
    expect(ribbonColor(ribbonThresholds.safe, T_LIGHT)).toBe(T_LIGHT.warning);
    expect(ribbonColor(ribbonThresholds.warning, T_LIGHT)).toBe(T_LIGHT.urgent);
  });

  it('clamps out-of-range input instead of trusting it', () => {
    expect(ribbonColor(5, T_LIGHT)).toBe(T_LIGHT.safe);
    expect(ribbonColor(-3, T_LIGHT)).toBe(T_LIGHT.urgent);
  });
});
