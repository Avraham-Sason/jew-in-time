import { create } from 'zustand';
import { persist, createJSONStorage } from './zustandMiddleware';
import { createZustandStorage } from '@/services/StorageService';
import { Nusach, HalachicOpinion } from '@/types/mitzvah';
import { Location } from '@/types/zmanim';
import { CITIES } from '@/data/cities';
import type { LocationSource, LocationStatus } from '@/services/LocationService';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'he' | 'en';
export type NotificationPermissionStatus = 'unknown' | 'granted' | 'denied';

type UserState = {
  nusach: Nusach;
  location: Location;
  locationStatus: LocationStatus;
  locationSource: LocationSource;
  theme: ThemeMode;
  language: Language;
  notificationPermission: NotificationPermissionStatus;
  notificationsEnabled: boolean;
  profileName: string;
  profilePhone: string;
  halachicOpinions: { ksSofZman: HalachicOpinion };
  inIsrael: boolean;
  isOnboarded: boolean;
  setNusach: (n: Nusach) => void;
  setLocation: (l: Location) => void;
  setLocationState: (l: Location, status: LocationStatus, source: LocationSource) => void;
  setTheme: (t: ThemeMode) => void;
  setLanguage: (l: Language) => void;
  setNotificationPermission: (status: NotificationPermissionStatus) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setProfileName: (v: string) => void;
  setProfilePhone: (v: string) => void;
  setKsOpinion: (o: HalachicOpinion) => void;
  setInIsrael: (v: boolean) => void;
  setOnboarded: (v: boolean) => void;
  reset: () => void;
};

const DEFAULT_LOCATION = CITIES[0];

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      nusach: 'ashkenaz',
      location: DEFAULT_LOCATION,
      locationStatus: 'ready',
      locationSource: 'manual',
      theme: 'system',
      language: 'he',
      notificationPermission: 'unknown',
      notificationsEnabled: true,
      profileName: '',
      profilePhone: '',
      halachicOpinions: { ksSofZman: 'GRA' },
      inIsrael: true,
      isOnboarded: false,
      setNusach: (n) => set({ nusach: n }),
      setLocation: (l) => set({ location: l, inIsrael: l.inIsrael }),
      setLocationState: (l, status, source) =>
        set({ location: l, inIsrael: l.inIsrael, locationStatus: status, locationSource: source }),
      setTheme: (t) => set({ theme: t }),
      setLanguage: (l) => set({ language: l }),
      setNotificationPermission: (status) => set({ notificationPermission: status }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setProfileName: (v) => set({ profileName: v }),
      setProfilePhone: (v) => set({ profilePhone: v }),
      setKsOpinion: (o) => set((s) => ({ halachicOpinions: { ...s.halachicOpinions, ksSofZman: o } })),
      setInIsrael: (v) => set({ inIsrael: v }),
      setOnboarded: (v) => set({ isOnboarded: v }),
      reset: () =>
        set({
          nusach: 'ashkenaz',
          location: DEFAULT_LOCATION,
          locationStatus: 'ready',
          locationSource: 'manual',
          theme: 'system',
          language: 'he',
          notificationPermission: 'unknown',
          notificationsEnabled: true,
          profileName: '',
          profilePhone: '',
          halachicOpinions: { ksSofZman: 'GRA' },
          inIsrael: true,
          isOnboarded: false,
        }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => createZustandStorage()),
    },
  ),
);
