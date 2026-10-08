# AGENTS.md

## Purpose

- Own the nusach reader route, opened from the notification "פתח נוסח" action, the mitzvah screen and the siddur catalog, and the catalog itself.

## Ownership

- [index.tsx](index.tsx) is the catalog: every `STANDALONE_TEXTS` entry under its `SIDDUR_GROUPS` heading (a group with no text is not drawn), named in the UI language, each row opening the reader. A text whose `available` condition fails for its `standaloneTextDay()` is dimmed, cannot be opened, and shows its `availableLabel` (else `siddur.catalog.notToday`); the shared `useNow` tick re-checks it when a day turns. Home's siddur row and the library header button open it.
- [[id].tsx](%5Bid%5D.tsx) renders a text in the user's nusach and language. `id` is a text id: a mitzvah (static or custom, found through `findAnyMitzvah()`), else a standalone text (`standaloneTextId()`).

## Local Contracts

- For a mitzvah text, `date` is the civil date of the mitzvah window, the same `YYYY-MM-DD` the notification carries as `dateKey` (recovered from the notification identifier when the payload lacks it). Without a valid `date` the reader shows "unavailable" rather than guessing. Evening texts resolve for the Hebrew day the evening opens, always through `liturgicalDay()`; never derive a mitzvah text's Hebrew day from the current time.
- A standalone text needs no `date`: it resolves for `standaloneTextDay()` — the Hebrew day in effect now at the location, or for an evening text the night in effect or coming next — re-read on the shared `useNow` tick and memoized by day number so the text re-resolves only when the day turns. With a `date` it resolves through `liturgicalDay(date, evening)`, as a mitzvah text does.
- Availability comes from `hasSiddurText()` for a mitzvah text and `hasStandaloneText()` for a standalone one, and day resolution from `resolveSiddurText()`. The route never filters segments itself.
- "סיימתי" marks the mitzvah done for the window date through `markDone`, which also clears that mitzvah's notifications from the tray, with the same haptic as home's done button, and then lands on home whatever opened the reader: `dismissAll()` and `navigate('/(tabs)/home')`, or `replace` when the reader is the only screen (a cold-start notification tap). The user asked for this on 2026-10-08. A standalone text has no done button and touches no completion.
- Keep-awake activation failures are swallowed: browsers refuse wake locks in background tabs, and Android refuses when the activity is gone.
- The source credits under the text are a CC-BY and CC-BY-SA license requirement, not decoration.

## Work Guidance

- Hebrew paragraphs are right-aligned RTL in the Noto Serif Hebrew family; English appears only in the English UI, under each paragraph. Native RN swaps a physical `textAlign` of `left`/`right` when `I18nManager.isRTL` is set, and react-native-web does not, so the reader aligns through `RIGHT_EDGE`/`LEFT_EDGE`, derived from `I18nManager.isRTL`. A literal `'right'` renders on the left of an Android phone in the Hebrew UI, even though the web preview looks right.
- A segment is highlighted as added today when its condition carries a flag (in `all` or `any`) that its section's other segments do not all share, or an omer day. Consecutive highlighted segments within one block share a single frame with a single "נוסף היום" caption.
- A passage only some say starts collapsed behind a tappable label with a down chevron, in the `optional` and `optionalBg` theme colors. An optional section's label replaces its title. An optional block inside a section sits where the passage is said, and the blocks come from `segmentBlocks()`. Expanded text is drawn in `optional`. Expansion is screen state keyed by section title and block start. It survives `FlatList` virtualization and resets when the reader closes.
- A passage only a minyan says stays open, drawn in the `minyan` theme color under a small heading that names who says it. Inside an optional block it takes the `minyan` color.
- Both kinds of block carry a border on the side where the UI language starts. Like the text edges, the side is derived from `I18nManager.isRTL` and the language, because react-native-web does not mirror `borderStartWidth`. In the Hebrew UI, `borderStartWidth` landed on the left on the web.
- The body is a `FlatList` of section cards, so a long text such as Shacharit paints its first sections before the rest.
- With more than one section, the header shows one section picker. It names the section at the top of the screen, tracked by `onViewableItemsChanged`, and opens a bottom sheet listing every section, with the current one highlighted. The sheet uses the same style as the home quick menu, is capped at 70% of the screen, and closes on a backdrop tap or Android back.
- A pick jumps instantly with `scrollToIndex`. A section not yet measured is reached without moving the view: the list lifts its render window (`windowSize` Infinity) so the remaining sections render in the background, retries every 50 ms, and lands once the target is measured. It gives up after 5 s or when the reader drags, and then restores the normal window. Never scroll to an intermediate section while waiting. On a phone one section can be taller than the whole render window (Petach Eliyahu in Edot HaMizrach is about 12 screens), so the section after it never renders. A retry that snapped back to the last measured section therefore looped forever and locked scrolling.
- The catalog's header mirrors the reader's (back button, title, nusach line) and its rows mirror the library tab's rows.

## Verification

- Run `pnpm test -- src/app/__tests__/routes.test.ts` and `pnpm typecheck` after route changes.
- Check visually on the web preview with dated URLs: an omer night, an erev Yom Tov, a Saturday night before Yom Tov, a fast-day mincha, a Saturday-night maariv, and Shacharit on Rosh Chodesh and Chol HaMoed; and `/siddur` plus `/siddur/birkat_hamazon` with no date.

## Child DOX Index

- No child AGENTS.md files.
