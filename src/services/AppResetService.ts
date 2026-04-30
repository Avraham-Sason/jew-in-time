import { Platform } from 'react-native';
import { storage } from '@/services/StorageService';
import { useUserStore } from '@/stores/useUserStore';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useCompletionsStore } from '@/stores/useCompletionsStore';
import { useCustomMitzvotStore } from '@/stores/useCustomMitzvotStore';
import { NotificationScheduler } from '@/services/NotificationScheduler';

export const AppResetService = {
  async reset(): Promise<void> {
    try {
      await NotificationScheduler.cancelAll();
    } catch {}
    useUserStore.getState().reset();
    useMitzvotStore.getState().reset();
    useCompletionsStore.getState().reset();
    useCustomMitzvotStore.getState().reset();
    if (Platform.OS !== 'web') {
      try {
        storage.clearAll();
      } catch {}
    }
  },
};
