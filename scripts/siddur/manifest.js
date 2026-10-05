const SEFARIA = 'https://www.sefaria.org';

const METSUDAH_ASHKENAZ = {
  title: 'Siddur Ashkenaz — The Metsudah Siddur, Avrohom Davis (1981)',
  license: 'CC-BY',
  url: `${SEFARIA}/Siddur_Ashkenaz`,
};
const METSUDAH_SEFARD = {
  title: 'Siddur Sefard — The Metsudah Siddur, Avrohom Davis (1981)',
  license: 'CC-BY',
  url: `${SEFARIA}/Siddur_Sefard`,
};
const METSUDAH_SHABBAT = {
  title: 'Shabbat Siddur Sefard Linear — The Metsudah Siddur (1981)',
  license: 'CC-BY',
  url: `${SEFARIA}/Shabbat_Siddur_Sefard_Linear`,
};
const METSUDAH_YOM_KIPPUR = {
  title: 'Machzor Yom Kippur Ashkenaz Linear — The Metsudah Machzor',
  license: 'CC-BY',
  url: `${SEFARIA}/Machzor_Yom_Kippur_Ashkenaz_Linear`,
};

const SOURCES = {
  metsudahAshkenazHe: {
    title: 'Siddur Ashkenaz',
    lang: 'he',
    version: 'The Metsudah siddur, 1981',
    credit: METSUDAH_ASHKENAZ,
    translationMemory: 'metsudahAshkenazEn',
  },
  metsudahAshkenazEn: {
    title: 'Siddur Ashkenaz',
    lang: 'en',
    version: 'Translation based on the Metsudah linear siddur, by Avrohom Davis, 1981',
    credit: METSUDAH_ASHKENAZ,
  },
  metsudahSefardHe: {
    title: 'Siddur Sefard',
    lang: 'he',
    version: 'The Metsudah siddur, 1981',
    credit: METSUDAH_SEFARD,
    translationMemory: 'metsudahSefardEn',
  },
  metsudahSefardEn: {
    title: 'Siddur Sefard',
    lang: 'en',
    version: 'Translation based on the Metsudah linear siddur, by Avrohom Davis, 1981',
    credit: METSUDAH_SEFARD,
  },
  metsudahShabbatHe: {
    title: 'Shabbat Siddur Sefard Linear',
    lang: 'he',
    version: 'The Metsudah Siddur, Metsudah Publications, 1981 - HE',
    credit: METSUDAH_SHABBAT,
  },
  metsudahShabbatEn: {
    title: 'Shabbat Siddur Sefard Linear',
    lang: 'en',
    version: 'The Metsudah Siddur, Metsudah Publications, 1981 - EN',
    credit: METSUDAH_SHABBAT,
  },
  metsudahYomKippurHe: {
    title: 'Machzor Yom Kippur Ashkenaz Linear',
    lang: 'he',
    version: 'The Metsudah Machzor. Metsudah Publications, New York',
    credit: METSUDAH_YOM_KIPPUR,
  },
  metsudahYomKippurEn: {
    title: 'Machzor Yom Kippur Ashkenaz Linear',
    lang: 'en',
    version: 'The Metsudah Machzor. Metsudah Publications, New York',
    credit: METSUDAH_YOM_KIPPUR,
  },
  daatAshkenazHe: {
    title: 'Siddur Ashkenaz',
    lang: 'he',
    version: 'Daat Siddur Ashkenaz',
    credit: { title: 'Siddur Ashkenaz — Daat Siddur Ashkenaz', license: 'Public Domain', url: `${SEFARIA}/Siddur_Ashkenaz` },
  },
  toratEmetSefardHe: {
    title: 'Siddur Sefard',
    lang: 'he',
    version: 'Torat Emet 357',
    credit: { title: 'Siddur Sefard — Torat Emet 357', license: 'Public Domain', url: `${SEFARIA}/Siddur_Sefard` },
  },
  wikiAshkenazAmidah: {
    wikisource: 'סידור/נוסח אשכנז/עמידה',
    revision: 3086024,
    lang: 'he',
    credit: {
      title: 'Siddur Nusach Ashkenaz — Hebrew Wikisource',
      license: 'CC-BY-SA',
      url: 'https://he.wikisource.org/w/index.php?oldid=3086024',
    },
  },
  edotHe: {
    title: 'Siddur Edot HaMizrach',
    lang: 'he',
    version: ' Shaliehsaboo Edition',
    credit: { title: 'Siddur Edot HaMizrach — Shaliehsaboo Edition', license: 'CC0', url: `${SEFARIA}/Siddur_Edot_HaMizrach` },
  },
  edotEn: {
    title: 'Siddur Edot HaMizrach',
    lang: 'en',
    version: 'Sefaria Community Translation',
    credit: { title: 'Siddur Edot HaMizrach — Sefaria Community Translation', license: 'CC0', url: `${SEFARIA}/Siddur_Edot_HaMizrach` },
  },
  chabadHe: {
    title: 'Weekday Siddur Chabad',
    lang: 'he',
    version: 'Wikisource',
    credit: { title: 'Weekday Siddur Chabad — Wikisource', license: 'CC-BY-SA', url: `${SEFARIA}/Weekday_Siddur_Chabad` },
  },
  chabadEn: {
    title: 'Weekday Siddur Chabad',
    lang: 'en',
    version: 'Sefaria Community Translation',
    credit: { title: 'Weekday Siddur Chabad — Sefaria Community Translation', license: 'CC0', url: `${SEFARIA}/Weekday_Siddur_Chabad` },
  },
};

const CONDITIONAL_INSTRUCTION = [
  /בקיץ/,
  /בחורף/,
  /עשי ת|עשרת ימי/,
  /ראש חו?דש|בר ח /,
  /חנוכה/,
  /פורים/,
  /תענית/,
  /תשעה באב|ט אב/,
  /יום הכ[י]?פורים|יוה כ/,
  /יום טוב|יו ט/,
  /אם חל/,
  /שבת/,
  /מוצאי|מוצ ש/,
  /חול המועד|חוה מ/,
  /ניסן|אייר|סיון/,
];

const ALWAYS_SAID = [/^ברוך שם כבוד מלכותו לעולם ועד$/, /^אמן$/, /^יתגדל ויתקדש שמה רבא/, /^(תתקבל|יהא שלמא|עושה שלום|על ישראל ועל רבנן) /];

const T = {
  tefillin: { he: 'הנחת תפילין', en: 'Putting on Tefillin' },
  rabbenuTam: { he: 'תפילין דרבנו תם', en: 'Rabbeinu Tam Tefillin' },
  tallitKatan: { he: 'טלית קטן', en: 'Tallit Katan' },
  tallitGadol: { he: 'טלית גדול', en: 'Tallit' },
  modehAni: { he: 'מודה אני', en: 'Modeh Ani' },
  netilatYadayim: { he: 'נטילת ידיים', en: 'Washing the Hands' },
  asherYatzar: { he: 'אשר יצר', en: 'Asher Yatzar' },
  elokaiNeshama: { he: 'אלוקי נשמה', en: 'Elokai Neshama' },
  upon: { he: 'נטילת ידיים, אשר יצר ואלוקי נשמה', en: 'Washing, Asher Yatzar and Elokai Neshama' },
  torahBlessings: { he: 'ברכות התורה', en: 'Blessings of the Torah' },
  morningBlessings: { he: 'ברכות השחר', en: 'Morning Blessings' },
  shema: { he: 'קריאת שמע', en: 'The Shema' },
  omer: { he: 'ספירת העומר', en: 'Counting of the Omer' },
  candlesShabbat: { he: 'הדלקת נרות שבת', en: 'Shabbat Candle Lighting' },
  candlesYomTov: { he: 'הדלקת נרות יום טוב', en: 'Yom Tov Candle Lighting' },
  candlesShabbatYomTov: { he: 'הדלקת נרות שבת ויום טוב', en: 'Shabbat and Yom Tov Candle Lighting' },
  candlesYomKippur: { he: 'הדלקת נרות יום הכיפורים', en: 'Yom Kippur Candle Lighting' },
  candlesShabbatYomKippur: { he: 'הדלקת נרות שבת ויום הכיפורים', en: 'Shabbat and Yom Kippur Candle Lighting' },
  havdalahVerses: { he: 'פסוקי ההבדלה', en: 'Opening Verses' },
  havdalahWine: { he: 'על היין', en: 'Over the Wine' },
  havdalahSpices: { he: 'על הבשמים', en: 'Over the Spices' },
  havdalahFire: { he: 'על הנר', en: 'Over the Flame' },
  havdalahBlessing: { he: 'ברכת המבדיל', en: 'The Havdalah Blessing' },
  havdalah: { he: 'סדר הבדלה', en: 'Havdalah' },
  korbanot: { he: 'קרבנות', en: 'Offerings' },
  ashrei: { he: 'אשרי', en: 'Ashrei' },
  amidah: { he: 'תפילת העמידה', en: 'The Amidah' },
  avinuMalkeinu: { he: 'אבינו מלכנו', en: 'Avinu Malkeinu' },
  tachanun: { he: 'תחנון', en: 'Tachanun' },
  kaddish: { he: 'קדיש', en: 'Kaddish' },
  kaddishAfterAdditions: { he: 'קדיש שלם', en: 'Full Kaddish' },
  aleinu: { he: 'עלינו לשבח', en: 'Aleinu' },
  mournersKaddish: { he: 'קדיש יתום', en: "Mourner's Kaddish" },
  vehuRachum: { he: 'והוא רחום', en: 'Vehu Rachum' },
  barchu: { he: 'ברכו', en: 'Barchu' },
  shemaBlessings: { he: 'קריאת שמע וברכותיה', en: 'The Shema and its Blessings' },
  motzaeiShabbat: { he: 'ויהי נועם ואתה קדוש', en: "Vihi No'am and V'Atah Kadosh" },
  ledavid: { he: 'לדוד ה׳ אורי', en: 'LeDavid' },
  mournersHouse: { he: 'בבית האבל', en: 'In a House of Mourning' },
  shirLamaalot: { he: 'שיר למעלות', en: 'Song of Ascents' },
  closingBarchu: { he: 'ברכו לסיום', en: 'Closing Barchu' },
  yehiShem: { he: 'יהי שם', en: 'Yehi Shem' },
  psalm: { he: 'מזמור', en: 'Psalm' },
  barchiNafshi: { he: 'ברכי נפשי', en: 'Barchi Nafshi' },
  shirHamaalot: { he: 'שיר המעלות', en: 'A Song of Ascents' },
  alTira: { he: 'אל תירא', en: 'Al Tira' },
  maTovu: { he: 'מה טובו', en: 'Mah Tovu' },
  adonOlam: { he: 'אדון עולם', en: 'Adon Olam' },
  yigdal: { he: 'יגדל', en: 'Yigdal' },
  akedah: { he: 'פרשת העקדה', en: 'The Binding of Isaac' },
  sovereignty: { he: 'לעולם יהא אדם', en: 'Accepting the Kingship of Heaven' },
  pesukeiDezimra: { he: 'פסוקי דזמרה', en: 'Pesukei Dezimra' },
  vidui: { he: 'וידוי וי"ג מידות', en: 'Confession and the Thirteen Attributes' },
  halfKaddish: { he: 'חצי קדיש', en: 'Half Kaddish' },
  lulav: { he: 'נטילת לולב', en: 'Taking the Lulav' },
  hallel: { he: 'הלל', en: 'Hallel' },
  torahReading: { he: 'קריאת התורה', en: 'The Torah Reading' },
  uvaLetzion: { he: 'אשרי ובא לציון', en: 'Ashrei and Uva Letzion' },
  musaf: { he: 'מוסף', en: 'Musaf' },
  songOfDay: { he: 'שיר של יום', en: 'Song of the Day' },
  einKelokeinu: { he: 'אין כאלהינו', en: 'Ein Keloheinu' },
  tachanunConclusion: { he: 'סיום התחנון', en: 'Conclusion of Tachanun' },
  returningTorah: { he: 'הכנסת ספר התורה', en: 'Returning the Torah' },
  beitYaakov: { he: 'בית יעקב', en: 'Beit Yaakov' },
  kaveh: { he: 'קוה', en: 'Kaveh' },
  petichatEliyahu: { he: 'פתח אליהו', en: 'Patach Eliyahu' },
  hannah: { he: 'תפילת חנה', en: "Hannah's Prayer" },
  festivalPsalm: { he: 'מזמור לחג', en: 'Psalm of the Festival' },
  sixRemembrances: { he: 'שש זכירות', en: 'Six Remembrances' },
};

const NOT_TISHA_BAV = { none: ['tishaBav'] };
const NOT_FASTING_BAREFOOT = { none: ['tishaBav', 'yomKippur'] };
const SHEHECHEYANU = { all: ['shehecheyanu'] };

function each(from, to, condition) {
  const map = {};
  for (let i = from; i <= to; i++) map[i] = condition;
  return map;
}

