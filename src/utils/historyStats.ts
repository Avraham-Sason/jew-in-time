import { Mitzvah, UserSettings } from '@/types/mitzvah';
import { Location } from '@/types/zmanim';
import { ZmanimService } from '@/services/ZmanimService';
import { DayObservance, isSkippedAt, observanceFor } from '@/utils/skipRules';
import { locationNoon } from '@/utils/locationDay';
import { Completions, dateKey } from '@/stores/useCompletionsStore';

export type HistoryStats = {
  streak: number;
  daily: Array<{ date: string; doneCount: number; totalCount: number; observed: DayObservance }>;
  perMitzvah: Record<string, { done: number; eligible: number; percent: number }>;
  missedYesterday: string[];
};

export function computeStats(
  mitzvot: Mitzvah[],
  completions: Completions,
  location: Location,
  settings: UserSettings,
  daysBack = 30,
  today: Date = new Date(),
): HistoryStats {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (daysBack - 1));

  const perMitzvah: HistoryStats['perMitzvah'] = Object.fromEntries(
    mitzvot.map((mitzvah) => [mitzvah.id, { done: 0, eligible: 0, percent: 0 }]),
  );
  const daily: HistoryStats['daily'] = [];
  let missedYesterday: string[] = [];
  const yesterday = new Date(today);
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dateKey(yesterday);

  for (let offset = 0; offset < daysBack; offset++) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const key = dateKey(date);
    const doneMap = completions[key] ?? {};
    const noon = locationNoon(date, location);
    const zmanim = ZmanimService.getZmanim(noon, location);
    if (!zmanim) {
      daily.push({ date: key, doneCount: 0, totalCount: 0, observed: { isShabbat: false, isYomTov: false } });
      continue;
    }
    let totalCount = 0;
    let doneCount = 0;
    const missed: string[] = [];

    for (const mitzvah of mitzvot) {
      const window = mitzvah.computeWindow({ date, location, settings, zmanim });
      if (!window) continue;
      if (isSkippedAt(mitzvah, window.start, location)) continue;
      totalCount += 1;
      perMitzvah[mitzvah.id].eligible += 1;
      if (doneMap[mitzvah.id]) {
        doneCount += 1;
        perMitzvah[mitzvah.id].done += 1;
      } else {
        missed.push(mitzvah.id);
      }
    }

    daily.push({ date: key, doneCount, totalCount, observed: observanceFor(noon, location) });
    if (key === yesterdayKey) {
      missedYesterday = missed;
    }
  }

  for (const stat of Object.values(perMitzvah)) {
    stat.percent = stat.eligible > 0 ? Math.round((stat.done / stat.eligible) * 100) : 0;
  }

  // Today is still in progress, so it can extend the streak but must never break it — otherwise
  // the counter reads 0 every morning until the first completion. Shabbat and Yom Tov are
  // likewise neutral: an observant user does not touch the phone, which used to cap the streak
  // at 6 forever with no way to repair it (past days are read-only by design).
  let streak = 0;
  const todayKey = dateKey(today);
  for (let index = daily.length - 1; index >= 0; index--) {
    const day = daily[index];
    if (Object.keys(completions[day.date] ?? {}).length > 0) {
      streak += 1;
      continue;
    }
    if (day.totalCount === 0) continue;
    if (day.date === todayKey) continue;
    if (day.observed.isShabbat || day.observed.isYomTov) continue;
    break;
  }

  return { streak, daily, perMitzvah, missedYesterday };
}
