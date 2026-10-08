import { create } from 'zustand';
import { persist, createJSONStorage } from './zustandMiddleware';
import { createZustandStorage } from '@/services/StorageService';
import { STORE_VERSION, onRehydrateStorage } from './persistOptions';
import { Nusach, HalachicOpinion } from '@/types/mitzvah';
import { Location } from '@/types/zmanim';
import { CITIES } from '@/data/cities';
import type { LocationSource, LocationStatus } from '@/services/LocationService';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'he' | 'en';
export type NotificationPermissionStatus = 'unknown' | 'granted' | 'denied';
export type Gender = 'male' | 'female';
export type MaritalStatus = 'married' | 'single';

export const SIDDUR_FONT_SIZES = [18, 20, 22, 25, 28, 32] as const;
const DEFAULT_SIDDUR_FONT_SIZE = 22;

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
  siddurFontSize: number;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
  taharahEnabled: boolean;
  setNusach: (n: Nusach) => void;
  setLocation: (l: Location) => void;
  setLocationState: (l: Location, status: LocationStatus, source: LocationSource) => void;
  setLocationStatus: (status: LocationStatus) => void;
  setTheme: (t: ThemeMode) => void;
  setLanguage: (l: Language) => void;
  setNotificationPermission: (status: NotificationPermissionStatus) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setProfileName: (v: string) => void;
  setProfilePhone: (v: string) => void;
  setKsOpinion: (o: HalachicOpinion) => void;
  setInIsrael: (v: boolean) => void;
  setOnboarded: (v: boolean) => void;
  setSiddurFontSize: (size: number) => void;
  setGender: (g: Gender | null) => void;
  setMaritalStatus: (m: MaritalStatus | null) => void;
  setTaharahEnabled: (v: boolean) => void;
  reset: () => void;
};

type PersistedUserState = Partial<Pick<UserState, 'taharahEnabled' | 'maritalStatus'>>;

const DEFAULT_LOCATION = CITIES[0];

const mergeWithInferredMaritalStatus = (persisted: unknown, current: UserState): UserState => {
  const saved = (persisted ?? {}) as PersistedUserState;
  const merged = { ...current, ...saved };
  if (merged.taharahEnabled && merged.maritalStatus == null) merged.maritalStatus = 'married';
  return merged;
};

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
      siddurFontSize: DEFAULT_SIDDUR_FONT_SIZE,
      gender: null,
      maritalStatus: null,
      taharahEnabled: false,
      setNusach: (n) => set({ nusach: n }),
      setLocation: (l) => set({ location: l, inIsrael: l.inIsrael }),
      setLocationState: (l, status, source) =>
        set({ location: l, inIsrael: l.inIsrael, locationStatus: status, locationSource: source }),
      // Records that a lookup failed without touching the chosen location.
      setLocationStatus: (status) => set({ locationStatus: status }),
      setTheme: (t) => set({ theme: t }),
      setLanguage: (l) => set({ language: l }),
      setNotificationPermission: (status) => set({ notificationPermission: status }),
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setProfileName: (v) => set({ profileName: v }),
      setProfilePhone: (v) => set({ profilePhone: v }),
      setKsOpinion: (o) => set((s) => ({ halachicOpinions: { ...s.halachicOpinions, ksSofZman: o } })),
      setInIsrael: (v) => set({ inIsrael: v }),
      setOnboarded: (v) => set({ isOnboarded: v }),
      setSiddurFontSize: (size) => set({ siddurFontSize: size }),
      setGender: (g) => set({ gender: g }),
      setMaritalStatus: (m) => set({ maritalStatus: m }),
      setTaharahEnabled: (v) => set({ taharahEnabled: v }),
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
          siddurFontSize: DEFAULT_SIDDUR_FONT_SIZE,
          gender: null,
          maritalStatus: null,
          taharahEnabled: false,
        }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => createZustandStorage()),
      version: STORE_VERSION,
      merge: mergeWithInferredMaritalStatus,
      onRehydrateStorage: onRehydrateStorage('user-store'),
    },
  ),
);
