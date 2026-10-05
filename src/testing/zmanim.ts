import { DateTime } from 'luxon';
import { ZmanimService } from '@/services/ZmanimService';
import { Location, Zmanim } from '@/types/zmanim';

// Test-only fixture helper. `getZmanim` returns null when the sun neither rises nor sets, which
// never happens for the locations used in fixtures — so a null here means the fixture is wrong.
export function zmanimFor(date: Date, loc: Location): Zmanim {
  const zmanim = ZmanimService.getZmanim(date, loc);
  if (!zmanim) throw new Error(`no zmanim for ${loc.name} on ${date.toISOString()}`);
  return zmanim;
}

// The instant a wall clock at the location shows `wallClock` ("2026-04-24T20:00"). A fixture built
// with `new Date(2026, 3, 24, 20)` is 20:00 on the DEVICE's clock, which is a different moment, and
// often a different day, at the location once the zones differ.
export function at(loc: Location, wallClock: string): Date {
  const instant = DateTime.fromISO(wallClock, { zone: loc.tz });
  if (!instant.isValid) throw new Error(`bad wall-clock fixture ${wallClock} for ${loc.name}`);
  return instant.toJSDate();
}
