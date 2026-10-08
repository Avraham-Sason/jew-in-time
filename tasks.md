# Tasks

Standalone siddur catalog: texts not tied to a mitzvah or a notification (Birkat Hamazon, Tefilat Haderech, …), read through the existing nusach reader. Decisions of 2026-10-08: entry from a home shortcut and the library header, no sixth tab; Retzei / VeHachalitzenu and the Yom Tov Yaaleh Veyavo are never shown; every text ships for all four nuschaot or not at all; no commit or OTA without per-action approval.

## High Priority
- [x] Split `SiddurTextId` into mitzvah and standalone ids
  **What it is:** In `src/types/siddur.ts` add `MitzvahTextId` (the ten existing ids), `StandaloneTextId` (`birkat_hamazon`, `al_hamichya`, `borei_nefashot`, `tefilat_haderech`) and `SiddurGroup`; `SiddurTextId` becomes their union.
  **What it solves:** Today a text id is a mitzvah id, so nothing can describe a text that has no mitzvah.
  **Expected result:** `pnpm typecheck` passes with the generated asset map typed over the union.

- [x] Add the standalone text registry to `src/data/siddur.ts`
  **What it is:** `STANDALONE_TEXTS: Record<StandaloneTextId, { name: {he, en}; group; available?: Condition }>`, `SIDDUR_TEXT_IDS` over both registries, `siddurTextId()` accepting both, `standaloneText(id)` and `hasStandaloneText(id, nusach, features)` (asset present and `available` holds).
  **What it solves:** One registry, mirroring `MITZVOT`, is the single source for names, grouping and availability of catalog texts; `hasSiddurText()` stays the mitzvah bridge untouched.
  **Expected result:** `siddur.test.ts` ships-every-text check iterates both registries and passes once the assets exist.

- [x] Expose the Hebrew day in effect at an instant from `HebcalService`
  **What it is:** `HebcalService.hebrewDayAt(instant, location): HDate` returning the last candidate of the existing `hebrewDaysAt()` (after shkia the next Hebrew day).
  **What it solves:** A standalone text opened with no date must resolve "now" at the location, the same rule the home header already uses; no second copy of the shkia rule.
  **Expected result:** A dated test in `HebcalService.test.ts` shows the day advancing at shkia in four zones (`pnpm test:tz`).

- [x] Decouple the reader route from the mitzvah
  **What it is:** `src/app/siddur/[id].tsx` resolves `id` as a text id: a mitzvah (static or custom) as today, else a standalone entry. For standalone: `date` optional (default `hebrewDayAt(now)` re-read through `useNow`), name from the registry, availability from `hasStandaloneText()`, no "סיימתי" button. Existing `/siddur/<mitzvahId>?date=` links are unchanged.
  **What it solves:** The reader currently needs a mitzvah and a window date, which standalone texts do not have.
  **Expected result:** `/siddur/birkat_hamazon` renders the text for the current Hebrew day; `/siddur/mincha?date=…` behaves exactly as before; `routes.test.ts` and `typecheck` pass.

- [x] Add the catalog screen `src/app/siddur/index.tsx`
  **What it is:** A stack route listing `STANDALONE_TEXTS` grouped by `SiddurGroup` (group headings from i18n, names from the registry in the UI language), rows styled like the library rows, each pushing `/siddur/[id]`. Registered in the root `_layout.tsx` with `presentation: 'card'`.
  **What it solves:** The user-facing entry to the standalone siddur.
  **Expected result:** The screen lists the four M1 texts under "סעודה" and "דרך"; `routes.test.ts` includes `siddur/index`.

- [x] Add the home shortcut and the library header button
  **What it is:** On home, a slim pressable row after the banners (title `siddur.catalog.title`, caption `siddur.catalog.caption`) opening `/siddur`; in the library tab, a siddur button beside the "+" in the `NavBar` `left` slot.
  **What it solves:** Decision 5a: entry from home and the library, no sixth tab.
  **Expected result:** Both open the catalog; home keeps its tab position and layout.

- [x] Add i18n keys for the catalog
  **What it is:** `siddur.catalog.title`, `siddur.catalog.caption`, `siddur.catalog.open`, `siddur.group.meals`, `siddur.group.travel` (plus later groups) in both `he.json` and `en.json`.
  **What it solves:** Normal UI copy goes through i18n; the parity test enforces both dictionaries.
  **Expected result:** `pnpm test -- src/i18n/__tests__/i18n.test.ts` passes.

- [x] Add the new day flags for yesterday's inserts
  **What it is:** `DayFlag`s `yaalehVeyavoYesterday` (the previous Hebrew day was Rosh Chodesh or Chol Hamoed and today is not) and `alHanissimYesterday` (previous day Chanukah or Purim, today not), computed in `dayFeatures()`.
  **What it solves:** A meal begun before sunset keeps yesterday's inserts; the date alone cannot decide, so the reader folds them under a `WHEN_SAID` label on the following day.
  **Expected result:** Dated tests in `src/utils/__tests__/siddur.test.ts` for the day after Rosh Chodesh, the day after Chanukah and an ordinary day.

