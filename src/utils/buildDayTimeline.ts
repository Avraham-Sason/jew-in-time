import { Mitzvah, UserSettings } from '@/types/mitzvah';
import { Location, Zmanim } from '@/types/zmanim';
import { ZmanimService } from '@/services/ZmanimService';
import { Completions, dateKey } from '@/stores/useCompletionsStore';

export type TimelineItem = {
  id: string;
  name: string;
  time: Date;
  type: 'zman' | 'mitzvah';
  done?: boolean;
  urgent?: boolean;
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

export function buildDayTimeline(
  date: Date,
  mitzvot: Mitzvah[],
  completions: Completions,
  location: Location,
  settings: UserSettings,
  language: 'he' | 'en',
  t: Translate,
  zmanim: Zmanim = ZmanimService.getZmanim(date, location),
): TimelineItem[] {
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
    timeline.push({
      id: `${mitzvah.id}-${window.start.toISOString()}`,
      name: language === 'en' && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he,
      time: window.start,
      type: 'mitzvah',
      done: Boolean(doneToday[mitzvah.id]),
      urgent: isToday && window.end.getTime() - Date.now() <= 45 * 60 * 1000,
      mitzvahId: mitzvah.id,
      windowEnd: window.end,
    });
  });

  timeline.sort((a, b) => a.time.getTime() - b.time.getTime());
  return timeline;
}