const AYT = 'aseretYemeiTeshuva';
const IN_AYT = { all: [AYT] };
const NOT_AYT = { none: [AYT] };
const WINTER = { all: ['winter'] };
const SUMMER = { none: ['winter'] };
const RAIN = { all: ['talUmatar'] };
const NO_RAIN = { none: ['talUmatar'] };
const FAST = { all: ['publicFast'] };
const FAST_NOT_AYT = { all: ['publicFast'], none: [AYT] };
const NOT_FAST = { none: ['publicFast'] };
const YAALEH_VEYAVO = { any: ['roshChodesh', 'cholHamoedPesach', 'cholHamoedSukkot'] };
const AL_HANISSIM = { any: ['chanukah', 'purim'] };
const CHANUKAH = { all: ['chanukah'] };
const PURIM = { all: ['purim'] };
const TISHA_BAV = { all: ['tishaBav'] };
const MOTZAEI = { all: ['motzaei'] };
const VI_HI_NOAM = { all: ['viHiNoam'] };
const VEATA_KADOSH = { any: ['viHiNoam', 'tishaBav'] };
const MINCHA_TACHANUN = { all: ['tachanunMincha'] };
const MINCHA_AVINU_MALKEINU = { any: [AYT, 'publicFast'], all: ['tachanunMincha'] };
const OMER = { all: ['omer'] };
const LEDAVID = { all: ['ledavidSeason'] };
const NOT_IN_ISRAEL = { none: ['inIsrael'] };
const IN_ISRAEL = { all: ['inIsrael'] };
const ROSH_CHODESH = { all: ['roshChodesh'] };
const CHOL_HAMOED = { any: ['cholHamoedPesach', 'cholHamoedSukkot'] };
const CHOL_HAMOED_PESACH = { all: ['cholHamoedPesach'] };
const CHOL_HAMOED_SUKKOT = { all: ['cholHamoedSukkot'] };
const TACHANUN_SHACHARIT = { all: ['tachanunShacharit'] };
const NO_TACHANUN_SHACHARIT = { none: ['tachanunShacharit'] };
const LONG_TACHANUN = { all: ['tachanunShacharit'], any: ['monday', 'thursday'] };
const SHACHARIT_AVINU_MALKEINU = { any: [AYT, 'publicFast'], all: ['tachanunShacharit'] };
const TORAH_READING = { all: ['torahReading'] };
const MUSAF = { all: ['musaf'] };
const NOT_MUSAF = { none: ['musaf'] };
const HALLEL = { any: ['hallelWhole', 'hallelHalf', 'hallelDisputed'] };
const WHOLE_HALLEL_ONLY = { none: ['hallelHalf'] };
const UNDISPUTED_HALLEL = { any: ['hallelWhole', 'hallelHalf'] };
const NO_UNDISPUTED_HALLEL = { none: ['hallelWhole', 'hallelHalf'] };
const NO_LAMNATZEACH_DAYS = ['roshChodesh', 'chanukah', 'purimOrShushan', 'purimKatan', 'erevPesach', 'erevYomKippur', 'tishaBav'];
const LAMNATZEACH = { none: NO_LAMNATZEACH_DAYS };
const KEL_ERECH_APAYIM = { any: ['monday', 'thursday'], none: NO_LAMNATZEACH_DAYS };
const MIZMOR_LETODA = { none: ['erevPesach', 'cholHamoedPesach', 'erevYomKippur'] };
const TITKABEL_AFTER_UVA_LETZION = { none: ['musaf', 'tishaBav'] };
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const AYT_TACHANUN_SHACHARIT = { all: [AYT, 'tachanunShacharit'] };
const AYT_TACHANUN_MINCHA = { all: [AYT, 'tachanunMincha'] };
const NO_TACHANUN_NOR_HALLEL = { none: ['tachanunShacharit', 'hallelWhole', 'hallelHalf'] };
const WHOLE_HALLEL = { all: ['hallelWhole'] };
const CHABAD_KEL_ERECH_APAYIM = {
  any: ['monday', 'thursday'],
  none: ['roshChodesh', 'chanukah', 'purimOrShushan', 'purimKatan', 'erevPesach', 'tishaBav'],
};

function both(first, second) {
  if (first.any || second.any) throw new Error('both() combines "all" and "none" conditions only');
  const all = [...(first.all ?? []), ...(second.all ?? [])];
  const none = [...(first.none ?? []), ...(second.none ?? [])];
  return { ...(all.length ? { all } : {}), ...(none.length ? { none } : {}) };
}

function weekdaySongs(rangesFromSunday) {
  return Object.assign({}, ...rangesFromSunday.map(([from, to], day) => each(from, to, { all: [WEEKDAYS[day]] })));
}

const NOTES = {
  fastTorahReading: {
    he: '<small>בתענית ציבור, כשיש מניין, קוראים כאן בתורה בפרשת "ויחל" ומפטירים לפי מנהג הקהילה, ואחר כך אומר שליח הציבור חצי קדיש.</small>',
    en: 'On a public fast, when there is a minyan, the Torah portion "Vayechal" is read here, with a haftarah according to the custom of the community, followed by Half Kaddish.',
    when: FAST,
  },
  erevYomKippurVidui: {
    he: '<small>בערב יום הכיפורים מוסיפים כאן וידוי ("אשמנו" ו"על חטא") כנוסח המחזור.</small>',
    en: 'On the eve of Yom Kippur, the confession (Ashamnu and Al Chet) is added here, as printed in the machzor.',
    when: { all: ['erevYomKippur'] },
  },
  tachanunDisputed: {
    he: '<small>יש קהילות שאינן אומרות תחנון היום.</small>',
    en: 'Some communities do not say Tachanun today.',
    when: { all: ['tachanunMincha', 'tachanunDisputed'] },
  },
  tishaBavEichah: {
    he: '<small>בליל תשעה באב קוראים כאן מגילת איכה ואומרים קינות, ואחר כך "ואתה קדוש".</small>',
    en: "On the night of Tisha B'Av, Eichah and kinot are read here, followed by V'Atah Kadosh.",
    when: TISHA_BAV,
  },
  tachanunDisputedShacharit: {
    he: '<small>יש קהילות שאינן אומרות תחנון היום.</small>',
    en: 'Some communities do not say Tachanun today.',
    when: { all: ['tachanunShacharit', 'tachanunDisputed'] },
  },
  halfKaddishAfterReading: {
    he: '<small>אחר קריאת התורה אומר הש"ץ חצי קדיש.</small>',
    en: 'After the Torah reading, the chazzan says Half Kaddish.',
  },
  hallelDisputed: {
    he: '<small>ביום העצמאות וביום ירושלים יש נוהגים לומר הלל, יש בברכה ויש בלא ברכה.</small>',
    en: 'On Yom HaAtzmaut and Yom Yerushalayim some communities say Hallel, some with its blessings and some without.',
    when: { all: ['hallelDisputed'] },
  },
  kinot: {
    he: '<small>בתשעה באב, אחר קריאת התורה, אומרים קינות.</small>',
    en: "On Tisha B'Av, kinot are recited after the Torah reading.",
    when: TISHA_BAV,
  },
  megillah: {
    he: '<small>בפורים קוראים את המגילה אחר קריאת התורה.</small>',
    en: 'On Purim, the Megillah is read after the Torah reading.',
    when: PURIM,
  },
  hoshanot: {
    he: '<small>בחול המועד סוכות אומרים הושענות; יש נוהגים לאומרן אחר ההלל, ויש אחר מוסף.</small>',
    en: 'On Chol HaMoed Sukkot, Hoshanot are recited; some say them after Hallel and some after Musaf.',
    when: CHOL_HAMOED_SUKKOT,
  },
  lamnatzeachCholHamoed: {
    he: '<small>יש נוהגים שלא לומר "למנצח" בחול המועד.</small>',
    en: 'Some do not say Lamnatzeach on Chol HaMoed.',
    when: CHOL_HAMOED,
  },
  kinotEdot: {
    he: '<small>בתשעה באב אומרים קינות כמנהג הקהילה.</small>',
    en: "On Tisha B'Av, kinot are recited according to the custom of the community.",
    when: TISHA_BAV,
  },
  einKelokeinuInIsrael: {
    he: '<small>יש נוהגים בארץ ישראל לומר:</small>',
    en: 'Some congregations in the Land of Israel add:',
    when: IN_ISRAEL,
  },
};

const MARKS = '[\\u0591-\\u05C7]*';
const RULES = [];

function loose(text) {
  return [...text].map((c) => (c === ' ' ? '[\\s\\u05BE]*' : `${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${MARKS}`)).join('');
}

function rule(name, pattern, replace) {
  const entry = { name, hits: 0 };
  RULES.push(entry);
  return (html) =>
    html.replace(pattern, (...match) => {
      entry.hits++;
      return replace(...match);
    });
}

const PAREN_NOTE = '\\(\\s*<small>[^<]*</small>\\s*';

function variant(defaultText, altText, flag) {
  return rule(
    `${defaultText} (${altText})`,
    new RegExp(`(${loose(defaultText)})\\s*${PAREN_NOTE}(${loose(altText)})\\s*\\)`, 'g'),
    (_, plainText, alt) => `<if none="${flag}">${plainText}</if><if all="${flag}">${alt}</if>`,
  );
}

function variantBefore(altText, defaultText, flag) {
  return rule(
    `(${altText}) ${defaultText}`,
    new RegExp(`${PAREN_NOTE}(${loose(altText)})\\s*\\)\\s*(${loose(defaultText)})`, 'g'),
    (_, alt, plainText) => `<if all="${flag}">${alt}</if><if none="${flag}">${plainText}</if>`,
  );
}

function compose(...transforms) {
  return (html, index) => transforms.reduce((out, transform) => transform(out, index), html);
}

const metsudahYaalehVeyavo = rule(
  'Metsudah Yaaleh Veyavo days',
  /<small>לר"ח:<\/small>\s*([^<]*?:)\s*<small>לפסח:<\/small>\s*([^<]*?:)\s*<small>לסכות:<\/small>\s*([^<]*?:)/g,
  (_, roshChodesh, pesach, sukkot) =>
    `<if all="roshChodesh">${roshChodesh}</if><if all="cholHamoedPesach">${pesach}</if><if all="cholHamoedSukkot">${sukkot}</if>`,
);

const metsudahKedushaEnding = rule(
  'Metsudah Kedusha ending',
  new RegExp(`(${loose('ברוך אתה יהוה האל הקדוש:')})\\s*<small>בעשי"ת מסיים:\\s*([^<]*)</small>`, 'g'),
  (_, plainText, ending) => `<if none="${AYT}">${plainText}</if><if all="${AYT}">${ending}</if>`,
);

function headingAsNote(html) {
  const text = html.replace(/<[^>]+>/g, '').trim();
  return text && text.length <= 24 && /[א-ת]/.test(text) && !/[ְ-ׇ]/.test(text) ? `<small>${text}</small>` : html;
}

const SEFARD_VARIANTS = compose(
  headingAsNote,
  variantBefore('ולעלא מכל', 'מן כל', AYT),
  variant('שלום', 'השלום', AYT),
  variantBefore('השלום', 'שלום', AYT),
);

const EDOT_AYT_NOTE = '<small><small>בעשרת ימי תשובה אומרים:</small>';

function edotAytEnding(plainEnding) {
  return rule(
    `Edot AYT ending ${plainEnding}`,
    new RegExp(`(${loose(plainEnding)})\\s*${EDOT_AYT_NOTE}\\s*([\\s\\S]*?)</small>`, 'g'),
    (_, plainText, ayt) => `<if none="${AYT}">${plainText}</if><if all="${AYT}">${ayt}</if>`,
  );
}

const EDOT_VARIANTS = compose(
  headingAsNote,
  rule('Edot psalm references', /\((?:תהלים|תהילים) [^)<]*\)/g, (reference) => `<small>${reference}</small>`),
  edotAytEnding('האל הקדוש:'),
  edotAytEnding('מלך אוהב צדקה ומשפט:'),
  rule(
    'Edot AYT insert',
    new RegExp(`${EDOT_AYT_NOTE}([\\s\\S]*?)</small>`, 'g'),
    (_, insert) => `<if all="${AYT}"><small>בעשרת ימי תשובה אומרים:</small>${insert}</if>`,
  ),
  rule(
    'Edot summer and winter',
    /<small>בקיץ:<\/small>\s*([^<]*?)\s*<small>בחורף:<\/small>\s*([^<]*)/g,
    (_, summer, winter) => `<if none="winter"><small>בקיץ:</small> ${summer}</if> <if all="winter"><small>בחורף:</small> ${winter}</if>`,
  ),
  rule(
    'Edot AYT oseh hashalom',
    new RegExp(`(${loose('שלום')})\\s*<small>(?:<small>)?בעשרת ימי תשובה אומר:(?:</small>)?\\s*([^<]*)</small>`, 'g'),
    (_, plainText, ayt) => `<if none="${AYT}">${plainText}</if><if all="${AYT}">${ayt}</if>`,
  ),
);

const ASHKENAZ_VARIANTS = compose(
  variant('לעלא מן כל', 'לעלא לעלא מכל', AYT),
  variant('שלום', 'השלום', AYT),
  variantBefore('השלום', 'שלום', AYT),
  metsudahYaalehVeyavo,
  metsudahKedushaEnding,
);

