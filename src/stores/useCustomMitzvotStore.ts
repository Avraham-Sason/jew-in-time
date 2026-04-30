import { create } from 'zustand';
import { persist, createJSONStorage } from './zustandMiddleware';
import { createZustandStorage } from '@/services/StorageService';
import { CustomMitzvah } from '@/types/mitzvah';

type CustomMitzvotState = {
  items: Record<string, CustomMitzvah>;
  add: (mitzvah: CustomMitzvah) => void;
  update: (id: string, patch: Partial<CustomMitzvah>) => void;
  remove: (id: string) => void;
  list: () => CustomMitzvah[];
  reset: () => void;
};

export const useCustomMitzvotStore = create<CustomMitzvotState>()(
  persist(
    (set, get) => ({
      items: {},
      add: (mitzvah) =>
        set((s) => ({ items: { ...s.items, [mitzvah.id]: mitzvah } })),
      update: (id, patch) =>
        set((s) => {
          const cur = s.items[id];
          if (!cur) return s;
          return { items: { ...s.items, [id]: { ...cur, ...patch } } };
        }),
      remove: (id) =>
        set((s) => {
          const next = { ...s.items };
          delete next[id];
          return { items: next };
        }),
      list: () => Object.values(get().items).sort((a, b) => a.createdAt - b.createdAt),
      reset: () => set({ items: {} }),
    }),
    {
      name: 'custom-mitzvot-store',
      storage: createJSONStorage(() => createZustandStorage()),
    },
  ),
);

export function makeCustomMitzvahId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
