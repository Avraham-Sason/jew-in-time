import { computeStats } from '../historyStats';
import { Mitzvah } from '@/types/mitzvah';
import { CITIES } from '@/data/cities';

function fixtureMitzvah(id: string, skipOn: Mitzvah['skipOn'] = []): Mitzvah {
  return {
    id,
    name: { he: id },
    icon: id,
    timeType: 'range-within-day',
    category: 'daily-morning',
    skipOn,
    nuschaotSupported: ['ashkenaz'],
    defaultReminders: [],
    computeWindow: ({ date }) => {
      const start = new Date(date);
      start.setHours(8, 0, 0, 0);
      const end = new Date(date);
      end.setHours(9, 0, 0, 0);
      return { start, end };
    },
  };
}

const settings = { nusach: 'ashkenaz' as const, halachicOpinions: { ksSofZman: 'GRA' as const }, inIsrael: true };

describe('historyStats', () => {
  it('computes a three-day streak when the fourth day back has a gap', () => {
    const today = new Date(2026, 4, 7);
    const stats = computeStats(
      [fixtureMitzvah('daily')],
      {
        '2026-05-07': { daily: Date.now() },
        '2026-05-06': { daily: Date.now() },
        '2026-05-05': { daily: Date.now() },
        '2026-05-03': { daily: Date.now() },
      },
      CITIES[0],
      settings,
      7,
      today,
    );

    expect(stats.streak).toBe(3);
    expect(stats.perMitzvah.daily).toMatchObject({ done: 4, eligible: 7, percent: 57 });
  });

  it('keeps a 23:59 completion on that date key', () => {
    const ts = new Date(2026, 4, 6, 23, 59).getTime();
    const stats = computeStats(
      [fixtureMitzvah('daily')],
      { '2026-05-06': { daily: ts } },
      CITIES[0],
      settings,
      1,
      new Date(2026, 4, 6),
    );

    expect(stats.daily[0]).toMatchObject({ date: '2026-05-06', doneCount: 1, totalCount: 1 });
  });

  it('removes Shabbat from eligibility for skipOn shabbat mitzvot', () => {
    const stats = computeStats(
      [fixtureMitzvah('weekday', ['shabbat'])],
      {},
      CITIES[0],
      settings,
      1,
      new Date(2026, 4, 2),
    );

    expect(stats.daily[0]).toMatchObject({ date: '2026-05-02', doneCount: 0, totalCount: 0 });
    expect(stats.perMitzvah.weekday).toMatchObject({ done: 0, eligible: 0, percent: 0 });
  });
});
