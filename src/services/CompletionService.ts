import { useCompletionsStore, dateKey } from '@/stores/useCompletionsStore';
import { NotificationScheduler } from './NotificationScheduler';

export const CompletionService = {
  async markDone(mitzvahId: string, date: Date = new Date()): Promise<void> {
    useCompletionsStore.getState().markDone(mitzvahId, date);
    try {
      await NotificationScheduler.cancelForMitzvah(mitzvahId, date);
    } catch {}
  },

  async unmark(mitzvahId: string, date: Date = new Date()): Promise<void> {
    useCompletionsStore.getState().unmark(mitzvahId, date);
    try {
      await NotificationScheduler.rebuild();
    } catch {}
  },

  async markSkipped(mitzvahId: string, date: Date = new Date()): Promise<void> {
    useCompletionsStore.getState().markSkipped(mitzvahId, date);
    try {
      await NotificationScheduler.cancelForMitzvah(mitzvahId, date);
    } catch {}
  },

  isDone(mitzvahId: string, date: Date = new Date()): boolean {
    return useCompletionsStore.getState().isDone(mitzvahId, date);
  },

  isSkipped(mitzvahId: string, date: Date = new Date()): boolean {
    return useCompletionsStore.getState().isSkipped(mitzvahId, date);
  },

  getDateKey: dateKey,
};
