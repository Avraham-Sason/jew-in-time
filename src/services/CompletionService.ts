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

  isDone(mitzvahId: string, date: Date = new Date()): boolean {
    return useCompletionsStore.getState().isDone(mitzvahId, date);
  },

  getDateKey: dateKey,
};
