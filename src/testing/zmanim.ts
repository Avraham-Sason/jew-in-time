import { ZmanimService } from '@/services/ZmanimService';
import { Location, Zmanim } from '@/types/zmanim';

// Test-only fixture helper. `getZmanim` returns null when the sun neither rises nor sets, which
// never happens for the locations used in fixtures — so a null here means the fixture is wrong.
export function zmanimFor(date: Date, loc: Location): Zmanim {
  const zmanim = ZmanimService.getZmanim(date, loc);
  if (!zmanim) throw new Error(`no zmanim for ${loc.name} on ${date.toISOString()}`);
  return zmanim;
}