- [x] Manifest: Birkat Hamazon for all four nuschaot
  **What it is:** `TEXTS.birkat_hamazon` from Metsudah Ashkenaz `Berachot > Birkat HaMazon`, Metsudah Sefard `Birchat HaMazon > Birchat HaMazon`, Edot `Post Meal Blessing`, Chabad `Blessings > Birkat HaMazon`. Sections: the psalm before, zimun (`SAID_BY` labels for the leader, the diners and one who did not eat), the four blessings, Harachaman. Conditions: Al Hanissim on `chanukah`/`purim`, Yaaleh Veyavo on `roshChodesh`/`cholHamoedPesach`/`cholHamoedSukkot` only, Harachaman for Rosh Chodesh / Sukkot by flag, the Sukkot wedding and brit variants folded, Shabbat / Yom Tov / Rosh Hashana lines and the forgetting-rules dropped, the Sefard sheva-berachot zimun folded under `WHEN_SAID`, the "migdol" alternative resolved by `musaf`.
  **What it solves:** The first and largest standalone text, with the user's insert policy applied.
  **Expected result:** `pnpm siddur:build` passes twice with no diff; dated cases in `siddur.test.ts`: Rosh Chodesh shows Yaaleh Veyavo, Chanukah and Purim show Al Hanissim, a weekday shows neither, Retzei never appears.

