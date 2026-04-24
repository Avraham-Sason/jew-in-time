import { useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import heTable from './he.json';
import enTable from './en.json';

export type AppLanguage = 'he' | 'en';

type Dict = Record<string, string>;
const tables: Record<AppLanguage, Dict> = {
  he: heTable as Dict,
  en: enTable as Dict,
};

let currentLocale: AppLanguage = 'he';
const defaultLocale: AppLanguage = 'he';

export function setLocale(language: AppLanguage): void {
  currentLocale = language;
}

function interpolate(str: string, options?: Record<string, unknown>): string {
  if (!options) return str;
  return str.replace(/%\{(\w+)\}/g, (_, key) =>
    options[key] !== undefined ? String(options[key]) : `%{${key}}`,
  );
}

export function t(scope: string, options?: Record<string, unknown>): string {
  const primary = tables[currentLocale]?.[scope];
  if (typeof primary === 'string') return interpolate(primary, options);
  const fallback = tables[defaultLocale]?.[scope];
  if (typeof fallback === 'string') return interpolate(fallback, options);
  return `[missing "${currentLocale}.${scope}" translation]`;
}

export function useI18n() {
  const language = useUserStore((s) => s.language);

  useEffect(() => {
    setLocale(language);
  }, [language]);

  return {
    language,
    t,
  };
}
