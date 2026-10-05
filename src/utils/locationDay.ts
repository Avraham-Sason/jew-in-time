import { DateTime } from 'luxon';
import { Location } from '@/types/zmanim';

// A calendar day the app shows or keys (device-local, as dateKey reads it) is the SAME date at the
// location. Its device-local midnight is not: east of the location it falls on the previous day
// there, so ZmanimService would resolve that day's zmanim. Midday at the location is unambiguous.
export function locationNoon(day: Date, location: Location): Date {
  return DateTime.fromObject(
    { year: day.getFullYear(), month: day.getMonth() + 1, day: day.getDate(), hour: 12 },
    { zone: location.tz },
  ).toJSDate();
}
