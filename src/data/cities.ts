import { Location } from '@/types/zmanim';

export const CITIES: Location[] = [
  { name: 'ירושלים', lat: 31.7683, lng: 35.2137, tz: 'Asia/Jerusalem', inIsrael: true, elevation: 754 },
  { name: 'תל אביב', lat: 32.0853, lng: 34.7818, tz: 'Asia/Jerusalem', inIsrael: true, elevation: 5 },
  { name: 'חיפה', lat: 32.7940, lng: 34.9896, tz: 'Asia/Jerusalem', inIsrael: true, elevation: 250 },
  { name: 'באר שבע', lat: 31.2518, lng: 34.7913, tz: 'Asia/Jerusalem', inIsrael: true, elevation: 260 },
  { name: 'נתניה', lat: 32.3215, lng: 34.8532, tz: 'Asia/Jerusalem', inIsrael: true },
  { name: 'אשדוד', lat: 31.8014, lng: 34.6435, tz: 'Asia/Jerusalem', inIsrael: true },
  { name: 'פתח תקווה', lat: 32.0878, lng: 34.8878, tz: 'Asia/Jerusalem', inIsrael: true },
  { name: 'בני ברק', lat: 32.0807, lng: 34.8338, tz: 'Asia/Jerusalem', inIsrael: true },
  { name: 'צפת', lat: 32.9646, lng: 35.4960, tz: 'Asia/Jerusalem', inIsrael: true, elevation: 900 },
  { name: 'אילת', lat: 29.5581, lng: 34.9482, tz: 'Asia/Jerusalem', inIsrael: true },
  { name: 'ניו יורק', lat: 40.7128, lng: -74.0060, tz: 'America/New_York', inIsrael: false },
  { name: 'לייקווד', lat: 40.0979, lng: -74.2176, tz: 'America/New_York', inIsrael: false },
  { name: 'לוס אנג\'לס', lat: 34.0522, lng: -118.2437, tz: 'America/Los_Angeles', inIsrael: false },
  { name: 'מיאמי', lat: 25.7617, lng: -80.1918, tz: 'America/New_York', inIsrael: false },
  { name: 'לונדון', lat: 51.5074, lng: -0.1278, tz: 'Europe/London', inIsrael: false },
  { name: 'פריז', lat: 48.8566, lng: 2.3522, tz: 'Europe/Paris', inIsrael: false },
  { name: 'אנטוורפן', lat: 51.2194, lng: 4.4025, tz: 'Europe/Brussels', inIsrael: false },
  { name: 'מלבורן', lat: -37.8136, lng: 144.9631, tz: 'Australia/Melbourne', inIsrael: false },
  { name: 'טורונטו', lat: 43.6532, lng: -79.3832, tz: 'America/Toronto', inIsrael: false },
  { name: 'מוסקבה', lat: 55.7558, lng: 37.6176, tz: 'Europe/Moscow', inIsrael: false },
];

export function findCityByName(name: string): Location | undefined {
  return CITIES.find((c) => c.name === name);
}