const FAST_ONLY = `all="publicFast" none="${AYT}"`;

const CHABAD_VARIANTS = compose(
  variant('האל', 'המלך', AYT),
  variant('מלך אוהב צדקה ומשפט:', 'המלך המשפט:', AYT),
  variant('שלום', 'השלום', AYT),
  rule(
    'Chabad rain request',
    /<small>בקיץ<\/small>\s*([^<(]*?)\s*\(\s*<small>בחורף<\/small>\s*([^<)]*?)\s*\)/g,
    (_, summer, winter) => `<if none="talUmatar">${summer}</if><if all="talUmatar">${winter}</if>`,
  ),
  rule(
    'Chabad summer and winter',
    /<small>בקיץ<\/small>\s*([^<]*?:)\s*<small>בחורף<\/small>\s*([^<]*:)/g,
    (_, summer, winter) => `<if none="winter"><small>בקיץ</small> ${summer}</if> <if all="winter"><small>בחורף</small> ${winter}</if>`,
  ),
  rule(
    'Chabad Yaaleh Veyavo days',
    /<small>בראש חדש:<\/small>\s*([^<]*?)\s*<small>בחוה״מ פסח:<\/small>\s*([^<]*?)\s*<small>בחוה״מ סוכות:<\/small>\s*([^<]*?\.)/g,
    (_, roshChodesh, pesach, sukkot) =>
      `<if all="roshChodesh">${roshChodesh}</if><if all="cholHamoedPesach">${pesach}</if><if all="cholHamoedSukkot">${sukkot}</if>`,
  ),
  rule(
    'Chabad Tisha BAv ending of Boneh Yerushalayim',
    new RegExp(`<small>\\(בתשעה באב אומרים כאן נחם\\)</small>\\s*(${loose('ברוך אתה יי, בונה')}[^:]*:)`, 'g'),
    (_, ending) => `<if none="tishaBav">${ending}</if>`,
  ),
  rule(
    'Chabad Avinu Malkeinu renew or bless',
    new RegExp(`(${loose('חדש')})\\s*\\(\\s*<small>בתענית ציבור:</small>\\s*(${loose('ברך')})\\s*\\)`, 'g'),
    (_, renew, bless) => `<if all="${AYT}">${renew}</if><if ${FAST_ONLY}>${bless}</if>`,
  ),
  rule(
    'Chabad Avinu Malkeinu Ten Days lines',
    /(<small>בעשרת ימי תשובה:<\/small>(?:<br>[^<]*){5})/g,
    (_, lines) => `<if all="${AYT}">${lines}</if>`,
  ),
  rule(
    'Chabad Avinu Malkeinu fast lines',
    /\[<small>בתענית ציבור<\/small>((?:<br><b>[^<]*<\/b>){5})\]/g,
    (_, lines) => `<if ${FAST_ONLY}><small>בתענית ציבור:</small>${lines.replace(/<\/?b>/g, '')}</if>`,
  ),
);

const UVA_LETZION_COVENANT = rule(
  "Uva Letzion covenant verse, omitted on Tisha B'Av",
  new RegExp(`${loose('ואני זאת בריתי')}[^:\\u05C3]*[:\\u05C3]`, 'g'),
  (verse) => `<if none="tishaBav">${verse}</if>`,
);

const EDOT_MEGILLAH = rule(
  'Edot Megillah after the covenant verse',
  new RegExp(`${loose('מעתה ועד עולם')}[:\\u05C3]`),
  (verse) => `${verse} <if all="purim"><small>בפורים קוראים כאן את המגילה, בברכותיה לפניה ולאחריה.</small></if>`,
);

const EDOT_LEVITES_LINE = rule(
  "Edot Levites' line of the Song of the Day, omitted on Chanukah",
  new RegExp(`,\\s*(${loose('השיר שהיו הלוים אומרים על הדוכן')})`, 'g'),
  (_, line) => `<if none="chanukah">, ${line}</if>`,
);

const EDOT_FESTIVAL_INSERTS = compose(
  rule('Edot Shabbat inserts', /<small>\s*<small>בשבת<\/small>\s*\(?([^<)]*)\)?\s*<\/small>/g, (_, insert) => `<if all="shabbat">${insert}</if>`),
  rule('Edot Yom Tov addition', /<small>\s*<small>ביו"ט מוסיף<\/small>\s*([^<]*)<\/small>/g, (_, insert) => `<if all="yomTov">${insert}</if>`),
);

const TORAT_EMET_LEAP_YEAR = rule(
  'Torat Emet leap-year atonement',
  /<small>בשנת העיבור עד חדש ניסן:<\/small>\s*<b>([^<]*)<\/b>\)/g,
  (_, insert) => `<if all="ulechaparatPesha">${insert}</if>`,
);

const SUKKOT_OFFERING_LABELS = {
  'בט"ז בתשרי (בא"י)': 2,
  'בי"ז בתשרי': 3,
  'בי"ח בתשרי': 4,
  'בי"ט בתשרי': 5,
  "בכ' בתשרי": 6,
  'בהושענא רבה': 7,
};

function ashkenazName(html) {
  return html.replace(/לַייָ/g, 'לַיהֹוָה').replace(/וַייָ/g, 'וַיהֹוָה').replace(/יְיָ/g, 'יְהֹוָה');
}

