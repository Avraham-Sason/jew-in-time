import { useEffect } from 'react';
import { I18n } from 'i18n-js';
import { useUserStore } from '@/stores/useUserStore';

export type AppLanguage = 'he' | 'en';

const i18n = new I18n({
  he: require('./he.json'),
  en: require('./en.json'),
});

i18n.defaultLocale = 'he';
i18n.enableFallback = true;
i18n.locale = 'he';

export function setLocale(language: AppLanguage): void {
  i18n.locale = language;
}

export function t(scope: string, options?: Record<string, unknown>): string {
  return i18n.t(scope, options) as string;
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