- [x] Manifest: Al Hamichya and Borei Nefashot for all four nuschaot
  **What it is:** `TEXTS.al_hamichya` from Daat Ashkenaz `Brachot Achronot > Al Hamichyah`, Torat Emet Sefard `Blessings > Me'ein Shalosh`, Edot (derived; the Edot source has no Me'ein Shalosh leaf, so take the verified Sefard wording or add a pinned source), Chabad `Blessings > Berakha Acharona` 0–13. `TEXTS.borei_nefashot` from Daat Ashkenaz `Borei Nefashot`, Torat Emet Sefard `Blessings > Borei Nefashot`, Edot `Blessings on Enjoyments` 11–12, Chabad `Berakha Acharona` 14–15. The grain / wine / fruit alternatives stay as labelled inline alternatives; the Israel / abroad ending uses `inIsrael`; Rosh Chodesh and Chol Hamoed inserts by flag; the Shabbat and Yom Tov inserts dropped.
  **What it solves:** The two after-blessings that follow a snack, the most frequent use of the catalog.
  **Expected result:** Build passes; dated tests assert the Rosh Chodesh insert and the Israel ending.

- [x] Manifest: Tefilat Haderech for all four nuschaot
  **What it is:** `TEXTS.tefilat_haderech` from Daat Ashkenaz `Berachot > Tefillat HaDerech` (English from the community translation, pinned as a new source), Torat Emet Sefard `Blessings > Traveler's Prayer` 0–20 plus the city prayers and the Ramban sea prayer folded under `WHEN_SAID`, Edot `Traveler's Prayer` with the verses folded as `SOME_SAY`, Chabad `The Travelers' Prayer`.
  **What it solves:** The second text the user named.
  **Expected result:** Build passes; `siddur.test.ts` asserts the prayer opens with "יהי רצון" in every nusach.

- [x] Add `pnpm siddur:build` output and the generated map for the four texts
  **What it is:** Run the build, commit the new `assets/siddur/<nusach>/<id>.siddur` files and `siddurAssets.generated.ts`.
  **What it solves:** Assets are generated, never hand-edited; Metro bundles them for the OTA.
  **Expected result:** Sixteen new asset files; a second build changes nothing.

- [x] Tests for the reader decoupling and the catalog
  **What it is:** `src/data/__tests__/siddur.test.ts` cases for the registry (`standaloneText`, `hasStandaloneText` with and without the asset / condition), `routes.test.ts` for `siddur/index`, and the dated content cases named above; run `pnpm test:tz -- src/utils/__tests__/siddur.test.ts src/data/__tests__/siddur.test.ts`.
  **What it solves:** The suite must fail for the reason it claims: wrong insert, missing nusach, broken route.
  **Expected result:** All suites green in four zones.

- [x] DOX pass for M1
  **What it is:** Update `scripts/siddur/AGENTS.md` (standalone specs, new labels, source additions), `src/data/AGENTS.md` (the standalone registry), `src/app/siddur/AGENTS.md` (catalog route, optional date, no done button), `src/app/(tabs)/AGENTS.md` (home shortcut, library button), `src/utils/AGENTS.md` (yesterday flags), `src/services/AGENTS.md` (`hebrewDayAt`), root `AGENTS.md` (Source Map, Common Change Checklist: "New standalone text"), then `pnpm check:dox`.
  **What it solves:** The DOX contract: every meaningful change is reflected in the nearest owning doc.
  **Expected result:** `pnpm check:dox` passes and the docs describe the shipped behavior.

## Medium Priority
- [x] M2: Kriat Shema al Hamita for all four nuschaot
  **What it is:** `kriat_shema_al_hamita` from Metsudah Sefard `Bedtime Shema`, Edot `Bedtime Shema`, Chabad `Bedtime Shema`, and Ashkenaz from a pinned source (Metsudah Ashkenaz has no leaf; candidates: Daat Ashkenaz or Hebrew Wikisource). Night text: resolves for the Hebrew day already in effect.
  **What it solves:** M2 scope.
  **Expected result:** Build and dated tests pass; the catalog shows it under a "לילה" group.

- [x] M2: Asher Yatzar as a standalone text
  **What it is:** `asher_yatzar` reusing the leaves the morning blessings already map (Ashkenaz `Preparatory Prayers > Asher Yatzar`, the Sefard, Edot and Chabad morning-blessing segments).
  **What it solves:** The most frequent daytime blessing, said outside the morning service.
  **Expected result:** Build passes; one segment per nusach, verified identical to the morning text.

- [x] M2: Birchot hanehenin and birchot hare'iya
  **What it is:** `birchot_hanehenin` (hamotzi, mezonot, hagafen, haetz, haadama, shehakol, netilat yadayim, spices) and `birchot_hareiya` (thunder, lightning, rainbow, sea, blossoming trees, shehecheyanu) from Daat Ashkenaz `Barachot Rishonot` / `Blessings on Sights Sounds and Smells`, Torat Emet Sefard `Blessings > …` and `Mealtime Blessings`, Edot `Blessings on Enjoyments` / `Assorted Blessings and Prayers`, Chabad `Blessings > Various Blessings`. Each blessing is its own section so the picker jumps to it.
  **What it solves:** M2 scope.
  **Expected result:** Build passes; a test asserts each blessing title appears once per nusach.

- [x] Fold yesterday's inserts in Birkat Hamazon and Al Hamichya
  **What it is:** On `yaalehVeyavoYesterday` / `alHanissimYesterday` the insert appears folded under `WHEN_SAID` "אם התחילו לאכול לפני השקיעה ב…" instead of being hidden.
  **What it solves:** A meal that began on Rosh Chodesh, Chol Hamoed, Chanukah or Purim and ends after nightfall keeps the insert.
  **Expected result:** A dated test shows the fold on the day after Rosh Chodesh and no insert two days later.

- [x] Halachic review list for the standalone texts
  **What it is:** Append the M1–M3 items a rav should confirm (bein hashmashot resolution, the folded forgetting rule, source substitutions between nuschaot) to the existing review notes in `scripts/siddur/AGENTS.md`.
  **What it solves:** Open items are recorded where the earlier milestones keep theirs.
  **Expected result:** The list exists before the preview-channel publish.

## Low Priority
- [x] M3: Kiddush Levana
  **What it is:** `kiddush_levana` from Metsudah Ashkenaz `Weekday > Maariv > Birkat HaLevana`, Torat Emet Sefard `Kiddush Levanah`, Edot `Blessing of the Moon`, Chabad `Kiddush Levanah`; a new `DayFlag` `kiddushLevana` (nights 3–15 of the Hebrew month) gating `available`, with Tisha B'Av and Yom Kippur handled by the existing flags.
  **What it solves:** M3 scope.
  **Expected result:** Build passes; the catalog hides it outside the window; dated tests for nights 2, 3, 15 and 16.

- [x] M3: Mezuzah blessing and Sheva Berachot
  **What it is:** `mezuzah` from Torat Emet Sefard `Blessings > Mezuzah`, Edot `Assorted Blessings and Prayers > Mezuza`, Chabad `Various Blessings`, Ashkenaz from Daat `Birkhot Hamitzvot`; `sheva_berachot` from Metsudah Sefard `Various Blessings > Sheva Berachot`, Edot `Sheva Berachot`, Chabad `Sheva Berakhot`, Ashkenaz from Metsudah Shabbat `The Seven Marriage Blessings`.
  **What it solves:** M3 scope.
  **Expected result:** Build passes; both appear under a "ברכות" group.

- [x] M3: Chanukah candles
  **What it is:** `chanukah_candles` from Daat Ashkenaz `Festivals > Chanukah > Service for Lighting Chanukah Candles`, Torat Emet Sefard `Chanukah > Menorah Lighting`, Edot `Hanukkah > Menorah Lighting`, Chabad `Chanukah`; `available` on `chanukah` with Shehecheyanu on the first night.
  **What it solves:** M3 scope.
  **Expected result:** Build passes; the first night shows Shehecheyanu and the second does not.

- [ ] Publish M1–M3 over the air
  **What it is:** After the 1.0.17 native build is installed by users, `pnpm update:preview` for review and `pnpm update:production` on approval.
  **What it solves:** Everything here is JS and bundled assets; nothing native changes.
  **Expected result:** The phone shows the catalog on `1.0.17-<n>`.

