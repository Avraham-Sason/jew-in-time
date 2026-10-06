# AGENTS.md

## Purpose

- Own the nusach reader route, opened from the notification "פתח נוסח" action and from the mitzvah screen.

## Ownership

- [[id].tsx](%5Bid%5D.tsx) renders a mitzvah's text in the user's nusach and language, resolved for the Hebrew day of its `date` param.

## Local Contracts

- `date` is the civil date of the mitzvah window, the same `YYYY-MM-DD` the notification carries as `dateKey` (recovered from the notification identifier when the payload lacks it). Without a valid `date` the reader shows "unavailable" rather than guessing. Evening texts resolve for the Hebrew day the evening opens, always through `liturgicalDay()`; never derive the Hebrew day from the current time.
- Availability comes from `hasSiddurText()` and day resolution from `resolveSiddurText()`. The route never filters segments itself.
- "סיימתי" marks the mitzvah done for the window date through `markDone`, which also clears that mitzvah's notifications from the tray.
- Keep-awake activation failures are swallowed: browsers refuse wake locks in background tabs, and Android refuses when the activity is gone.
- The source credits under the text are a CC-BY and CC-BY-SA license requirement, not decoration.

## Work Guidance

- Hebrew paragraphs are right-aligned RTL in the Noto Serif Hebrew family; English appears only in the English UI, under each paragraph. Native RN swaps a physical `textAlign` of `left`/`right` when `I18nManager.isRTL` is set, and react-native-web does not, so the reader aligns through `RIGHT_EDGE`/`LEFT_EDGE`, derived from `I18nManager.isRTL`. A literal `'right'` renders on the left of an Android phone in the Hebrew UI, even though the web preview looks right.
- A segment is highlighted as added today when its condition carries a flag that its section's other segments do not, or an omer day. Consecutive highlighted segments within one block share a single frame with a single "נוסף היום" caption.
- A passage only some say starts collapsed behind a tappable label with a down chevron, in the `optional` and `optionalBg` theme colors. An optional section's label replaces its title. An optional block inside a section sits where the passage is said, and the blocks come from `segmentBlocks()`. Expanded text is drawn in `optional`. Expansion is screen state keyed by section title and block start. It survives `FlatList` virtualization and resets when the reader closes.
- A passage only a minyan says stays open, drawn in the `minyan` theme color under a small heading that names who says it. Inside an optional block it takes the `minyan` color.
- Both kinds of block carry a border on the side where the UI language starts. Like the text edges, the side is derived from `I18nManager.isRTL` and the language, because react-native-web does not mirror `borderStartWidth`. In the Hebrew UI, `borderStartWidth` landed on the left on the web.
- The body is a `FlatList` of section cards, so a long text such as Shacharit paints its first sections before the rest.
- With more than one section, the header shows one section picker. It names the section at the top of the screen, tracked by `onViewableItemsChanged`, and opens a bottom sheet listing every section, with the current one highlighted. The sheet uses the same style as the home quick menu, is capped at 70% of the screen, and closes on a backdrop tap or Android back.
- A pick jumps instantly with `scrollToIndex`. A section not yet measured is reached without moving the view: the list lifts its render window (`windowSize` Infinity) so the remaining sections render in the background, retries every 50 ms, and lands once the target is measured. It gives up after 5 s or when the reader drags, and then restores the normal window. Never scroll to an intermediate section while waiting. On a phone one section can be taller than the whole render window (Petach Eliyahu in Edot HaMizrach is about 12 screens), so the section after it never renders. A retry that snapped back to the last measured section therefore looped forever and locked scrolling.

## Verification

- Run `pnpm test -- src/app/__tests__/routes.test.ts` and `pnpm typecheck` after route changes.
- Check visually on the web preview with dated URLs: an omer night, an erev Yom Tov, a Saturday night before Yom Tov, a fast-day mincha, a Saturday-night maariv, and Shacharit on Rosh Chodesh and Chol HaMoed.

## Child DOX Index

- No child AGENTS.md files.
