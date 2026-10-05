import { Mitzvah, Nusach } from '@/types/mitzvah';
import { Location } from '@/types/zmanim';
import { Condition, Place, SiddurText, SiddurTextId } from '@/types/siddur';
import { isJerusalem } from './mitzvot';
import { dayFeatures, liturgicalDay, matchesCondition } from '@/utils/siddur';
import { SIDDUR_ASSETS } from './siddurAssets.generated';

type SiddurEntry = { evening: boolean; available?: Condition };

export const SIDDUR_TEXTS: Record<SiddurTextId, SiddurEntry> = {
  tefillin: { evening: false },
  tzitzit: { evening: false },
  birchot_hashachar: { evening: false },
  krias_shma_shacharit: { evening: false },
  candle_lighting: { evening: true },
  havdalah: { evening: true, available: { none: ['yomTov'] } },
  sefirat_haomer: { evening: true },
  shacharit: { evening: false, available: { none: ['shabbat', 'yomTov', 'yomKippur'] } },
  mincha: { evening: false, available: { none: ['shabbat', 'yomTov', 'yomKippur'] } },
  maariv: { evening: true, available: { none: ['shabbat', 'yomTov', 'yomKippur'] } },
};

const ASSETS: Record<Nusach, Partial<Record<SiddurTextId, number>>> = SIDDUR_ASSETS;

export function siddurTextId(mitzvahId: string): SiddurTextId | null {
  return mitzvahId in SIDDUR_TEXTS ? (mitzvahId as SiddurTextId) : null;
}

export function siddurAsset(nusach: Nusach, id: SiddurTextId): number | undefined {
  return ASSETS[nusach]?.[id];
}

export function customSiddurText(mitzvah: Mitzvah, nusach: Nusach): SiddurText | null {
  const blocks = mitzvah.contentBlocks?.filter((block) => block.type !== 'link') ?? [];
  if (!blocks.length) return null;
  return {
    nusach,
    id: mitzvah.id,
    sections: [
      {
        title: { he: mitzvah.name.he, en: mitzvah.name.en ?? mitzvah.name.he },
        segments: blocks.map((block) => ({
          he: [[{ t: block.he, ...(block.type === 'blessing' ? { s: 'b' as const } : {}) }]],
          ...(block.en ? { en: block.en } : {}),
        })),
      },
    ],
    credits: [],
  };
}

export function siddurPlace(location: Location, inIsrael: boolean): Place {
  return { inIsrael, jerusalem: isJerusalem(location) };
}

export function hasSiddurText(mitzvah: Mitzvah, nusach: Nusach, windowDate: Date, place: Place): boolean {
  if (mitzvah.isCustom) return customSiddurText(mitzvah, nusach) !== null;
  const id = siddurTextId(mitzvah.id);
  if (!id || siddurAsset(nusach, id) === undefined) return false;
  const { evening, available } = SIDDUR_TEXTS[id];
  return matchesCondition(available, dayFeatures(liturgicalDay(windowDate, evening), place));
}
