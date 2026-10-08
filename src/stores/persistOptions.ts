import { storage } from '@/services/StorageService';

// Every store carries a version so a future shape change has somewhere to live. Without one,
// zustand's default merge is a single-level spread: a persisted nested object (activeMitzvot, a
// Location snapshot) wholesale replaces the fresh default and never picks up new fields.
export const STORE_VERSION = 1;

// A corrupt value makes zustand's hydrate path short-circuit silently: the store keeps its
// defaults, `hasHydrated` stays false, and the bad bytes stay on disk to fail again next launch —
// which reads as "fresh install" and throws the user back into onboarding. Drop it instead, from the
// storage the store actually persists to.
export function onRehydrateStorage<T>(
  name: string,
  target: Pick<typeof storage, 'delete'> = storage,
): (state: T) => (state?: T, error?: unknown) => void {
  return () => (_state?: T, error?: unknown) => {
    if (!error) return;
    if (__DEV__) console.warn(`[storage] dropping corrupt "${name}" payload`, error);
    try {
      target.delete(name);
    } catch {}
  };
}
