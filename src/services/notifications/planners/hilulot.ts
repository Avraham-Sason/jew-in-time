import { DateTime } from 'luxon';
import type { HDate } from '@hebcal/core';
import type { HolyBlock, Location } from '@/types/zmanim';
import { Hilula, hilulaDateLabel, hilulotOn } from '@/data/hilulot';
import { ZmanimService } from '@/services/ZmanimService';
import { isQuietAt } from '@/utils/skipRules';
import { locationNoon } from '@/utils/locationDay';
import { civilHebrewDayAt } from '@/utils/taharah/onot';
import { t } from '@/i18n';
import { HILULA_KIND, type HilulaWhen } from '@/services/notifications/ids';
import type { PlanInput, ScheduleCandidate } from '@/services/notifications/types';
import type { Horizon } from '@/services/notifications/planners/horizon';

type HilulaNotice = { trigger: Date; day: HDate; when: HilulaWhen; hilulot: Hilula[] };

// A hilula's Hebrew date opens at shkia, so its notices fire at the shkia that opens it and at the
// shkia a day before. `day` is a calendar day as the horizon holds it. Its Hebrew day comes from
// the civil date, not from the hour: in an Arctic winter shkia comes before noon.
function hilulaNoticesOn(day: Date, location: Location, inIsrael: boolean): HilulaNotice[] {
  const noon = locationNoon(day, location);
  const shkia = ZmanimService.getZmanim(noon, location)?.shkia;
  if (!shkia) return [];
  const tonight = civilHebrewDayAt(noon, location).next();
  const notices: [HilulaWhen, HDate][] = [
    ['evening', tonight],
    ['before', tonight.next()],
  ];
  return notices.flatMap(([when, date]) => {
    const hilulot = hilulotOn(date, inIsrael);
    return hilulot.length ? [{ trigger: shkia, day: date, when, hilulot }] : [];
  });
}

function hilulaNames(hilulot: Hilula[], english: boolean): string {
  return hilulot.map((hilula) => (english ? hilula.name.en : hilula.name.he)).join(', ');
}

function hilulaCandidate({ trigger, day, when, hilulot }: HilulaNotice, english: boolean): ScheduleCandidate {
  return {
    id: `${HILULA_KIND}:${day.abs()}:${when}`,
    trigger,
    channel: 'hilulot',
    title: t(`hilulot.notice.${when}.title`, { names: hilulaNames(hilulot, english) }),
    body: t(`hilulot.notice.${when}.body`, { date: hilulaDateLabel(day, english ? 'en' : 'he') }),
    data: { kind: HILULA_KIND, hilula: { day: day.abs(), when } },
  };
}

// A notice that would fire inside a holy block is named in that block's pre-block notice instead.
export function planHilulot(input: PlanInput, horizon: Horizon): ScheduleCandidate[] {
  if (!input.hilulotEnabled) return [];
  const { location, settings, now } = input;
  const english = input.language === 'en';
  return horizon.days
    .flatMap((day) => hilulaNoticesOn(day, location, settings.inIsrael))
    .filter((notice) => notice.trigger.getTime() > now.getTime() && !isQuietAt(notice.trigger, location))
    .map((notice) => hilulaCandidate(notice, english));
}

// One line per hilula whose notice the block swallows, naming the evening its date opens.
export function hilulaLines(block: HolyBlock, input: PlanInput): string[] {
  const { location, settings } = input;
  const english = input.language === 'en';
  const erev = DateTime.fromISO(block.days[0], { zone: location.tz }).minus({ days: 1 });
  const evenings = [erev, ...block.days.map((day) => DateTime.fromISO(day, { zone: location.tz }))];
  const swallowed = new Map<number, HilulaNotice>();
  for (const evening of evenings) {
    const day = new Date(evening.year, evening.month - 1, evening.day);
    for (const notice of hilulaNoticesOn(day, location, settings.inIsrael)) {
      if (isQuietAt(notice.trigger, location) && !swallowed.has(notice.day.abs()))
        swallowed.set(notice.day.abs(), notice);
    }
  }
  const locale = english ? 'en' : 'he';
  return [...swallowed.values()].map(({ day, hilulot }) => {
    const opens = DateTime.fromJSDate(day.prev().greg());
    const names = hilulaNames(hilulot, english);
    return opens.toISODate() === erev.toISODate()
      ? t('holyBlock.notice.hilulaTonight', { names })
      : t('holyBlock.notice.hilulaOn', { names, day: opens.setLocale(locale).toFormat('cccc') });
  });
}
