import { DateTime } from 'luxon';
import { CustomMitzvah, Mitzvah, MitzvahWindow, Nusach } from '@/types/mitzvah';
import { MITZVOT, findMitzvah as findStaticMitzvah } from '@/data/mitzvot';
import { useCustomMitzvotStore } from '@/stores/useCustomMitzvotStore';

const ALL_NUSCHAOT: Nusach[] = ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'];

function parseHHMM(value: string): { h: number; m: number } {
  const [hStr, mStr] = (value ?? '').split(':');
  const h = Math.max(0, Math.min(23, Number(hStr) || 0));
  const m = Math.max(0, Math.min(59, Number(mStr) || 0));
  return { h, m };
}

function buildWindow(start: Date, end: Date): MitzvahWindow {
  if (end.getTime() <= start.getTime()) return null;
  return { start, end };
}

export function customToMitzvah(c: CustomMitzvah): Mitzvah {
  const { h: sh, m: sm } = parseHHMM(c.startHHMM);
  const { h: eh, m: em } = parseHHMM(c.endHHMM);
  return {
    id: c.id,
    name: { he: c.name },
    icon: 'custom',
    timeType: 'range-within-day',
    category: c.category,
    skipOn: c.skipOn,
    nuschaotSupported: ALL_NUSCHAOT,
    defaultReminders: c.reminders,
    isCustom: true,
    computeWindow: ({ date, location }) => {
      const tz = location.tz;
      const base = DateTime.fromJSDate(date).setZone(tz);
      const start = base.set({ hour: sh, minute: sm, second: 0, millisecond: 0 }).toJSDate();
      const end = base.set({ hour: eh, minute: em, second: 0, millisecond: 0 }).toJSDate();
      return buildWindow(start, end);
    },
  };
}

export function getAllMitzvot(): Mitzvah[] {
  const customs = useCustomMitzvotStore.getState().list().map(customToMitzvah);
  return [...MITZVOT, ...customs];
}

export function findAnyMitzvah(id: string): Mitzvah | undefined {
  const fromStatic = findStaticMitzvah(id);
  if (fromStatic) return fromStatic;
  const custom = useCustomMitzvotStore.getState().items[id];
  return custom ? customToMitzvah(custom) : undefined;
}
