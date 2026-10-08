import type { Nusach } from '@/types/mitzvah';
import { useTaharahStore } from './useTaharahStore';
import { Gender, MaritalStatus, useUserStore } from './useUserStore';

export const taharahOffered = (user: { gender: Gender | null; maritalStatus: MaritalStatus | null }): boolean =>
  user.gender !== null && user.maritalStatus === 'married';

export function chooseGender(next: Gender): void {
  const user = useUserStore.getState();
  user.setGender(next);
  if (user.taharahEnabled) useTaharahStore.getState().setRoleForGender(next);
}

export function chooseMaritalStatus(next: MaritalStatus): void {
  const user = useUserStore.getState();
  user.setMaritalStatus(next);
  if (next !== 'married' && user.taharahEnabled) user.setTaharahEnabled(false);
}

export function setTaharahTracking(next: boolean): void {
  const user = useUserStore.getState();
  if (next && !taharahOffered(user)) return;
  user.setTaharahEnabled(next);
  if (next && user.gender) useTaharahStore.getState().startTracking(user.gender, user.nusach);
}

export function chooseNusach(next: Nusach): void {
  const user = useUserStore.getState();
  user.setNusach(next);
  if (user.taharahEnabled) useTaharahStore.getState().adoptPresetFor(next);
}
