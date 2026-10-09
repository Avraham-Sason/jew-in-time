import { Mitzvah } from '@/types/mitzvah';

export function mitzvahName(mitzvah: Pick<Mitzvah, 'name'>, language: 'he' | 'en'): string {
  return language === 'en' && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he;
}
