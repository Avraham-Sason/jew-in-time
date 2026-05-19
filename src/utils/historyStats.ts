import { Mitzvah, UserSettings } from '@/types/mitzvah';
import { Location } from '@/types/zmanim';
import { HebcalService } from '@/services/HebcalService';
import { ZmanimService } from '@/services/ZmanimService';
import { Completions, dateKey } from '@/stores/useCompletionsStore';

export type HistoryStats = {
  streak: number;
  daily: Array<{ date: string; doneCount: number; totalCount: number }>;
  perMitzvah: Record<string, { done: number; eligible: number; percent: number }>;
  missedYesterday: string[];
};

function shouldSkip(mitzvah: Mitzvah, isShabbat: boolean, isYomTov: boolean): boolean {
  if (!mitzvah.skipOn.length) return false;
  if (mitzvah.skipOn.includes('shabbat') && isShabbat) return true;
  if (mitzvah.skipOn.includes('yomtov') && isYomTov) return true;
  return false;
}

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
    const zmanim = ZmanimService.getZmanim(date, location);
    const isShabbat = HebcalService.isShabbat(date, location);
    const isYomTov = HebcalService.isYomTov(date, location);
    let totalCount = 0;
    let doneCount = 0;
    const missed: string[] = [];

    for (const mitzvah of mitzvot) {
      if (shouldSkip(mitzvah, isShabbat, isYomTov)) continue;
      if (!mitzvah.computeWindow({ date, location, settings, zmanim })) continue;
      totalCount += 1;
      perMitzvah[mitzvah.id].eligible += 1;
      if (doneMap[mitzvah.id]) {
        doneCount += 1;
        perMitzvah[mitzvah.id].done += 1;
      } else {
        missed.push(mitzvah.id);
      }
    }

    daily.push({ date: key, doneCount, totalCount });
    if (key === yesterdayKey) {
      missedYesterday = missed;
    }
  }

  for (const stat of Object.values(perMitzvah)) {
    stat.percent = stat.eligible > 0 ? Math.round((stat.done / stat.eligible) * 100) : 0;
  }

  let streak = 0;
  for (let index = daily.length - 1; index >= 0; index--) {
    const day = daily[index];
    const hasAny = Object.keys(completions[day.date] ?? {}).length > 0;
    if (hasAny) {
      streak += 1;
      continue;
    }
    if (day.totalCount === 0) continue;
    break;
  }

  return { streak, daily, perMitzvah, missedYesterday };
}
