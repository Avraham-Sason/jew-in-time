import * as ExpoLocation from 'expo-location';
import { CITIES } from '@/data/cities';
import { Location } from '@/types/zmanim';

export type LocationStatus = 'ready' | 'denied' | 'timeout' | 'missing';
export type LocationSource = 'gps' | 'manual';

export type LocationResolution = {
  location: Location;
  status: LocationStatus;
  source: LocationSource;
};

const DEFAULT_TIMEOUT_MS = 10000;

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const q =
    s1 * s1 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * s2 * s2;
  return 6371 * 2 * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
}

function nearestCity(lat: number, lng: number): Location {
  return CITIES.reduce((best, city) => {
    const nextDistance = distanceKm(lat, lng, city.lat, city.lng);
    const bestDistance = distanceKm(lat, lng, best.lat, best.lng);
    return nextDistance < bestDistance ? city : best;
  }, CITIES[0]);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), timeoutMs);
    }),
  ]);
}

export const LocationService = {
  async getPermissionStatus(): Promise<LocationStatus> {
    const perm = await ExpoLocation.getForegroundPermissionsAsync();
    if (perm.granted) return 'ready';
    if (perm.canAskAgain === false) return 'denied';
    return 'missing';
  },

  async requestPermission(): Promise<LocationStatus> {
    const perm = await ExpoLocation.requestForegroundPermissionsAsync();
    if (perm.granted) return 'ready';
    return perm.canAskAgain === false ? 'denied' : 'missing';
  },

  async getCurrentLocation(timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<LocationResolution> {
    const currentStatus = await this.getPermissionStatus();
    if (currentStatus === 'missing') {
      const requested = await this.requestPermission();
      if (requested !== 'ready') {
        return { location: CITIES[0], status: requested, source: 'manual' };
      }
    }
    if ((await this.getPermissionStatus()) !== 'ready') {
      return { location: CITIES[0], status: 'denied', source: 'manual' };
    }

    try {
      const result = await withTimeout(
        ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        }),
        timeoutMs,
      );
      const city = nearestCity(result.coords.latitude, result.coords.longitude);
      return {
        location: {
          ...city,
          lat: result.coords.latitude,
          lng: result.coords.longitude,
        },
        status: 'ready',
        source: 'gps',
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'timeout') {
        return { location: CITIES[0], status: 'timeout', source: 'manual' };
      }
      return { location: CITIES[0], status: 'missing', source: 'manual' };
    }
  },

  getFallbackCities(): Location[] {
    return CITIES;
  },
};
