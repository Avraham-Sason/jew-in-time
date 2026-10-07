import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

export function appVersionLabel(): string {
  return `${Constants.expoConfig?.version ?? ''}-${process.env.EXPO_PUBLIC_UPDATE_NUMBER ?? 0}`;
}

export async function downloadNewUpdate(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;
  const { isAvailable } = await Updates.checkForUpdateAsync();
  if (isAvailable) await Updates.fetchUpdateAsync();
}
