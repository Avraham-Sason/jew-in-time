jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = require('react-native-mmkv/lib/commonjs/createMMKV.mock');
  return { MMKV: jest.fn(() => createMockMMKV()) };
});

import * as fs from 'fs';
import * as path from 'path';
import { HDate, gematriya, months } from '@hebcal/core';
import { SIDDUR_TEXTS, customSiddurText, hasSiddurText } from '../siddur';
import { SIDDUR_ASSETS } from '../siddurAssets.generated';
import { findMitzvah } from '../mitzvot';
import { Mitzvah, Nusach } from '@/types/mitzvah';
import { DayFeatures, Run, SiddurText, SiddurTextId } from '@/types/siddur';
import { dayFeatures, liturgicalDay, resolveSiddurText } from '@/utils/siddur';

const NUSCHAOT: Nusach[] = ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'];
const TEXT_IDS = Object.keys(SIDDUR_TEXTS) as SiddurTextId[];
const ASSET_DIR = path.join(__dirname, '..', '..', '..', 'assets', 'siddur');

function load(nusach: Nusach, id: SiddurTextId): SiddurText {
  return JSON.parse(fs.readFileSync(path.join(ASSET_DIR, nusach, `${id}.siddur`), 'utf8'));
}

function letters(text: string): string {
  return text
    .replace(/־/g, ' ')
    .replace(/[֑-ׇ͏]/g, '')
    .replace(/[״"׳'(),.:;]/g, '')
    .replace(/\s+/g, ' ');
}

function textOn(nusach: Nusach, id: SiddurTextId, day: DayFeatures, keep: (run: Run) => boolean): string {
  return letters(
    resolveSiddurText(load(nusach, id), day)
      .flatMap((section) => section.segments.flatMap((segment) => segment.he.map((runs) => runs.filter(keep).map((run) => run.t).join(''))))
      .join(' '),
  );
}

function saidOn(nusach: Nusach, id: SiddurTextId, day: DayFeatures): string {
  return textOn(nusach, id, day, (run) => run.s !== 'n');
}

function shownOn(nusach: Nusach, id: SiddurTextId, day: DayFeatures): string {
  return textOn(nusach, id, day, () => true);
}

const ISRAEL = { inIsrael: true, jerusalem: false };
const DIASPORA = { inIsrael: false, jerusalem: false };

function day(date: number, month: number, year: number, place = ISRAEL): DayFeatures {
  return dayFeatures(new HDate(date, month, year), place);
}

function civilDay(civil: Date, place = ISRAEL): DayFeatures {
  return dayFeatures(new HDate(civil), place);
}

function count(text: string, pattern: RegExp): number {
  return (text.match(new RegExp(pattern.source, 'g')) ?? []).length;
}

function eveningOf(civil: Date): DayFeatures {
  return dayFeatures(liturgicalDay(civil, true), ISRAEL);
}

function erev(day: number, month: number, year: number): Date {
  return new HDate(day, month, year).prev().greg();
}

describe('siddur content', () => {
  it('ships every registered text for every nusach, in step with the generated asset map', () => {
    for (const nusach of NUSCHAOT) {
      for (const id of TEXT_IDS) {
        expect((SIDDUR_ASSETS[nusach] as Record<string, unknown>)[id]).toBeDefined();
        const text = load(nusach, id);
        expect(text.nusach).toBe(nusach);
        expect(text.id).toBe(id);
        expect(text.sections.length).toBeGreaterThan(0);
        expect(text.credits.length).toBeGreaterThan(0);
        for (const credit of text.credits) {
          expect(credit.license).toMatch(/^(CC|Public Domain$)/);
          expect(credit.url).toMatch(/^https:\/\/(www\.sefaria\.org|he\.wikisource\.org)\//);
        }
        for (const segment of text.sections.flatMap((section) => section.segments)) {
          expect(segment.he.length).toBeGreaterThan(0);
          expect(segment.he.flat().some((run) => /[א-ת]/.test(run.t))).toBe(true);
          if (segment.en) expect(segment.en).toMatch(/[A-Za-z]{3,}/);
        }
      }
    }
  });

  it('registers texts only for real mitzvot', () => {
    for (const id of TEXT_IDS) expect(findMitzvah(id)).toBeDefined();
  });

  it('shows exactly the night’s omer count, for all 49 nights, in every nusach', () => {
    const monthName: Record<number, string> = { [months.NISAN]: 'ניסן', [months.IYYAR]: 'אייר', [months.SIVAN]: 'סיון' };
    for (const nusach of NUSCHAOT) {
      const text = load(nusach, 'sefirat_haomer');
      for (let day = 1; day <= 49; day++) {
        const resolved = resolveSiddurText(text, { flags: new Set(), omerDay: day });
        const counted = resolved.flatMap((section) => section.segments).filter((segment) => segment.when?.omerDay !== undefined);
        expect(counted.length).toBeGreaterThan(0);
        expect(counted.every((segment) => segment.when?.omerDay === day)).toBe(true);
        const hd = new HDate(15, months.NISAN, 5786).add(day);
        const label = letters(`${gematriya(hd.getDate())} ${monthName[hd.getMonth()]}`);
        const shown = letters(counted.flatMap((segment) => segment.he.flat().map((run) => run.t)).join(' '));
        expect(shown).toContain(label);
        expect(shown).toContain('היום');
      }
      const outside = resolveSiddurText(text, { flags: new Set(), omerDay: null });
      expect(outside.flatMap((section) => section.segments).some((segment) => segment.when?.omerDay !== undefined)).toBe(false);
    }
  });

  it('lights candles with the right blessing for each kind of evening, in every nusach', () => {
    const regularFriday = new Date(2026, 9, 9);
    const erevPesach = erev(15, months.NISAN, 5786);
    const erevLastDayPesach = erev(21, months.NISAN, 5786);
    const erevYomKippur = erev(10, months.TISHREI, 5787);
    const erevRoshHashanaOnShabbat = erev(1, months.TISHREI, 5787);
    expect([regularFriday, erevPesach, erevLastDayPesach, erevYomKippur].map((d) => d.getDay())).toEqual([5, 3, 2, 0]);
    expect(erevRoshHashanaOnShabbat.getDay()).toBe(5);

    for (const nusach of NUSCHAOT) {
      const shabbat = saidOn(nusach, 'candle_lighting', eveningOf(regularFriday));
      expect(shabbat).toMatch(/נר של שבת/);
      expect(shabbat).not.toMatch(/יום טוב|הכפורים|שהחינו/);

      const pesach = saidOn(nusach, 'candle_lighting', eveningOf(erevPesach));
      expect(pesach).toMatch(/נר של יום טוב/);
      expect(pesach).toMatch(/שהחינו/);
      expect(pesach).not.toMatch(/שבת/);

      const lastDay = saidOn(nusach, 'candle_lighting', eveningOf(erevLastDayPesach));
      expect(lastDay).toMatch(/נר של יום טוב/);
      expect(lastDay).not.toMatch(/שהחינו|שבת/);

      const yomKippur = saidOn(nusach, 'candle_lighting', eveningOf(erevYomKippur));
      expect(yomKippur).toMatch(/נר של יום הכפורים/);
      expect(yomKippur).toMatch(/שהחינו/);
      expect(yomKippur).not.toMatch(/נר של שבת|יום טוב/);

      const both = saidOn(nusach, 'candle_lighting', eveningOf(erevRoshHashanaOnShabbat));
      expect(both).toMatch(/נר של שבת ו(של )?יום טוב/);
      expect(both).toMatch(/שהחינו/);
    }
  });

  it('says only the blessing on the flame when Tisha B’Av begins at havdalah', () => {
    const regularSaturday = new Date(2026, 9, 10);
    const tishaBavOnShabbat = new HDate(9, months.AV, 5782).greg();
    expect(regularSaturday.getDay()).toBe(6);
    expect(tishaBavOnShabbat.getDay()).toBe(6);

    for (const nusach of NUSCHAOT) {
      const regular = saidOn(nusach, 'havdalah', eveningOf(regularSaturday));
      expect(regular).toMatch(/בורא פרי הג[פג]ן/);
      expect(regular).toMatch(/בשמים/);
      expect(regular).toMatch(/מאורי האש/);
      expect(regular).toMatch(/המבדיל בין קדש לחול/);

      const tishaBav = saidOn(nusach, 'havdalah', eveningOf(tishaBavOnShabbat));
      expect(tishaBav).toMatch(/מאורי האש/);
      expect(tishaBav).not.toMatch(/הגפן|הגפן|בשמים|המבדיל/);
    }
  });

  it('drops "she’asa li kol tzorki" on Tisha B’Av and Yom Kippur where the nusach does', () => {
    const tishaBav = dayFeatures(new HDate(9, months.AV, 5786), ISRAEL);
    const weekday = dayFeatures(new HDate(12, months.CHESHVAN, 5787), ISRAEL);
    const yomKippur = dayFeatures(new HDate(10, months.TISHREI, 5787), ISRAEL);
    for (const nusach of NUSCHAOT) {
      expect(saidOn(nusach, 'birchot_hashachar', weekday)).toMatch(/שעשה לי כל צרכי/);
      const omits = nusach !== 'ashkenaz';
      for (const day of [tishaBav, yomKippur]) {
        const said = saidOn(nusach, 'birchot_hashachar', day);
        if (omits) expect(said).not.toMatch(/שעשה לי כל צרכי/);
        else expect(said).toMatch(/שעשה לי כל צרכי/);
      }
    }
  });

  it('adds the Rosh Chodesh line to the Edot HaMizrach after-blessing only on Rosh Chodesh', () => {
    const roshChodesh = dayFeatures(new HDate(1, months.CHESHVAN, 5787), ISRAEL);
    const weekday = dayFeatures(new HDate(12, months.CHESHVAN, 5787), ISRAEL);
    expect(saidOn('edot_hamizrach', 'havdalah', roshChodesh)).toMatch(/ביום ראש חדש הזה/);
    expect(saidOn('edot_hamizrach', 'havdalah', weekday)).not.toMatch(/ראש חדש/);
  });
});

describe('weekday mincha', () => {
  const weekday = day(11, months.CHESHVAN, 5787);
  const friday = day(12, months.CHESHVAN, 5787);
  const tenDays = day(5, months.TISHREI, 5787);
  const tzomGedaliah = day(3, months.TISHREI, 5787);
  const tammuzFast = day(17, months.TAMUZ, 5786);
  const tishaBav = day(9, months.AV, 5786);
  const roshChodesh = day(1, months.CHESHVAN, 5787);
  const cholHamoed = day(18, months.NISAN, 5786);
  const chanukah = day(27, months.KISLEV, 5787);
  const purim = day(14, months.ADAR_II, 5787);
  const avinuMalkeinu = /אבינו מלכנו חטאנו לפניך/;

  it('falls on weekdays in its fixtures', () => {
    for (const fixture of [weekday, friday, tenDays, tzomGedaliah, tammuzFast, tishaBav, roshChodesh, cholHamoed, chanukah, purim]) {
      expect(fixture.flags.has('shabbat') || fixture.flags.has('yomTov')).toBe(false);
    }
    expect(friday.flags.has('friday')).toBe(true);
  });

  it('says the Ten Days changes only during the Ten Days, in every nusach', () => {
    for (const nusach of NUSCHAOT) {
      const ten = saidOn(nusach, 'mincha', tenDays);
      expect(ten).toMatch(/המלך הקדוש/);
      expect(ten).toMatch(/המלך המשפט/);
      expect(ten).toMatch(/זכרנו לחיים/);
      expect(ten).not.toMatch(/האל הקדוש|מלך או?הב צדקה ומשפט/);

      const plain = saidOn(nusach, 'mincha', weekday);
      expect(plain).toMatch(/האל הקדוש/);
      expect(plain).toMatch(/מלך או?הב צדקה ומשפט/);
      expect(plain).not.toMatch(/המלך הקדוש|המלך המשפט|זכרנו לחיים/);
    }
  });

  it('says Aneinu only on a public fast', () => {
    for (const nusach of NUSCHAOT) {
      expect(saidOn(nusach, 'mincha', tammuzFast)).toMatch(/עננו \S+ עננו/);
      expect(saidOn(nusach, 'mincha', weekday)).not.toMatch(/עננו \S+ עננו/);
    }
    expect(saidOn('ashkenaz', 'mincha', tammuzFast)).toMatch(/שים שלום/);
    expect(saidOn('ashkenaz', 'mincha', tammuzFast)).not.toMatch(/שלום רב/);
    expect(saidOn('ashkenaz', 'mincha', weekday)).toMatch(/שלום רב/);
    expect(saidOn('ashkenaz', 'mincha', weekday)).not.toMatch(/שים שלום/);
  });

  it('closes Boneh Yerushalayim with Nachem on Tisha B’Av instead of the ordinary ending', () => {
    for (const nusach of NUSCHAOT) {
      const fast = saidOn(nusach, 'mincha', tishaBav);
      expect(fast).toMatch(/אבלי ציון/);
      expect(fast).toMatch(/מנחם ציון/);
      expect(count(fast, /ברוך אתה \S+ בונה ירושלי?ם/)).toBe(0);

      const plain = saidOn(nusach, 'mincha', weekday);
      expect(plain).not.toMatch(/אבלי ציון|מנחם ציון/);
      expect(count(plain, /ברוך אתה \S+ בונה ירושלי?ם/)).toBe(1);
    }
  });

  it('names the day in Yaaleh Veyavo and the festival in Al HaNissim', () => {
    for (const nusach of NUSCHAOT) {
      const newMonth = saidOn(nusach, 'mincha', roshChodesh);
      expect(newMonth).toMatch(/ראש ה?חו?דש הזה/);
      expect(newMonth).not.toMatch(/חג המצות הזה|חג הסכות הזה/);

      const pesach = saidOn(nusach, 'mincha', cholHamoed);
      expect(pesach).toMatch(/חג המצות הזה/);
      expect(pesach).not.toMatch(/ראש ה?חו?דש הזה|חג הסכות הזה/);

      expect(saidOn(nusach, 'mincha', weekday)).not.toMatch(/יעלה ויבא|על הנסים/);

      const lights = saidOn(nusach, 'mincha', chanukah);
      expect(lights).toMatch(/מתתיה/);
      expect(lights).not.toMatch(/מרדכי/);

      const lots = saidOn(nusach, 'mincha', purim);
      expect(lots).toMatch(/מרדכי/);
      expect(lots).not.toMatch(/מתתיה/);
    }
  });

  it('says Tachanun only on days it is said', () => {
    for (const nusach of NUSCHAOT) {
      expect(saidOn(nusach, 'mincha', weekday)).toMatch(/ואנחנו לא נדע/);
      for (const noTachanun of [friday, roshChodesh, tishaBav, chanukah]) {
        expect(saidOn(nusach, 'mincha', noTachanun)).not.toMatch(/ואנחנו לא נדע/);
      }
    }
  });

  it('says Avinu Malkeinu in the Ten Days and on fasts, with the lines that match the day', () => {
    for (const nusach of NUSCHAOT) {
      for (const tenDaysOrBoth of [tenDays, tzomGedaliah]) {
        const said = saidOn(nusach, 'mincha', tenDaysOrBoth);
        expect(said).toMatch(avinuMalkeinu);
        expect(said).toMatch(/כתבנו בספר חיים טובים/);
        expect(said).not.toMatch(/זכרנו לחיים טובים/);
      }
      expect(saidOn(nusach, 'mincha', weekday)).not.toMatch(avinuMalkeinu);
      expect(saidOn(nusach, 'mincha', friday)).not.toMatch(avinuMalkeinu);
      expect(saidOn(nusach, 'mincha', day(7, months.TISHREI, 5787))).not.toMatch(avinuMalkeinu);
      expect(saidOn(nusach, 'mincha', day(9, months.TISHREI, 5787))).not.toMatch(avinuMalkeinu);
    }
    for (const nusach of ['ashkenaz', 'sefard', 'chabad'] as const) {
      const fast = saidOn(nusach, 'mincha', tammuzFast);
      expect(fast).toMatch(avinuMalkeinu);
      expect(fast).toMatch(/זכרנו לחיים טובים/);
      expect(fast).not.toMatch(/כתבנו בספר חיים טובים/);
    }
    expect(saidOn('chabad', 'mincha', tenDays)).toMatch(/אבינו מלכנו חדש עלינו שנה טובה/);
    expect(saidOn('chabad', 'mincha', tzomGedaliah)).toMatch(/אבינו מלכנו חדש עלינו שנה טובה/);
    expect(saidOn('chabad', 'mincha', tammuzFast)).toMatch(/אבינו מלכנו ברך עלינו שנה טובה/);
  });

  it('follows the season and the place for dew and rain', () => {
    const summer = day(20, months.SIVAN, 5786);
    const winterBeforeDiasporaRain = day(11, months.CHESHVAN, 5787, DIASPORA);
    for (const nusach of NUSCHAOT) {
      const winter = saidOn(nusach, 'mincha', weekday);
      expect(winter).toMatch(/משיב הרוח/);
      expect(winter).toMatch(/טל ומטר/);
      expect(winter).not.toMatch(/מוריד הטל/);

      const dry = saidOn(nusach, 'mincha', summer);
      expect(dry).toMatch(/מוריד הטל/);
      expect(dry).not.toMatch(/משיב הרוח|טל ומטר/);

      const abroad = saidOn(nusach, 'mincha', winterBeforeDiasporaRain);
      expect(abroad).toMatch(/משיב הרוח/);
      expect(abroad).not.toMatch(/טל ומטר/);

      const summerAbroad = saidOn(nusach, 'mincha', day(20, months.SIVAN, 5786, DIASPORA));
      if (nusach === 'ashkenaz') expect(summerAbroad).not.toMatch(/מוריד הטל|משיב הרוח/);
      else expect(summerAbroad).toMatch(/מוריד הטל/);
    }
  });
});

describe('weekday maariv', () => {
  const weeknight = day(11, months.CHESHVAN, 5787);
  const afterShabbat = civilDay(new Date(2026, 9, 11));
  const afterShabbatBeforeYomKippur = civilDay(new Date(2026, 8, 20));
  const afterYomTovIntoCholHamoed = day(16, months.NISAN, 5786);
  const tishaBav = day(9, months.AV, 5786);
  const tishaBavAfterShabbat = day(10, months.AV, 5782);
  const viHiNoam = /ישב (תהלים צא )?בסתר עליון/;

  it('opens the nights it claims to', () => {
    expect(afterShabbat.flags.has('viHiNoam')).toBe(true);
    expect(afterShabbatBeforeYomKippur.flags.has('motzaeiShabbat')).toBe(true);
    expect(afterShabbatBeforeYomKippur.flags.has('viHiNoam')).toBe(false);
    expect(afterYomTovIntoCholHamoed.flags.has('motzaei')).toBe(true);
    expect(afterYomTovIntoCholHamoed.omerDay).toBe(1);
    expect(tishaBav.flags.has('motzaei')).toBe(false);
    expect(tishaBavAfterShabbat.flags.has('motzaeiShabbat')).toBe(true);
  });

  it('adds Ata Chonantanu, Vihi Noam and Ve’ata Kadosh after an ordinary Shabbat, with the full Kaddish after them', () => {
    for (const nusach of NUSCHAOT) {
      const said = saidOn(nusach, 'maariv', afterShabbat);
      expect(said).toMatch(/אתה חוננתנו/);
      expect(said).toMatch(viHiNoam);
      expect(said).toMatch(/ואתה קדוש/);
      expect(count(said, /תתקבל/)).toBe(1);
      expect(said.indexOf('תתקבל')).toBeGreaterThan(said.indexOf('ואתה קדוש'));

      const plain = saidOn(nusach, 'maariv', weeknight);
      expect(plain).not.toMatch(/אתה חוננתנו|ואתה קדוש/);
      expect(plain).not.toMatch(viHiNoam);
      expect(count(plain, /תתקבל/)).toBe(1);
    }
  });

  it('keeps Ata Chonantanu but drops Vihi Noam and Ve’ata Kadosh before a week with Yom Kippur', () => {
    for (const nusach of NUSCHAOT) {
      const said = saidOn(nusach, 'maariv', afterShabbatBeforeYomKippur);
      expect(said).toMatch(/אתה חוננתנו/);
      expect(said).not.toMatch(viHiNoam);
      expect(said).not.toMatch(/ואתה קדוש/);
      expect(count(said, /תתקבל/)).toBe(1);
    }
  });

  it('after Yom Tov into Chol HaMoed Pesach says Ata Chonantanu, the festival and the first omer count', () => {
    for (const nusach of NUSCHAOT) {
      const said = saidOn(nusach, 'maariv', afterYomTovIntoCholHamoed);
      expect(said).toMatch(/אתה חוננתנו/);
      expect(said).toMatch(/חג המצות הזה/);
      expect(said).not.toMatch(viHiNoam);
      expect(said).toMatch(/ספירת העמר/);
      expect(said).toMatch(/היום יום אחד/);
    }
  });

  it('counts only the night’s omer day, and counts nothing outside the omer', () => {
    const twentieth = day(5, months.IYYAR, 5786);
    expect(twentieth.omerDay).toBe(20);
    for (const nusach of NUSCHAOT) {
      const counted = resolveSiddurText(load(nusach, 'maariv'), twentieth)
        .flatMap((section) => section.segments)
        .filter((segment) => segment.when?.omerDay !== undefined);
      expect(counted.length).toBeGreaterThan(0);
      expect(counted.every((segment) => segment.when?.omerDay === 20)).toBe(true);
      expect(saidOn(nusach, 'maariv', weeknight)).not.toMatch(/ספירת העמר/);
    }
  });

  it('says Ve’ata Kadosh after Eichah on Tisha B’Av night, without Vihi Noam', () => {
    for (const nusach of NUSCHAOT) {
      for (const night of [tishaBav, tishaBavAfterShabbat]) {
        const shown = shownOn(nusach, 'maariv', night);
        expect(shown).toMatch(/איכה/);
        expect(shown).toMatch(/ואתה קדוש/);
        expect(shown).not.toMatch(viHiNoam);
        expect(shown.indexOf('איכה')).toBeLessThan(shown.indexOf('ואתה קדוש'));
      }
      expect(saidOn(nusach, 'maariv', tishaBavAfterShabbat)).toMatch(/אתה חוננתנו/);
      expect(saidOn(nusach, 'maariv', tishaBav)).not.toMatch(/אתה חוננתנו/);
    }
    for (const nusach of ['ashkenaz', 'sefard', 'chabad'] as const) {
      const said = saidOn(nusach, 'maariv', tishaBav);
      expect(count(said, /תתקבל/)).toBe(1);
      expect(said.indexOf('תתקבל')).toBeLessThan(said.indexOf('ואתה קדוש'));
    }
  });

  it('says the Ten Days changes on their nights', () => {
    const tenDays = day(5, months.TISHREI, 5787);
    for (const nusach of NUSCHAOT) {
      const said = saidOn(nusach, 'maariv', tenDays);
      expect(said).toMatch(/המלך הקדוש/);
      expect(said).toMatch(/המלך המשפט/);
      expect(said).not.toMatch(/האל הקדוש|מלך או?הב צדקה ומשפט/);
      expect(saidOn(nusach, 'maariv', weeknight)).not.toMatch(/המלך הקדוש|המלך המשפט/);
    }
  });

  it('adds what only one place says', () => {
    const blessedForever = /ברוך \S+ לעולם אמן ואמן/;
    expect(saidOn('ashkenaz', 'maariv', day(11, months.CHESHVAN, 5787, DIASPORA))).toMatch(blessedForever);
    expect(saidOn('ashkenaz', 'maariv', weeknight)).not.toMatch(blessedForever);
    expect(saidOn('sefard', 'maariv', weeknight)).toMatch(/שיר למעלות/);
    expect(saidOn('sefard', 'maariv', day(11, months.CHESHVAN, 5787, DIASPORA))).not.toMatch(/שיר למעלות/);
  });
});

describe('weekday shacharit', () => {
  const tuesday = day(9, months.CHESHVAN, 5787);
  const monday = day(8, months.CHESHVAN, 5787);
  const roshChodesh = day(1, months.CHESHVAN, 5787);
  const cholHamoedPesach = day(18, months.NISAN, 5786);
  const cholHamoedSukkot = day(18, months.TISHREI, 5787);
  const cholHamoedSukkotAbroad = day(17, months.TISHREI, 5787, DIASPORA);
  const chanukah = day(27, months.KISLEV, 5787);
  const purim = day(14, months.ADAR_II, 5787);
  const tishaBav = day(9, months.AV, 5786);
  const tzomGedaliah = day(3, months.TISHREI, 5787);
  const tammuzFast = day(17, months.TAMUZ, 5786);
  const tenDays = day(5, months.TISHREI, 5787);
  const erevYomKippur = day(9, months.TISHREI, 5787);
  const erevPesach = day(14, months.NISAN, 5786);
  const titles = (nusach: Nusach, features: DayFeatures) =>
    resolveSiddurText(load(nusach, 'shacharit'), features).map((section) => section.title.he);
  const avinuMalkeinu = /אבינו מלכנו חטאנו לפניך/;

  it('falls on the weekdays its fixtures claim', () => {
    const fixtures = [tuesday, monday, roshChodesh, cholHamoedPesach, cholHamoedSukkot, cholHamoedSukkotAbroad, chanukah, purim];
    for (const fixture of [...fixtures, tishaBav, tzomGedaliah, tammuzFast, tenDays, erevYomKippur, erevPesach]) {
      expect(fixture.flags.has('shabbat') || fixture.flags.has('yomTov') || fixture.flags.has('yomKippur')).toBe(false);
    }
    expect(tuesday.flags.has('tuesday')).toBe(true);
    expect(monday.flags.has('monday')).toBe(true);
    expect(erevYomKippur.flags.has('sunday')).toBe(true);
    expect([...cholHamoedSukkotAbroad.flags].filter((flag) => flag.startsWith('sukkotOffering'))).toEqual(['sukkotOffering2', 'sukkotOffering3']);
  });

  it('says Tachanun on ordinary days only, and the long Monday and Thursday Tachanun on those days', () => {
    const longTachanun: Record<Nusach, RegExp> = {
      ashkenaz: /הבט משמים וראה/,
      sefard: /הבט משמים וראה/,
      edot_hamizrach: /אל מלך יושב על כסא רחמים/,
      chabad: /הבט משמים וראה/,
    };
    for (const nusach of NUSCHAOT) {
      expect(titles(nusach, tuesday)).toContain('תחנון');
      expect(titles(nusach, monday)).toContain('תחנון');
      for (const noTachanun of [roshChodesh, cholHamoedPesach, chanukah, purim, tishaBav, erevYomKippur, erevPesach]) {
        expect(titles(nusach, noTachanun)).not.toContain('תחנון');
      }
      expect(saidOn(nusach, 'shacharit', monday)).toMatch(longTachanun[nusach]);
      expect(saidOn(nusach, 'shacharit', tuesday)).not.toMatch(longTachanun[nusach]);
    }
  });

  it('reads the Torah only on its days, and says Musaf only on Rosh Chodesh and Chol HaMoed', () => {
    for (const nusach of NUSCHAOT) {
      expect(titles(nusach, tuesday)).not.toContain('קריאת התורה');
      for (const reading of [monday, roshChodesh, cholHamoedPesach, chanukah, purim, tishaBav, tzomGedaliah]) {
        expect(titles(nusach, reading)).toContain('קריאת התורה');
      }
      for (const withMusaf of [roshChodesh, cholHamoedPesach, cholHamoedSukkot]) expect(titles(nusach, withMusaf)).toContain('מוסף');
      for (const withoutMusaf of [tuesday, monday, chanukah, purim]) expect(titles(nusach, withoutMusaf)).not.toContain('מוסף');
    }
  });

  it('says whole Hallel on Chanukah and Chol HaMoed Sukkot, half Hallel on Rosh Chodesh and Chol HaMoed Pesach, and none on a plain day', () => {
    const notToUs = /לא לנו \S+ לא לנו/;
    const praiseServants = /הללו עבדי \S+ הללו את ?שם/;
    for (const nusach of NUSCHAOT) {
      for (const whole of [chanukah, cholHamoedSukkot]) {
        expect(saidOn(nusach, 'shacharit', whole)).toMatch(praiseServants);
        expect(saidOn(nusach, 'shacharit', whole)).toMatch(notToUs);
      }
      for (const half of [roshChodesh, cholHamoedPesach]) {
        expect(saidOn(nusach, 'shacharit', half)).toMatch(praiseServants);
        expect(saidOn(nusach, 'shacharit', half)).not.toMatch(notToUs);
      }
      expect(titles(nusach, tuesday)).not.toContain('הלל');
      expect(titles(nusach, purim)).not.toContain('הלל');
    }
    expect(saidOn('edot_hamizrach', 'shacharit', chanukah)).toMatch(/לגמור את ההלל/);
    expect(saidOn('edot_hamizrach', 'shacharit', roshChodesh)).not.toMatch(/לגמור את ההלל|לקרוא את ההלל/);
  });

  it('takes the lulav on Chol HaMoed Sukkot only', () => {
    for (const nusach of NUSCHAOT) {
      expect(saidOn(nusach, 'shacharit', cholHamoedSukkot)).toMatch(/על נטילת לולב/);
      expect(saidOn(nusach, 'shacharit', cholHamoedPesach)).not.toMatch(/על נטילת לולב/);
    }
  });

  it('names the day in Musaf, with the Sukkot offerings of the day and of the doubtful day abroad', () => {
    for (const nusach of NUSCHAOT) {
      expect(saidOn(nusach, 'shacharit', roshChodesh)).toMatch(/ראשי חדשים לעמך נתת/);
      expect(saidOn(nusach, 'shacharit', cholHamoedPesach)).toMatch(/מוסף יום \S*\s?חג המצות/);
      expect(saidOn(nusach, 'shacharit', cholHamoedSukkot)).toMatch(/מוסף יום \S*\s?חג הסכות/);
    }
    for (const nusach of ['ashkenaz', 'sefard', 'chabad'] as const) {
      const israel = saidOn(nusach, 'shacharit', cholHamoedSukkot);
      expect(israel).toMatch(/וביום הרביעי פרים/);
      expect(israel).not.toMatch(/וביום השלישי פרים|וביום החמישי פרים/);
      const abroad = saidOn(nusach, 'shacharit', cholHamoedSukkotAbroad);
      expect(abroad).toMatch(/וביום השני פרים/);
      expect(abroad).toMatch(/וביום השלישי פרים/);
      expect(abroad).not.toMatch(/וביום הרביעי פרים/);
    }
    for (const nusach of ['ashkenaz', 'sefard'] as const) {
      expect(saidOn(nusach, 'shacharit', roshChodesh)).toMatch(/ולכפרת פשע/);
      expect(saidOn(nusach, 'shacharit', day(1, months.IYYAR, 5786))).not.toMatch(/ולכפרת פשע/);
    }
  });

  it('says the Song of the Day of the weekday', () => {
    const tuesdaySong = /אלהים נצב בעדת ?אל/;
    const mondaySong = /גדול \S+ ומהלל מאד בעיר אלהינו/;
    for (const nusach of NUSCHAOT) {
      expect(saidOn(nusach, 'shacharit', tuesday)).toMatch(tuesdaySong);
      expect(saidOn(nusach, 'shacharit', tuesday)).not.toMatch(mondaySong);
      expect(saidOn(nusach, 'shacharit', monday)).toMatch(mondaySong);
      expect(saidOn(nusach, 'shacharit', monday)).not.toMatch(tuesdaySong);
    }
    expect(shownOn('edot_hamizrach', 'shacharit', tuesday)).toMatch(/השיר שהיו הלוים/);
    expect(shownOn('edot_hamizrach', 'shacharit', chanukah)).not.toMatch(/השיר שהיו הלוים/);
  });

  it('says Avinu Malkeinu in the Ten Days on days with Tachanun, and on fasts where the nusach does', () => {
    for (const nusach of NUSCHAOT) {
      expect(saidOn(nusach, 'shacharit', tenDays)).toMatch(avinuMalkeinu);
      expect(saidOn(nusach, 'shacharit', tzomGedaliah)).toMatch(avinuMalkeinu);
      expect(saidOn(nusach, 'shacharit', erevYomKippur)).not.toMatch(avinuMalkeinu);
      expect(saidOn(nusach, 'shacharit', tuesday)).not.toMatch(avinuMalkeinu);
    }
    for (const nusach of ['ashkenaz', 'sefard', 'chabad'] as const) expect(saidOn(nusach, 'shacharit', tammuzFast)).toMatch(avinuMalkeinu);
    expect(saidOn('edot_hamizrach', 'shacharit', tammuzFast)).not.toMatch(avinuMalkeinu);
  });

  it('skips Lamnatzeach on the days the nusach does', () => {
    const lamnatzeach = /יענך \S+ ביום צרה/;
    for (const nusach of NUSCHAOT) {
      expect(saidOn(nusach, 'shacharit', tuesday)).toMatch(lamnatzeach);
      for (const without of [roshChodesh, chanukah, purim, erevYomKippur, tishaBav]) {
        expect(saidOn(nusach, 'shacharit', without)).not.toMatch(lamnatzeach);
      }
    }
  });

  it('drops the covenant verse and Titkabel on Tisha B’Av', () => {
    for (const nusach of NUSCHAOT) {
      const fast = saidOn(nusach, 'shacharit', tishaBav);
      expect(fast).not.toMatch(/ואני זאת בריתי/);
      expect(fast).not.toMatch(/תתקבל/);
      const plain = saidOn(nusach, 'shacharit', tuesday);
      expect(plain).toMatch(/ואני זאת בריתי/);
      expect(plain).toMatch(/תתקבל/);
    }
  });

  it('says Mizmor LeToda except on erev Pesach and Chol HaMoed Pesach', () => {
    for (const nusach of NUSCHAOT) {
      expect(saidOn(nusach, 'shacharit', tuesday)).toMatch(/מזמור לתודה/);
      expect(saidOn(nusach, 'shacharit', erevPesach)).not.toMatch(/מזמור לתודה/);
      expect(saidOn(nusach, 'shacharit', cholHamoedPesach)).not.toMatch(/מזמור לתודה/);
    }
  });

  it('marks where Edot HaMizrach reads the Megillah on Purim', () => {
    expect(shownOn('edot_hamizrach', 'shacharit', purim)).toMatch(/בפורים קוראים כאן את המגילה/);
    expect(shownOn('edot_hamizrach', 'shacharit', tuesday)).not.toMatch(/בפורים קוראים כאן את המגילה/);
  });
});

describe('section titles', () => {
  const sampleDays: DayFeatures[] = [
    day(9, months.CHESHVAN, 5787),
    day(8, months.CHESHVAN, 5787),
    day(12, months.CHESHVAN, 5787),
    day(1, months.CHESHVAN, 5787),
    day(30, months.TISHREI, 5787),
    day(1, months.TEVET, 5787),
    day(18, months.NISAN, 5786),
    day(18, months.NISAN, 5786, DIASPORA),
    day(18, months.TISHREI, 5787),
    day(17, months.TISHREI, 5787, DIASPORA),
    day(21, months.TISHREI, 5787),
    day(27, months.KISLEV, 5787),
    day(14, months.ADAR_II, 5787),
    day(15, months.ADAR_II, 5787, { inIsrael: true, jerusalem: true }),
    day(14, months.ADAR_I, 5787),
    day(9, months.AV, 5786),
    day(3, months.TISHREI, 5787),
    day(5, months.TISHREI, 5787),
    day(9, months.TISHREI, 5787),
    day(11, months.TISHREI, 5787),
    day(10, months.TEVET, 5787),
    day(13, months.ADAR_II, 5787),
    day(17, months.TAMUZ, 5786),
    day(14, months.NISAN, 5786),
    day(1, months.ELUL, 5786),
    day(30, months.AV, 5786),
    day(18, months.IYYAR, 5786),
    civilDay(new Date(2026, 3, 22)),
    civilDay(new Date(2026, 9, 11)),
  ];

  it('are unique among the sections shown on any one day, because the reader keys and scrolls by them', () => {
    for (const nusach of NUSCHAOT) {
      for (const id of TEXT_IDS) {
        const text = load(nusach, id);
        for (const features of sampleDays) {
          const sections = resolveSiddurText(text, features);
          for (const language of ['he', 'en'] as const) {
            const shown = sections.map((section) => section.title[language]);
            expect({ nusach, id, shown: shown.filter((title, index) => shown.indexOf(title) !== index) }).toEqual({ nusach, id, shown: [] });
          }
        }
      }
    }
  });
});

describe('hasSiddurText', () => {
  const tefillin = findMitzvah('tefillin')!;
  const havdalah = findMitzvah('havdalah')!;
  const shacharit = findMitzvah('shacharit')!;
  const custom = (contentBlocks: Mitzvah['contentBlocks']): Mitzvah => ({ ...tefillin, id: 'custom_1_a', isCustom: true, contentBlocks });

  it('offers a static text in every nusach, and nothing for an id with no text', () => {
    for (const nusach of NUSCHAOT) {
      expect(hasSiddurText(tefillin, nusach, new Date(2026, 9, 9), ISRAEL)).toBe(true);
      expect(hasSiddurText({ ...tefillin, id: 'no_such_text' }, nusach, new Date(2026, 9, 9), ISRAEL)).toBe(false);
    }
  });

  it('withholds havdalah when the night that follows is Yom Tov', () => {
    let saturdayBeforeYomTov: Date | null = null;
    for (let d = new Date(2026, 0, 3); d.getFullYear() < 2036; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7)) {
      if (eveningOf(d).flags.has('yomTov')) {
        saturdayBeforeYomTov = d;
        break;
      }
    }
    expect(saturdayBeforeYomTov).not.toBeNull();
    expect(hasSiddurText(havdalah, 'ashkenaz', saturdayBeforeYomTov!, ISRAEL)).toBe(false);
    expect(hasSiddurText(havdalah, 'ashkenaz', new Date(2026, 9, 10), ISRAEL)).toBe(true);
  });

  it('offers the weekday services only when the day or the night they open is a weekday', () => {
    const mincha = findMitzvah('mincha')!;
    const maariv = findMitzvah('maariv')!;
    const friday = new Date(2026, 9, 9);
    const saturday = new Date(2026, 9, 10);
    const erevPesach = erev(15, months.NISAN, 5786);
    const firstDayPesach = new HDate(15, months.NISAN, 5786).greg();
    const yomKippur = new HDate(10, months.TISHREI, 5787).greg();
    expect([friday.getDay(), saturday.getDay()]).toEqual([5, 6]);
    expect([erevPesach, firstDayPesach, yomKippur].map((d) => d.getDay())).toEqual([3, 4, 1]);

    const cholHamoed = new HDate(18, months.NISAN, 5786).greg();
    for (const nusach of NUSCHAOT) {
      expect(hasSiddurText(shacharit, nusach, friday, ISRAEL)).toBe(true);
      expect(hasSiddurText(shacharit, nusach, cholHamoed, ISRAEL)).toBe(true);
      expect(hasSiddurText(shacharit, nusach, saturday, ISRAEL)).toBe(false);
      expect(hasSiddurText(shacharit, nusach, firstDayPesach, ISRAEL)).toBe(false);
      expect(hasSiddurText(shacharit, nusach, yomKippur, ISRAEL)).toBe(false);
      expect(hasSiddurText(mincha, nusach, friday, ISRAEL)).toBe(true);
      expect(hasSiddurText(mincha, nusach, saturday, ISRAEL)).toBe(false);
      expect(hasSiddurText(mincha, nusach, firstDayPesach, ISRAEL)).toBe(false);
      expect(hasSiddurText(mincha, nusach, yomKippur, ISRAEL)).toBe(false);
      expect(hasSiddurText(maariv, nusach, friday, ISRAEL)).toBe(false);
      expect(hasSiddurText(maariv, nusach, saturday, ISRAEL)).toBe(true);
      expect(hasSiddurText(maariv, nusach, erevPesach, ISRAEL)).toBe(false);
      expect(hasSiddurText(maariv, nusach, firstDayPesach, ISRAEL)).toBe(true);
      expect(hasSiddurText(maariv, nusach, firstDayPesach, DIASPORA)).toBe(false);
    }
  });

  it('offers a custom mitzvah’s own text, but not a link alone', () => {
    const blessing = custom([{ type: 'blessing', he: 'ברוך אתה', en: 'Blessed are You' }]);
    expect(hasSiddurText(blessing, 'sefard', new Date(), ISRAEL)).toBe(true);
    expect(hasSiddurText(custom([{ type: 'link', he: 'קישור', url: 'https://example.org' }]), 'sefard', new Date(), ISRAEL)).toBe(false);
    expect(hasSiddurText(custom(undefined), 'sefard', new Date(), ISRAEL)).toBe(false);
    expect(customSiddurText(blessing, 'sefard')?.sections[0].segments).toEqual([
      { he: [[{ t: 'ברוך אתה', s: 'b' }]], en: 'Blessed are You' },
    ]);
  });
});
