import { create } from 'zustand';
import { persist, createJSONStorage } from './zustandMiddleware';
import { createZustandStorage } from '@/services/StorageService';
import { STORE_VERSION, onRehydrateStorage } from './persistOptions';

export type Completions = Record<string, Record<string, number>>;

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

export const RETENTION_DAYS = 400;

// Returns the ORIGINAL map when nothing changes. The old version returned `{}` for a missing day,
// which made every markDone write an empty `"YYYY-MM-DD": {}` bucket into the sibling map — pure
// noise that still had to be serialised on every tap.
function withoutMark(
  source: Record<string, number> | undefined,
  id: string,
): Record<string, number> | undefined {
  if (!source?.[id]) return source;
  const next = { ...source };
  delete next[id];
  return Object.keys(next).length ? next : undefined;
}

function setDay(
  map: Completions,
  key: string,
  value: Record<string, number> | undefined,
): Completions {
  if (!value) {
    if (!(key in map)) return map;
    const next = { ...map };
    delete next[key];
    return next;
  }
  return { ...map, [key]: value };
}

// The maps are rewritten to MMKV on every single tap, so they cannot grow without bound. The UI
// never reads further back than the history window.
export function pruneCompletions(map: Completions, today: Date = new Date()): Completions {
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  const cutoffKey = dateKey(cutoff);
  const entries = Object.entries(map).filter(([key, value]) => key >= cutoffKey && Object.keys(value).length);
  return entries.length === Object.keys(map).length ? map : Object.fromEntries(entries);
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
          completions: { ...s.completions, [key]: { ...(s.completions[key] ?? {}), [id]: Date.now() } },
          skipped: setDay(s.skipped, key, withoutMark(s.skipped[key], id)),
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
          completions: setDay(s.completions, key, withoutMark(s.completions[key], id)),
          skipped: { ...s.skipped, [key]: { ...(s.skipped[key] ?? {}), [id]: Date.now() } },
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
        set((s) => ({
          completions: setDay(s.completions, key, withoutMark(s.completions[key], id)),
          skipped: setDay(s.skipped, key, withoutMark(s.skipped[key], id)),
        }));
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
      version: STORE_VERSION,
      onRehydrateStorage: onRehydrateStorage('completions-store'),
      merge: (persisted: unknown, current: CompletionsState): CompletionsState => {
        const saved = persisted as Partial<CompletionsState> | undefined;
        return {
          ...current,
          ...saved,
          completions: pruneCompletions(saved?.completions ?? {}),
          skipped: pruneCompletions(saved?.skipped ?? {}),
        };
      },
    },
  ),
);
