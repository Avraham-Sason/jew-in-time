# Tasks

Taharat hamishpacha tracking: niddah cycle, hefsek tahara, shiva nekiim, tevila, onot perisha, smart reminders, minhag presets, husband mode. Decisions taken 2026-10-08: husband mode is in scope; onboarding gains a short personalization questionnaire with a gender question; four presets (Ashkenaz, Chassidic, Chabad, Sephardi by Rav Ovadia Yosef / by Rav Mordechai Eliyahu); ketamim (stain questions) are out of scope and always defer to a rav; the rule table is reviewed by a rav through the review page before production.

## High Priority
- [x] Define taharah types
  **What it is:** `src/types/taharah.ts`: `TaharahEvent` (onset with onah, hefsek, bedika with slot and day index, tevila, restart, pause/resume), `TaharahSettings` (every halachic parameter plus `role: 'woman' | 'husband'`), `CycleState`, `DayTasks`, `PerishaOnah`, `KavuaHint`.
  **What it solves:** One shared shape for the engine, the store, the scheduler and the screens.
  **Expected result:** `pnpm typecheck` passes with the new module exporting every type the engine and store need.

- [x] Add minhag presets
  **What it is:** `src/data/taharahPresets.ts`: the four presets as parameter sets (`hefsekEarliestDay`, `mochDachuk`, `onahBeinonitDays`, `onahBeinonitSpan`, `ohrZarua`, `haflagaMethod`), the nusach-to-preset default, and `TAHARAH_RULES_VERSION`.
  **What it solves:** Minhag differences are data, so a rav's correction changes one row and every derived state replays.
  **Expected result:** A test pins each preset's values and the nusach mapping; changing a value fails the test.

