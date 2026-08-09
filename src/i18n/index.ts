import { useCallback } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import heTable from './he.json';
import enTable from './en.json';

export type AppLanguage = 'he' | 'en';

type Dict = Record<string, string>;
const tables: Record<AppLanguage, Dict> = {
  he: heTable as Dict,
  en: enTable as Dict,
};

const defaultLocale: AppLanguage = 'he';
let currentLocale: AppLanguage = useUserStore.getState().language;

export function setLocale(language: AppLanguage): void {
  currentLocale = language;
}

// Non-React callers (the notification scheduler, most of all) read `currentLocale` directly, so it
// has to track the store rather than wait for a component effect to push it.
useUserStore.subscribe((state) => setLocale(state.language));

function interpolate(str: string, options?: Record<string, unknown>): string {
  if (!options) return str;
  return str.replace(/%\{(\w+)\}/g, (_, key) =>
    options[key] !== undefined ? String(options[key]) : `%{${key}}`,
  );
}

export function translate(
  scope: string,
  options?: Record<string, unknown>,
  locale: AppLanguage = currentLocale,
): string {
  const primary = tables[locale]?.[scope];
  if (typeof primary === 'string') return interpolate(primary, options);
  const fallback = tables[defaultLocale]?.[scope];
  if (typeof fallback === 'string') return interpolate(fallback, options);
  return `[missing "${locale}.${scope}" translation]`;
}

export function t(scope: string, options?: Record<string, unknown>): string {
  return translate(scope, options, currentLocale);
}

export function useI18n() {
  const language = useUserStore((s) => s.language);
  // Bound to this render's language, so a language switch cannot render one frame of stale copy,
  // and `useMemo`s keyed on `t` actually refresh.
  const boundT = useCallback(
    (scope: string, options?: Record<string, unknown>) => translate(scope, options, language),
    [language],
  );
  return { language, t: boundT };
}
