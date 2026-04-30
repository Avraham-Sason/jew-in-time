import { create } from 'zustand';
import { persist, createJSONStorage } from './zustandMiddleware';
import { createZustandStorage } from '@/services/StorageService';

type Completions = Record<string, Record<string, number>>;

type CompletionsState = {
  completions: Completions;
  skipped: Completions;
  markDone: (id: string, date?: Date) => void;
  markSkipped: (id: string, date?: Date) => void;
  unmark: (id: string, date?: Date) => void;
  isDone: (id: string, date?: Date) => boolean;
  isSkipped: (id: string, date?: Date) => boolean;
  countForDate: (date?: Date) => number;
  completionsForDate: (date?: Date) => Record<string, number>;
  skippedForDate: (date?: Date) => Record<string, number>;
  reset: () => void;
};

function removeDailyMark(source: Record<string, number> | undefined, id: string): Record<string, number> {
  if (!source?.[id]) return source ?? {};
  const next = { ...source };
  delete next[id];
  return next;
}

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const useCompletionsStore = create<CompletionsState>()(
  persist(
    (set, get) => ({
      completions: {},
      skipped: {},
      markDone: (id, date = new Date()) => {
        const key = dateKey(date);
        set((s) => ({
          completions: {
            ...s.completions,
            [key]: { ...(s.completions[key] ?? {}), [id]: Date.now() },
          },
          skipped: {
            ...s.skipped,
            [key]: removeDailyMark(s.skipped[key], id),
          },
        }));
        queueMicrotask(() => {
          try {
            const { NotificationScheduler } = require('@/services/NotificationScheduler');
            NotificationScheduler.cancelForMitzvah(id, date).catch(() => {});
          } catch {}
        });
      },
      markSkipped: (id, date = new Date()) => {
        const key = dateKey(date);
        set((s) => ({
          completions: {
            ...s.completions,
            [key]: removeDailyMark(s.completions[key], id),
          },
          skipped: {
            ...s.skipped,
            [key]: { ...(s.skipped[key] ?? {}), [id]: Date.now() },
          },
        }));
        queueMicrotask(() => {
          try {
            const { NotificationScheduler } = require('@/services/NotificationScheduler');
            NotificationScheduler.cancelForMitzvah(id, date).catch(() => {});
          } catch {}
        });
      },
      unmark: (id, date = new Date()) => {
        const key = dateKey(date);
        set((s) => {
          const completions = removeDailyMark(s.completions[key], id);
          const skipped = removeDailyMark(s.skipped[key], id);
          return {
            completions: { ...s.completions, [key]: completions },
            skipped: { ...s.skipped, [key]: skipped },
          };
        });
        queueMicrotask(() => {
          try {
            const { NotificationScheduler } = require('@/services/NotificationScheduler');
            NotificationScheduler.rebuild().catch(() => {});
          } catch {}
        });
      },
      isDone: (id, date = new Date()) => {
        const key = dateKey(date);
        return Boolean(get().completions[key]?.[id]);
      },
      isSkipped: (id, date = new Date()) => {
        const key = dateKey(date);
        return Boolean(get().skipped[key]?.[id]);
      },
      countForDate: (date = new Date()) => {
        const key = dateKey(date);
        return Object.keys(get().completions[key] ?? {}).length;
      },
      completionsForDate: (date = new Date()) => {
        const key = dateKey(date);
        return get().completions[key] ?? {};
      },
      skippedForDate: (date = new Date()) => {
        const key = dateKey(date);
        return get().skipped[key] ?? {};
      },
      reset: () => set({ completions: {}, skipped: {} }),
    }),
    {
      name: 'completions-store',
      storage: createJSONStorage(() => createZustandStorage()),
    },
  ),
);
