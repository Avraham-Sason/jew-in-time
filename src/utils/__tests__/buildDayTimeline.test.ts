import { buildDayTimeline, ZMAN_KEYS } from '../buildDayTimeline';
import { Mitzvah } from '@/types/mitzvah';
import { CITIES } from '@/data/cities';

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
