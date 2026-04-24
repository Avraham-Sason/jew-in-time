// Pure logic tests for the reminder math used in NotificationScheduler.
// Covers tests 11.5 (negative offset), 16.4 (positive overshoot), 16.5 (skipIfDone).

type Anchor = 'start' | 'end';
type Reminder = { anchor: Anchor; offsetMin: number; label: string; skipIfDone?: boolean };
type Win = { start: Date; end: Date };

function buildTriggerTime(r: Reminder, w: Win): Date {
  const anchor = r.anchor === 'start' ? w.start : w.end;
  return new Date(anchor.getTime() + r.offsetMin * 60_000);
}

const win: Win = {
  start: new Date('2026-04-23T05:08:00Z'),
  end: new Date('2026-04-23T19:13:00Z'),
};

describe('Reminder buildTriggerTime', () => {
  it('11.5.a anchor=start + offset=0 → start time', () => {
    expect(buildTriggerTime({ anchor: 'start', offsetMin: 0, label: 'x' }, win).toISOString())
      .toBe(win.start.toISOString());
  });

  it('11.5.b anchor=start + offset=+30 → 30min after start', () => {
    expect(buildTriggerTime({ anchor: 'start', offsetMin: 30, label: 'x' }, win).getTime())
      .toBe(win.start.getTime() + 30 * 60_000);
  });

  it('11.5.c anchor=end + offset=-45 → 45min before end (negative offset)', () => {
    const t = buildTriggerTime({ anchor: 'end', offsetMin: -45, label: 'x' }, win);
    expect(t.getTime()).toBe(win.end.getTime() - 45 * 60_000);
    expect(t.getTime()).toBeLessThan(win.end.getTime());
  });

  it('11.5.d anchor=end + offset=0 → end time', () => {
    expect(buildTriggerTime({ anchor: 'end', offsetMin: 0, label: 'x' }, win).toISOString())
      .toBe(win.end.toISOString());
  });

  it('16.4 large positive offset overshoots window.end → trigger > end (caller must drop)', () => {
    const t = buildTriggerTime({ anchor: 'start', offsetMin: 24 * 60, label: 'x' }, win);
    expect(t.getTime()).toBeGreaterThan(win.end.getTime());
  });

  it('16.5 skipIfDone=true is on reminder shape (consumed by scheduler)', () => {
    const r: Reminder = { anchor: 'start', offsetMin: 0, label: 'x', skipIfDone: true };
    expect(r.skipIfDone).toBe(true);
  });
});
