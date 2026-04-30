import { create } from 'zustand';
import { persist, createJSONStorage } from './zustandMiddleware';
import { createZustandStorage } from '@/services/StorageService';
import { MITZVOT } from '@/data/mitzvot';
import { Reminder } from '@/types/mitzvah';

export type ActiveMitzvahState = {
  enabled: boolean;
  customReminders?: Reminder[];
};

type MitzvotState = {
  activeMitzvot: Record<string, ActiveMitzvahState>;
  setEnabled: (id: string, enabled: boolean) => void;
  toggleEnabled: (id: string) => void;
  setReminders: (id: string, reminders: Reminder[]) => void;
  resetToDefault: (id: string) => void;
  getEnabledIds: () => string[];
  removeMitzvah: (id: string) => void;
  reset: () => void;
};

const DEFAULT_ACTIVE: Record<string, ActiveMitzvahState> = Object.fromEntries(
  MITZVOT.filter((m) => ['tefillin', 'tzitzit', 'krias_shma_shacharit', 'shacharit', 'mincha', 'maariv'].includes(m.id))
    .map((m) => [m.id, { enabled: true }]),
);

for (const m of MITZVOT) {
  if (!(m.id in DEFAULT_ACTIVE)) DEFAULT_ACTIVE[m.id] = { enabled: false };
}

export const useMitzvotStore = create<MitzvotState>()(
  persist(
    (set, get) => ({
      activeMitzvot: DEFAULT_ACTIVE,
      setEnabled: (id, enabled) =>
        set((s) => ({
          activeMitzvot: {
            ...s.activeMitzvot,
            [id]: { ...(s.activeMitzvot[id] ?? {}), enabled },
          },
        })),
      toggleEnabled: (id) =>
        set((s) => {
          const cur = s.activeMitzvot[id] ?? { enabled: false };
          return {
            activeMitzvot: { ...s.activeMitzvot, [id]: { ...cur, enabled: !cur.enabled } },
          };
        }),
      setReminders: (id, reminders) =>
        set((s) => ({
          activeMitzvot: {
            ...s.activeMitzvot,
            [id]: { ...(s.activeMitzvot[id] ?? { enabled: false }), customReminders: reminders },
          },
        })),
      resetToDefault: (id) =>
        set((s) => {
          const next = { ...s.activeMitzvot };
          next[id] = { enabled: next[id]?.enabled ?? false };
          return { activeMitzvot: next };
        }),
      getEnabledIds: () =>
        Object.entries(get().activeMitzvot)
          .filter(([, v]) => v.enabled)
          .map(([id]) => id),
      removeMitzvah: (id) =>
        set((s) => {
          const next = { ...s.activeMitzvot };
          delete next[id];
          return { activeMitzvot: next };
        }),
      reset: () => set({ activeMitzvot: { ...DEFAULT_ACTIVE } }),
    }),
    {
      name: 'mitzvot-store',
      storage: createJSONStorage(() => createZustandStorage()),
    },
  ),
);
