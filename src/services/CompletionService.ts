import { useCompletionsStore, dateKey } from '@/stores/useCompletionsStore';
import { NotificationScheduler } from './NotificationScheduler';

// The store actions already queue the matching scheduler call, so this layer only awaits it — it
// used to fire a second, identical cancel/rebuild for every completion.
export const CompletionService = {
  async markDone(mitzvahId: string, date: Date = new Date()): Promise<void> {
    useCompletionsStore.getState().markDone(mitzvahId, date);
    try {
      await NotificationScheduler.cancelForMitzvah(mitzvahId, date);
    } catch {}
  },

  async unmark(mitzvahId: string, date: Date = new Date()): Promise<void> {
    useCompletionsStore.getState().unmark(mitzvahId, date);
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
