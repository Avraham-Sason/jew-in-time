# AGENTS.md

## Purpose

- Own the build that turns pinned Sefaria and Hebrew Wikisource siddur sources into the bundled, day-conditioned nusach texts the reader shows.

## Ownership

- [build.js](build.js) downloads each pinned source once into a gitignored cache folder next to it, parses segments into runs, applies the manifest, fills English, validates, and writes [../../assets/siddur/](../../assets/siddur) plus [../../src/data/siddurAssets.generated.ts](../../src/data/siddurAssets.generated.ts). It rewrites only files whose content changed, so Metro's watcher keeps working.
- [build.js](build.js) classifies the sources' small print line by line: a vocalized line is text to say, an unvocalized one is an instruction, and a leading unvocalized label ending in ":" splits off a vocalized line.
- A Wikisource source is fetched through the MediaWiki API at its pinned revision. Its `path` is a list of parts joined by ` | `; each part is a `{{#קטע}}` label, or `A .. B` for the text between label A and label B. Known templates become runs; an unknown template fails the build.
- `flattenSmall` re-classifies a source that prints whole prayers in small print: it unwraps them and keeps only unvocalized fragments as instructions.
- `node scripts/siddur/build.js --inspect <sourceKey> "<path>"` prints a source leaf with its segment indices (`P`: small print promoted to said text, `N`: instruction only). Manifest indices come from this listing.
- [manifest.js](manifest.js) owns the source list (exact Sefaria version title or Wikisource revision, and credit) and, per text and nusach, the source section, range, groups, drops, edits, inserts, conditions, the passages only some say (`SOME_SAY` labels), who says each passage only a minyan says (`SAID_BY` labels), and the per-nusach rule sets (`rule()`, `variant()`, `variantBefore()`) that turn the sources' inline alternatives into conditional runs.
- Two kinds of passage label exist, and a segment may carry both.
  - An optional label (`SOME_SAY`) marks a passage only some say; the reader folds it. A spec's `optional` makes its whole section optional.
  - A minyan label (`SAID_BY`) names who says a passage only a minyan says: the chazzan, the chazzan with the congregation's answer, the repetition's Kedushah, Modim DeRabbanan and Priestly Blessing, the chazzan's Aneinu, mourners, or the person called to the Torah. The reader shows it open under its label. A spec's `minyan` labels each segment of that spec, but never its authored `insert` notes.
- `optionalParts` and `minyanParts` take `[{ from, to, paragraph, until, label, englishInPart }]` and mark a run of segments inside a section. `paragraph` cuts the `from` segment where the run starts, and `until` cuts the `to` segment where it ends. The source English stays with the first piece unless `englishInPart`. A label may carry its own `when`, so the passage folds only on the days it is disputed.

## Local Contracts

- Both outputs are generated. Never hand-edit an asset or the generated map; change the manifest and run `pnpm siddur:build`.
- Every source pins an exact Sefaria version title or Wikisource revision id and carries a credit (title, license, URL). CC-BY and CC-BY-SA credits must reach the output; the reader displays them.
- The build fails, and must keep failing, on:
  - an edit that does not match exactly once;
  - a manifest rule that never matches, so a source update cannot silently drop a variant;
  - an edit, condition, group or `reviewed` index that targets a segment outside the selected range;
  - an omer section that does not carry exactly 49 days, each with its own date label;
  - an instruction note that names a day (`CONDITIONAL_INSTRUCTION`) on a segment with no condition and no `reviewed` entry;
  - such a note in the middle of said text without its own run condition, even inside a conditioned segment, because that is an unresolved inline alternative;
  - small print promoted to said text on an unconditioned segment, unless `reviewed` or matched by `ALWAYS_SAID`;
  - a passage label without Hebrew and English;
  - two optional parts, or two minyan parts, that overlap;
  - a labeled part that matches no text or cuts past a segment's last paragraph;
  - both `minyan` and `minyanParts` on one spec;
  - a group that mixes labeled and unlabeled text;
  - merged sections that disagree on `optional`.

  Fix the manifest; never widen a pattern to silence one.