- [x] Build the onah helpers
  **What it is:** `src/utils/taharah/onot.ts`: `onahAt(instant, location)` (Hebrew date + day/night from sunrise/sunset in the location's zone, bein hashmashot flagged doubtful), `onahBounds`, `hebrewDayOfOnah`, add/compare helpers.
  **What it solves:** Every rule counts in Hebrew days and onot; a single owner keeps the scheduler, the calendar and the dashboard agreeing.
  **Expected result:** Unit tests cover day/night, an onset after shkia belonging to the next Hebrew day, and bein hashmashot; `pnpm test:tz` passes.

- [x] Build the cycle engine
  **What it is:** `src/utils/taharah/cycle.ts`: `deriveCycle(events, settings, location, now)` returns the stage (`niddah`, `awaitingHefsek`, `shivaNekiim` day k with bedika status, `tevilaNight`, `tahor`, `paused`, `safek`), key instants (earliest hefsek day and its shkia deadline, each clean day's bedika slots, tevila tzeit) and `tasksForDay(date)`.
  **What it solves:** The core of the feature: what the user must do today and until when, replayed from raw events.
  **Expected result:** Fixture tests for Ashkenaz 5-day and Sephardi 4-day counts, missed hefsek rolling to the next day, failed bedika restarting the seven days, tevila deferred past Yom Kippur / Tisha B'Av, pause mode; `pnpm test:tz` passes.

- [x] Build the vestot engine
  **What it is:** `src/utils/taharah/vestot.ts`: `perishaOnotFor(events, settings, location, range)` computes yom hachodesh, haflaga (days method, Chabad onot method), onah beinonit (30 / 30+31, one onah or 24h), ohr zarua, and `kavuaHints()` (three same-date sightings, three equal intervals).
  **What it solves:** The separation reminders for a woman without a veset kavua, per preset.
  **Expected result:** Tests cover the 30th of a 30-day month followed by a 29-day month, equal intervals, Chabad onot counting, ohr zarua adding the preceding onah, and a kavua hint after three matches.

- [x] Add the encrypted taharah store
  **What it is:** `src/stores/useTaharahStore.ts` on a separate MMKV instance with an `encryptionKey` kept in `expo-secure-store`; persists events and settings with `version`/`migrate`; `AppResetService.reset()` and a dedicated "delete taharah data" action clear it.
  **What it solves:** The data is the most private the app holds; it must not sit in the plain store or in backups.
  **Expected result:** Store tests cover add/undo event, settings change, reset; the instance is excluded from Android auto-backup.

- [x] Add gender and taharah role to the user store
  **What it is:** `gender: 'male' | 'female' | undefined` and `taharahEnabled` in `useUserStore`, with defaults, reset and a migration step.
  **What it solves:** Personalization and the husband/woman role derive from it.
  **Expected result:** Existing persisted users hydrate with `gender` undefined and the feature off.

- [x] Add the onboarding questionnaire
  **What it is:** New onboarding step after welcome: gender, and for a woman or a married man the taharah opt-in with a one-screen explanation and the "the app does not rule, ask a rav" notice.
  **What it solves:** The user asked for a short personalization questionnaire and an explicit opt-in.
  **Expected result:** Route test lists the step; a fresh install reaches home with the right defaults; existing users see the question once from settings.

- [x] Build the taharah screens
  **What it is:** `src/app/taharah/index.tsx` (stage, day k of 7, today's tasks with deadlines, next perisha onah), `log.tsx` (record onset with onah, hefsek, bedikot, tevila, restart, pause), `settings.tsx` (preset, each parameter, role, discreet notifications, biometric lock, delete data). Husband role shows only onot perisha and tevila night.
  **What it solves:** The daily use surface, mirroring existing screen patterns and theme tokens.
  **Expected result:** Routes discovered by `routes.test.ts`; every string in both i18n files; RTL verified.

- [x] Add the home card and settings entry
  **What it is:** A discreet card on home (stage and the next task) when the feature is on, and a Settings section linking to taharah settings.
  **What it solves:** Entry points without a sixth tab.
  **Expected result:** The card renders only when enabled and never inside a holy block.

- [x] Schedule taharah notifications
  **What it is:** New `data.kind = 'taharah'` notifications in `NotificationScheduler.ts` (and the web shim): hefsek (shkia minus lead), bedika morning/evening, tevila prep and tzeit, perisha onah start, "did the period arrive?" nudge. Discreet titles by default. Friday reminders move before candle lighting; nothing fires inside a holy block.
  **What it solves:** The smart reminders the feature is built around, respecting the quiet window.
  **Expected result:** Scheduler tests pin each kind's trigger, the Friday shift and the quiet-block drop; `SCHEDULE_FORMAT` raised.

- [x] Route taharah notification taps
  **What it is:** `notificationResponseHandler.ts` opens `/taharah` for the new kind; a bedika reminder offers a mark-done action.
  **What it solves:** Tapping a reminder lands on the right screen.
  **Expected result:** Response-handler tests cover the new kind.

- [x] Nudge after a holy block for unmarked bedikot
  **What it is:** A `taharah:postBlock:<firstHolyDay>` notification at the block's end plus fifteen minutes when clean days fell inside the block and a bedika of theirs is unrecorded; the dashboard's clean-day grid lets past days be marked after the fact.
  **What it solves:** The app is quiet on Shabbat; the record must still be complete without a second check-in flow.
  **Expected result:** Scheduler test covers a count spanning Shabbat; the grid accepts a bedika for a past clean day.

- [x] Publish the rav review page
  **What it is:** `docs/taharah-review.html`: every rule, preset value, reminder, edge case and deferral the app implements, with sources and a "verify" mark on disputed items. Static, no dependencies, mobile first.
  **What it solves:** The rav approves or corrects the rules before real users rely on them.
  **Expected result:** Page renders offline, RTL, and matches `taharahPresets.ts` exactly.

## Medium Priority
- [x] Add the perisha calendar view
  **What it is:** `src/app/taharah/calendar.tsx`: a Hebrew month grid marking cycle days, clean days, tevila night and every perisha onah with its reason.
  **What it solves:** Couples plan around the onot; a list alone is hard to read.
  **Expected result:** The grid agrees with `perishaOnotFor()` for the displayed month.

- [x] Add biometric lock
  **What it is:** `expo-local-authentication` gate on every taharah route, on by default, with the settings toggle.
  **What it solves:** Privacy on a shared or unlocked phone.
  **Expected result:** Opening a taharah route prompts; a failed prompt returns to home.

- [ ] Native build and version bump
  **What it is:** Add `expo-secure-store` and `expo-local-authentication`, raise `version` in `app.json` and `package.json` together, run `pnpm prebuild:clean`, build via EAS.
  **What it solves:** Both dependencies are native; an OTA cannot ship them.
  **Expected result:** A development build installs on the test device with the encrypted store working.

- [x] Update AGENTS.md chain
  **What it is:** Root, `src/`, `src/utils/`, `src/data/`, `src/stores/`, `src/services/`, `src/app/`, `docs/` AGENTS.md entries for the new modules, rules and the review page.
  **What it solves:** DOX closeout.
  **Expected result:** `pnpm check:dox` passes.

## Low Priority
- [ ] Veset kavua mode
  **What it is:** When the user confirms a kavua with their rav, compute only the kavua onah and drop onah beinonit / yom hachodesh until three misses.
  **What it solves:** Women with a fixed cycle; deferred because the rules differ per posek.
  **Expected result:** Engine tests for a date kavua and an interval kavua.

- [ ] Long-cycle and postpartum exemptions
  **What it is:** The Sephardi 60/90-day pregnancy onot and the long-cycle exemption from onah beinonit.
  **What it solves:** Edge rules the presets currently defer to a rav.
  **Expected result:** Parameterized and covered by tests after rav confirmation.

## Open Questions
- The rav's answers on every item marked "verify" in `docs/taharah-review.html`: yom hachodesh after a sighting on the 30th, ohr zarua default for Ashkenaz, onah beinonit span for Rav Eliyahu, moch dachuk status per preset, bein hashmashot onset handling.
