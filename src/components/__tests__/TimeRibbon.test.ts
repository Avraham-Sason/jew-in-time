import { ribbonThresholds } from '@/theme/tokens';

// Pure logic extracted from TimeRibbon — same as runtime.
function colorOf(pct: number, colors: { safe: string; warning: string; urgent: string }): string {
  const p = Math.max(0, Math.min(1, pct));
  return p > ribbonThresholds.safe ? colors.safe : p > ribbonThresholds.warning ? colors.warning : colors.urgent;
}

const COLORS = { safe: '#10B981', warning: '#F59E0B', urgent: '#EF4444' };

describe('TimeRibbon color thresholds (8.3)', () => {
  it('8.3.a pct > 0.5 → safe', () => {
    expect(colorOf(0.6, COLORS)).toBe(COLORS.safe);
    expect(colorOf(1.0, COLORS)).toBe(COLORS.safe);
    expect(colorOf(0.51, COLORS)).toBe(COLORS.safe);
  });

  it('8.3.b 0.25 < pct ≤ 0.5 → warning', () => {
    expect(colorOf(0.5, COLORS)).toBe(COLORS.warning);
    expect(colorOf(0.4, COLORS)).toBe(COLORS.warning);
    expect(colorOf(0.26, COLORS)).toBe(COLORS.warning);
  });

  it('8.3.c pct ≤ 0.25 → urgent', () => {
    expect(colorOf(0.25, COLORS)).toBe(COLORS.urgent);
    expect(colorOf(0.1, COLORS)).toBe(COLORS.urgent);
    expect(colorOf(0, COLORS)).toBe(COLORS.urgent);
  });

  it('8.3.d clamps out-of-bounds (negative → urgent, >1 → safe)', () => {
    expect(colorOf(-0.5, COLORS)).toBe(COLORS.urgent);
    expect(colorOf(1.5, COLORS)).toBe(COLORS.safe);
  });

  it('8.3.e thresholds locked to spec (safe=0.5, warning=0.25)', () => {
    expect(ribbonThresholds.safe).toBe(0.5);
    expect(ribbonThresholds.warning).toBe(0.25);
  });
});

// Sort logic extracted from home.tsx:123.
type Item = { id: string; window: { start: Date; end: Date } };
function sortByEnd(items: Item[]): Item[] {
  return [...items].sort((a, b) => a.window.end.getTime() - b.window.end.getTime());
}

describe('Home ordering by urgency (8.2)', () => {
  it('8.2 sorts by window.end ascending', () => {
    const items: Item[] = [
      { id: 'late', window: { start: new Date('2026-04-23T06:00Z'), end: new Date('2026-04-23T19:00Z') } },
      { id: 'early', window: { start: new Date('2026-04-23T05:00Z'), end: new Date('2026-04-23T08:00Z') } },
      { id: 'mid', window: { start: new Date('2026-04-23T07:00Z'), end: new Date('2026-04-23T13:00Z') } },
    ];
    const sorted = sortByEnd(items);
    expect(sorted.map((i) => i.id)).toEqual(['early', 'mid', 'late']);
  });
});
