import type { Nusach } from '@/types/mitzvah';
import { useTaharahStore } from './useTaharahStore';
import { Gender, useUserStore } from './useUserStore';

export function chooseGender(next: Gender): void {
  const user = useUserStore.getState();
  user.setGender(next);
  if (user.taharahEnabled) useTaharahStore.getState().setRoleForGender(next);
}

export function setTaharahTracking(next: boolean): void {
  const user = useUserStore.getState();
  user.setTaharahEnabled(next);
  if (next && user.gender) useTaharahStore.getState().startTracking(user.gender, user.nusach);
}

export function chooseNusach(next: Nusach): void {
  const user = useUserStore.getState();
  user.setNusach(next);
  if (user.taharahEnabled) useTaharahStore.getState().adoptPresetFor(next);
}