const WIKI_ASHKENAZ_MUSAF = compose(
  ashkenazName,
  rule('Wikisource Shabbat inserts', /<small>בשבת<\/small><opt>([^<]*)<\/opt>/g, (_, insert) => `<if all="shabbat">${insert}</if>`),
  rule(
    'Wikisource leap-year atonement',
    /<small>בשנה מעוברת עד ר"ח אדר ב'<\/small><opt>([^<]*)<\/opt>/g,
    (_, insert) => `<if all="ulechaparatPesha">${insert}</if>`,
  ),
  rule('Wikisource weekday marker', /<small>כשחל בחול:<\/small>\s*/g, () => ''),
  rule(
    'Wikisource festival names',
    /<br>\s*<small>בפסח:<\/small>\s*([^<]*?)\s*<br>\s*<small>בשבועות:<\/small>[^<]*<br>\s*<small>בסוכות:<\/small>\s*([^<]*?)\s*<br>\s*<small>בשמיני עצרת[^<]*<\/small>[^<]*<br>\s*/g,
    (_, pesach, sukkot) => ` <if all="cholHamoedPesach">${pesach}</if><if all="cholHamoedSukkot">${sukkot}</if> `,
  ),
  rule('Wikisource Shabbat and Pesach headings after the offerings', /<small>בשבת:<\/small>\s*<small>ביו"ט ראשון \(ושני\) של פסח:<\/small>\s*$/g, () => ''),
  rule(
    'Wikisource Sukkot offerings of the day',
    new RegExp(`<small>(${Object.keys(SUKKOT_OFFERING_LABELS).map(escapeForRegExp).join('|')}):</small>\\s*([^<]*)`, 'g'),
    (_, label, verse) => `<if all="sukkotOffering${SUKKOT_OFFERING_LABELS[label]}">${verse}</if>`,
  ),
);

function escapeForRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function metsudahHallel() {
  return {
    he: 'metsudahShabbatHe',
    en: 'metsudahShabbatEn',
    linear: true,
    title: T.hallel,
    path: 'Hallel',
    from: 4,
    to: 262,
    drop: [8, 29, 49, 94, 141, 148],
    groups: [
      [4, 7],
      [9, 28],
      [30, 48],
      [51, 76],
      [77, 93],
      [96, 120],
      [121, 140],
      [142, 146],
      [149, 162],
      [163, 201],
      [202, 217],
      [219, 222],
      [223, 246],
      [247, 262],
    ],
    when: HALLEL,
    at: { ...each(51, 76, WHOLE_HALLEL_ONLY), ...each(96, 120, WHOLE_HALLEL_ONLY) },
    transform: (html) => html.replace(/❖/g, ''),
    insert: [{ at: 4, ...NOTES.hallelDisputed }],
  };
}

function lulavBlessing({ from = 1 } = {}) {
  return {
    he: 'metsudahShabbatHe',
    en: 'metsudahShabbatEn',
    linear: true,
    title: T.lulav,
    path: 'Prayers for Yom Tov > Blessings on the Lulav',
    from,
    to: 11,
    groups: [
      [2, 6],
      [8, 11],
    ],
    when: CHOL_HAMOED_SUKKOT,
    at: each(8, 11, { all: ['lulavShehecheyanu'] }),
  };
}

function withoutOmerNumber(html) {
  return html.replace(/(<br>)\s*\d+\.\s*/, '$1');
}

function chabadName(html) {
  return html.replace(/לַיהֹוָה/g, 'לַייָ').replace(/יְהֹוָה/g, 'יְיָ');
}

function candles({ transform, shabbatEdits, shabbatEnEdits } = {}) {
  const shabbat = { he: 'metsudahShabbatHe', en: 'metsudahShabbatEn', linear: true, transform };
  const yomKippur = { he: 'metsudahYomKippurHe', en: 'metsudahYomKippurEn', linear: true, transform };
  return [
    {
      ...shabbat,
      title: T.candlesShabbat,
      path: 'Candle Lighting > Candle Lighting for Shabbos',
      groups: [[2, 6]],
      when: { all: ['shabbat'], none: ['yomTov', 'yomKippur'] },
      edits: shabbatEdits,
      enEdits: shabbatEnEdits,
    },
    {
      ...shabbat,
      title: T.candlesYomTov,
      path: 'Candle Lighting > Candle Lighting for Yom Tov',
      groups: [[0, 4], [5, 8]],
      when: { all: ['yomTov'], none: ['shabbat'] },
      at: each(5, 8, SHEHECHEYANU),
    },
    {
      ...shabbat,
      title: T.candlesShabbatYomTov,
      path: 'Candle Lighting > Candle Lighting when Shabbos occurs on Yom Tov',
      groups: [[0, 5], [6, 9]],
      when: { all: ['shabbat', 'yomTov'] },
      at: each(6, 9, SHEHECHEYANU),
    },
    {
      ...yomKippur,
      title: T.candlesYomKippur,
      path: 'Candle Lighting',
      from: 0,
      to: 8,
      groups: [[0, 4], [5, 8]],
      when: { all: ['yomKippur'], none: ['shabbat'] },
    },
    {
      ...yomKippur,
      title: T.candlesShabbatYomKippur,
      path: 'Candle Lighting',
      from: 10,
      to: 19,
      groups: [[10, 15], [16, 19]],
      when: { all: ['yomKippur', 'shabbat'] },
    },
  ];
}

function linearHavdalah({ transform } = {}) {
  const base = { he: 'metsudahShabbatHe', en: 'metsudahShabbatEn', linear: true, transform, path: 'Havdalah' };
  return [
    {
      ...base,
      title: T.havdalahVerses,
      from: 2,
      to: 21,
      groups: [[2, 7], [8, 9], [10, 12], [13, 14], [15, 16], [17, 18], [19, 19], [20, 21]],
      when: NOT_TISHA_BAV,
    },
    { ...base, title: T.havdalahWine, from: 22, to: 25, groups: [[23, 25]], when: NOT_TISHA_BAV },
    { ...base, title: T.havdalahSpices, from: 26, to: 29, groups: [[27, 29]], when: NOT_TISHA_BAV },
    { ...base, title: T.havdalahFire, from: 30, to: 33, groups: [[31, 33]] },
    {
      ...base,
      title: T.havdalahBlessing,
      from: 34,
      to: 44,
      groups: [[34, 44]],
      when: NOT_TISHA_BAV,
      edits: [{ seg: 42, from: 'בָּרוּר', to: 'בָּרוּךְ' }],
    },
  ];
}

const ASHKENAZ = { he: 'metsudahAshkenazHe', en: 'metsudahAshkenazEn' };
const ashkenazPrep = (node) => `Weekday > Shacharit > Preparatory Prayers > ${node}`;
const SEFARD = { he: 'metsudahSefardHe', en: 'metsudahSefardEn' };
const EDOT = { he: 'edotHe', en: 'edotEn' };
const CHABAD = { he: 'chabadHe', en: 'chabadEn' };

const TEXTS = {
  tefillin: {
    ashkenaz: [{ ...ASHKENAZ, title: T.tefillin, path: ashkenazPrep('Tefillin') }],
    sefard: [{ ...SEFARD, title: T.tefillin, path: 'Upon Arising > Tefilin' }],
    edot_hamizrach: [{ ...EDOT, title: T.tefillin, path: 'Weekday Shacharit > Order of Tefillin', from: 1, reviewed: [2] }],
    chabad: [
      { ...CHABAD, title: T.tefillin, path: 'Shacharit > Tefillin', from: 4 },
      { ...CHABAD, title: T.rabbenuTam, path: 'Shacharit > Rabbenu Tam' },
    ],
  },
  tzitzit: {
    ashkenaz: [
      { ...ASHKENAZ, title: T.tallitKatan, path: ashkenazPrep('Tzitzit') },
      { ...ASHKENAZ, title: T.tallitGadol, path: ashkenazPrep('Tallit') },
    ],
    sefard: [
      { ...SEFARD, title: T.tallitKatan, path: 'Upon Arising > Modeh Ani', from: 4, to: 6 },
      { ...SEFARD, title: T.tallitGadol, path: 'Upon Arising > Tallit' },
    ],
    edot_hamizrach: [{ ...EDOT, title: T.tallitGadol, path: 'Weekday Shacharit > Order of Talit', from: 1 }],
    chabad: [
      { ...CHABAD, title: T.tallitKatan, path: 'Shacharit > Tzitzit and Tallit', from: 1, to: 1 },
      { ...CHABAD, title: T.tallitGadol, path: 'Shacharit > Tzitzit and Tallit', from: 3, to: 9 },
    ],
  },
  birchot_hashachar: {
    ashkenaz: ashkenazBirchot(),
    sefard: sefardBirchot(),
    edot_hamizrach: edotBirchot(),
    chabad: chabadBirchot(),
  },
  krias_shma_shacharit: {
    ashkenaz: [{ ...ASHKENAZ, title: T.shema, path: 'Weekday > Shacharit > Blessings of the Shema > Shema' }],
    sefard: [{ ...SEFARD, title: T.shema, path: 'Weekday Shacharit > The Shema', from: 17, to: 28 }],
    edot_hamizrach: [{ ...EDOT, title: T.shema, path: 'Weekday Shacharit > The Shema', from: 9, to: 15 }],
    chabad: [{ ...CHABAD, title: T.shema, path: 'Shacharit > Blessings of the Shema', from: 9, to: 13 }],
  },
  candle_lighting: {
    ashkenaz: candles(),
    sefard: candles(),
    edot_hamizrach: [
      {
        ...EDOT,
        title: T.candlesShabbat,
        path: 'Shabbat Candle Lighting',
        from: 1,
        to: 2,
        when: { all: ['shabbat'], none: ['yomTov', 'yomKippur'] },
      },
      {
        ...EDOT,
        title: T.candlesYomTov,
        path: 'Shabbat Candle Lighting',
        from: 3,
        to: 6,
        when: { all: ['yomTov'] },
        at: each(5, 6, SHEHECHEYANU),
        edits: [
          {
            seg: 4,
            from: '<small><small>אם חל בשבת תוסיף:</small> (שַׁבָּת וְ)</small>',
            to: '<if all="shabbat">שַׁבָּת וְ</if>',
          },
        ],
      },
      ...candles().slice(3),
    ],
    chabad: candles({
      transform: chabadName,
      shabbatEdits: [{ seg: 6, from: 'לְהַדְלִיק נֵר שֶׁל שַׁבָּת:', to: 'לְהַדְלִיק נֵר שֶׁל שַׁבָּת קֹדֶשׁ:' }],
      shabbatEnEdits: [{ seg: 6, from: 'to kindle the Shabbos light.', to: 'to kindle the light of the holy Shabbos.' }],
    }),
  },
  havdalah: {
    ashkenaz: linearHavdalah(),
    sefard: linearHavdalah(),
    edot_hamizrach: [
      {
        ...EDOT,
        title: T.havdalah,
        path: 'Havdalah > Havdala',
        from: 1,
        drop: [10],
        at: {
          ...each(1, 9, NOT_TISHA_BAV),
          11: NOT_TISHA_BAV,
          ...each(14, 20, NOT_TISHA_BAV),
          17: { all: ['roshChodesh'], none: ['tishaBav'] },
          18: { all: ['cholHamoedPesach'], none: ['tishaBav'] },
          19: { all: ['cholHamoedSukkot'], none: ['tishaBav'] },
        },
      },
    ],
    chabad: linearHavdalah({ transform: chabadName }),
  },
  sefirat_haomer: {
    ashkenaz: [
      {
        ...ASHKENAZ,
        title: T.omer,
        path: 'Weekday > Maariv > Sefirat HaOmer',
        from: 1,
        omer: { first: 5, stride: 1 },
        transform: withoutOmerNumber,
      },
    ],
    sefard: [
      {
        ...SEFARD,
        title: T.omer,
        path: 'Weekday Maariv > Sefirat HaOmer',
        from: 1,
        omer: { first: 4, stride: 1 },
        transform: withoutOmerNumber,
      },
    ],
    edot_hamizrach: [edotOmer()],
    chabad: [
      {
        ...CHABAD,
        title: T.omer,
        path: 'Sefirat HaOmer',
        from: 1,
        omer: { first: 3, stride: 1 },
        transform: withoutOmerNumber,
      },
    ],
  },
  shacharit: {
    ashkenaz: ashkenazShacharit(),
    sefard: sefardShacharit(),
    edot_hamizrach: edotShacharit(),
    chabad: chabadShacharit(),
  },
  mincha: {
    ashkenaz: ashkenazMincha(),
    sefard: sefardMincha(),
    edot_hamizrach: edotMincha(),
    chabad: chabadMincha(),
  },
  maariv: {
    ashkenaz: ashkenazMaariv(),
    sefard: sefardMaariv(),
    edot_hamizrach: edotMaariv(),
    chabad: chabadMaariv(),
  },
};

function chabadMincha() {
  const base = { ...CHABAD, transform: CHABAD_VARIANTS };
  const tachanun = 'Mincha > Tachanun';
  const aleinu = 'Mincha > Aleinu';
  return [
    { ...base, title: T.korbanot, path: 'Mincha > Korbanot' },
    { ...base, title: T.ashrei, path: 'Mincha > Ashrei', insert: [{ at: 1, ...NOTES.fastTorahReading }] },
    {
      ...base,
      title: T.amidah,
      path: 'Mincha > Amidah',
      at: {
        2: IN_AYT,
        7: IN_AYT,
        15: FAST,
        23: TISHA_BAV,
        26: FAST,
        29: YAALEH_VEYAVO,
        33: AL_HANISSIM,
        34: CHANUKAH,
        35: PURIM,
        37: IN_AYT,
        39: FAST,
        41: IN_AYT,
      },
      reviewed: [9, 32],
      insert: [{ at: 44, ...NOTES.erevYomKippurVidui }],
    },
    {
      ...base,
      title: T.tachanun,
      path: tachanun,
      to: 11,
      when: MINCHA_TACHANUN,
      at: { 9: MINCHA_AVINU_MALKEINU },
      insert: [{ at: 0, ...NOTES.tachanunDisputed }],
    },
    { ...base, title: T.kaddish, path: tachanun, from: 12 },
    { ...base, title: T.ledavid, path: aleinu, to: 0, when: LEDAVID },
    { ...base, title: T.aleinu, path: aleinu, from: 1, to: 2 },
    { ...base, title: T.mournersKaddish, path: aleinu, from: 4, to: 6 },
    { ...base, title: T.alTira, path: aleinu, from: 7 },
  ];
}

function chabadMaariv() {
  const base = { ...CHABAD, path: 'Maariv', transform: CHABAD_VARIANTS };
  return [
    { ...base, title: T.vehuRachum, to: 0 },
    { ...base, title: T.shirHamaalot, from: 1, to: 2 },
    { ...base, title: T.barchu, from: 3, to: 4 },
    { ...base, title: T.shemaBlessings, from: 5, to: 15 },
    {
      ...base,
      title: T.amidah,
      from: 16,
      to: 57,
      at: {
        18: IN_AYT,
        23: IN_AYT,
        27: MOTZAEI,
        42: YAALEH_VEYAVO,
        45: AL_HANISSIM,
        46: CHANUKAH,
        47: PURIM,
        49: IN_AYT,
        52: IN_AYT,
      },
    },
    { ...base, title: T.kaddish, from: 58, to: 62, at: each(60, 62, { none: ['viHiNoam'] }) },
    {
      ...base,
      title: T.motzaeiShabbat,
      from: 64,
      to: 66,
      at: { 64: VI_HI_NOAM, 65: VI_HI_NOAM, 66: VEATA_KADOSH },
      insert: [{ at: 66, ...NOTES.tishaBavEichah }],
    },
    { ...base, title: T.kaddishAfterAdditions, from: 59, to: 62, when: VEATA_KADOSH, at: { 60: VI_HI_NOAM } },
    {
      ...CHABAD,
      title: T.omer,
      path: 'Sefirat HaOmer',
      from: 1,
      when: OMER,
      omer: { first: 3, stride: 1 },
      transform: withoutOmerNumber,
    },
    { ...base, title: T.aleinu, from: 67, to: 68 },
    { ...base, title: T.mournersKaddish, from: 70, to: 72 },
    { ...base, title: T.alTira, from: 73 },
  ];
}

function chabadBirchot() {
  return [
    { ...CHABAD, title: T.modehAni, path: 'Shacharit > Upon Arising', from: 1 },
    {
      ...CHABAD,
      title: T.morningBlessings,
      path: 'Shacharit > Morning Blessings',
      from: 1,
      to: 23,
      drop: [2, 5],
      at: each(14, 15, NOT_FASTING_BAREFOOT),
    },
    { ...CHABAD, title: T.torahBlessings, path: 'Shacharit > Morning Blessings', from: 25 },
  ];
}

function chabadSongs(when) {
  const heOnly = { he: 'chabadHe', transform: CHABAD_VARIANTS, path: 'Shacharit > Song of the Day' };
  const mournersKaddish = { he: 'chabadHe', transform: CHABAD_VARIANTS, path: "Shacharit > Mourner's Kaddish" };
  return [
    { ...heOnly, title: T.beitYaakov, from: 1, to: 4, when, at: { 1: TACHANUN_SHACHARIT } },
    {
      ...heOnly,
      title: T.songOfDay,
      from: 6,
      to: 29,
      when,
      at: weekdaySongs([
        [6, 9],
        [10, 13],
        [14, 17],
        [18, 21],
        [22, 25],
        [26, 29],
      ]),
    },
    { ...mournersKaddish, title: T.songOfDay, when },
    { ...heOnly, title: T.barchiNafshi, from: 30, to: 32, when: both(when, ROSH_CHODESH) },
    { ...mournersKaddish, title: T.barchiNafshi, when: both(when, ROSH_CHODESH) },
    { ...heOnly, title: T.ledavid, from: 33, when: both(when, LEDAVID) },
  ];
}

function chabadShacharit() {
  const base = { ...CHABAD, transform: CHABAD_VARIANTS };
  const heOnly = { he: 'chabadHe', transform: CHABAD_VARIANTS };
  const at = (node) => `Shacharit > ${node}`;
  const tachanun = at('Tachnun');
  const torah = at('Torah Reading');
  const uvaLetzion = at('Ashrei Uva LeZion');
  const festivalMusaf = 'Musaf for Festivals';
  return [
    ...chabadBirchot(),
    { ...heOnly, title: T.lulav, path: 'Lulav', from: 1, when: CHOL_HAMOED_SUKKOT, at: each(7, 8, { all: ['lulavShehecheyanu'] }) },
    { ...base, title: T.maTovu, path: at('Morning Prayer'), to: 2 },
    { ...base, title: T.adonOlam, path: at('Morning Prayer'), from: 3, to: 3 },
    { ...heOnly, title: T.akedah, path: at('Morning Prayer'), from: 4, to: 7, at: { 4: TACHANUN_SHACHARIT, ...each(6, 7, TACHANUN_SHACHARIT) } },
    { ...heOnly, title: T.sovereignty, path: at('Morning Prayer'), from: 8, to: 16 },
    { ...heOnly, title: T.korbanot, path: at('Morning Prayer'), from: 17, at: { 19: TACHANUN_SHACHARIT, 31: TACHANUN_SHACHARIT }, reviewed: [17] },
    { ...heOnly, title: T.korbanot, path: at('Kaddish DeRabbanan') },
    { ...heOnly, title: T.pesukeiDezimra, path: at('Hodu') },
    { ...heOnly, title: T.pesukeiDezimra, path: at('Pesukei Dezimra'), to: 17, at: { 2: MIZMOR_LETODA, 16: IN_AYT } },
    { ...heOnly, title: T.shemaBlessings, path: at('Pesukei Dezimra'), from: 18 },
    { ...heOnly, title: T.shemaBlessings, path: at('Blessings of the Shema') },
    { ...base, title: T.amidah, path: at('The Amidah'), to: 5, at: { 2: IN_AYT } },
    {
      ...heOnly,
      title: T.amidah,
      path: at('The Amidah'),
      from: 6,
      at: {
        7: IN_AYT,
        15: FAST,
        26: YAALEH_VEYAVO,
        30: AL_HANISSIM,
        31: CHANUKAH,
        32: PURIM,
        34: IN_AYT,
        38: IN_AYT,
      },
      reviewed: [9, 29],
    },
    {
      ...heOnly,
      title: T.hallel,
      path: 'Hallel',
      to: 24,
      drop: [4, 7],
      when: HALLEL,
      at: { 5: WHOLE_HALLEL_ONLY, 8: WHOLE_HALLEL_ONLY, ...each(22, 24, ROSH_CHODESH) },
      insert: [{ at: 0, ...NOTES.hallelDisputed }],
    },
    {
      ...heOnly,
      title: T.hallel,
      path: uvaLetzion,
      from: 5,
      to: 8,
      when: UNDISPUTED_HALLEL,
      at: each(6, 8, MUSAF),
      insert: [{ at: 9, ...NOTES.hoshanot }],
    },
    ...chabadSongs(MUSAF),
    { ...base, title: T.tachanun, path: tachanun, to: 8, when: TACHANUN_SHACHARIT, insert: [{ at: 0, ...NOTES.tachanunDisputedShacharit }] },
    { ...heOnly, title: T.tachanun, path: tachanun, from: 10, to: 30, when: LONG_TACHANUN },
    { ...heOnly, title: T.tachanun, path: tachanun, from: 31, to: 33, when: TACHANUN_SHACHARIT, at: { 31: SHACHARIT_AVINU_MALKEINU } },
    { ...heOnly, title: T.halfKaddish, path: tachanun, from: 34, when: NO_UNDISPUTED_HALLEL },
    { ...heOnly, title: T.torahReading, path: torah, to: 15, when: TORAH_READING, at: each(0, 1, CHABAD_KEL_ERECH_APAYIM) },
    { ...heOnly, title: T.torahReading, path: tachanun, from: 35, when: TORAH_READING },
    {
      ...heOnly,
      title: T.torahReading,
      path: torah,
      from: 17,
      drop: [20],
      when: TORAH_READING,
      insert: [
        { at: 26, ...NOTES.megillah },
        { at: 26, ...NOTES.kinot },
      ],
    },
    { ...heOnly, title: T.uvaLetzion, path: uvaLetzion, to: 3, drop: [1], at: { 2: TACHANUN_SHACHARIT }, transform: compose(CHABAD_VARIANTS, UVA_LETZION_COVENANT) },
    { ...heOnly, title: T.uvaLetzion, path: uvaLetzion, from: 4, to: 8, when: NOT_MUSAF, at: { 6: TITKABEL_AFTER_UVA_LETZION } },
    { ...heOnly, title: T.returningTorah, path: uvaLetzion, from: 9, when: TORAH_READING },
    { ...heOnly, title: T.musaf, path: 'Rosh Chodesh', to: 25, when: ROSH_CHODESH, at: each(16, 17, CHANUKAH) },
    {
      ...heOnly,
      title: T.musaf,
      path: festivalMusaf,
      when: CHOL_HAMOED,
      drop: [21, 24, 25, 28, 29, 32, 33, 36, 37, 40, 41, 42],
      at: {
        10: CHOL_HAMOED_PESACH,
        11: CHOL_HAMOED_SUKKOT,
        15: CHOL_HAMOED_PESACH,
        16: CHOL_HAMOED_SUKKOT,
        ...each(18, 20, CHOL_HAMOED_PESACH),
        ...each(22, 23, { all: ['sukkotOffering2'] }),
        ...each(26, 27, { all: ['sukkotOffering3'] }),
        ...each(30, 31, { all: ['sukkotOffering4'] }),
        ...each(34, 35, { all: ['sukkotOffering5'] }),
        ...each(38, 39, { all: ['sukkotOffering6'] }),
        ...each(43, 44, { all: ['sukkotOffering7'] }),
      },
    },
    { ...heOnly, title: T.musaf, path: 'Rosh Chodesh', from: 26, when: MUSAF },
    ...chabadSongs(NOT_MUSAF),
    { ...heOnly, title: T.kaveh, path: at('Kaveh') },
    { ...heOnly, title: T.aleinu, path: at('Aleinu'), to: 1 },
    { ...heOnly, title: T.mournersKaddish, path: at('Aleinu'), from: 3, to: 5 },
    { ...heOnly, title: T.alTira, path: at('Aleinu'), from: 6 },
    { ...heOnly, title: T.sixRemembrances, path: at('Six Remembrances') },
  ];
}

function ashkenazShacharit() {
  const base = { ...ASHKENAZ, transform: ASHKENAZ_VARIANTS };
  const at = (node) => `Weekday > Shacharit > ${node}`;
  const korbanot = (node, extra = {}) => ({ ...base, title: T.korbanot, path: ashkenazPrep(`Korbanot > ${node}`), ...extra });
  const pesukei = (node, extra = {}) => ({ ...base, title: T.pesukeiDezimra, path: at(`Pesukei Dezimra > ${node}`), ...extra });
  const shema = (node) => ({ ...base, title: T.shemaBlessings, path: at(`Blessings of the Shema > ${node}`) });
  const tachanun = (node, when) => ({ ...base, title: T.tachanun, path: at(`Post Amidah > Tachanun > ${node}`), when });
  const torah = (node, extra = {}) => ({ ...base, title: T.torahReading, path: at(`Torah Reading > ${node}`), when: TORAH_READING, ...extra });
  const concluding = (title, node, extra = {}) => ({ ...base, title, path: at(`Concluding Prayers > ${node}`), ...extra });
  const israelKorbanot = (node, extra = {}) => concluding(T.einKelokeinu, `Korbanot (Israel) > ${node}`, { when: IN_ISRAEL, ...extra });
  const wikiMusaf = { he: 'wikiAshkenazAmidah', title: T.musaf, transform: WIKI_ASHKENAZ_MUSAF };
  const birchot = ashkenazBirchot();
  const morningBlessings = birchot.pop();
  return [
    ...birchot,
    { ...base, title: T.maTovu, path: ashkenazPrep('Ma Tovu') },
    { ...base, title: T.adonOlam, path: ashkenazPrep('Adon Olam'), groups: [[0, 9]] },
    { ...base, title: T.yigdal, path: ashkenazPrep('Yigdal') },
    morningBlessings,
    { ...base, title: T.akedah, path: ashkenazPrep('Akedah') },
    { ...base, title: T.sovereignty, path: ashkenazPrep('Sovereignty of Heaven') },
    korbanot('Kiyor'),
    korbanot('Terumat HaDeshen'),
    korbanot('Korban HaTamid', { from: 1 }),
    korbanot('Ketoret'),
    korbanot('Order of the Temple Service', { at: each(3, 4, ROSH_CHODESH) }),
    korbanot('Laws of Sacrifices'),
    korbanot('Baraita of Rabbi Yishmael'),
    korbanot('Kaddish DeRabbanan'),
    pesukei('Introductory Psalm'),
    pesukei("Mourner's Kaddish"),
    pesukei("Barukh She'amar"),
    pesukei('Hodu'),
    pesukei('Mizmor Letoda', { when: MIZMOR_LETODA }),
    pesukei('Yehi Chevod'),
    pesukei('Ashrei'),
    ...[146, 147, 148, 149, 150].map((psalm) => pesukei(`Psalm ${psalm}`)),
    pesukei('Closing Verses'),
    pesukei('Vayevarech David'),
    pesukei('Ata Hu'),
    pesukei('Az Yashir'),
    pesukei('Yishtabach'),
    pesukei('Psalm 130', { when: IN_AYT }),
    pesukei('Half Kaddish'),
    shema('Barchu'),
    shema('First Blessing before Shema'),
    shema('Second Blessing before Shema'),
    shema('Shema'),
    shema('Blessing after Shema'),
    ...ashkenazAmidah('Shacharit'),
    lulavBlessing(),
    metsudahHallel(),
    {
      ...concluding(T.hallel, 'Kaddish Shalem'),
      when: UNDISPUTED_HALLEL,
      at: each(5, 7, MUSAF),
      insert: [{ at: 8, ...NOTES.hoshanot }],
    },
    {
      ...base,
      title: T.vidui,
      path: at('Post Amidah > Vidui and 13 Middot'),
      when: TACHANUN_SHACHARIT,
      insert: [{ at: 0, ...NOTES.tachanunDisputedShacharit }],
    },
    {
      ...base,
      title: T.avinuMalkeinu,
      path: at('Post Amidah > Avinu Malkenu'),
      when: SHACHARIT_AVINU_MALKEINU,
      at: { 4: IN_AYT, 5: FAST_NOT_AYT, ...each(20, 25, IN_AYT), ...each(26, 31, FAST_NOT_AYT) },
    },
    tachanun('For Monday and Thursday', LONG_TACHANUN),
    tachanun('Nefilat Apayim', TACHANUN_SHACHARIT),
    tachanun('God of Israel', LONG_TACHANUN),
    tachanun('Shomer Yisrael', TACHANUN_SHACHARIT),
    { ...base, title: T.halfKaddish, path: at('Post Amidah > Tachanun > Half Kaddish'), to: 5, when: NO_UNDISPUTED_HALLEL },
    torah('Removing the Torah from Ark > El Erech Appayim', { when: KEL_ERECH_APAYIM }),
    torah('Removing the Torah from Ark > Vayehi Binsoa'),
    torah('Removing the Torah from Ark > Berich Shmei'),
    torah('Removing the Torah from Ark > Lekha Hashem'),
    torah('Removing the Torah from Ark > Av Harachamim'),
    torah('Removing the Torah from Ark > Vetigaleh Veteraeh'),
    torah('Reading from Sefer > Birkat HaTorah'),
    torah('Reading from Sefer > Birkat Hagomel'),
    torah('Reading from Sefer > Half Kaddish'),
    torah('Reading from Sefer > Raising the Torah', { at: each(3, 8, LONG_TACHANUN) }),
    torah('Returning Sefer to Aron > Yehalelu'),
    torah('Returning Sefer to Aron > LeDavid Mizmor'),
    torah('Returning Sefer to Aron > Uvenucho Yomar', {
      insert: [
        { at: 1, ...NOTES.megillah },
        { at: 1, ...NOTES.kinot },
      ],
    }),
    concluding(T.uvaLetzion, 'Ashrei'),
    concluding(T.uvaLetzion, "Lamenatze'ach", { at: each(0, 1, LAMNATZEACH), insert: [{ at: 0, ...NOTES.lamnatzeachCholHamoed }] }),
    concluding(T.uvaLetzion, 'Uva Letzion', { transform: compose(ASHKENAZ_VARIANTS, UVA_LETZION_COVENANT) }),
    concluding(T.uvaLetzion, 'Kaddish Shalem', { at: { 5: TITKABEL_AFTER_UVA_LETZION, 6: NOT_MUSAF, 7: NOT_MUSAF } }),
    ...ashkenazAmidah('Shacharit', {
      musaf: [
        { ...wikiMusaf, path: 'ראשי חדשים | ובראשי | ומנחתם | חדש', when: { all: ['musaf', 'roshChodesh'] } },
        {
          ...wikiMusaf,
          path: 'אתה בחרתנו | ותתן רגלים | ומפני | ומפני .. פסוקים פסח א | פסוקים פסח ב | פסוקים סוכות ב | ומנחתם | מלך רחמן | והשיאנו-חול',
          when: CHOL_HAMOED,
          at: { 4: CHOL_HAMOED_PESACH, 5: CHOL_HAMOED_SUKKOT, 6: CHOL_HAMOED_SUKKOT },
        },
      ],
    }),
    concluding(T.musaf, 'Kaddish Shalem', { when: MUSAF }),
    concluding(T.aleinu, 'Alenu'),
    concluding(T.mournersKaddish, "Mourner's Kaddish"),
    concluding(T.songOfDay, 'Song of the Day', {
      at: weekdaySongs([
        [1, 3],
        [4, 6],
        [7, 9],
        [10, 12],
        [13, 15],
        [16, 18],
      ]),
    }),
    concluding(T.songOfDay, 'Barchi Nafshi', { when: ROSH_CHODESH }),
    concluding(T.songOfDay, 'LeDavid', { to: 1, when: LEDAVID }),
    concluding(T.songOfDay, 'LeDavid', { from: 2 }),
    israelKorbanot('Ein Kelohenu', { insert: [{ at: 0, ...NOTES.einKelokeinuInIsrael }] }),
    israelKorbanot('Pitum HaKetoret'),
    israelKorbanot("Mourner's Kaddish"),
    israelKorbanot('Barchu'),
  ];
}

function sefardBirchot() {
  return [
    { ...SEFARD, title: T.modehAni, path: 'Upon Arising > Modeh Ani', from: 0, to: 3 },
    { ...SEFARD, title: T.upon, path: 'Weekday Shacharit > Morning Blessings' },
    { ...SEFARD, title: T.torahBlessings, path: 'Weekday Shacharit > Blessings on Torah', to: 6 },
    {
      ...SEFARD,
      title: T.morningBlessings,
      path: 'Weekday Shacharit > Blessings on Torah',
      from: 7,
      at: each(19, 20, NOT_FASTING_BAREFOOT),
    },
  ];
}

function sefardMusaf() {
  const amidah = { ...SEFARD, title: T.musaf, path: 'Weekday Shacharit > Amidah', transform: SEFARD_VARIANTS, when: MUSAF };
  const yomTov = { he: 'metsudahShabbatHe', en: 'metsudahShabbatEn', linear: true, title: T.musaf };
  const sanctification = { ...yomTov, path: 'Prayers for Yom Tov > Musaf for Yom Tov > Divine Sanctification' };
  const toratEmet = { he: 'toratEmetSefardHe', title: T.musaf, path: 'Rosh Chodesh > Mussaf', flattenSmall: true };
  const sukkotOfferings = [
    [2, 200, 214],
    [3, 215, 229],
    [4, 247, 261],
    [5, 279, 293],
    [6, 311, 325],
    [7, 343, 357],
  ];
  return [
    { ...toratEmet, from: 2, to: 2, when: MUSAF },
    { ...amidah, to: 19, at: { ...each(3, 5, IN_AYT), ...each(9, 10, SUMMER), ...each(11, 13, WINTER), ...each(15, 17, IN_AYT) } },
    {
      ...yomTov,
      path: 'Prayers for Yom Tov > Musaf for Yom Tov > Kedusha for Chol Hamoed',
      when: MUSAF,
      groups: [
        [1, 8],
        [10, 12],
        [15, 16],
        [19, 21],
        [23, 33],
      ],
    },
    { ...amidah, from: 33, to: 38, at: { 35: NOT_AYT, ...each(36, 38, IN_AYT) } },
    { ...toratEmet, from: 12, to: 15, transform: TORAT_EMET_LEAP_YEAR, when: { all: ['musaf', 'roshChodesh'] } },
    {
      ...sanctification,
      from: 9,
      to: 97,
      when: CHOL_HAMOED,
      drop: [20, 25, 30, 31, 36, 37, 39, 80, 81, 82, 83, 85, 86, 87, 89, 90],
      groups: [
        [9, 16],
        [17, 23],
        [27, 28],
        [33, 34],
        [40, 41],
        [42, 78],
        [91, 97],
      ],
      at: { ...each(27, 28, CHOL_HAMOED_PESACH), ...each(33, 34, CHOL_HAMOED_SUKKOT), 84: CHOL_HAMOED_PESACH, 88: CHOL_HAMOED_SUKKOT },
    },
    {
      ...sanctification,
      from: 135,
      to: 150,
      when: CHOL_HAMOED_PESACH,
      groups: [
        [135, 140],
        [141, 150],
      ],
    },
    ...sukkotOfferings.map(([day, from, to]) => ({
      ...sanctification,
      from,
      to,
      when: { all: ['cholHamoedSukkot', `sukkotOffering${day}`] },
      groups: [[from, to]],
    })),
    {
      ...sanctification,
      from: 390,
      to: 450,
      when: CHOL_HAMOED,
      drop: [430, 431, 439, 442, 449],
      groups: [
        [390, 421],
        [422, 450],
      ],
    },
    {
      ...amidah,
      from: 81,
      to: 124,
      drop: [83, 84, 85, 86, 87, 88, 89],
      at: {
        ...each(96, 97, AL_HANISSIM),
        ...each(98, 99, CHANUKAH),
        ...each(100, 101, PURIM),
        ...each(103, 105, IN_AYT),
        ...each(117, 119, IN_AYT),
      },
      reviewed: [95, 114],
    },
    { ...amidah, path: 'Weekday Shacharit > Ashrei', from: 17, to: 22 },
  ];
}

function sefardSongs(placement) {
  const base = { ...SEFARD, transform: SEFARD_VARIANTS };
  const at = (node) => `Weekday Shacharit > ${node}`;
  const early = placement === 'early';
  return [
    {
      ...base,
      title: T.songOfDay,
      path: at('Song of the Day'),
      when: early ? MUSAF : NOT_MUSAF,
      at: weekdaySongs([
        [1, 4],
        [5, 8],
        [9, 12],
        [13, 16],
        [17, 20],
        [21, 24],
      ]),
    },
    ...(early ? [{ ...base, title: T.barchiNafshi, path: at('Barchi Nafshi'), when: { all: ['musaf', 'roshChodesh'] } }] : []),
    {
      ...base,
      title: T.ledavid,
      path: at("L'David Hashem"),
      to: 2,
      when: early ? { all: ['ledavidSeason', 'musaf'] } : { all: ['ledavidSeason'], none: ['musaf'] },
    },
  ];
}

function sefardShacharit() {
  const base = { ...SEFARD, transform: SEFARD_VARIANTS };
  const at = (node) => `Weekday Shacharit > ${node}`;
  const ashrei = (title, extra) => ({ ...base, title, path: at('Ashrei'), ...extra });
  return [
    ...sefardBirchot(),
    { ...base, title: T.akedah, path: at('Morning Prayer'), to: 3, at: each(2, 3, TACHANUN_SHACHARIT) },
    { ...base, title: T.sovereignty, path: at('Morning Prayer'), from: 4 },
    { ...base, title: T.korbanot, path: at('Korbanot'), drop: [5], at: each(24, 25, ROSH_CHODESH) },
    { ...base, title: T.korbanot, path: at("B'raita d'Rabi Yishmael") },
    { ...base, title: T.pesukeiDezimra, path: at('Hodu'), at: each(13, 14, MIZMOR_LETODA) },
    { ...base, title: T.pesukeiDezimra, path: at('Yishtabach'), at: each(2, 3, IN_AYT) },
    { ...base, title: T.shemaBlessings, path: at('The Shema') },
    {
      ...base,
      title: T.amidah,
      path: at('Amidah'),
      at: {
        ...each(3, 5, IN_AYT),
        ...each(9, 10, SUMMER),
        ...each(11, 13, WINTER),
        ...each(15, 17, IN_AYT),
        35: NOT_AYT,
        ...each(36, 38, IN_AYT),
        47: FAST,
        ...each(55, 56, NO_RAIN),
        ...each(57, 58, RAIN),
        65: NOT_AYT,
        ...each(66, 68, IN_AYT),
        ...each(83, 89, YAALEH_VEYAVO),
        85: ROSH_CHODESH,
        86: CHOL_HAMOED_PESACH,
        87: CHOL_HAMOED_SUKKOT,
        ...each(96, 97, AL_HANISSIM),
        ...each(98, 99, CHANUKAH),
        ...each(100, 101, PURIM),
        ...each(103, 105, IN_AYT),
        ...each(117, 119, IN_AYT),
      },
      reviewed: [51, 80, 95, 114],
    },
    lulavBlessing(),
    metsudahHallel(),
    ashrei(T.hallel, { from: 17, to: 22, when: UNDISPUTED_HALLEL, at: each(20, 22, MUSAF), insert: [{ at: 23, ...NOTES.hoshanot }] }),
    ...sefardSongs('early'),
    {
      ...base,
      title: T.vidui,
      path: at('Tachanun'),
      from: 1,
      to: 9,
      when: TACHANUN_SHACHARIT,
      insert: [{ at: 1, ...NOTES.tachanunDisputedShacharit }],
    },
    { ...base, title: T.tachanun, path: at('Tachanun'), from: 10, when: TACHANUN_SHACHARIT },
    {
      ...base,
      title: T.avinuMalkeinu,
      path: at('Avinu Malkeinu'),
      when: SHACHARIT_AVINU_MALKEINU,
      at: { ...each(4, 5, IN_AYT), ...each(6, 7, FAST_NOT_AYT), ...each(22, 27, IN_AYT), ...each(28, 33, FAST_NOT_AYT) },
    },
    {
      ...base,
      title: T.tachanunConclusion,
      path: at('For Monday & Thursday'),
      to: 24,
      when: TACHANUN_SHACHARIT,
      at: each(1, 19, LONG_TACHANUN),
    },
    { ...base, title: T.halfKaddish, path: at('For Monday & Thursday'), from: 25, to: 29, when: NO_UNDISPUTED_HALLEL },
    {
      ...base,
      title: T.torahReading,
      path: at('Torah Reading'),
      when: TORAH_READING,
      at: { ...each(0, 1, KEL_ERECH_APAYIM), ...each(34, 39, LONG_TACHANUN) },
      insert: [
        { at: 31, ...NOTES.halfKaddishAfterReading },
        { at: 40, ...NOTES.megillah },
        { at: 40, ...NOTES.kinot },
      ],
    },
    ashrei(T.uvaLetzion, {
      to: 22,
      transform: compose(SEFARD_VARIANTS, UVA_LETZION_COVENANT),
      at: { ...each(1, 3, LAMNATZEACH), 20: TITKABEL_AFTER_UVA_LETZION, 21: NOT_MUSAF, 22: NOT_MUSAF },
      insert: [{ at: 3, ...NOTES.lamnatzeachCholHamoed }],
      reviewed: [16],
    }),
    ashrei(T.returningTorah, { from: 23, when: TORAH_READING }),
    ...sefardMusaf(),
    { ...base, title: T.beitYaakov, path: at('Beit Yaakov'), when: NOT_MUSAF, at: { 1: TACHANUN_SHACHARIT, ...each(2, 3, LAMNATZEACH) } },
    ...sefardSongs('late'),
    {
      ...base,
      title: T.mournersHouse,
      path: at("L'David Hashem"),
      from: 3,
      when: NOT_MUSAF,
      at: { ...each(3, 5, TACHANUN_SHACHARIT), ...each(6, 7, NO_TACHANUN_SHACHARIT) },
    },
    { ...base, title: T.kaveh, path: at('Kaveh') },
    { ...base, title: T.aleinu, path: at('Aleinu') },
  ];
}

function ashkenazBirchot() {
  return [
    { ...ASHKENAZ, title: T.modehAni, path: ashkenazPrep('Modeh Ani') },
    { ...ASHKENAZ, title: T.netilatYadayim, path: ashkenazPrep('Netilat Yadayim') },
    { ...ASHKENAZ, title: T.asherYatzar, path: ashkenazPrep('Asher Yatzar') },
    { ...ASHKENAZ, title: T.elokaiNeshama, path: ashkenazPrep('Elokai Neshama') },
    { ...ASHKENAZ, title: T.torahBlessings, path: ashkenazPrep('Torah Blessings') },
    { ...ASHKENAZ, title: T.torahBlessings, path: ashkenazPrep('Torah Study') },
    { ...ASHKENAZ, title: T.morningBlessings, path: ashkenazPrep('Morning Blessings') },
  ];
}

function edotBirchot() {
  return [
    { ...EDOT, title: T.modehAni, path: 'Preparatory Prayers > Modeh Ani', from: 2 },
    {
      ...EDOT,
      title: T.morningBlessings,
      path: 'Preparatory Prayers > Morning Blessings',
      from: 1,
      at: each(15, 16, NOT_FASTING_BAREFOOT),
      reviewed: [6],
    },
    { ...EDOT, title: T.torahBlessings, path: 'Preparatory Prayers > Torah Blessings', from: 1 },
  ];
}

function edotHallel() {
  return {
    he: 'edotHe',
    transform: EDOT_VARIANTS,
    title: T.hallel,
    path: 'Rosh Hodesh > Hallel',
    from: 1,
    to: 33,
    drop: [7, 10, 23, 25],
    when: HALLEL,
    at: {
      ...each(1, 4, WHOLE_HALLEL),
      8: WHOLE_HALLEL_ONLY,
      11: WHOLE_HALLEL_ONLY,
      24: WHOLE_HALLEL,
      26: { none: ['hallelDisputed'] },
      ...each(27, 29, MUSAF),
    },
    insert: [
      { at: 1, ...NOTES.hallelDisputed },
      { at: 30, ...NOTES.hoshanot },
    ],
    edits: [{ seg: 8, from: '<b><small>לֹ֤א</small></b><small> <small>', to: '<b>לֹ֤א</b> <small><small>' }],
  };
}

function edotMusaf() {
  const heOnly = { he: 'edotHe', transform: EDOT_VARIANTS, title: T.musaf };
  return [
    { ...heOnly, path: 'Rosh Hodesh > Song of the Day', from: 16, when: MUSAF },
    { ...heOnly, path: 'Rosh Hodesh > Mussaf', from: 2, to: 40, when: ROSH_CHODESH, at: each(17, 19, CHANUKAH) },
    {
      ...heOnly,
      path: 'Prayers for Three Festivals > Mussaf',
      from: 1,
      to: 56,
      drop: [6, 7, 13, 15, 17, 23, 25, 29, 30, 31],
      when: CHOL_HAMOED,
      at: { 14: CHOL_HAMOED_PESACH, 22: CHOL_HAMOED_PESACH, 16: CHOL_HAMOED_SUKKOT, 24: CHOL_HAMOED_SUKKOT },
      transform: compose(EDOT_FESTIVAL_INSERTS, EDOT_VARIANTS),
    },
    { ...heOnly, path: 'Rosh Hodesh > Mussaf', from: 41, when: MUSAF },
  ];
}

function edotShacharit() {
  const base = { ...EDOT, transform: EDOT_VARIANTS };
  const heOnly = { he: 'edotHe', transform: EDOT_VARIANTS };
  const at = (node) => `Weekday Shacharit > ${node}`;
  const amidah = at('Amida');
  const vidui = at('Vidui');
  const torah = at('Torah Reading');
  const uvaLetzion = at('Uva LeSion');
  const songs = at('Song of the Day');
  const rcSongs = 'Rosh Hodesh > Song of the Day';
  const barchiNafshi = 'Rosh Hodesh > Barchi Nafshi';
  return [
    ...edotBirchot(),
    { ...base, title: T.petichatEliyahu, path: at('Petichat Eliyahu'), from: 2, reviewed: [8] },
    {
      ...base,
      title: T.hannah,
      path: at("Hanna's Prayer"),
      from: 1,
      edits: [
        { seg: 1, from: '<small><small>בשבת ויום טוב אין אומרים פסוק זה</small> ', to: '<if none="shabbat,yomTov">' },
        { seg: 1, from: 'לִֽי:</small>', to: 'לִֽי:</if>' },
      ],
    },
    {
      ...base,
      title: T.akedah,
      path: at('Morning Prayer'),
      from: 1,
      to: 9,
      reviewed: [1, 2],
      edits: [
        { seg: 2, from: '<br><br><small>וַהֲרֵינִי', to: '<br><br>וַהֲרֵינִי' },
        { seg: 2, from: 'הַקָּדוֹשׁ בָּרוּךְ הוּא:</small></small>', to: 'הַקָּדוֹשׁ בָּרוּךְ הוּא:</small>' },
      ],
    },
    { ...base, title: T.sovereignty, path: at('Morning Prayer'), from: 10, to: 17 },
    { ...base, title: T.korbanot, path: at('Morning Prayer'), from: 18 },
    { ...base, title: T.korbanot, path: at('Incense Offering'), from: 1, to: 17 },
    { ...heOnly, title: T.korbanot, path: at('Incense Offering'), from: 18 },
    { ...base, title: T.pesukeiDezimra, path: at('Hodu'), from: 1, drop: [12], at: each(6, 7, { any: [AYT, 'hoshanaRabba'] }) },
    { ...base, title: T.pesukeiDezimra, path: at("Pesukei D'Zimra"), from: 1, to: 22, at: { 2: MIZMOR_LETODA, ...each(19, 20, IN_AYT) } },
    { ...base, title: T.shemaBlessings, path: at("Pesukei D'Zimra"), from: 23 },
    { ...base, title: T.shemaBlessings, path: at('The Shema'), from: 1 },
    {
      ...base,
      title: T.amidah,
      path: amidah,
      from: 1,
      to: 71,
      at: {
        ...each(14, 16, FAST),
        ...each(18, 19, NO_RAIN),
        ...each(20, 21, RAIN),
        ...each(29, 30, FAST),
        ...each(33, 38, YAALEH_VEYAVO),
        35: ROSH_CHODESH,
        36: CHOL_HAMOED_PESACH,
        37: CHOL_HAMOED_SUKKOT,
        ...each(45, 46, AL_HANISSIM),
        47: CHANUKAH,
        48: PURIM,
      },
      reviewed: [8, 44, 51, 52, 53, 55, 56, 57, 59, 60, 61, 62, 64, 67, 69, 71],
    },
    lulavBlessing({ from: 2 }),
    edotHallel(),
    { ...base, title: T.avinuMalkeinu, path: amidah, from: 73, to: 105, when: AYT_TACHANUN_SHACHARIT },
    { ...base, title: T.yehiShem, path: amidah, from: 106, when: NO_TACHANUN_NOR_HALLEL },
    {
      ...base,
      title: T.tachanun,
      path: vidui,
      from: 1,
      to: 10,
      when: TACHANUN_SHACHARIT,
      at: { 10: FAST },
      insert: [{ at: 1, ...NOTES.tachanunDisputedShacharit }],
    },
    { ...heOnly, title: T.tachanun, path: vidui, from: 13, to: 32, when: LONG_TACHANUN },
    { ...heOnly, title: T.halfKaddish, path: vidui, from: 12, to: 12, when: TACHANUN_SHACHARIT },
    { ...heOnly, title: T.halfKaddish, path: vidui, from: 12, to: 12, when: NO_TACHANUN_NOR_HALLEL },
    {
      ...heOnly,
      title: T.torahReading,
      path: torah,
      from: 1,
      to: 5,
      when: TORAH_READING,
      at: { ...each(1, 3, TACHANUN_SHACHARIT), ...each(4, 5, NO_TACHANUN_SHACHARIT) },
    },
    { ...heOnly, title: T.torahReading, path: 'Rosh Hodesh > Hallel', from: 36, to: 37, when: MUSAF },
    { ...heOnly, title: T.torahReading, path: torah, from: 6, drop: [18], when: TORAH_READING, insert: [{ at: 21, ...NOTES.kinotEdot }] },
    { ...base, title: T.uvaLetzion, path: at('Ashrei'), from: 1, drop: [4], at: { 5: TACHANUN_SHACHARIT } },
    {
      ...heOnly,
      title: T.uvaLetzion,
      path: uvaLetzion,
      from: 1,
      to: 2,
      transform: compose(EDOT_MEGILLAH, UVA_LETZION_COVENANT, EDOT_VARIANTS),
    },
    { ...heOnly, title: T.uvaLetzion, path: uvaLetzion, from: 4, to: 7, when: NOT_MUSAF, at: { 5: TITKABEL_AFTER_UVA_LETZION } },
    { ...heOnly, title: T.returningTorah, path: uvaLetzion, from: 8, when: { all: ['torahReading'], none: ['musaf'] } },
    { ...heOnly, title: T.beitYaakov, path: at('Beit Yaakov'), from: 2, at: { 2: TACHANUN_SHACHARIT } },
    {
      ...heOnly,
      title: T.songOfDay,
      path: rcSongs,
      from: 1,
      to: 13,
      when: MUSAF,
      at: {
        ...weekdaySongs([
          [1, 2],
          [3, 4],
          [5, 6],
          [7, 8],
          [9, 10],
          [11, 12],
        ]),
        13: CHANUKAH,
      },
    },
    { ...heOnly, title: T.returningTorah, path: rcSongs, from: 14, to: 15, when: MUSAF },
    ...edotMusaf(),
    { ...heOnly, title: T.barchiNafshi, path: barchiNafshi, from: 2, to: 2, when: ROSH_CHODESH },
    { ...heOnly, title: T.festivalPsalm, path: 'Prayers for Three Festivals > Song for Passover', from: 1, to: 1, when: CHOL_HAMOED_PESACH },
    { ...heOnly, title: T.festivalPsalm, path: 'Prayers for Three Festivals > Song for Sukkot', from: 1, to: 1, when: CHOL_HAMOED_SUKKOT },
    { ...heOnly, title: T.kaddish, path: barchiNafshi, from: 3, when: MUSAF },
    {
      ...heOnly,
      title: T.songOfDay,
      path: songs,
      from: 1,
      to: 23,
      when: NOT_MUSAF,
      transform: compose(EDOT_LEVITES_LINE, EDOT_VARIANTS),
      at: {
        ...weekdaySongs([
          [2, 3],
          [4, 5],
          [6, 7],
          [8, 9],
          [10, 11],
          [12, 13],
        ]),
        ...each(14, 15, { any: ['tzomGedaliah', 'asaraBTevet'] }),
        ...each(16, 17, { all: ['dayAfterYomKippur'] }),
        ...each(18, 19, CHANUKAH),
        ...each(20, 21, { any: ['taanitEsther', 'purim'] }),
        ...each(22, 23, { all: ['tzomTammuz'] }),
      },
    },
    { ...heOnly, title: T.mournersHouse, path: songs, from: 24, to: 26, when: NOT_MUSAF },
    { ...heOnly, title: T.kaddish, path: songs, from: 27, when: NOT_MUSAF },
    { ...base, title: T.kaveh, path: at('Kaveh'), from: 1, to: 11 },
    { ...heOnly, title: T.kaveh, path: at('Kaveh'), from: 12 },
    { ...base, title: T.aleinu, path: at('Alenu'), from: 1, to: 4, reviewed: [3] },
    { ...heOnly, title: T.ledavid, path: at('Alenu'), from: 5 },
  ];
}

function edotOmer(extra = {}) {
  return {
    ...EDOT,
    title: T.omer,
    path: 'Counting of the Omer',
    from: 1,
    omer: { first: 4, stride: 3 },
    reviewed: [1],
    edits: [{ seg: 3, from: 'הָעֹֽמֶר: הַיּוֹם', to: 'הָעֹֽמֶר:' }],
    transform: (html, index) => (index >= 5 && index <= 149 && (index - 5) % 3 === 0 ? `הַיּוֹם ${html.trimStart()}` : html),
    ...extra,
  };
}

function edotMincha() {
  const base = { ...EDOT, transform: EDOT_VARIANTS };
  const offerings = 'Weekday Mincha > Offerings';
  const amidah = 'Weekday Mincha > Amida';
  const vidui = 'Weekday Mincha > Vidui';
  return [
    { ...base, title: T.korbanot, path: offerings, from: 1, to: 10, reviewed: [1] },
    { ...base, title: T.ashrei, path: offerings, from: 11, insert: [{ at: 16, ...NOTES.fastTorahReading }] },
    {
      ...base,
      title: T.amidah,
      path: amidah,
      from: 1,
      to: 71,
      at: {
        ...each(13, 15, FAST),
        ...each(17, 18, NO_RAIN),
        ...each(19, 20, RAIN),
        ...each(26, 27, TISHA_BAV),
        28: { none: ['tishaBav'] },
        ...each(31, 32, FAST),
        ...each(35, 40, YAALEH_VEYAVO),
        37: { all: ['roshChodesh'] },
        38: { all: ['cholHamoedPesach'] },
        39: { all: ['cholHamoedSukkot'] },
        ...each(45, 46, AL_HANISSIM),
        47: CHANUKAH,
        48: PURIM,
        ...each(50, 62, FAST),
      },
      reviewed: [7, 44, 65, 67, 68, 69, 71],
      insert: [{ at: 64, ...NOTES.erevYomKippurVidui }],
    },
    { ...base, title: T.avinuMalkeinu, path: amidah, from: 72, to: 104, when: AYT_TACHANUN_MINCHA },
    { ...base, title: T.yehiShem, path: amidah, from: 105, to: 106, when: { none: ['tachanunMincha'] } },
    { ...base, title: T.tachanun, path: vidui, from: 1, to: 9, when: MINCHA_TACHANUN, insert: [{ at: 1, ...NOTES.tachanunDisputed }] },
    { ...base, title: T.kaddish, path: vidui, from: 10, to: 14 },
    {
      ...base,
      title: T.psalm,
      path: vidui,
      from: 15,
      to: 20,
      at: { ...each(15, 16, { none: ['friday'] }), ...each(17, 18, { all: ['friday'] }), ...each(19, 20, FAST) },
    },
    { ...base, title: T.mournersKaddish, path: vidui, from: 21, to: 23 },
    { ...base, title: T.aleinu, path: 'Weekday Mincha > Alenu', from: 1, reviewed: [3] },
  ];
}

function edotMaariv() {
  const base = { ...EDOT, transform: EDOT_VARIANTS };
  const barchu = 'Weekday Arvit > Barchu';
  const amidah = 'Weekday Arvit > Amidah';
  return [
    { ...base, title: T.barchiNafshi, path: barchu, from: 1, to: 2, when: { all: ['roshChodesh'] } },
    { ...base, title: T.vehuRachum, path: barchu, from: 3, to: 7, reviewed: [3] },
    { ...base, title: T.barchu, path: barchu, from: 8, to: 10 },
    { ...base, title: T.shemaBlessings, path: 'Weekday Arvit > The Shema', from: 1 },
    {
      ...base,
      title: T.amidah,
      path: amidah,
      from: 1,
      to: 50,
      at: {
        ...each(8, 9, MOTZAEI),
        ...each(15, 16, NO_RAIN),
        ...each(17, 18, RAIN),
        ...each(26, 27, TISHA_BAV),
        ...each(30, 35, YAALEH_VEYAVO),
        32: { all: ['roshChodesh'] },
        33: { all: ['cholHamoedPesach'] },
        34: { all: ['cholHamoedSukkot'] },
        ...each(39, 40, AL_HANISSIM),
        41: CHANUKAH,
        42: PURIM,
      },
      reviewed: [46, 48, 50],
    },
    { ...base, title: T.yehiShem, path: amidah, from: 51, to: 51 },
    {
      ...base,
      title: T.motzaeiShabbat,
      path: amidah,
      from: 52,
      to: 60,
      at: { ...each(52, 58, VI_HI_NOAM), 59: VEATA_KADOSH, 60: VI_HI_NOAM },
      insert: [{ at: 59, ...NOTES.tishaBavEichah }],
    },
    { ...base, title: T.kaddish, path: amidah, from: 61, to: 65 },
    edotOmer({ when: OMER }),
    { ...base, title: T.shirLamaalot, path: amidah, from: 66, to: 69 },
    { ...base, title: T.closingBarchu, path: amidah, from: 70, to: 72 },
    { ...base, title: T.aleinu, path: 'Weekday Arvit > Alenu', from: 1, reviewed: [3] },
  ];
}


function sefardMincha() {
  const base = { ...SEFARD, transform: SEFARD_VARIANTS };
  const tachanun = 'Weekday Mincha > Tachanun';
  return [
    { ...base, title: T.korbanot, path: 'Weekday Mincha > Korbanot', to: 21 },
    { ...base, title: T.ashrei, path: 'Weekday Mincha > Korbanot', from: 22, insert: [{ at: 28, ...NOTES.fastTorahReading }] },
    {
      ...base,
      title: T.amidah,
      path: 'Weekday Mincha > Amidah',
      at: {
        ...each(3, 5, IN_AYT),
        ...each(9, 10, SUMMER),
        ...each(11, 13, WINTER),
        ...each(15, 17, IN_AYT),
        35: NOT_AYT,
        ...each(36, 38, IN_AYT),
        ...each(47, 48, FAST),
        ...each(53, 54, NO_RAIN),
        ...each(55, 56, RAIN),
        62: NOT_AYT,
        ...each(63, 64, IN_AYT),
        ...each(72, 74, TISHA_BAV),
        75: { none: ['tishaBav'] },
        ...each(80, 81, FAST),
        ...each(85, 91, YAALEH_VEYAVO),
        87: { all: ['roshChodesh'] },
        88: { all: ['cholHamoedPesach'] },
        89: { all: ['cholHamoedSukkot'] },
        ...each(98, 99, AL_HANISSIM),
        ...each(100, 101, CHANUKAH),
        ...each(102, 103, PURIM),
        ...each(105, 107, IN_AYT),
        ...each(109, 116, FAST),
        ...each(119, 121, IN_AYT),
      },
      reviewed: [65, 97],
      insert: [{ at: 123, ...NOTES.erevYomKippurVidui }],
    },
    {
      ...base,
      title: T.avinuMalkeinu,
      path: 'Weekday Mincha > Avinu Malkeinu',
      when: MINCHA_AVINU_MALKEINU,
      at: { ...each(4, 5, IN_AYT), ...each(6, 7, FAST_NOT_AYT), ...each(22, 27, IN_AYT), ...each(28, 33, FAST_NOT_AYT) },
    },
    { ...base, title: T.tachanun, path: tachanun, to: 16, when: MINCHA_TACHANUN, insert: [{ at: 0, ...NOTES.tachanunDisputed }] },
    { ...base, title: T.kaddish, path: tachanun, from: 17, to: 23 },
    { ...base, title: T.aleinu, path: tachanun, from: 24, to: 26 },
    { ...base, title: T.mournersKaddish, path: tachanun, from: 27, to: 31 },
    { ...base, title: T.ledavid, path: tachanun, from: 32, to: 34, when: LEDAVID },
    { ...base, title: T.mournersHouse, path: tachanun, from: 35, to: 36, when: MINCHA_TACHANUN },
  ];
}

function sefardMaariv() {
  const base = { ...SEFARD, transform: SEFARD_VARIANTS };
  const shema = 'Weekday Maariv > The Shema';
  const amidah = 'Weekday Maariv > Amidah';
  const motzaei = 'Weekday Maariv > Motzaei Shabbat';
  return [
    { ...base, title: T.vehuRachum, path: shema, from: 1, to: 1 },
    { ...base, title: T.barchu, path: shema, from: 2, to: 5 },
    { ...base, title: T.shemaBlessings, path: shema, from: 6 },
    {
      ...base,
      title: T.amidah,
      path: amidah,
      to: 95,
      at: {
        ...each(3, 5, IN_AYT),
        ...each(9, 10, SUMMER),
        ...each(11, 13, WINTER),
        ...each(15, 17, IN_AYT),
        21: NOT_AYT,
        ...each(22, 24, IN_AYT),
        27: MOTZAEI,
        ...each(39, 40, NO_RAIN),
        ...each(41, 42, RAIN),
        44: RAIN,
        49: NOT_AYT,
        ...each(50, 51, IN_AYT),
        ...each(65, 70, YAALEH_VEYAVO),
        67: { all: ['roshChodesh'] },
        68: { all: ['cholHamoedPesach'] },
        69: { all: ['cholHamoedSukkot'] },
        ...each(75, 76, AL_HANISSIM),
        ...each(77, 78, CHANUKAH),
        ...each(79, 80, PURIM),
        ...each(82, 84, IN_AYT),
        ...each(88, 90, IN_AYT),
      },
      reviewed: [52],
    },
    { ...base, title: T.kaddish, path: amidah, from: 96, to: 102, at: { 96: VI_HI_NOAM, ...each(100, 102, { none: ['viHiNoam'] }) } },
    {
      ...base,
      title: T.motzaeiShabbat,
      path: motzaei,
      from: 3,
      to: 10,
      at: { ...each(3, 4, VI_HI_NOAM), ...each(5, 10, VEATA_KADOSH) },
      insert: [{ at: 5, ...NOTES.tishaBavEichah }],
    },
    { ...base, title: T.kaddishAfterAdditions, path: motzaei, from: 11, to: 16, when: VEATA_KADOSH, at: { 14: VI_HI_NOAM } },
    {
      ...base,
      title: T.omer,
      path: 'Weekday Maariv > Sefirat HaOmer',
      from: 1,
      when: OMER,
      omer: { first: 4, stride: 1 },
      transform: compose(SEFARD_VARIANTS, withoutOmerNumber),
    },
    { ...base, title: T.shirLamaalot, path: amidah, from: 103, to: 110, when: { all: ['inIsrael'] } },
    { ...base, title: T.closingBarchu, path: amidah, from: 111, to: 112 },
    { ...base, title: T.aleinu, path: amidah, from: 113, to: 115 },
    { ...base, title: T.mournersKaddish, path: amidah, from: 116, to: 120 },
  ];
}

function ashkenazAmidah(service, { musaf } = {}) {
  const mincha = service === 'Minchah';
  const maariv = service === 'Maariv';
  const base = {
    ...ASHKENAZ,
    title: musaf ? T.musaf : T.amidah,
    transform: ASHKENAZ_VARIANTS,
    ...(musaf ? { when: MUSAF } : {}),
  };
  const at = (node) => `Weekday > ${service} > ${mincha ? 'Amida' : 'Amidah'} > ${node}`;
  const summer = { all: ['inIsrael'], none: ['winter'] };
  const middleBlessings = [
    { ...base, path: at('Knowledge'), ...(maariv ? { at: { 1: MOTZAEI } } : {}) },
    ...['Repentance', 'Forgiveness'].map((node) => ({ ...base, path: at(node) })),
    { ...base, path: at('Redemption'), ...(maariv ? {} : { at: { 1: FAST } }) },
    { ...base, path: at('Healing'), ...(maariv ? {} : { reviewed: [2] }) },
    {
      ...base,
      path: at('Prosperity'),
      at: maariv ? { 1: NO_RAIN, 2: RAIN, 4: RAIN } : { 1: NO_RAIN, 2: NO_RAIN, 3: RAIN, 4: RAIN, 6: RAIN },
    },
    { ...base, path: at('Gathering the Exiles') },
    { ...base, path: at('Justice'), at: { 1: NOT_AYT, 2: IN_AYT }, reviewed: [3] },
    ...['Against Enemies', 'The Righteous'].map((node) => ({ ...base, path: at(node) })),
    {
      ...base,
      path: at('Rebuilding Jerusalem'),
      ...(mincha ? { at: { 1: TISHA_BAV, 2: TISHA_BAV, 3: { none: ['tishaBav'] } } } : {}),
    },
    { ...base, path: at('Kingdom of David') },
    { ...base, path: at('Response to Prayer'), ...(mincha ? { at: { 1: FAST, 2: FAST } } : {}) },
  ];
  return [
    musaf
      ? { ...base, path: 'Weekday > Minchah > Amida > Patriarchs', at: each(4, 5, IN_AYT) }
      : { ...base, path: at('Patriarchs'), at: each(mincha ? 4 : 3, mincha ? 5 : 4, IN_AYT) },
    { ...base, path: at('Divine Might'), at: { 1: summer, 2: summer, 3: WINTER, 4: WINTER, 5: WINTER, 7: IN_AYT, 8: IN_AYT } },
    ...(maariv ? [] : [{ ...base, path: at(mincha ? 'Keduasha' : 'Kedushah') }]),
    {
      ...base,
      path: at('Holiness of God'),
      at: maariv ? { 2: NOT_AYT, 3: IN_AYT, 4: IN_AYT } : { 1: NOT_AYT, 2: IN_AYT, 3: IN_AYT },
    },
    ...(musaf ?? middleBlessings),
    musaf
      ? { ...base, path: at('Temple Service'), drop: [1, 2, 3] }
      : { ...base, path: at('Temple Service'), at: maariv ? each(1, 2, YAALEH_VEYAVO) : each(1, 3, YAALEH_VEYAVO) },
    {
      ...base,
      path: at('Thanksgiving'),
      at: maariv
        ? { 2: AL_HANISSIM, 3: AL_HANISSIM, 4: CHANUKAH, 5: PURIM, 7: IN_AYT, 8: IN_AYT }
        : { 4: AL_HANISSIM, 5: AL_HANISSIM, 6: CHANUKAH, 7: PURIM, 9: IN_AYT, 10: IN_AYT },
      ...(maariv ? {} : { reviewed: [3] }),
    },
    ...(maariv ? [] : [{ ...base, path: at('Birkat Kohanim'), ...(mincha ? { when: FAST } : {}) }]),
    {
      ...base,
      path: at('Peace'),
      at: mincha ? { 0: NOT_FAST, 1: FAST, 2: IN_AYT, 3: IN_AYT } : { 1: IN_AYT, 2: IN_AYT },
    },
    mincha
      ? { ...base, path: at('Concluding Passage'), insert: [{ at: 0, ...NOTES.erevYomKippurVidui }] }
      : { ...base, path: at('Concluding Passage'), ...(maariv ? {} : { drop: [4] }) },
  ];
}

function ashkenazMincha() {
  const base = { ...ASHKENAZ, transform: ASHKENAZ_VARIANTS };
  const at = (node) => `Weekday > Minchah > ${node}`;
  return [
    { ...base, title: T.ashrei, path: at('Ashrei'), insert: [{ at: 7, ...NOTES.fastTorahReading }] },
    ...ashkenazAmidah('Minchah'),
    {
      ...base,
      title: T.avinuMalkeinu,
      path: at('Post Amidah > Avinu Malkenu'),
      when: MINCHA_AVINU_MALKEINU,
      at: { 4: IN_AYT, 5: FAST_NOT_AYT, ...each(20, 25, IN_AYT), ...each(26, 31, FAST_NOT_AYT) },
    },
    {
      ...base,
      title: T.tachanun,
      path: at('Post Amidah > Tachanun > Nefilat Appayim'),
      when: MINCHA_TACHANUN,
      insert: [{ at: 0, ...NOTES.tachanunDisputed }],
    },
    { ...base, title: T.tachanun, path: at('Post Amidah > Tachanun > Shomer Yisrael'), when: MINCHA_TACHANUN },
    { ...base, title: T.kaddish, path: at('Post Amidah > Kaddish Shalem') },
    { ...base, title: T.aleinu, path: at('Concluding Prayers > Alenu') },
    { ...base, title: T.mournersKaddish, path: at("Concluding Prayers > Mourner's Kaddish") },
  ];
}

function ashkenazMaariv() {
  const base = { ...ASHKENAZ, transform: ASHKENAZ_VARIANTS };
  const at = (node) => `Weekday > Maariv > ${node}`;
  const shema = (node, extra = {}) => ({ ...base, title: T.shemaBlessings, path: at(`Blessings of the Shema > ${node}`), ...extra });
  return [
    { ...base, title: T.vehuRachum, path: at('Vehu Rachum'), from: 1 },
    { ...base, title: T.barchu, path: at('Barchu') },
    shema('First Blessing before Shema'),
    shema('Second Blessing before Shema'),
    shema('Shema'),
    shema('First Blessing after Shema', { from: 1 }),
    shema('Second Blessing after Shema', { from: 1 }),
    shema('Third Blessing after Shema', { from: 1, when: NOT_IN_ISRAEL }),
    shema('Half Kaddish'),
    ...ashkenazAmidah('Maariv'),
    { ...base, title: T.kaddish, path: at('Kaddish Shalem'), at: { 0: VI_HI_NOAM, ...each(6, 8, { none: ['viHiNoam'] }) } },
    {
      ...base,
      title: T.motzaeiShabbat,
      path: at("Additions for Motza'ei Shabbat > Viyehi Noam"),
      at: { ...each(0, 1, VI_HI_NOAM), ...each(2, 10, { any: ['viHiNoam', 'tishaBav'] }) },
      insert: [{ at: 2, ...NOTES.tishaBavEichah }],
    },
    {
      ...base,
      title: T.kaddishAfterAdditions,
      path: at('Kaddish Shalem'),
      from: 1,
      when: { any: ['viHiNoam', 'tishaBav'] },
      at: { 6: VI_HI_NOAM },
    },
    {
      ...base,
      title: T.omer,
      path: at('Sefirat HaOmer'),
      from: 1,
      when: OMER,
      omer: { first: 5, stride: 1 },
      transform: compose(ASHKENAZ_VARIANTS, withoutOmerNumber),
    },
    { ...base, title: T.aleinu, path: at('Alenu') },
    { ...base, title: T.mournersKaddish, path: at("Mourner's Kaddish") },
    { ...base, title: T.ledavid, path: at('LeDavid'), when: LEDAVID },
  ];
}

module.exports = { SOURCES, TEXTS, CONDITIONAL_INSTRUCTION, ALWAYS_SAID, RULES };
