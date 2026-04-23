import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createZustandStorage } from '@/services/StorageService';

type Completions = Record<string, Record<string, number>>;

type CompletionsState = {
  completions: Completions;
  markDone: (id: string, date?: Date) => void;
  unmark: (id: string, date?: Date) => void;
  isDone: (id: string, date?: Date) => boolean;
  countForDate: (date?: Date) => number;
  completionsForDate: (date?: Date) => Record<string, number>;
};

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
      markDone: (id, date = new Date()) => {
        const key = dateKey(date);
        set((s) => ({
          completions: {
            ...s.completions,
            [key]: { ...(s.completions[key] ?? {}), [id]: Date.now() },
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
          const cur = { ...(s.completions[key] ?? {}) };
          delete cur[id];
          return { completions: { ...s.completions, [key]: cur } };
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
      countForDate: (date = new Date()) => {
        const key = dateKey(date);
        return Object.keys(get().completions[key] ?? {}).length;
      },
      completionsForDate: (date = new Date()) => {
        const key = dateKey(date);
        return get().completions[key] ?? {};
      },
    }),
    {
      name: 'completions-store',
      storage: createJSONStorage(() => createZustandStorage()),
    },
  ),
);
