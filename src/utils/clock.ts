import { DateTime } from 'luxon';

type Translate = (scope: string) => string;

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatRemaining(ms: number, t: Translate): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  if (totalMin >= 60) {
    const hours = Math.floor(totalMin / 60);
    const minutes = String(totalMin % 60).padStart(2, '0');
    return `${hours}:${minutes} ${t('time.unit.hours')}`;
  }
  return `${totalMin} ${t('time.unit.minutes')}`;
}

export function clockOf(date: Date, zone?: string): string {
  return DateTime.fromJSDate(date, { zone }).toFormat('HH:mm');
}
