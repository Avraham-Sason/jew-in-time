# AGENTS.md

## Purpose

- Own the main bottom-tab experience: home, schedule, history, library, settings, and tab layout.

## Ownership

- [_layout.tsx](_layout.tsx) owns tab registration and tab bar behavior.
- [home.tsx](home.tsx), [schedule.tsx](schedule.tsx), [history.tsx](history.tsx), [library.tsx](library.tsx), and [settings.tsx](settings.tsx) own their respective tab screens.
- [index.tsx](index.tsx) redirects hidden tab index traffic.

## Local Contracts

- Tab labels and normal UI copy must stay in [../../i18n/AGENTS.md](../../i18n/AGENTS.md).
- The tab order in [_layout.tsx](_layout.tsx) is schedule, history, home, library, settings: home stays the initial route and sits in the middle of the bar, where [BottomTabs](../../components/BottomTabs.tsx) draws it as a raised gold disc (the user's choice, 2026-10-08). Keep it third when adding a tab.
- Schedule and history views should reuse pure helpers from [../../utils/AGENTS.md](../../utils/AGENTS.md) instead of duplicating day computation.
- Day navigation should route to [../day/AGENTS.md](../day/AGENTS.md) for drilldown behavior.
- Home shows a banner into `/checkin` while a check-in is open, and keeps the mitzvot waiting in it out of "missed". The schedule's day view labels them waiting.
- Home calls `downloadNewUpdate()` on every return to the foreground and shows a reload banner while `useUpdates().isUpdatePending` holds. Settings shows `appVersionLabel()`. Both come from [../../services/appUpdates.ts](../../services/appUpdates.ts).
- Settings holds the gender and marital status chips in its profile section; the status labels follow the gender. The taharah section, after nusach, renders only while `taharahOffered()` holds and then shows the tracking switch, the disclaimer and, while tracking is on, a button to `/taharah/settings`. The gender and status chips, the switch and the nusach chips call [taharahOptIn.ts](../../stores/taharahOptIn.ts), the same functions the onboarding steps use. Every section is [SettingsSection](../../components/SettingsSection.tsx).
- The theme section is [ThemeSwatchRow](../../components/ThemeSwatchRow.tsx): unlabelled colour circles for the six palettes, each writing `useUserStore.setTheme`. There is no system / light / dark mode switch.
- Home shows the taharah card right after the banners while `taharahEnabled` holds and no quiet block does: the cycle stage, then the first unfinished task of today, else the stage's hint. While `useTaharahStore.lockEnabled` holds it shows only the `taharah.home.title` heading and the `taharah.home.open` caption, because the session is always locked while home is showing. It opens `/taharah`. Its cycle, task and perisha data come from [../../utils/AGENTS.md](../../utils/AGENTS.md); home adds only the wording.
- Home offers a gold banner (`home.completeProfile`) into settings while onboarded and either the gender or the marital status is unanswered. It asks for the profile answers and never names the taharah topic, which a single user must not see. Pressing it writes the MMKV key `profile:intro-dismissed`, read once into state at mount, so it appears once; the key names the question set, so a new question gets a new key and every install is asked once more.
- Home's current and missed cards offer the open-text button only when `hasSiddurText()` holds for today, and open `/siddur/[id]` with today's `dateKey`, the key the cards and notifications already use.

## Work Guidance

- Keep tab screens scannable and mobile-first; avoid turning operational app screens into marketing layouts.
- Preserve Hebrew-first and RTL ergonomics.
- If a tab consumes notification, location, completion, or settings state, use the owning store/service APIs instead of reaching into persistence directly.

## Verification

- Run `pnpm test -- src/app/__tests__/routes.test.ts` after tab route changes.
- Run `pnpm test -- src/utils/__tests__/buildDayTimeline.test.ts src/utils/__tests__/historyStats.test.ts` after schedule/history logic changes.
- Run `pnpm typecheck` after screen state or navigation changes.

## Child DOX Index

- No child AGENTS.md files.
