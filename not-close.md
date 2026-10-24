# Not Closed

Every open item of the project in one place: tasks, bugs, open questions, and other open items (reviews, external dependencies, unverified paths, cleanup). Add new open work here, never in a separate tasks, bugs or questions file, and delete an item in the change that closes it. Closed work lives in git history; the closed findings of the 2026-08-09 failure-point audit stay in [AUDIT.md](AUDIT.md).

Standing rules: no commit or OTA without per-action approval; every siddur text ships for all four nuschaot or not at all; English under a Hebrew segment is the pinned source's translation of exactly that segment ([scripts/siddur/AGENTS.md](scripts/siddur/AGENTS.md), Local Contracts).

## Tasks

### Requests of 2026-10-24 — batch rules

The user's batch of fifteen requests, all decisions taken in the session of 2026-10-24. An executor takes these tasks as written; every product call is already made here.

- **Flag:** every task carries one. `OTA` ships in a numbered over-the-air update (`pnpm update:production`, only with the user's approval); `Build` needs a new native build. A task flagged `OTA` must not add a native module or touch [app.json](app.json) native fields; if it turns out to need one, stop and flag it.
- **Halachic choices:** each zman, window or liturgical rule below is implemented as written and also listed under [Open Questions → For the rav](#for-the-rav) by its `R` number. A rav's answer comes back as a change to that one rule.
- **At least one reminder:** a mitzvah that is switched on always has at least one reminder (task "Require at least one reminder"). Every new switch in this batch follows it.
- **New mitzvot are on by default**, except the ids in `MENS_MITZVOT` ([src/stores/taharahOptIn.ts](src/stores/taharahOptIn.ts)) for a user whose gender is `female`.
- **Gender changes are automatic:** `chooseGender()` is the one place a gender change fans out (mitzvot defaults, palette, taharah role, and from this batch the siddur voice).
- **Declined on 2026-10-24:** offering Tehillim as a download (0.4 MB, not worth the step), and installing only the user's nusach (it would make the first launch depend on the network).
- **Done means:** both dictionaries updated, a DOX pass on every touched AGENTS.md, and `pnpm typecheck`, `pnpm lint`, `pnpm check:dox`, `pnpm test:tz` green. No commit and no OTA without the user's per-action approval.

### High — Requests of 2026-10-24

- [ ] Fix the blank tab screen on iOS
  - **Flag:** `OTA` — screen options in JS only.
  - **What it is:** [src/app/(tabs)/_layout.tsx](<src/app/(tabs)/_layout.tsx>) sets `animation: 'fade'` while inactive tabs stay detachable (the iOS default). `@react-navigation/bottom-tabs` 7.15.11 then derives each tab's detached state from an `Animated` value (`node_modules/@react-navigation/bottom-tabs/src/views/BottomTabView.tsx`, lines 304-325), which under Fabric sometimes leaves the focused tab detached. The screen is blank and the tab bar still shows (react-navigation#12755, react-native-screens#3824; fixed upstream in 7.18.8). Change: pass `detachInactiveScreens={false}` to `<Tabs>` on every platform, and drop `freezeOnBlur: true`, which never worked with an animation set (react-navigation#12621) and would start freezing tabs once the animated path is gone. Keep `animation: 'fade'` and `lazy: false`. In [home.tsx](<src/app/(tabs)/home.tsx>) the `Animated.View entering={FadeInDown…}` wrappers (about lines 419 and 462) run only while the tab is focused (`useIsFocused()`; `entering={focused ? FadeInDown… : undefined}`), so a card that mounts while home is off-screen never sticks at opacity 0.
  - **What it solves:** Moving between home, history, siddur and the other tabs on an iPhone sometimes shows an empty page.
  - **Expected result:** A Jest test pins the tabs' `detachInactiveScreens` as `false` and that no `freezeOnBlur` is set. The Android emulator shows no regression: switching through all five tabs 30 times, and switching right after scrolling siddur and home, never blanks. The iOS check is the user's: after the OTA, on TestFlight, scroll the siddur tab and tap home at once, repeated 30 times, then 30 rapid switches across all tabs, with no blank page. Root [AGENTS.md](AGENTS.md) and [src/app/AGENTS.md](src/app/AGENTS.md) state why the tabs are never detached.

- [ ] Fix weekday and month names that read "null" on iOS
  - **Flag:** `OTA`.
  - **What it is:**
    - **Where it shows:** on an iPhone the home subtitle reads "null · 24 null" where Android reads "יום שבת · 24 אוקטובר" (screenshots of 2026-10-24).
    - **Why:** every weekday and month name in the app comes from Luxon's `toFormat('cccc' | 'ccc' | 'LLLL' | 'LLL')`. Luxon builds these from `Intl.DateTimeFormat().formatToParts()`, and when no part of the requested type comes back it returns `null`. Hermes's `Intl` on iOS does not return those parts, while Hermes on Android does.
    - **The fix:** one formatter, `formatDate(date, pattern, language)`, in [src/i18n/index.ts](src/i18n/index.ts). It reads names from the dictionaries (new keys `weekday.long.0-6`, `month.long.1-12`, `month.short.1-12` beside the existing `weekday.short.0-6`) and numbers from Luxon's numeric getters, so it never touches `Intl`. It supports the tokens in use (`cccc`, `ccc`, `d`, `M`, `LLLL`, `LLL`, `yyyy` and literal separators).
    - **Call sites:** it replaces all 18 name-formatting calls: [home.tsx](<src/app/(tabs)/home.tsx>) lines 102, 161 and 327; [history.tsx](<src/app/(tabs)/history.tsx>):108; [siddur.tsx](<src/app/(tabs)/siddur.tsx>):87; [checkin.tsx](src/app/checkin.tsx):88 and 104; [day/[date].tsx](<src/app/day/[date].tsx>):66 and 72; [hilulot.tsx](src/app/hilulot.tsx):70; [rosh-chodesh.tsx](src/app/rosh-chodesh.tsx):47; [schedule.tsx](src/app/schedule.tsx):133 and 155; [DayStepper.tsx](src/components/DayStepper.tsx):22; [BackupService.ts](src/services/BackupService.ts):165; [planners/hilulot.ts](src/services/notifications/planners/hilulot.ts):80; [planners/holyBlock.ts](src/services/notifications/planners/holyBlock.ts):37; [planners/roshChodesh.ts](src/services/notifications/planners/roshChodesh.ts):58. The last three put text into notifications, so iPhone notifications carry "null" today too.
  - **What it solves:** Dates on iPhone screens and in iPhone notifications show "null" instead of the day and month.
  - **Expected result:**
    - A test that deletes `Intl.DateTimeFormat.prototype.formatToParts` (the Hermes-on-iOS case) renders home and the day view, and builds a Rosh Chodesh notice, all with real Hebrew and English names and no "null".
    - A source-scan test in [designSystem.test.ts](src/app/__tests__/designSystem.test.ts) fails on any `toFormat(` with `ccc`, `LLL` or `EEE` outside `formatDate`.
    - The i18n parity test covers the new keys.
    - The user confirms on TestFlight after the OTA.

- [ ] Seat the tab bar at the bottom on iPhone
  - **Flag:** `OTA`.
  - **What it is:**
    - **Why it floats:** [BottomTabs.tsx](src/components/BottomTabs.tsx) pads the strip under the floating bar by `insets.bottom + spacing.sm`. On an iPhone the home-indicator inset is 34 pt, so the bar floats about 42 pt above the edge. On Android the gesture inset is small, so there the bar sits at the bottom (screenshots of 2026-10-24).
    - **The change:** on iOS only, `paddingBottom = Math.max(spacing.sm, insets.bottom − IOS_HOME_INDICATOR_OVERLAP)` with `IOS_HOME_INDICATOR_OVERLAP = 20`. That gives about 14 pt on a Face ID iPhone and 8 pt on a home-button iPhone (inset 0), so the bar's bottom edge sits just above the home indicator.
    - Android keeps today's padding.
    - Screens that pad their content for the bar keep using its measured height, so no screen needs a literal.
  - **What it solves:** On iPhone the navigation bar sits too high, unlike Android.
  - **Expected result:**
    - A render test with a mocked inset of 34 on iOS gives a bottom padding of 14, and on Android gives 34 + `spacing.sm`.
    - On TestFlight (the user's check) the bar sits right above the home indicator, the last row of a scrolled list is not hidden, and the home indicator stays uncovered.

- [ ] Require at least one reminder on every enabled mitzvah
  - **Flag:** `OTA`.
  - **What it is:** A mitzvah's effective reminders are `activeMitzvot[id].customReminders ?? mitzvah.defaultReminders`.
    - **Switching on with none:** switching it on anywhere while that list is empty (the library switch in [src/app/mitzvot.tsx](src/app/mitzvot.tsx), the mitzvah screen, and the master switches of Rosh Chodesh and hilulot when every notice kind is off) does not switch it on. A `ConfirmDialog` opens instead:
      - title `mitzvah.needsReminder.title` ("אין התראות" / "No reminders");
      - body `mitzvah.needsReminder.body` ("יש להגדיר לפחות התראה אחת בשביל להפעיל מעקב על המצווה" / "Set at least one reminder to start tracking this mitzvah");
      - cancel `common.cancel` ("ביטול"), which only closes;
      - confirm `mitzvah.needsReminder.settings` ("הגדרה" / "Settings"), which pushes `/mitzvah/[id]`, or `/rosh-chodesh` / `/hilulot` for those two.
    - **Deleting the last one:** on the mitzvah screen, deleting the last reminder of an enabled mitzvah is refused with an inline error `reminder.errors.lastReminder` ("יש להשאיר לפחות התראה אחת כל עוד המצווה פעילה" / "Keep at least one reminder while the mitzvah is on").
    - **Existing state:** on hydrate, the `merge` of [useMitzvotStore.ts](src/stores/useMitzvotStore.ts) turns a persisted `customReminders: []` into `undefined`, so the defaults apply. A custom mitzvah already requires one reminder in its form; that stays.
    - **One home for the rule:** a single helper `canEnable(id)` / `effectiveReminders(id)` in [useMitzvotStore.ts](src/stores/useMitzvotStore.ts), used by every switch, never a copy per screen.
  - **What it solves:** The user's rule: tracking a mitzvah without any reminder is never possible.
  - **Expected result:**
    - Render tests show that switching on a mitzvah whose reminders were emptied opens the dialog, that Cancel leaves it off, and that Settings navigates to its screen.
    - Deleting the last reminder of an enabled mitzvah shows the error and keeps the reminder.
    - A store test shows that `customReminders: []` hydrates as defaults.
    - [src/stores/AGENTS.md](src/stores/AGENTS.md) states the rule.

- [ ] Give every mitzvah full reminder flexibility
  - **Flag:** `OTA`.
  - **What it is:** Today [ReminderEditor.tsx](src/components/ReminderEditor.tsx) offers `start`, `end` and `clock` (the last for registry mitzvot only), an offset up to `MAX_OFFSET_MIN` (720), a label and "skip if done". `reminderFires()` ([skipRules.ts](src/utils/skipRules.ts)) drops any trigger outside `[window.start, window.end]`, so a reminder outside the window is refused at save (birchot hashachar at 10:00 is refused because its window ends at sof zman Shema). Change:
    - (1) Every mitzvah, registry and custom alike, gets all three anchors: `allowClock` goes away, and a custom mitzvah may store a `clock` reminder. Update the root AGENTS.md line that says a custom mitzvah never stores one.
    - (2) A heads-up before the window: a trigger may fall up to `HEADS_UP_MAX_MIN = 180` minutes before `window.start`.
      - `reminderFires()` accepts `[window.start − 180 min, window.end]`, still never strictly inside a holy block.
      - A `start` offset may be negative down to −180.
      - A `clock` reminder resolves to the first such wall-clock time at or after `window.start − 180 min` (`clockTriggerAfter` in [planners/mitzvot.ts](src/services/notifications/planners/mitzvot.ts)).
      - `nextReminderAt()` and the planner share the rule, as today.
    - (3) Any number of reminders per mitzvah, listed on the mitzvah screen in trigger order, each with its next fire time (`nextReminderAt` per reminder).
    - (4) When a reminder cannot fire, the editor's error names today's window: `reminder.errors.outsideWindowToday` ("החלון היום פתוח מ־%{start} עד %{end}; בשעה הזו התזכורת לא תישלח").
    - (5) The window of `birchot_hashachar` ends at chatzot hayom (`zmanim.chatzot`) instead of sof zman Shema (R7), so 10:00 is a valid reminder.
    - (6) "Reset to defaults" stays.
  - **What it solves:** The user wants to set any reminder on any mitzvah, not only the defaults, e.g. birchot hashachar at 10:00 instead of at alot.
  - **Expected result:**
    - On a pinned date in Jerusalem, birchot hashachar saves a 10:00 clock reminder, and the planner schedules it at 10:00 local.
    - A custom mitzvah saves a clock reminder.
    - A start reminder at −60 fires an hour before the window opens.
    - A trigger more than 180 minutes before the window, or after its end, is refused with the window named.
    - [NotificationScheduler.nextReminder.test.ts](src/services/__tests__/NotificationScheduler.nextReminder.test.ts), [ReminderEditor.render.test.tsx](src/components/__tests__/ReminderEditor.render.test.tsx) and the window tests in [src/data/__tests__/](src/data/__tests__) cover each case under `pnpm test:tz`.
    - Root [AGENTS.md](AGENTS.md) (Mitzvah Data Model, `defaultReminders`) and [src/services/notifications/AGENTS.md](src/services/notifications/AGENTS.md) state the heads-up limit.

- [ ] Add a follow-up reminder after the window for custom mitzvot
  - **Flag:** `OTA`.
  - **What it is:** A new reminder anchor `followUp` in `ReminderAnchor` ([src/types/mitzvah.ts](src/types/mitzvah.ts)): `offsetMin` (1–720) counts minutes after `window.end`.
    - **When it fires:** only if that window's mitzvah is neither done nor skipped. Behind that:
      - the planner already drops completed and skipped dates;
      - a later mark cancels it through `cancelForMitzvah()`;
      - `skipIfDone` is implied.
    - **The window rule:** `reminderFires()` ([skipRules.ts](src/utils/skipRules.ts)) accepts a `followUp` trigger in `(window.end, window.end + 720 min]`. This is the only exception to "never after the window", and it is still never strictly inside a holy block.
    - **The editor:** [ReminderEditor.tsx](src/components/ReminderEditor.tsx) offers it as a fourth `SegmentedControl` option, `reminder.anchor.followUp` "אחרי הסוף, אם לא בוצע" ("After the end, if not done"), for custom mitzvot only (the user's call, 2026-10-24). The planner and the rule are generic, so offering it to registry mitzvot later is one condition.
    - **The custom form:** in [custom-mitzvah.tsx](src/app/custom-mitzvah.tsx), the reminder check (today "every reminder inside the hours") accepts it.
    - **Its notification:** the default label is `reminder.followUp.label` "עוד לא סימנת: %{name}" / "Not marked yet: %{name}". It keeps the mark-done action, which files under the window's `dateKey` as every mark does.
  - **What it solves:** A custom mitzvah at 10:00 can remind again two hours later if it was not marked done.
  - **Expected result:**
    - A custom mitzvah 10:00–11:00 with a `followUp/60` reminder schedules 12:00.
    - Marking it at 11:30 cancels the 12:00 notification.
    - A follow-up that lands inside Shabbat is not scheduled.
    - The registry editor shows no fourth option.
    - Covered in [NotificationScheduler.test.ts](src/services/__tests__/NotificationScheduler.test.ts), [ReminderEditor.render.test.tsx](src/components/__tests__/ReminderEditor.render.test.tsx) and [customMitzvah.render.test.tsx](src/app/__tests__/customMitzvah.render.test.tsx) under `pnpm test:tz`.
    - Root [AGENTS.md](AGENTS.md) (Mitzvah Data Model, `defaultReminders`) documents the anchor.

- [ ] Group the mitzvot library by category with a floating add button
  - **Flag:** `OTA`.
  - **What it is:** [src/app/mitzvot.tsx](src/app/mitzvot.tsx) is today one flat `Card` filtered by a `ChipRow` of categories, with the add-custom entry as a header `HeaderPill` "+".
    - **Group field:** add `group: LibraryGroup` to `Mitzvah` ([src/types/mitzvah.ts](src/types/mitzvah.ts)), with `LibraryGroup = 'prayers' | 'daily' | 'weekly' | 'seasonal' | 'other' | 'mine'`. It is required on every registry entry; the custom adapter sets `'mine'`. `category` stays as is: it still drives the custom-form pill and the mitzvah screen's cycle label.
    - **Mapping:**
      - prayers: `shacharit`, `mincha`, `maariv`;
      - daily: `tefillin`, `krias_shma_shacharit`, `birchot_hashachar`, `krias_shma_al_hamita`;
      - weekly: `candle_lighting`, `havdalah`;
      - seasonal: `sefirat_haomer`, `chanukah_candles`, `selichot`, `ushpizin`;
      - other: `kiddush_levana`, `chok_leyisrael`, plus the hilulot and Rosh Chodesh setting rows;
      - mine: every custom mitzvah.
    - **Layout:** the screen renders, in that order, one `SectionLabel` plus one `Card divided` per non-empty group, with titles `library.group.prayers` "תפילות", `.daily` "מצוות יומיות", `.weekly` "מצוות שבועיות", `.seasonal` "מצוות עונתיות", `.other` "עוד" and `.mine` "המצוות שלי" (English: Prayers, Daily mitzvot, Weekly mitzvot, Seasonal mitzvot, More, My mitzvot). Within a group the order is `MITZVOT` order, and customs are ordered by `createdAt`. The `ChipRow` filter and the header "+" are removed.
    - **Floating add button:** the shared `Button` with a plus icon, label `library.addCustom`, pushing `/custom-mitzvah`.
      - It is absolutely positioned: `left`/`right` `spacing.lg`, `bottom` = safe-area bottom inset + `spacing.md`, with the `cardSoft` shadow.
      - It always stays at the bottom while the list scrolls.
      - The `ScrollView`'s `contentContainerStyle.paddingBottom` = the button's measured height (`onLayout`) + bottom inset + `spacing.xl`, so the last row scrolls fully above the button.
    - **Cleanup:** remove the unused `library.category.*` keys only if no other file reads them (the custom form's pill does today, so they likely stay), and the unused `library.customSection`. The `mitzvot` search item stays.
  - **What it solves:** The library is hard to scan, and the add button at the top is not accessible or clear.
  - **Expected result:**
    - [mitzvot.render.test.tsx](src/app/__tests__/mitzvot.render.test.tsx) asserts the six section titles in order, each mitzvah under its group, the hilulot and Rosh Chodesh rows under "עוד", no "המצוות שלי" section without customs, and the floating button's label and navigation.
    - It also asserts `paddingBottom ≥` button height + inset.
    - [designSystem.test.ts](src/app/__tests__/designSystem.test.ts) and the smoke test stay green.
    - A screenshot from the `expo-web` preview at phone width shows the last row fully visible above the button when scrolled to the end.
    - [src/app/AGENTS.md](src/app/AGENTS.md) describes the screen.

- [ ] Prepare the registry for new default-on mitzvot
  - **Flag:** `OTA`.
  - **What it is:** The groundwork the five new mitzvot below share.
    - (1) **Default on:** add each new id to the default-on list in [useMitzvotStore.ts](src/stores/useMitzvotStore.ts) (`DEFAULT_ACTIVE`).
    - (2) **Stamp `enabledAt` for existing installs:** today `merge` unions `DEFAULT_ACTIVE` back in without `enabledAt`, and a mitzvah with no `enabledAt` counts as enabled forever ([checkIn.ts](src/utils/checkIn.ts) `wasEnabledBy`). That would turn every past day into a miss and break the streak. So `merge` stamps `enabledAt: Date.now()` on every id it adds that the persisted map lacked, and records those ids in a module-level `addedOnHydrate` list.
    - (3) **Gender defaults:**
      - Add `kiddush_levana` to `MENS_MITZVOT` in [taharahOptIn.ts](src/stores/taharahOptIn.ts), so a switch to `female` turns it off with tefillin, and a switch back turns both on.
      - After both stores hydrate, the root layout calls `applyGenderDefaultsToNew()`, which switches off `addedOnHydrate ∩ MENS_MITZVOT` when `gender === 'female'`.
      - In the library, a mitzvah in `MENS_MITZVOT` shows the caption `library.notForWomen` ("לא נהוג אצל נשים") for a woman, and she can still switch it on.
    - (4) **Siddur text mapping:** a `MITZVAH_STANDALONE_TEXT: Partial<Record<string, StandaloneTextId>>` map in [src/data/siddur.ts](src/data/siddur.ts) links a mitzvah to an existing standalone text. `hasSiddurText()`, the reader, `OPEN_TEXT` and the notification category use it. The text keeps its place in the siddur tab's groups, and `mitzvahTextId()` / `MITZVAH_TEXTS` stay unchanged, so no siddur-tab row is duplicated.
    - (5) **Icons:** new `MitzvahIcon` names with drawings in `DRAWINGS`: `chanukiah`, `sukkah`, `shofar`. The bedtime Shema uses `night` and Kiddush Levana uses `moon`.
    - (6) Raise `SCHEDULE_FORMAT` in [ids.ts](src/services/notifications/ids.ts) once for the batch.
  - **What it solves:** New mitzvot reach existing installs switched on, without rewriting their history or switching on men's mitzvot for women.
  - **Expected result:**
    - A store test: hydrating a persisted map without the new ids yields them `enabled: true` with `enabledAt` ≈ now, and `computeStats()` over the previous 30 days counts no miss for them.
    - The same hydrate with `gender: 'female'` leaves `kiddush_levana` off.
    - `chooseGender('female')` turns `tefillin` and `kiddush_levana` off, and `chooseGender('male')` turns them back on.
    - [stores.test.ts](src/stores/__tests__/stores.test.ts) (the fresh-install enabled set) and [mitzvahIcon.test.ts](src/components/__tests__/mitzvahIcon.test.ts) are updated.

- [ ] Add the bedtime Shema as a mitzvah
  - **Flag:** `OTA`.
  - **What it is:** A registry entry `krias_shma_al_hamita`:
    - he "קריאת שמע על המיטה", en "Bedtime Shema";
    - icon `night`, `category: 'daily-evening'`, `group: 'daily'`, `timeType: 'range-within-day'`, `skipOn: []`, all nuschaot;
    - window from `nightfall(zmanim, location)` to `nextAlot(ctx)` (R3);
    - one default reminder `{ anchor: 'clock', offsetMin: 1350 }` (22:30) with three `bodyVariants`;
    - a description line "לכתחילה לפני חצות הלילה" (R3);
    - linked to the standalone text `kriat_shema_al_hamita` through `MITZVAH_STANDALONE_TEXT`.
    - Inside a holy block no reminder fires, and the night is asked about in the block's check-in like every other window that reaches into a block.
  - **What it solves:** Reminders and tracking for the bedtime Shema, not only its text.
  - **Expected result:**
    - Window tests on dated days in Jerusalem and Los Angeles under `pnpm test:tz`.
    - The reminder schedules at 22:30 on a weekday and not on Friday night.
    - The Shabbat check-in lists it.
    - The mitzvah screen opens its text, and a notification gets the open-text action.

- [ ] Add Kiddush Levana as a monthly mitzvah
  - **Flag:** `OTA`.
  - **What it is:** A registry entry `kiddush_levana`:
    - he "קידוש לבנה", en "Kiddush Levana";
    - icon `moon`, `category: 'seasonal'`, `group: 'other'`, `timeType: 'monthly-window'`, all nuschaot;
    - linked to the standalone text `kiddush_levana`;
    - in `MENS_MITZVOT`.
    - **The period (R1):** computed from the molad, through `@hebcal/core`'s `Molad` for the Hebrew month:
      - it starts 3 days after the molad for Ashkenaz, and 7 days after it for Sefard, Edot HaMizrach and Chabad;
      - it ends 14 days 18 hours 22 minutes after the molad for Ashkenaz, Sefard and Chabad, and 15 days after it for Edot HaMizrach;
      - in Tishrei it starts no earlier than the exit of Yom Kippur, and in Av no earlier than the night after Tisha B'Av.
    - **One multi-day window per month:**
      - It belongs to the day of the first night it can be said: nightfall on or after the period start that is not a Shabbat or Yom Tov night. It is keyed on that day, and every other day returns `null`.
      - It runs from that nightfall to the period end.
      - Shabbat and Yom Tov nights inside it are quiet as usual.
    - **Engine support for a window longer than a day.** Add `multiDay?: { maxDays: number }` to `Mitzvah` (16 here), and honour it in:
      - `appDayWindow()` / `currentOrNextWindow()` ([buildDayTimeline.ts](src/utils/buildDayTimeline.ts)), which look back up to `maxDays` for a window still open, so home shows it every night of the period until done;
      - `planMitzvot()`, which plans the triggers of a window that started up to `maxDays` back;
      - `judgeDay()` ([historyStats.ts](src/utils/historyStats.ts)), where the item is open until `window.end`, done when marked, and missed after the period ends unmarked;
      - the check-in, which skips a multi-day window whose end is after the block.
    - **A new reminder anchor `blockExit`:** it fires `offsetMin` minutes after the exit of every holy block that ends inside the window. The editor offers it only for a `multiDay` mitzvah, labelled `reminder.anchor.blockExit` "במוצאי שבת וחג".
    - **Default reminders:** `start/0` (the first night) and `blockExit/15` (motzaei Shabbat within the period), each with three `bodyVariants`.
    - Retire the plain `kiddushLevana` day-3-to-15 flag in [src/utils/siddur.ts](src/utils/siddur.ts) in favour of the same period function, so the siddur tab and the mitzvah agree on which nights are open. The function lives in one home: `kiddushLevanaPeriod(hebrewMonth, nusach)` in [src/utils/siddur.ts](src/utils/siddur.ts).
  - **What it solves:** Kiddush Levana in its time, with reminders, as one monthly mitzvah instead of a nightly one.
  - **Expected result:**
    - Period tests against published molad times for three months, per nusach, including Tishrei and Av.
    - On a pinned month, home shows it from the first night through the period end until it is marked.
    - Marking it on the fifth night files it under the first night's key, clears it from home and cancels its later reminders.
    - History shows one item for the month, done or missed.
    - No reminder inside a Shabbat, and one at block exit + 15.
    - The siddur tab greys the text outside the period.
    - Root [AGENTS.md](AGENTS.md) documents `multiDay` and `blockExit`.

- [ ] Add Selichot as a seasonal mitzvah
  - **Flag:** `OTA`.
  - **What it is:** A registry entry `selichot`:
    - he "סליחות", en "Selichot";
    - icon `shofar`, `category: 'seasonal'`, `group: 'seasonal'`, `timeType: 'annual-seasonal'`, all nuschaot;
    - linked to the standalone text `selichot`.
    - **Window (R2):** on each day of the user's nusach season, the same flags the siddur tab uses (`selichotFlags()` in [src/utils/siddur.ts](src/utils/siddur.ts): Edot HaMizrach from 2 Elul, the others from leil Selichot, both through 9 Tishrei, none on Shabbat, Yom Tov or Yom Kippur), it runs from `chatzotLayla` to the next morning's `sofZmanTfilaGra`. That is the existing `MIDNIGHT_TO_MORNING_PRAYER` hours, keyed on the civil day whose night it opens.
    - **One default reminder:** `start/0` at chatzot halayla (the user's call), with three `bodyVariants`, editable like every reminder.
  - **What it solves:** Selichot reminders through the season, by nusach.
  - **Expected result:**
    - Window tests per nusach for the first and last day of the season and for a Shabbat in between (no window).
    - The reminder schedules at chatzot.
    - The siddur tab and the mitzvah agree on the days.

- [ ] Add Chanukah candles as a seasonal mitzvah
  - **Flag:** `OTA`.
  - **What it is:** A registry entry `chanukah_candles`:
    - he "נרות חנוכה", en "Chanukah candles";
    - icon `chanukiah`, `category: 'seasonal'`, `group: 'seasonal'`, `timeType: 'annual-seasonal'`, all nuschaot;
    - linked to the standalone text `chanukah_candles`.
    - **Window per night (R4),** for each of the eight nights (the evenings that open 25 Kislev through 2 Tevet):
      - a weekday starts at nightfall (tzeit) for Ashkenaz, Sefard and Edot HaMizrach, and at shkia for Chabad;
      - Friday runs from `plagHaMincha` to the Shabbat candle lighting time;
      - motzaei Shabbat starts at the block exit;
      - every night ends at the next alot;
      - a night is keyed on the civil day whose evening it is.
    - **Default reminder:** `start/0`, with three `bodyVariants` that name the night ("הנר ה־%{n}"). The body carries the night's count through a new optional `bodyParams(ctx)` on `Mitzvah`, which the planner fills when building the body.
  - **What it solves:** Chanukah candle reminders, with the Friday and motzaei Shabbat timing right.
  - **Expected result:**
    - Window tests for a weekday night, a Friday (ends at candle lighting, before the block) and a motzaei Shabbat (starts at the exit) in Jerusalem and abroad, under `pnpm test:tz`.
    - Each reminder's body names the right night.
    - No window outside Chanukah.

- [ ] Add Ushpizin as a seasonal mitzvah with its text
  - **Flag:** `OTA` — the text is a bundled asset.
  - **What it is:**
    - (1) **Text:** a new standalone text `ushpizin` in the occasions group, he "אושפיזין", en "Ushpizin", available on the nights of Sukkot (a new day flag `sukkotNight` for 15–21 Tishrei nights). It is built by `pnpm siddur:build` from pinned sources already cached in [scripts/siddur/.cache/](scripts/siddur/.cache):
      - Ashkenaz: the `Ushpizin` section of the Metsudah or Torat Emet Ashkenaz source;
      - Sefard: "Prayer Upon Entering Sukkah" in `toratEmetSefardHe.json`, which carries "תיבו תיבו אושפיזין";
      - Edot HaMizrach: "סדר שבעה אושפיזין" in `edotHe.json`;
      - English: the pinned translations where they exist, Hebrew only otherwise, per the siddur contract.
      - Each night's ushpiz paragraph is conditioned on its night (flags `ushpizinNight1..7`).
    - (2) **Chabad:** Chabad custom is not to recite the "עולו אושפיזין" formula (R5). So the mitzvah's `nuschaotSupported` excludes `chabad`, and the text is not shipped for Chabad. This is a deliberate exception to "every text ships for all four nuschaot". Record it in the test that enforces that rule as a named allowlist entry (`ushpizin: ['chabad']`) and in [scripts/siddur/AGENTS.md](scripts/siddur/AGENTS.md). If the rav answers that Chabad does say it, the exception is removed and a Chabad source is added.
    - (3) **Mitzvah:**
      - registry entry `ushpizin`: icon `sukkah`, `category: 'seasonal'`, `group: 'seasonal'`, `timeType: 'annual-seasonal'`, linked to the text;
      - window per night: nightfall → next alot on the seven nights;
      - default reminder `start/0`, whose body names that night's ushpiz (Avraham, Yitzchak, Yaakov, Moshe, Aharon, Yosef, David, in that order; R5), with three `bodyVariants` through `bodyParams`.
    - (4) **Nights inside a holy block** (Yom Tov, and Shabbat of chol hamoed):
      - no reminder fires;
      - the pre-block notice ([planners/holyBlock.ts](src/services/notifications/planners/holyBlock.ts)) gets one line per such night while the mitzvah is on: `holyBlock.notice.ushpizinTonight` "הלילה אושפיזין: %{name}", or `ushpizinOn` with the weekday;
      - after the block, the check-in lists each of those nights as done or not, through the existing check-in.
  - **What it solves:** The Ushpizin invitation each night of Sukkot, with the night's guest named, and its tracking on Shabbat and Yom Tov.
  - **Expected result:**
    - [siddur.test.ts](src/data/__tests__/siddur.test.ts) dated cases for nights 1 and 7 in three nuschaot.
    - A Chabad user sees neither the text nor the mitzvah.
    - The planner schedules chol hamoed nights with the right name, and puts the Yom Tov nights' lines in the pre-block notice.
    - The check-in after the first Yom Tov lists the Yom Tov nights.
    - [scripts/siddur/AGENTS.md](scripts/siddur/AGENTS.md) records the sources and the Chabad exception.

- [ ] Keep Maariv open all night
  - **Flag:** `OTA`.
  - **What it is:** In [src/data/mitzvot.ts](src/data/mitzvot.ts), maariv's `computeWindow` ends at `nextAlot(ctx)` instead of `zmanim.chatzotLayla` (R6). The mitzvah's description gains the line "לכתחילה עד חצות הלילה". Its default reminders (`start/0`, `start/120`) stay.
  - **What it solves:** Maariv may be prayed all night; today home, history and reminders treat it as closed at chatzot.
  - **Expected result:**
    - Window tests show the end at the next alot in Jerusalem and Los Angeles.
    - Home between chatzot and alot still lists maariv as current ([home.render.test.tsx](src/app/__tests__/home.render.test.tsx)).
    - History marks it missed only after alot.
    - The pre-block notice and check-in behaviour on Friday are unchanged.

### Medium — Requests of 2026-10-24

- [ ] Add schedule modes to the custom mitzvah model
  - **Flag:** `OTA`.
  - **What it is:**
    - **The model:** `CustomMitzvah` ([src/types/mitzvah.ts](src/types/mitzvah.ts)) gains `schedules?: ScheduleEntry[]`, with:
      - `ScheduleEntry = { from: 'YYYY-MM-DD'; schedule: CustomSchedule }`, sorted by `from`;
      - `CustomSchedule = { mode: 'weekdays'; days: Weekday[] } | { mode: 'range'; start: 'YYYY-MM-DD'; end: 'YYYY-MM-DD' } | { mode: 'streak'; start: 'YYYY-MM-DD'; days: number }`.
    - **The rule:**
      - The schedule in force on a location day is the last entry whose `from` ≤ that day.
      - `weekdays` applies on its days.
      - `range` applies on `start..end` inclusive.
      - `streak` applies on `start .. start + days − 1`.
      - A mitzvah without `schedules` reads its legacy `activeDays` as one weekdays entry from the beginning of time, so no migration and no `STORE_VERSION` bump.
    - **One home:** `appliesOn(custom, dayKey)` in [src/utils/customMitzvah.ts](src/utils/customMitzvah.ts), beside `isActiveOn`. The adapter ([customMitzvotAdapter.ts](src/data/customMitzvotAdapter.ts)) calls it in place of today's weekday check, still on the location day the window starts on. That is the only line any surface reads, so home, schedule, day view, history, streak, weekly report, check-in and notifications follow with no change of their own.
    - **Editing never rewrites the past:** saving a changed schedule appends an entry with `from` = today's app day (`appDay()`), so earlier days keep the schedule they had. A streak counts from the app day it was saved. Its count restarts only when `days` or the mode changes; editing the name, hours or reminders keeps the entry as it is.
    - **Ended:** a `range` or `streak` mitzvah whose last day is before today's app day is ended. On every foreground, `reconcileEndedCustomMitzvot()` switches it off (keeping its history and completions).
    - **Short look-ahead:** for a schedule that starts beyond the 9-day look-ahead of `currentOrNextWindow()`, the mitzvah screen shows `custom.startsOn` "מתחילה ב־%{date}" in place of the empty time range.
  - **What it solves:** The model and every surface behind the three scheduling modes, with history kept honest.
  - **Expected result:**
    - Unit tests for `appliesOn` across all three modes, a legacy `activeDays` item, a schedule changed mid-week (days before the change keep the old answer), and a streak that ends.
    - A history test: days before a range and after its end are neither missed nor counted, and the streak is unbroken.
    - A planner test: no reminders outside the range.
    - Everything passes under `pnpm test:tz`.
    - Root [AGENTS.md](AGENTS.md), [src/types/AGENTS.md](src/types/AGENTS.md), [src/data/AGENTS.md](src/data/AGENTS.md), [src/utils/AGENTS.md](src/utils/AGENTS.md) and [src/app/AGENTS.md](src/app/AGENTS.md) describe schedules instead of `activeDays`.

- [ ] Build the schedule picker in the custom mitzvah form
  - **Flag:** `OTA` — the calendar is built in JS. No date-picker package is added, since every such package is native.
  - **What it is:** In [src/app/custom-mitzvah.tsx](src/app/custom-mitzvah.tsx), the "active days" section becomes "תזמון המצווה" (`custom.schedule`).
    - **Mode choice:** a `SegmentedControl` with three options:
      - `custom.schedule.weekdays` "הגדר לפי ימי פעילות": today's `WeekdayPicker`, unchanged;
      - `custom.schedule.range` "בחירה ביומן": a summary row "מ־%{from} עד %{to}" that opens a `BottomSheet` with a new shared `CalendarRangePicker` (`src/components/CalendarRangePicker.tsx`);
      - `custom.schedule.streak` "בחירת ימים ברצף": a number chosen through `WheelPicker` (1–365) and the line "פעילה מהיום (%{from}) עד %{to}".
    - **`CalendarRangePicker`:**
      - a month grid on theme tokens, RTL-aware, with previous/next month in `ScreenHeader`-style pills;
      - each cell shows the Gregorian day and, below it, the Hebrew day in small type;
      - the first tap sets the start and the second the end, which must be on or after the start;
      - the range is shaded with `goldWash`, today is ringed, and days before today are disabled;
      - the maximum is today + 2 years.
    - **Validation:** a range with both ends (`custom.errors.rangeRequired`) and a streak of 1–365 (`custom.errors.streakRange`), in the existing order of checks. `Affects` still lists the day surfaces.
    - **Library:** an ended mitzvah stays under "המצוות שלי" with the caption `custom.ended` "הסתיימה ב־%{date}" and its switch off. Switching it on opens its edit form, so the schedule can be extended.
  - **What it solves:** The three scheduling options the user asked for in place of the fixed weekdays.
  - **Expected result:**
    - [customMitzvah.render.test.tsx](src/app/__tests__/customMitzvah.render.test.tsx) covers each mode, the summary lines, the validation errors and that save writes the right `schedules` entry.
    - A new `CalendarRangePicker.render.test.tsx` covers start/end selection, the disabled past, month paging and the Hebrew day labels.
    - The library shows an ended mitzvah with its caption.
    - A web-preview screenshot at phone width of each mode.
    - [src/components/AGENTS.md](src/components/AGENTS.md) lists the new component.

- [ ] Ask which mitzvot to track during onboarding
  - **Flag:** `OTA`.
  - **What it is:**
    - **New step:** a new onboarding route `src/app/onboarding/mitzvot.tsx`, between nusach and location. In [nusach.tsx](src/app/onboarding/nusach.tsx), Continue pushes `/onboarding/mitzvot`, and the new step's Continue pushes `/onboarding/location`. It comes after profile and nusach, so the list is already filtered by nusach and shows the gender defaults (`MENS_MITZVOT` off for a woman).
    - **Copy:** title `onboarding.mitzvot.title` "אילו מצוות לעקוב?" / "Which mitzvot to track?"; hint `onboarding.mitzvot.hint` "אפשר לשנות את זה בכל עת במסך המצוות" / "You can change this any time in the mitzvot screen".
    - **The list:** a shared component `MitzvahLibraryList` in [src/components/](src/components), extracted from [src/app/mitzvot.tsx](src/app/mitzvot.tsx) so both screens render the same grouped sections, switches, hilulot and Rosh Chodesh rows, and the at-least-one-reminder rule.
      - Onboarding passes `showMine={false}` and shows no floating add button.
      - The library screen keeps both.
    - **Layout and dots:** the step uses the same layout, `OnboardingDots` and Continue `Button` as its siblings, and the dot count grows by one.
    - **Ready step:** [ready.tsx](src/app/onboarding/ready.tsx) keeps its "edit mitzvot" link.
    - **Existing users:** they are onboarded already, so they never see the step.
  - **What it solves:** A new user chooses what to track the first time they open the app.
  - **Expected result:**
    - [routes.test.ts](src/app/__tests__/routes.test.ts) and [screens.smoke.render.test.tsx](src/app/__tests__/screens.smoke.render.test.tsx) gain the route.
    - An onboarding render test: the step lists the groups, a toggle changes `useMitzvotStore`, and Continue goes to location.
    - The library's render test still passes on the extracted component.
    - [src/app/onboarding/AGENTS.md](src/app/onboarding/AGENTS.md) lists the step.

- [ ] Fold Rashi and Bartenura in Chok LeYisrael, globally and per passage
  - **Flag:** `OTA`.
  - **What it is:**
    - **Today:** Chok's commentaries already come as folded passages: each Rashi, Bartenura or Zohar-translation segment carries an `optional` label from [scripts/chok/parse.js](scripts/chok/parse.js) `COMMENTARIES`, and the reader opens or closes each one on tap (`isOpen(key, openByDefault)` in [src/app/siddur/[id].tsx](<src/app/siddur/[id].tsx>)). They always start closed.
    - **New setting:** `useUserStore.chokCommentaryOpen: boolean`, default `false` (today's behaviour). It sets the default state of every Rashi and Bartenura passage, the same way prayer mode sets the minyan folds.
      - The labels are matched through one constant `CHOK_COMMENTARY_LABELS = ['Rashi', 'Bartenura']` in [src/utils/chok.ts](src/utils/chok.ts), pinned by a test against `COMMENTARIES` in parse.js. That needs no content rebuild.
      - The Zohar translation keeps today's folding.
    - **Toolbar:** in the Chok reader, a `SegmentedControl` labelled `chok.commentary` "פירושים" with `chok.commentary.folded` "מקופלים" and `chok.commentary.open` "פתוחים". It sits in the toolbar's prayer-mode slot, since prayer mode does not apply to Chok.
    - **Per passage:** each passage still toggles on tap against the default. Changing the global setting clears the per-passage toggles of commentary passages, so all of them follow it.
    - **Settings:** the same choice as a switch in Settings → Prayer → reading (`settings.chokCommentaryOpen`, "פירושים פתוחים בחוק לישראל"), with a search item.
  - **What it solves:** The reader chooses whether Rashi and Bartenura are open or folded everywhere, and can still open or close one passage.
  - **Expected result:**
    - [chokReader.render.test.tsx](src/app/__tests__/chokReader.render.test.tsx): the default closes Rashi and Bartenura; "פתוחים" opens them all; tapping one closes only it; switching back to "מקופלים" closes all.
    - The Zohar translation is unaffected.
    - The Settings switch and the toolbar stay in sync.

- [ ] Show the Chok add-on's real download size
  - **Flag:** `OTA` for the app text. The manifest change ships by `pnpm chok:build` and a push to `main`.
  - **What it is:**
    - **The numbers (measured 2026-10-24):** the add-on takes 18.6 MB on the device. That is the uncompressed JSON of 54 parashiyot × 7 days: Hebrew is 2 bytes a letter in UTF-8; nikud and teamim are 4.6 MB of it; the commentaries alone (Bartenura 2.8, Rashi 2.4, Zohar translation 1.4) are 6.7 MB; JSON structure is 2.3 MB. GitHub Pages serves it gzipped, and the phone's HTTP client unzips it as it arrives, so the download itself is about 4.7 MB.
    - **What's wrong today:** the copy says "יורדים 18.6 MB… מומלץ Wi‑Fi" (`chok.addon.downloadBody`), and the list caption says "כ־19 MB" with no distinction.
    - **Change:**
      - [scripts/chok/build.js](scripts/chok/build.js) records each file's gzip size (`gzipBytes`, level 9) and the total in [docs/chok/manifest.json](docs/chok/manifest.json). Additive fields, so `format` stays 1 and older apps ignore them.
      - `chok.addon.listCaption` becomes "תוסף להורדה · הורדה כ־%{download} MB, כ־%{disk} MB במכשיר".
      - `chok.addon.downloadBody` becomes "יורדים כ־%{download} MB (כ־%{disk} MB במכשיר) מאתר יהודי 365 ב־GitHub Pages".
      - The progress line counts parashiyot and MB on the device as today.
      - `CHOK_SIZE_ESTIMATE_MB` splits into a download and a disk estimate for the offline caption.
    - **If this ships together with "Store the Chok add-on compressed on the device"**, show one number (about 5 MB) instead of two.
  - **What it solves:** The size the user sees before downloading is the real download, and the size on the device is stated separately.
  - **Expected result:**
    - The manifest carries `gzipBytes`.
    - [ChokAddonCard.render.test.tsx](src/components/__tests__/ChokAddonCard.render.test.tsx) shows both numbers from a fixture manifest.
    - [scripts/chok/AGENTS.md](scripts/chok/AGENTS.md) explains the two sizes.

- [ ] Build the direct APK for phone processors only
  - **Flag:** `Build`.
  - **What it is:**
    - **Why it is big:** the direct-install APK (`production-apk` in [eas.json](eas.json)) is universal: `jew365-1.0.21-9.apk` is 125 MB, of which 93 MB is native code for four ABIs. `x86` (26.5 MB) and `x86_64` (25.8 MB) serve emulators only.
    - **Change:** the `production-apk` profile builds with `"gradleCommand": ":app:assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a"` in place of `"buildType": "apk"`. That keeps 32-bit ARM for older phones.
    - **Unchanged:** the Play AAB (`production`), because Play already sends each phone only its own ABI.
    - **Docs:** the profile list in root [AGENTS.md](AGENTS.md) (Commands) says so.
  - **What it solves:** The direct APK the user shares weighs about 52 MB less.
  - **Expected result:**
    - The next `pnpm build:android:production-apk` produces an APK with no `lib/x86*` entries (`unzip -l`) and about 73 MB in size.
    - It installs and runs on the emulator (arm64 image) through [android-native-verify](.claude/skills/android-native-verify/SKILL.md).
    - Its size is logged in [release/RELEASE_LOG.md](release/RELEASE_LOG.md).

- [ ] Shrink release builds with R8
  - **Flag:** `Build`.
  - **What it is:**
    - **Why:** the APK carries 47 MB of unshrunk `classes*.dex`.
    - **Change:** add the config plugin `expo-build-properties` (at the version `npx expo install` picks for SDK 54) to [app.json](app.json) with `android.enableMinifyInReleaseBuilds: true` and `android.enableShrinkResourcesInReleaseBuilds: true`. This is the SDK 54 name; check the plugin's docs for the exact keys at that version.
    - **Keep rules:** add them in `android.extraProguardRules` for anything R8 breaks. Candidates: MMKV, expo-notifications' task classes, expo-background-task, the Kotlin service written by [withMitzvahNotificationAction.js](scripts/withMitzvahNotificationAction.js), Sentry.
    - **Mapping file:** keep each build's `mapping.txt` (an EAS build artifact), so a future Sentry upload can de-obfuscate.
  - **What it solves:** Smaller downloads from Play and as a direct APK.
  - **Expected result:** A release build verified on the emulator through every native path:
    - a notification at its time, with both actions (mark done and open text) while the app is killed;
    - the hourly background task;
    - MMKV state across a restart;
    - the taharah lock (biometric and secure store);
    - location;
    - share and pick of a backup file;
    - the Chok download.

    The dex size before and after is logged in [release/RELEASE_LOG.md](release/RELEASE_LOG.md). Any keep rule added is commented with the crash it fixed.

- [ ] Store the Chok add-on compressed on the device
  - **Flag:** `OTA` — `fflate` is pure JS. The content side ships by `pnpm chok:build` and a push to `main`.
  - **What it is:**
    - **Build:** [scripts/chok/build.js](scripts/chok/build.js) also writes each parasha as `<name>.<hash>.json.gz` (gzip level 9, about 4.7 MB in all against 18.6 MB). [docs/chok/manifest.json](docs/chok/manifest.json) gains a `gz` map (`path`, `sha256` of the `.gz` bytes, `bytes`) beside `files`. Older apps keep reading `files`, so both sets stay published until a later content version drops the plain files, once no installed bundle reads them.
    - **Why the files arrive still compressed:** Pages serves a `.gz` as `application/gzip` with no `Content-Encoding`, so the phone stores the compressed bytes as they are.
    - **Download:** [ChokContentService.ts](src/services/ChokContentService.ts) downloads and verifies the `.gz` files.
    - **Reading:** [chokFiles.ts](src/services/chokFiles.ts) reads them with `gunzipSync` from `fflate` (a new dependency), then `JSON.parse`. A file named `.json` (an install made before this change) is still read as plain, and the next content update replaces it.
    - **Size labels:** both numbers on the add-on card become the same, about 5 MB.
  - **What it solves:** The add-on takes about 5 MB on the phone instead of 18.6 MB.
  - **Expected result:**
    - [ChokContentService.test.ts](src/services/__tests__/ChokContentService.test.ts) covers the `.gz` download and its hash check, reading both `.gz` and legacy `.json` installs, and a corrupt `.gz` turning into "download again".
    - On the Android emulator against the live site: download, read a parasha offline, delete, download again; Settings › Storage shows about 5 MB for the add-on files.
    - [scripts/chok/AGENTS.md](scripts/chok/AGENTS.md) and [src/services/AGENTS.md](src/services/AGENTS.md) describe the format.

- [ ] Make every Rosh Chodesh and hilula notice configurable
  - **Flag:** `OTA`.
  - **What it is:** Today the times are constants ([planners/roshChodesh.ts](src/services/notifications/planners/roshChodesh.ts): `before` 3 days ahead at 20:00, `evening` at shkia, `day` at 07:00; [planners/hilulot.ts](src/services/notifications/planners/hilulot.ts): `before` a day ahead at shkia, `evening` at shkia).
    - **Settings:** `useUserStore` gains `roshChodeshNotices` and `hilulaNotices`, each mapping its notice kinds to `{ enabled: boolean; daysBefore?: number; timing: { anchor: 'shkia'; offsetMin: number } | { anchor: 'clock'; minutes: number } }`. The defaults reproduce today exactly, and a missing field reads as the default, so there is no version bump.
    - **Planners:** they read these settings in place of the constants. `roshChodeshLines()` and `hilulaLines()` follow the same settings.
    - **Screens:** in [rosh-chodesh.tsx](src/app/rosh-chodesh.tsx) and [hilulot.tsx](src/app/hilulot.tsx), under the master switch, a `Card divided` with one `ListRow` per kind:
      - a switch, and a caption describing its time ("3 ימים לפני, 20:00", "בשקיעה");
      - tapping the row opens a `BottomSheet` with a `SegmentedControl` (בשקיעה / בשעה קבועה), an offset or a `TimeField`, and for `before` a days-before choice (1–7).
    - **The one-reminder rule:** switching the master switch on with every kind off opens the dialog of the at-least-one-reminder task.
    - **Search:** add the kinds' labels to the existing search items' terms.
  - **What it solves:** The user wants to add or remove any of these notices and change their times.
  - **Expected result:**
    - Planner tests: each kind off drops only its notices; a changed days-before and clock time move the trigger; the defaults equal today's output.
    - Render tests for both screens.
    - The pre-block lines follow the settings.
    - Root [AGENTS.md](AGENTS.md) (Notification Engine) describes the settings instead of fixed times.

- [ ] Add the siddur voice setting that follows gender
  - **Flag:** `OTA`.
  - **What it is:**
    - **The field:** `useUserStore` gains `siddurVoice: 'male' | 'female' | null`, default `null`, which keeps today's text.
    - **Following gender:** `chooseGender()` sets `siddurVoice` to the new gender on every gender change, overwriting any manual choice.
    - **Settings:** in the Prayer section, `ChipRow` "נוסח הסידור" (`settings.siddurVoice`) with `settings.siddurVoice.male` "גבר" and `.female` "אישה", anchor `siddurVoice`, plus a settings-search item.
    - **The reader:** [src/app/siddur/[id].tsx](<src/app/siddur/[id].tsx>) passes the voice into `resolveSiddurText()` through a new `forVoice()` step beside `forMaritalStatus()`.
    - **The asset mechanism:**
      - `PassageLabel` gains `voice?: 'male' | 'female'`, which shows a passage only to that voice. A null voice shows both, folded as today.
      - `Run` gains `voice?` for inline alternatives such as מוֹדֶה / מוֹדָה.
      - [scripts/siddur/build.js](scripts/siddur/build.js) and the tests guard the new flag exactly as they guard `marriedOnly`.
  - **What it solves:** A woman reads the siddur in her own voice, and the gender in Settings drives it.
  - **Expected result:**
    - Store tests: a gender change sets the voice; a manual change sticks until the next gender change.
    - A settings render test shows the chips.
    - Siddur tests show that a `voice: 'female'` passage shows only for `female`, and that a null voice keeps today's resolved text byte for byte.
    - [scripts/siddur/AGENTS.md](scripts/siddur/AGENTS.md) documents the flag.

- [ ] Apply the women's liturgy in every siddur text
  - **Flag:** `OTA` — bundled assets rebuilt by `pnpm siddur:build`.
  - **What it is:** Through the voice mechanism above, and by manifest patches in [scripts/siddur/manifest.js](scripts/siddur/manifest.js), each with a source note:
    - (1) **Modeh Ani and Elokai Neshama** in all four nuschaot: `female` reads מוֹדָה for מוֹדֶה. In Edot HaMizrach the inline note "האשה אומרת: מודה" is resolved by voice.
    - (2) **Birchot hashachar**, in `birchot_hashachar` and `shacharit`, all four nuschaot. For `female`:
      - "שלא עשני אשה" is hidden;
      - "שעשני כרצונו" is shown open: with shem umalchut in Ashkenaz and Sefard (the existing segment, its `WHEN_SAID.women` fold dropped for `female`), without shem umalchut in Edot HaMizrach (the existing segment), and in Chabad a new segment with shem umalchut, as a manifest patch noted as the Chabad women's text (R8);
      - Edot HaMizrach's "גוי / גויה" and "עבד / שפחה" read the feminine word;
      - the other nuschaot keep "גוי" and "עבד" (R8).
      - For `male`, "שעשני כרצונו" is hidden in all four.
    - (3) **Tallit and tefillin:** for `female`, Shacharit's tallit-and-tefillin station is hidden entirely; the `tefillin` text's tallit-katan and tefillin blessings and kavanot (Rabbeinu Tam included) are hidden; and the siddur tab does not list the `tefillin` text.
    - (4) **Feminine first-person forms** for `female`, with correct nikud:
      - הריני / הנני מוּכָן וּמְזֻמָּן → מוּכָנָה וּמְזֻמֶּנֶת: Omer in `sefirat_haomer` and `maariv`, Edot shacharit, Sefard chanukah_candles;
      - הנני מְכַוֵּן → מְכַוֶּנֶת: Sefard chanukah_candles;
      - הריני מְקַבֵּל → מְקַבֶּלֶת: the Shacharit "מה טובו" and "פרשת העקדה" kabbalah lines, and the bedtime Shema in Edot HaMizrach and Chabad;
      - הריני מוֹחֵל → מוֹחֶלֶת: the bedtime Shema, all four;
      - הריני מְזַמֵּן / מְקַשֵּׁר → מְזַמֶּנֶת / מְקַשֶּׁרֶת: Tikkun HaKlali, Edot shacharit;
      - הריני בָּא → בָּאָה: Edot birchot_hanehenin and mezuzah.
      - Verses (e.g. "עבדך בן אמתך") never change.
    - (5) **Edot HaMizrach candle lighting** is written in a woman's voice. For `male` it reads הריני נוֹתֵן and "על אשתי"; `female` and null keep it as is.
    - (6) **Birkat HaMazon Harachaman** "(ואת אשתי / בעלי ואת זרעי)" in Ashkenaz and Sefard: a married `male` reads "ואת אשתי", a married `female` "ואת בעלי", and a single user neither.
    - (7) **Edot HaMizrach, `female`:**
      - Sefirat HaOmer shows the note "נשים סופרות בלי ברכה" and folds the blessing (R8);
      - Hallel shows the note "נשים אומרות בלי ברכה" and folds its opening and closing blessings (R8).
    - (8) **Unchanged:** Birkat HaMazon's "ועל בריתך שחתמת בבשרנו ועל תורתך שלמדתנו" stays as printed (R8).
    - (9) **English:** follows its pinned translation. Where a segment is hidden its English is hidden with it, and where the Hebrew changes form the English stays (it is gender-neutral).
  - **What it solves:** The research the user asked for: every place in the app's texts that differs for a woman, applied in one pass.
  - **Expected result:**
    - [siddur.test.ts](src/data/__tests__/siddur.test.ts) has a dated case per item above, per nusach, for `female`, `male` and null.
    - Null output is identical to today's.
    - The `tefillin` text is absent from the siddur tab for `female`.
    - `pnpm siddur:build` is clean.
    - [scripts/siddur/AGENTS.md](scripts/siddur/AGENTS.md) lists the voice patches and adds the R8 items to its halachic review list.

- [ ] Search mitzvot and siddur texts from Settings
  - **Flag:** `OTA`.
  - **What it is:** [settingsSearch.ts](src/utils/settingsSearch.ts) indexes 26 settings items today.
    - **New result kinds:**
      - every mitzvah the user's nusach supports, static and custom, opening `/mitzvah/[id]`, caption `settings.search.kind.mitzvah` "מצווה";
      - every siddur text, the mitzvah texts and the `STANDALONE_TEXTS` (Chok LeYisrael only once installed), opening `/siddur/[id]`, caption `settings.search.kind.siddur` "סידור";
      - every chapter or station of a text, opening `/siddur/[id]?section=<title>`, caption "סידור · %{text}".
    - **Chapter index:** `pnpm siddur:build` writes a new generated file `src/data/siddurChapters.generated.ts` (text id → nusach → chapter titles, he and en), so the search never loads an asset.
    - **Type changes:** the item type takes a literal `title: { he, en }` beside `titleKey`, and a `href` of `{ pathname, params }` beside `route`. `chooseResult()` pushes it.
    - **Reader:** it accepts `section` and runs its existing `jumpTo` on open.
    - **Ranking:** the existing score. Ties order settings, mitzvot, texts, then chapters. `SETTINGS_SEARCH_LIMIT` goes from 8 to 12.
    - **Mitzvah icons:** results use `iconFor()`, and texts their group icon.
  - **What it solves:** Typing a mitzvah or prayer name in the search finds it.
  - **Expected result:**
    - [settingsSearch.test.ts](src/utils/__tests__/settingsSearch.test.ts): "ערבית" finds the maariv mitzvah and text; "אשרי" finds the Shacharit and Mincha stations; a custom mitzvah's name finds it; the other keyboard layout and typos work for these too; Chok is absent before install.
    - [settings.search.render.test.tsx](src/app/__tests__/settings.search.render.test.tsx) opens a mitzvah, a text and a chapter (the reader lands on that section).

- [ ] Add bookmarks and the last reading position to the siddur reader
  - **Flag:** `OTA`.
  - **What it is:**
    - (1) **Stable segment keys:** [scripts/siddur/build.js](scripts/siddur/build.js) writes `key` on every `SiddurSegment`, a short hash of source id, source path and source segment index. The key survives day-dependent drops and rebuilds that keep the source. Chok sections get `parasha:day:heading` keys in [src/utils/chok.ts](src/utils/chok.ts).
    - (2) **Store:** a new store `useSiddurBookmarksStore` (`siddur-bookmarks-store`, MMKV, in `STORES` of [BackupService.ts](src/services/BackupService.ts), reset by [AppResetService.ts](src/services/AppResetService.ts)) holds:
      - `bookmarks: { id; textId; nusach; sectionTitle; segmentKey; label; createdAt }[]`, where `label` is the section title plus the segment's first three words;
      - `lastPositions: Record<textId, { nusach; sectionTitle; segmentKey; appDay: 'YYYY-MM-DD'; savedAt }>`.
    - (3) **Saving the last position:** the reader saves it 1 s after scrolling stops and on blur or background. Its anchor is the top visible segment, tracked by measuring each segment's `onLayout` inside its section item.
    - (4) **Toolbar:** a bookmark button that adds a bookmark at the current segment, with a toast "נוספה סימנייה", and a "סימניות" button that opens a `BottomSheet`:
      - its first row is always "המקום האחרון" (the place the user asked for, present whenever a last position exists for this text);
      - then this text's bookmarks, newest first, each with a delete action;
      - tapping a row jumps there: `scrollToIndex` to the section, then `scrollToOffset` by the segment's measured offset; when the key is gone, it falls back to the section top.
    - (5) **Resume banner:** opening a text with a last position shows a `Banner` "להמשיך מהמקום שבו עצרת?" with "המשך" and "מההתחלה":
      - for the daily texts (the mitzvah texts in `SIDDUR_TEXTS`), only when `appDay` equals today's app day;
      - for every other text (Tehillim, Tikkun HaKlali, Chok LeYisrael, the standalone texts), always.
      - Opening with a `section` param (search) skips the banner.
  - **What it solves:** Jumping straight to a chosen place in Tehillim, a prayer, Tikkun HaKlali or any text, and returning to where the user stopped.
  - **Expected result:**
    - Reader render tests: add a bookmark, list it, jump to it, delete it.
    - "המקום האחרון" appears after scrolling and returns to that segment.
    - The banner shows for Tehillim the next day but not for Shacharit the next day.
    - A key missing after a day change falls back to the section top.
    - The store is in the backup file.
    - A build test asserts every segment of every asset has a unique `key` within its text.
    - [src/app/AGENTS.md](src/app/AGENTS.md), [src/stores/AGENTS.md](src/stores/AGENTS.md) and [scripts/siddur/AGENTS.md](scripts/siddur/AGENTS.md) are updated.

- [ ] Merge app reset into a "Backup, restore and reset" section
  - **Flag:** `OTA`.
  - **What it is:** In [settings.tsx](<src/app/(tabs)/settings.tsx>), the `settings.backup` section's title becomes "גיבוי, שחזור ואיפוס" / "Backup, restore and reset".
    - **Reset:** the reset `danger` Button and its `ConfirmDialog` (today under Device → App) move into it, below restore. Both behave as today.
    - **Delete data:** a link row "מחיקת הנתונים שלך" / "Delete your data" opens the privacy policy's `#delete` section (`…/privacy/#delete` in Hebrew, `…/privacy/en/#delete` in English) through `Linking`.
    - **Web:** the section now shows on web too, with the reset and the link only, because export and import stay native-only.
    - **Device section:** its `settings.app` sub-heading goes away; the version moves to "About and contact".
    - **Search and docs:** the `reset` search item points to the new section, and its terms gain backup words. Update the reset path in the public FAQ ([docs/index.html](docs/index.html)) and its rule in [docs/AGENTS.md](docs/AGENTS.md).
  - **What it solves:** Backup, restore, reset and data deletion live in one place.
  - **Expected result:**
    - [settings.backup.render.test.tsx](src/app/__tests__/settings.backup.render.test.tsx) shows the new title, the reset button and dialog working there, and the link opening the right URL per language.
    - The Device section has no reset.
    - Search "איפוס" opens the new section.
    - The FAQ wording matches.

- [ ] Turn "Contact us" into "About and contact"
  - **Flag:** `OTA`.
  - **What it is:** The `settings.contact` section's title becomes "אודות ויצירת קשר" / "About and contact". Its content, top to bottom:
    - the version line `settings.version` (`appVersionLabel()`, moved from Device);
    - the existing contact hint, form, privacy line and email;
    - a `Card divided` of link rows:
      - the support page `https://jew-365.github.io/jew-365/`;
      - the privacy policy (`…/privacy/` in Hebrew, `…/privacy/en/` in English);
      - the store page for the device: Android `https://play.google.com/store/apps/details?id=com.jew365.app`, iOS `https://apps.apple.com/app/id6825802248`;
      - the Chok LeYisrael text credit and licence `…/chok/LICENSE.txt`.
    - The tester page and the taharah review page are not linked.
    - The URLs live in one constant `PRODUCT_LINKS` in [ContactService.ts](src/services/ContactService.ts), beside `CONTACT_EMAIL`.
    - The section's search item gains "אודות", "גרסה" and "קישורים" terms, and the `version` item points here.
  - **What it solves:** One place for what the app is, its version, every product page, and how to reach the team.
  - **Expected result:**
    - [settings.contact.render.test.tsx](src/app/__tests__/settings.contact.render.test.tsx) shows the title, the version and each link opening its URL per platform and language, and the contact form unchanged.
    - Search "גרסה" opens this section.

### Low — Requests of 2026-10-24

- [ ] Rework the five non-default palettes to the default's quality
  - **Flag:** `OTA`.
  - **What it is:** First, a preview board `design/palettes-2026-10-24/index.html`: for gold and each of pink, purple, blue, dark and plum, it shows current against proposed tokens on a mock home card, the tab bar, a `Banner`, a primary `Button` and the siddur toolbar. The user approves it before any code changes.
    - **Rules carried from `gold`** (see `T_LIGHT` in [colors.ts](src/theme/colors.ts)):
      - the surface is a white warmed toward the palette's hue, never pure `#FFFFFF`, and the same card-to-page step as gold;
      - a separate darker `goldText` reaching 4.5:1 on `surface`;
      - dark ink `onGold` wherever the accent allows 4.5:1, else white;
      - hue-tinted soft shadows at gold's .08 / .18;
      - a `surface2` and `border` one step from the surface.
    - Hues stay: pink, purple, blue, dark navy and plum. `ThemeSwatchRow` shows the palette's surface as a ring inside its `bg`, so gold and pink no longer look alike.
  - **What it solves:** The other palettes look plainer than the default.
  - **Expected result:**
    - The approved board is committed.
    - [colors.ts](src/theme/colors.ts) is updated to it.
    - The theme tests pass, with a new contrast test that every palette's `text`, `textSub` and `goldText` on `surface`, and `onGold` on `gold`, meet 4.5:1.
    - Web-preview screenshots of home in all six palettes.

- [ ] Upgrade bottom-tabs to the version with the detach fix
  - **Flag:** `OTA` only if the lockfile diff changes no native package (`react-native-screens` stays 4.16.0, `react-native-safe-area-context` unchanged); otherwise `Build`.
  - **What it is:** Raise `@react-navigation/bottom-tabs` to ≥ 7.18.8, which no longer derives detach state from an animated value (upstream commit 9bfc8d0). That requires `@react-navigation/native` ^7.3.8 and `@react-navigation/elements` ≥ 2.9.30, all pure JS, and it must still resolve to the single copy expo-router 6.0.24 uses. Keep `detachInactiveScreens={false}` from the iOS fix.
  - **What it solves:** The root cause of the blank tabs, not only the workaround.
  - **Expected result:**
    - `pnpm why @react-navigation/bottom-tabs` shows one version.
    - The full test suite passes.
    - A smoke run of every route on the Android emulator via [android-native-verify](.claude/skills/android-native-verify/SKILL.md).
    - The lockfile diff is reviewed for native packages, and the flag is confirmed in the change.

- [ ] Move Selichot out of the bundle into a downloadable add-on per nusach
  - **Flag:** `OTA` for the behaviour. The space comes back only with the next `Build`, because a binary keeps the assets it was built with until it is replaced.
  - **When:** after the direct-APK, R8 and Chok-compression tasks, and after the Selichot mitzvah task.
  - **What it is:**
    - **Why:** the four `selichot.siddur` assets are 5.5 MB of the 10 MB siddur (Ashkenaz 2.4, Chabad 1.6, Sefard 1.4, Edot HaMizrach 0.16), and they are read about 40 days a year.
    - (1) **Shared add-on code:** extract what [ChokContentService.ts](src/services/ChokContentService.ts), [chokFiles.ts](src/services/chokFiles.ts), [useChokStore.ts](src/stores/useChokStore.ts) and [ChokAddonCard.tsx](src/components/ChokAddonCard.tsx) do generically into one shared add-on core under `src/services/addons/`, plus a shared `AddonCard`, used by both add-ons:
      - manifest fetch, hash-verified download of `.gz` files, install and delete;
      - the launch reconcile and the version check;
      - the card itself.

      No second copy of the download code.
    - (2) **Build:** `pnpm siddur:build` writes the Selichot of each nusach to `docs/selichot/<nusach>.<hash>.siddur.gz` with a `docs/selichot/manifest.json`, and leaves them out of `assets/siddur` and `siddurAssets.generated.ts`.
    - (3) **The app:**
      - The `selichot` standalone text and mitzvah need the user's nusach file. Until it is installed, the mitzvah's window is `null` (as Chok's is), and the siddur tab row, the mitzvah screen and the More tab offer the download of that nusach only.
      - A nusach change offers the new nusach's file and deletes the old one after the new one installs.
      - From 7 days before the user's season starts (the same `selichotFlags()` dates), home shows a `Banner` "הסליחות מתחילות ב־%{date} · להוריד את הנוסח?" with a download button, until it is installed or dismissed for that season.
    - (4) **Store:** a new device-only store `useSelichotStore`, out of the backup file like `useChokStore`.
  - **What it solves:** The app stops carrying four nuschaot of Selichot for a text read a few weeks a year.
  - **Expected result:**
    - The bundle has no `selichot.siddur`, and the next build's APK and iOS app are about 5.5 MB smaller.
    - Tests for the shared core run against both add-ons.
    - Selichot appears and reads offline once downloaded, and is offered before the season.
    - The Chok add-on behaves exactly as before.
    - [scripts/siddur/AGENTS.md](scripts/siddur/AGENTS.md), [docs/AGENTS.md](docs/AGENTS.md) and [src/services/AGENTS.md](src/services/AGENTS.md) are updated.

- [ ] Push an update notice to closed apps (not urgent)
  - **Flag:** `Build`.
  - **Decision of 2026-10-24:** keep today's notice for now and move to push only when the user base calls for it. Today the hourly background task (`jew-365-daily-rebuild`) downloads a new update and presents a local `update:<id>` notification (`notifyIfUpdateReady()` in [NotificationScheduler.ts](src/services/NotificationScheduler.ts)). The OS decides when that task runs: within hours on Android, possibly days on iOS, and never after the user swipes the app away on iOS.
  - **What it is:** When the user asks to start:
    - **Native side:** add `@react-native-firebase/app` and `@react-native-firebase/messaging`, with Firebase config files for both platforms (APNs key in Firebase for iOS).
    - **Subscribing:** each install subscribes to the topic `updates-<runtimeVersion>` on launch, so no device token is stored anywhere.
    - **Sending:** [scripts/publish-update.js](scripts/publish-update.js) sends one FCM message to that topic after a production publish. It uses a service-account key held as a local env var, never in the repo.
    - **Receiving:** the message is data-only. The app downloads the update and presents the existing local notice, so the wording, the holy-block silence and the tap behaviour stay in one place.
    - **Privacy:** update the privacy policy and both stores' data-safety answers (the FCM instance id leaves the device) in [docs/](docs) and [release/](release).
  - **What it solves:** Users with the app closed hear about an update within minutes.
  - **Expected result:**
    - A test publish reaches a killed Android app and a swiped-away iPhone within 5 minutes, showing the same notice.
    - Nothing is sent during Shabbat or Yom Tov.
    - The policy and the store forms are updated.

- [ ] Publish the rav questions as a review page
  - **Flag:** no app release — a push to `main` publishes it on GitHub Pages.
  - **What it is:** `docs/halacha-review.html`, on the model of [docs/taharah-review.html](docs/taharah-review.html) (noindex, the same Formspree answer form with נכון / לא נכון and a note per item). It lists R1–R9 of [For the rav](#for-the-rav) with each rule as implemented and its source.
  - **What it solves:** The rav answers the batch's halachic choices in one place, as with the taharah rules.
  - **Expected result:** The page is live at `https://jew-365.github.io/jew-365/halacha-review.html` and listed in [docs/AGENTS.md](docs/AGENTS.md). Each answer comes back as a change to its one rule.

### High — Chok LeYisrael

Chok LeYisrael shipped as a downloadable add-on on 2026-10-23 (production update 1.0.21-1, content version 2): the text comes from the Torat Emet database (CC BY-NC-SA 2.5, the user's call on 2026-10-23), [scripts/chok/](scripts/chok) builds it from the committed source into [docs/chok/](docs/chok), and the app downloads it from GitHub Pages on request, from the mitzvah's screen or the More tab. Its decisions live in [scripts/chok/AGENTS.md](scripts/chok/AGENTS.md), [src/utils/AGENTS.md](src/utils/AGENTS.md) and [src/services/AGENTS.md](src/services/AGENTS.md).

Standing constraint: the app stays non-commercial (no ads, no paid tier) while it carries this text.

- [ ] Add Chok LeYisrael to the store listings
  - **What it is:** Once the add-on is live, mention it in the feature lists of [release/](release) (Hebrew and English, Play and App Store) and re-enter the copy in both consoles, with a [release/RELEASE_LOG.md](release/RELEASE_LOG.md) entry.
  - **What it solves:** The listings describe what the app does.
  - **Expected result:** Both consoles carry the new copy.

### Medium — Chok LeYisrael source defects

- [ ] Decide on the Torat Emet text defects
  - **What it is:** The 2026-10-23 cross-check against the old raktora text found defects in Torat Emet itself: the Onkelos of Numbers 26:22 and 31:44 lacks "וַחֲמֵשׁ מְאָה", two words are run together in Numbers 2:12 (צוּרִישַׁדָּֽי) and 7:54 (פְּדָהצֽוּר), the Onkelos of Leviticus 4:5 reads וְיִםַב for וְיִסַב, and spacing glitches remain in the Onkelos of Leviticus 4:7 and 4:34. The build fixes markup by rule only, never text. Options: report them to Torat Emet, or add a reviewed text-patch list to the build.
  - **What it solves:** A reader of those verses sees the correct text.
  - **Expected result:** The user's decision, and either a sent report or a patch list with tests.

### Low — Chok LeYisrael follow-ups

- [ ] Watch for an App Review note on the add-on's storage
  - **What it is:** The add-on keeps about 19 MB of re-downloadable text in the app's Documents folder, which rides the iCloud device backup; Apple's storage guidelines prefer such data outside it, and expo-file-system 19 has no exclude-from-backup flag. If App Review objects, move it to `Paths.cache` (the launch reconcile already turns a purge into "download again").
  - **What it solves:** Keeps the iOS submission from stalling on storage.
  - **Expected result:** Either no objection, or the folder moved in one change.

## Bugs

## Open Questions

### For the rav

Every halachic rule and zman of the 2026-10-24 batch, implemented as written until a rav answers (the user's call, 2026-10-24). The task "Publish the rav questions as a review page" puts them on a page with an answer form. Each answer changes one rule.

- **R1 — Kiddush Levana period.**
  - **Question:** When does Kiddush Levana start and end?
  - **Assumption:** It starts 3 days after the molad (Ashkenaz) or 7 days after it (Sefard, Edot HaMizrach, Chabad). It ends 14 days 18 h 22 m after the molad (Ashkenaz, Sefard, Chabad) or 15 days after it (Edot HaMizrach). Nights only, not on Shabbat or Yom Tov nights. In Tishrei after Yom Kippur, in Av after Tisha B'Av. Women do not say it.
  - **Lives in:** `kiddushLevanaPeriod()` in [src/utils/siddur.ts](src/utils/siddur.ts).
- **R2 — Selichot.**
  - **Question:** Are the seasons and the hours right?
  - **Assumption:** Edot HaMizrach from 2 Elul; the other nuschaot from leil Selichot (at least four days before Rosh Hashana); all through 9 Tishrei, not on Shabbat or Yom Tov. Said from chatzot halayla to sof zman tefila.
  - **Lives in:** `selichotFlags()` in [src/utils/siddur.ts](src/utils/siddur.ts) and `MIDNIGHT_TO_MORNING_PRAYER` in [src/data/siddur.ts](src/data/siddur.ts).
- **R3 — Bedtime Shema.**
  - **Question:** What is its window?
  - **Assumption:** From tzeit to alot, ideally before chatzot halayla.
  - **Lives in:** the `krias_shma_al_hamita` entry in [src/data/mitzvot.ts](src/data/mitzvot.ts).
- **R4 — Chanukah candles.**
  - **Question:** When are the candles lit each night?
  - **Assumption:** A weekday from tzeit (Ashkenaz, Sefard, Edot HaMizrach) or from shkia (Chabad), until alot. Friday from plag hamincha to the Shabbat candle lighting. Motzaei Shabbat from the block exit (tzeit + 10 min).
  - **Lives in:** the `chanukah_candles` entry.
- **R5 — Ushpizin.**
  - **Question:** Which nights, which guest each night, and does Chabad say it?
  - **Assumption:** Each of the seven nights of Sukkot, before entering the sukkah, from tzeit to alot. The order is Avraham, Yitzchak, Yaakov, Moshe, Aharon, Yosef, David. Chabad custom does not recite the "עולו אושפיזין" formula, so Chabad is not offered it.
  - **Lives in:** the `ushpizin` entry and its manifest entry.
- **R6 — Maariv.**
  - **Question:** Until when may Maariv be prayed?
  - **Assumption:** From tzeit until alot, ideally before chatzot.
  - **Lives in:** maariv's `computeWindow`.
- **R7 — Birchot hashachar.**
  - **Question:** Until when may birchot hashachar be said?
  - **Assumption:** From alot until chatzot hayom (it was sof zman Shema).
  - **Lives in:** birchot_hashachar's `computeWindow`.
- **R8 — Women's liturgy.**
  - **Question:** What does a woman say differently?
  - **Assumption:**
    - "שעשני כרצונו": with shem umalchut in Ashkenaz, Sefard and Chabad; without it in Edot HaMizrach.
    - "גויה / שפחה" in Edot HaMizrach only; "גוי / עבד" elsewhere.
    - The feminine forms of הריני מוכנה, מקבלת, מוחלת, מזמנת, מקשרת, באה, מכוונת.
    - Edot HaMizrach women count the Omer and say Hallel without a blessing.
    - "ועל בריתך… ועל תורתך" in Birkat HaMazon is unchanged.
    - Tallit and tefillin blessings are not shown to women.
  - **Lives in:** the voice patches in [scripts/siddur/manifest.js](scripts/siddur/manifest.js).
- **R9 — Edot HaMizrach candle lighting for a man.**
  - **Question:** What does a man read when he lights?
  - **Assumption:** He reads the woman-voiced text in the masculine: הריני נותן, "על אשתי".
  - **Lives in:** the same voice patches.

## Other Open Items

- **Every project account moves to 365jew@gmail.com** (the user's call, 2026-10-20). Done in the repo: `CONTACT_EMAIL` in [ContactService.ts](src/services/ContactService.ts), the support page, both privacy policies and the taharah review page; `CONTACT_FORM_ID` is the new Formspree form `mrpevdbk` on 365jew; this repo's local `git config user.email`; `owner` in [app.json](app.json) is `jew-365-org`; `credentials.json`, `credentials/` and `*.keystore` gitignored; `origin` and every Pages URL moved to the GitHub organization `jew-365` (`https://jew-365.github.io/jew-365/`, all four pages answer 200; the old address is dead). The 88 earlier commits keep avi6190i@gmail.com (no history rewrite, the user's call). Done by the user: the Formspree account and form on 365jew, and the old form `xyekordk` retargeted to 365jew as a linked email (kept alive until no install of the previous app remains, because its update 1.0.19-2 posts to it); the GitHub organization `jew-365` with 365jew as its email, 365jew verified on the personal account, `jew-365` transferred to it; 2-Step Verification, a passkey, a verified recovery email and offline backup codes on 365jew; the Expo user `jew-365` on 365jew, Owner of the organization `jew-365-org`, which owns the project now (`@jew-365-org/jew-365`, same project ID, so updates still reach build 1.0.20, which moved with it), its stored keystore read again after the move with the same SHA-256, `avraham-sason` removed from the organization and 2FA on the Expo user `jew-365`; 365jew an admin of the Play Console, which stays owned by avi6190i (the user's call: moving the ownership would repeat the identity verification); a backup of the Android keystore from `eas credentials -p android`, encrypted into `jew365-keystore.tar.gz.enc` (AES-256-CBC, PBKDF2 600000 iterations, SHA-256; the plain folder deleted only after a decrypted copy matched it) and uploaded to the Google Drive of 365jew, its passphrase kept outside that account; the key's SHA-256 is `DC:62:0E:28:E9:67:30:98:E8:90:88:B7:09:FB:6D:B8:F9:C0:B1:E6:80:D9:52:60:3B:A8:9C:F4:3B:AE:00:B4`; 365jew as the contact email of the Play store listing and the owner of the testers group (2026-10-20). Left for the user: `com.jew365.app` registered in the Play Console with the SHA-256 above for Android developer verification, which from 2027 covers the direct APK too; Sentry and the Apple Developer account opened on 365jew; the empty `@avraham-sason/jew-360` Expo project deleted.
- **iOS 1.0.21 is in App Store review, manual release.** EAS build `72c51b1e` (buildNumber 4) was submitted on 2026-10-23 with every App Store Connect page filled ([release/APP_STORE_METADATA_EN.md](release/APP_STORE_METADATA_EN.md), [release/RELEASE_LOG.md](release/RELEASE_LOG.md)); after approval it waits for the owner's Release. Before releasing: the TestFlight checks on a real iPhone (public link https://testflight.apple.com/join/cZeSqPzG, live since the Beta App Review passed on 2026-10-23). Still open: the EU trader status. Trader chosen, email and phone verified; the identification documents (no Hebrew accepted) wait for the owner's passport, and until they are in, the app is not offered in the EU storefronts. iOS builds and submissions run as `npx eas-cli@latest …`, because the project's eas-cli failed the Apple login.
- **Moving the previous app's users.** The previous app is a different package, so its installs get nothing from this project. Each user exports a backup file in Settings there (only the previous app's 1.0.19 build can export), installs this app, restores the file on the welcome step, checks the data, and uninstalls the previous app: while both are installed, both send reminders. The taharah data does not move, by design. The previous EAS project stays until no install depends on it; deleting it on expo.dev is the user's step.
- **Families policy for the 13-15 audience.** Play's target audience is 13-15, 16-17 and 18+ (the user's call, 2026-10-20, because tefillin start at 13), so wherever 13-15 count as children (parts of the EU under GDPR) the Families policy applies: content fit for children and COPPA / GDPR rules for any data a child sends. The Contact us form sends a name and phone number through Formspree; before production, either confirm that flow complies or add a neutral age question before the form, and keep Sentry free of personal data. The 18+ alone answer removed the Families notice, which the user weighed and declined.
- **Google Play closed test, then production** (the user's call, 2026-10-20: upload now, with the icon and UI redesign arriving during the test). The Play Console stays owned by avi6190i, so it is a personal account and needs a closed test with at least 12 testers opted in for 14 days in a row before production; a new build does not restart the count, dropping under 12 testers does. Play App Signing uses the EAS keystore itself, so a direct APK and a Play install are signed alike and replace each other: Play had generated its own key (SHA-256 `47:2D:E3:57…`) when the app was created, and on 2026-10-21, before any release, it was replaced through PEPK by the EAS key `DC:62…00:B4`, which is also the upload key. EAS build `3753424b` (1.0.20, versionCode 3, the old icon) was never uploaded: on 2026-10-21 the user chose to ship the redesign first, so the first AAB is EAS build `cc56fee1` (1.0.21, versionCode 8) from a clean worktree of `11be1c8`, with the APK `d54afeab` (versionCode 9) beside it for direct installs. Never uploaded: the 1.0.20 pair (`a0d84bad`, `811bbbb9`), which cropped the launcher icon, and the first 1.0.21 pair (`0b2ddd8f`, `e2682ebc`), whose icon lacked the four symbols. Done on 2026-10-20: the app `com.jew365.app` in the Play Console, all ten App content declarations, the Hebrew default listing with its English translation, temporary store graphics, and the track `Closed testing - Alpha` with the testers group, all countries and the feedback address; every answer is recorded in [release/PLAY_CONSOLE_METADATA.md](release/PLAY_CONSOLE_METADATA.md). Done on 2026-10-21: the redesigned store graphics, the privacy policy with its `#delete` section pushed, and the signing key. Done on 2026-10-22: the AAB uploaded with its release notes, the store listing saved past draft, the exact-alarm declaration (Calendar), the AI asset labels, and all sixteen changes sent for Google's review; Google approved it the same night, and the release is available to the testers group. Left: the invitation to 15 to 20 testers so at least 12 stay opted in for 14 days in a row (2 opted in on 2026-10-22, the owner's own account among them), then the production application from the Dashboard. Then the App Store name and listing at the first iOS submission, from [release/](release), with the support and privacy URLs under `https://jew-365.github.io/jew-365/`.
- **The redesign's native half ships in 1.0.21.** The palettes, screens and in-app logo of the redesign (2026-10-21) can ship over the air, but the launcher icon (`icon.png`, `adaptive-icon.png`, the Android 13 monochrome layer `adaptive-monochrome.png`), the notification icon and its colour `#012B97` (the logo's dark blue, the owner's call, 2026-10-22), and the splash (the `expo-splash-screen` plugin with a light and a dark image) are native. The first build with them, 1.0.20 (AAB `a0d84bad`, APK `811bbbb9`), showed the launcher icon cropped on the user's Samsung phone: the mark filled the whole 66/108 safe circle and the launcher cut its crown, check and bell. [scripts/logo/export.mjs](scripts/logo/export.mjs) now draws it to a 0.255-width radius, and that build was never uploaded; the next one raises `version` to 1.0.21 (the user's call, 2026-10-21), so installs of 1.0.20 get no updates until they install it. Verified on the Android emulator (debug build): launcher icon, light and dark splash, the in-app SVG logo's gradient and outline mask. Unverified: the 1.0.21 icon on a real launcher, iOS (no iOS build exists), and Android 13 themed icons.
- **No Sentry account yet** (the user's call, 2026-10-09), so crash reporting stays off: `organization` and `project` of the `@sentry/react-native/expo` entry in [app.json](app.json) are placeholders, no `EXPO_PUBLIC_SENTRY_DSN` is set, and every profile in [eas.json](eas.json) sets `SENTRY_DISABLE_AUTO_UPLOAD`. To close: open the account, set the DSN (Metro inlines it, so it ships over the air), add `SENTRY_AUTH_TOKEN` as an EAS secret, fill `organization` / `project` (native config, so the next build), and drop the two production `env` lines.
- **Rav review of the taharah rules.** [docs/taharah-review.html](docs/taharah-review.html) holds 14 "לאימות" items awaiting a rav's answers, now as an answer form (נכון / לא נכון and a note per item) that emails the answers to 365jew@gmail.com through Formspree; send the rav the page link: https://jew-365.github.io/jew-365/taharah-review.html. The rule table ships as initial. Each correction comes back as one preset edit in [src/data/taharahPresets.ts](src/data/taharahPresets.ts) that raises `TAHARAH_RULES_VERSION` and edits the same cell of the page.
- **Halachic review of the siddur texts.** The open items are listed in [scripts/siddur/AGENTS.md](scripts/siddur/AGENTS.md) (Work Guidance): meals, bedtime Shema, sights and food, Kiddush Levana, Sheva Berachot, Chanukah, Tehillim's Yehi Ratzon placement, and Shacharit's tallit and tefillin section.
- **Taharah device checks are not recorded.** The biometric lock, the `expo-secure-store` key and the headless `MARK_DONE` of a bedika were built and tested in Jest only (2026-10-08); no device run is recorded since.
- **Merged local branches.** Seven local branches are fully merged into `main`. Five are checked out nowhere and wait only for the user to run `git branch -d fix/audit-remediation hok-leisrael master reduce-apk-size refactor` (the agent's own run was refused by the auto-mode classifier on 2026-10-12; `fix/audit-remediation` stays on `origin`). The other two, `claude/adoring-agnesi-250cfe` and `claude/magical-wozniak-a1d944`, are checked out in clean worktrees under [.claude/](.claude) that belong to two inactive desktop sessions ("Fix vacuous scheduler test 6.6", "Fix the no-op timezone test matrix…"): archive or delete those sessions, let Settings › Storage clean up their worktrees, then delete the two branches.
