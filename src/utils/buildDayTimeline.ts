import { Mitzvah, UserSettings } from '@/types/mitzvah';
import { Location, Zmanim } from '@/types/zmanim';
import { ZmanimService } from '@/services/ZmanimService';
import { isSkippedAt } from '@/utils/skipRules';
import { locationNoon } from '@/utils/locationDay';
import { Completions, dateKey } from '@/stores/useCompletionsStore';

export type TimelineItem = {
  id: string;
  name: string;
  time: Date;
  type: 'zman' | 'mitzvah';
  done?: boolean;
  urgent?: boolean;
  expired?: boolean;
  mitzvahId?: string;
  windowEnd?: Date;
};

export const ZMAN_KEYS = [
  'alotHaShachar',
  'netzHaChama',
  'sofZmanShmaGra',
  'sofZmanTfilaGra',
  'minchaGedola',
  'plagHaMincha',
  'shkia',
  'tzeitHakochavim',
] as const;

type Translate = (key: string, params?: Record<string, unknown>) => string;

const NEXT_WINDOW_LOOKAHEAD_DAYS = 9;

export function currentOrNextWindow(
  mitzvah: Mitzvah,
  location: Location,
  settings: UserSettings,
  now: Date = new Date(),
): { start: Date; end: Date; date: Date } | null {
  // Far enough ahead to clear the longest run of skipped days — Sukkot in Israel keeps tefillin
  // off for chol hamoed, Shemini Atzeret and a Shabbat — and to reach next week's candle lighting.
  for (let offset = -1; offset <= NEXT_WINDOW_LOOKAHEAD_DAYS; offset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    const zmanim = ZmanimService.getZmanim(date, location);
    if (!zmanim) continue;
    const window = mitzvah.computeWindow({ date, location, settings, zmanim });
    if (!window || window.end.getTime() <= now.getTime()) continue;
    if (isSkippedAt(mitzvah, window.start, location, settings)) continue;
    return { ...window, date };
  }
  return null;
}

export function buildDayTimeline(
  date: Date,
  mitzvot: Mitzvah[],
  completions: Completions,
  location: Location,
  settings: UserSettings,
  language: 'he' | 'en',
  t: Translate,
  zmanim: Zmanim | null = ZmanimService.getZmanim(locationNoon(date, location), location),
): TimelineItem[] {
  if (!zmanim) return [];
  const timeline: TimelineItem[] = ZMAN_KEYS.map((key) => ({
    id: key,
    name: t(`zman.${key}`),
    time: zmanim[key],
    type: 'zman',
  }));
  const selectedDateKey = dateKey(date);
  const doneToday = completions[selectedDateKey] ?? {};
  const isToday = selectedDateKey === dateKey(new Date());
  mitzvot.forEach((mitzvah) => {
    const window = mitzvah.computeWindow({ date, location, settings, zmanim });
    if (!window) return;
    if (isSkippedAt(mitzvah, window.start, location, settings)) return;
    timeline.push({
      id: `${mitzvah.id}-${window.start.toISOString()}`,
      name: language === 'en' && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he,
      time: window.start,
      type: 'mitzvah',
      done: Boolean(doneToday[mitzvah.id]),
      // Bounded on both sides. Unbounded, the comparison stayed true once `remaining` went
      // negative, so mitzvot that closed hours ago kept rendering "ending soon" all day — and it
      // also fired before a short window (candle lighting is 18 minutes) had even opened.
      urgent:
        isToday &&
        window.end.getTime() - Date.now() > 0 &&
        window.end.getTime() - Date.now() <= 45 * 60 * 1000,
      expired: isToday && window.end.getTime() <= Date.now(),
      mitzvahId: mitzvah.id,
      windowEnd: window.end,
    });
  });

  timeline.sort((a, b) => a.time.getTime() - b.time.getTime());
  return timeline;
}
