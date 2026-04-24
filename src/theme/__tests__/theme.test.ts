import { T_LIGHT, T_DARK, themes } from '../colors';
import { ribbonThresholds, durations, spacing, radius } from '../tokens';

describe('Theme', () => {
  it('15.3 light + dark have identical key sets', () => {
    expect(Object.keys(T_LIGHT).sort()).toEqual(Object.keys(T_DARK).sort());
  });

  it('15.3 every color value is non-empty string', () => {
    for (const t of [T_LIGHT, T_DARK]) {
      for (const [k, v] of Object.entries(t)) {
        expect(typeof v).toBe('string');
        expect((v as string).length).toBeGreaterThan(2);
        expect(k).toBeTruthy();
      }
    }
  });

  it('15.3 themes export contains both light + dark', () => {
    expect(themes.light).toBe(T_LIGHT);
    expect(themes.dark).toBe(T_DARK);
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
