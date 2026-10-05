import { DateTime } from 'luxon';
import { buildDayTimeline, currentOrNextWindow, ZMAN_KEYS } from '../buildDayTimeline';
import { Mitzvah, UserSettings } from '@/types/mitzvah';
import { CITIES } from '@/data/cities';
import { findMitzvah, omerDayFor } from '@/data/mitzvot';

const date = new Date('2026-05-06T08:00:00Z');
const zmanim = Object.fromEntries(
  ZMAN_KEYS.map((key, index) => [key, new Date(date.getTime() + index * 60_000)]),
) as never;

const mitzvah: Mitzvah = {
  id: 'sample',
  name: { he: 'בדיקה', en: 'Sample' },
  icon: 'sample',
  timeType: 'range-within-day',
  category: 'daily-morning',
  skipOn: [],
  nuschaotSupported: ['ashkenaz'],
  defaultReminders: [],
  computeWindow: () => ({
    start: new Date('2026-05-06T09:00:00Z'),
    end: new Date('2026-05-06T10:00:00Z'),
  }),
};

describe('buildDayTimeline', () => {
  it('builds zmanim plus mitzvah items in time order', () => {
    const items = buildDayTimeline(
      date,
      [mitzvah],
      { '2026-05-06': { sample: Date.now() } },
      CITIES[0],
      { nusach: 'ashkenaz', halachicOpinions: { ksSofZman: 'GRA' }, inIsrael: true },
      'en',
      (key) => key,
      zmanim,
    );

    expect(items).toHaveLength(ZMAN_KEYS.length + 1);
    expect(items.find((item) => item.mitzvahId === 'sample')).toMatchObject({
      name: 'Sample',
      type: 'mitzvah',
      done: true,
    });
    expect([...items].sort((a, b) => a.time.getTime() - b.time.getTime())).toEqual(items);
  });
});

describe('currentOrNextWindow', () => {
  const jerusalem = CITIES[0];
  const settings: UserSettings = { nusach: 'ashkenaz', halachicOpinions: { ksSofZman: 'GRA' }, inIsrael: true };
  const omer = findMitzvah('sefirat_haomer')!;
  const at = (iso: string) => DateTime.fromISO(iso, { zone: jerusalem.tz }).toJSDate();

  it('keeps last night’s omer window after midnight, while it is still open', () => {
    const now = at('2026-04-20T00:30');
    const window = currentOrNextWindow(omer, jerusalem, settings, now)!;
    expect(window.start.getTime()).toBeLessThan(now.getTime());
    expect(window.end.getTime()).toBeGreaterThan(now.getTime());
    expect(omerDayFor(window.date, jerusalem.tz)).toBe(18);
  });

  it('moves to tonight’s window once last night’s has closed', () => {
    const now = at('2026-04-20T12:00');
    const window = currentOrNextWindow(omer, jerusalem, settings, now)!;
    expect(window.start.getTime()).toBeGreaterThan(now.getTime());
    expect(omerDayFor(window.date, jerusalem.tz)).toBe(19);
  });
});