- Fold a passage behind an optional label only when the source itself marks it as said by only some ("יש נוהגים / יש אומרים / ויש שמוסיפים / מי שרוצה"). The user chose this rule on 2026-10-05; kabbalistic additions the source prints as regular text, such as Leshem Yichud, stay regular.
- Every Kaddish, Barchu, Kedushah, Modim DeRabbanan and Priestly Blessing carries a minyan label; [../../src/data/__tests__/siddur.test.ts](../../src/data/__tests__/siddur.test.ts) fails on one that does not. Kaddish Titkabel and half Kaddish are the chazzan's, and Kaddish Yatom and DeRabbanan are the mourners'. The congregation's answer to the chazzan outside the repetition, such as the answer to Barchu or the Torah-reading responses, sits inside the chazzan's block. The user decided both on 2026-10-05.
- Drop or edit out a source note once a label says the same thing, such as "בחזרת הש״ץ אומרים כאן קדושה", and keep notes that add information. Weekday Maariv has no repetition, so the Ashkenaz source's Kedushah note in Maariv is dropped.
- An `insert` is an authored instruction, never authored liturgy. It points at what the weekday text does not carry (the fast-day Torah reading, the erev Yom Kippur vidui, Eichah, disputed Tachanun) and carries its own condition.
- Tag a segment with a condition only when the rule is certain for that nusach. Anything uncertain stays visible with its own instruction.
- Havdalah follows what it closes, through positive conditions: spices only on `motzaeiShabbat` (never on Tisha B'Av), the flame on `motzaeiShabbat` or `dayAfterYomKippur`. Motzaei Yom Tov and the Sunday night after a Tisha B'Av fast carry no flag, so they come out as wine and Hamavdil. Edot HaMizrach's opening instruction names the spices, so it is tagged like them, with an authored instruction without spices for the other nights. The verses stay visible everywhere the sources are silent; only Ashkenaz, whose Metsudah Yom Kippur machzor marks it, gets a note to skip them after a weekday Yom Kippur.
- One nusach's wording may be taken from another source only when it is verified identical. Current cases: Ashkenaz candle lighting and havdalah come from the Metsudah Shabbat siddur (havdalah verified identical to Daat Siddur Ashkenaz); Chabad candle lighting and havdalah are derived from it with the Chabad divine name and "שבת קודש"; every nusach's Yom Kippur candle lighting comes from the Metsudah Yom Kippur machzor. In Shacharit, Ashkenaz Hallel comes from the Metsudah Shabbat siddur (verified identical to Wikisource Ashkenaz) and its Musaf middle blessing from Hebrew Wikisource; Sefard Musaf combines Metsudah Shabbat and Torat Emet; the lulav blessing comes from Metsudah Shabbat, and Edot HaMizrach takes only its blessings. Four authored havdalah notes join them: the flame that rested on motzaei Yom Kippur, the flame-only night when Tisha B'Av begins at havdalah, the Ashkenaz verses after a weekday Yom Kippur, and the Edot HaMizrach instruction without spices. These are the first items for halachic review.
- English is the aligned translation of the same source, else an exact normalized-Hebrew match from the Metsudah translation memory, else nothing. A source translation that stops aligning by index partway through a leaf is used only up to that point; the rest of the leaf is built without `en`. Omer counts without a source translation take Hebcal's English. No other translation is ever written.
- Hebrew is normalized to NFC; the sources store nikud in non-canonical order.

## Work Guidance

- New text: register its id in [../../src/data/siddur.ts](../../src/data/siddur.ts), add a manifest entry for all four nuschaot, rebuild, and extend [../../src/data/__tests__/siddur.test.ts](../../src/data/__tests__/siddur.test.ts) with dated cases.
- New day-dependent insert: add the flag to [../../src/types/siddur.ts](../../src/types/siddur.ts) and [../../src/utils/siddur.ts](../../src/utils/siddur.ts) with a dated test first, then tag the manifest.
- Map a leaf with `--inspect` before writing its spec, and give every conditional segment its own `at` entry.
- Inline alternatives inside a segment become `<if all|any|none="flag">…</if>` runs. A pattern the source repeats goes in the nusach's rule set; a one-off goes in an `if` edit.
- Section titles must be unique among the sections shown on any one day: the reader keys and scrolls by them. Consecutive specs with the same title merge into one section, and mutually exclusive sections may share a title. [../../src/data/__tests__/siddur.test.ts](../../src/data/__tests__/siddur.test.ts) checks this across sample days.

## Verification

- `pnpm siddur:build` passes, and running it a second time changes no output file.
- `pnpm test -- src/data/__tests__/siddur.test.ts src/utils/__tests__/siddur.test.ts`.

## Child DOX Index

- No child AGENTS.md files.
