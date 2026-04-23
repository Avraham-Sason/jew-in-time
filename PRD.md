# יהודי כשר — רשימת משימות

אפליקציית React Native + Expo למעקב מצוות יומיומי עם התראות חכמות לפי זמני הלכה.  
מקורות: [PLAN.md](PLAN.md) (ארכיטקטורה) + [design/kosher-jew/](design/kosher-jew/) (Hi-Fi).  
פורמט: כל phase עומד בזכות עצמו, סיום phase = commit, כל task עם acceptance.

---

## Phase 0 — Bootstrap ✅

- [x] **0.1** ✅ צור פרויקט Expo עם TypeScript  
  `npx create-expo-app kosher-jew --template`

- [x] **0.2** ✅ התקן תלויות  
  `expo-router`, `expo-notifications`, `expo-location`, `expo-task-manager`, `expo-background-fetch`, `expo-font`, `expo-haptics`, `zustand`, `react-native-mmkv`, `kosher-zmanim`, `@hebcal/core`, `luxon`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`, `i18n-js`

- [x] **0.3** ✅ הגדר `app.json`  
  bundle id, LOCATION permission, NOTIFICATIONS permission, background modes (fetch + processing)

- [x] **0.4** ✅ אכוף RTL  
  ב-`src/app/_layout.tsx`: `I18nManager.allowRTL(true)` + `forceRTL(true)`

- [x] **0.5** ✅ טען פונט Heebo  
  משקלים 300/400/500/600/700/800/900 דרך `expo-font` + `useFonts()` ב-_layout

- [x] **0.6** ✅ העתק theme tokens  
  `src/theme/colors.ts` ← `T_LIGHT` + `T_DARK` מ-[design/kosher-jew/project/hifi/components.jsx:21-44](design/kosher-jew/project/hifi/components.jsx)  
  `src/theme/typography.ts` + `src/theme/tokens.ts`

- [x] **0.7** ✅ הגדר EAS  
  `eas build:configure` → פרופילים: dev, preview, production

- [x] **0.8** ✅ Smoke test  
  `expo start` → iOS simulator + Android emulator → "Hello" ב-RTL עם Heebo

**Acceptance**: אפליקציה עולה, RTL עובד, Heebo נטען, theme tokens זמינים.

---

## Phase 1 — מנוע הזמנים ✅

- [x] **1.1** ✅ `src/types/zmanim.ts`  
  טיפוסים: `Zmanim`, `Location` ( `{ lat, lng, tz, name, inIsrael }` )

- [x] **1.2** ✅ `src/services/ZmanimService.ts`  
  wrapper סביב `kosher-zmanim`. מחזיר: `alotHaShachar, misheyakir, netzHaChama, sofZmanShmaGra, sofZmanShmaMA, sofZmanTfilaGra, minchaGedola, plagHaMincha, shkia, tzeitHakochavim, chatzot`

- [x] **1.3** ✅ `src/services/HebcalService.ts`  
  wrapper סביב `@hebcal/core`: `getHebrewDate`, `getParasha`, `getHolidays`, `isShabbat`, `isYomTov`, `getDafYomi`, `getOmerDay`

- [x] **1.4** ✅ Unit tests — דיוק זמנים  
  3 ערים (ירושלים, ת"א, ניו יורק) × 3 תאריכים. סטייה ≤1 דקה מ-MyZmanim.  
  ירושלים 2026-04-23: misheyakir≈05:08, netz≈06:01, shkia≈19:13, סוף ק"ש גר"א≈09:19

**Acceptance**: כל 9 הבדיקות עוברות; offline עובד.

---

## Phase 2 — Registry מצוות ✅

- [x] **2.1** ✅ `src/types/mitzvah.ts`  
  `Mitzvah`, `Reminder`, `TimeType` (`fixed-moment` | `range-within-day` | `all-day` | `sunset-trigger` | `date-range` | `monthly-window` | `annual-seasonal`), `Nusach` (`ashkenaz` | `sefard` | `edot_hamizrach` | `chabad`)

- [x] **2.2** ✅ `src/data/mitzvot.ts` — 10 מצוות MVP עם `computeWindow`:
  - [x] ✅ תפילין (misheyakir → shkia)
  - [x] ✅ ציצית (all-day, misheyakir → shkia)
  - [x] ✅ ק"ש שחרית (netz → sofZmanShmaGra, תומך MA)
  - [x] ✅ שחרית (netz → sofZmanTfila)
  - [x] ✅ מנחה (minchaGedola → shkia)
  - [x] ✅ ערבית (tzeit → chatzot)
  - [x] ✅ ברכות השחר (alot → sofZmanShma)
  - [x] ✅ הדלקת נרות (שישי, shkia − 18דק' ישראל / 20 חו"ל)
  - [x] ✅ הבדלה (מוצש"ק, tzeit)
  - [x] ✅ ספירת העומר (16 ניסן → 5 סיוון, מ-tzeit)

- [x] **2.3** ✅ `src/data/nuschaot.ts`  
  מיפוי נוסח → דעות חישוב (GRA / MA לק"ש)

- [x] **2.4** ✅ `defaultReminders` לכל מצווה  
  דוגמה: `{anchor:'start', offsetMin:0}`, `{anchor:'start', offsetMin:180, skipIfDone:true}`, `{anchor:'end', offsetMin:-45, skipIfDone:true}`  
  ([PLAN.md:69-73](PLAN.md))

- [x] **2.5** ✅ `skipOn` + `nuschaotSupported` לכל מצווה

- [x] **2.6** ✅ Unit tests — windows  
  10 מצוות × ירושלים × 2 תאריכים → windows תקינים. Omer יום 10 = כ"ה ניסן.

**Acceptance**: `mitzvot.find(m => m.id === 'tefillin').computeWindow(...)` מחזיר חלון תקף.

---

## Phase 3 — Storage + Stores ✅

- [x] **3.1** ✅ `src/services/StorageService.ts`  
  MMKV singleton + generics `get<T>/set<T>/delete` + JSON serialization

- [x] **3.2** ✅ `src/stores/useUserStore.ts` (Zustand + persist)  
  `{ nusach, location, theme, language, halachicOpinions: {ksSofZman: 'GRA'|'MA'}, inIsrael, isOnboarded }`

- [x] **3.3** ✅ `src/stores/useMitzvotStore.ts`  
  `{ activeMitzvot: Record<mitzvahId, { enabled: boolean; customReminders?: Reminder[] }> }`  
  actions: `setEnabled`, `setReminders`, `resetToDefault`

- [x] **3.4** ✅ `src/stores/useCompletionsStore.ts`  
  `{ completions: Record<'YYYY-MM-DD', Record<mitzvahId, timestamp>> }`  
  actions: `markDone(id)`, `unmark(id)`, `isDone(id, date)`

- [x] **3.5** ✅ `src/services/CompletionService.ts`  
  wrapper עם hook ל-`NotificationScheduler.cancelForMitzvah()` לאחר `markDone`

- [x] **3.6** ✅ Smoke test — persistence  
  סמן mitzvah → kill app → restart → סימון נשאר

**Acceptance**: state שוחזר אחרי restart.

---

## Phase 4 — UI Core

- [x] **4.1** ✅ `src/components/AppLogo.tsx`  
  SVG port מ-[components.jsx:49](design/kosher-jew/project/hifi/components.jsx)

- [x] **4.2** ✅ `src/components/TimeRibbon.tsx`  
  port מ-[components.jsx:169](design/kosher-jew/project/hifi/components.jsx). props: `pct`, `timeLeft`. צבע: >50% ירוק, >25% כתום, else אדום.

- [x] **4.3** ✅ `src/components/MitzvahCard.tsx`  
  port מ-[components.jsx:189](design/kosher-jew/project/hifi/components.jsx). stamping via Reanimated (`stampIn`: scale+rotate+fade, 1.3s).

- [x] **4.4** ✅ `src/components/CompletedRow.tsx`  
  port + `slideUp` animation

- [x] **4.5** ✅ `src/components/NavBar.tsx` + `BottomTabs.tsx`  
  port מ-components.jsx

- [x] **4.6** ✅ `src/app/_layout.tsx`  
  expo-router root: fonts, theme provider, RTL, tab navigator (בית / לוח / מצוות). Guard onboarding.

- [x] **4.7** ✅ `src/app/(tabs)/home.tsx`  
  port מ-[screens.jsx:6](design/kosher-jew/project/hifi/screens.jsx). mock data תחילה. counter בhead (2/7). כרטיסים ממוינים לפי דחיפות + רשימת "הושלמו" מתחת.

- [x] **4.8** ✅ Onboarding flow — 4 מסכים ([screens.jsx:371](design/kosher-jew/project/hifi/screens.jsx)):
  - [x] ✅ `src/app/onboarding/index.tsx` — Welcome
  - [x] ✅ `src/app/onboarding/nusach.tsx` — בחירת נוסח
  - [x] ✅ `src/app/onboarding/location.tsx` — בקשת location + notifications permission
  - [x] ✅ `src/app/onboarding/ready.tsx` — סיום

- [x] **4.9** ✅ `src/services/LocationService.ts`  
  GPS via `expo-location` + fallback ל-`src/data/cities.ts` (רשימת ערים עם lat/lng/tz)

- [x] **4.10** ✅ Dark mode  
  `useColorScheme()` + theme switch ב-settings → apply T_LIGHT / T_DARK

**Acceptance**: onboarding → Home עם mock → ללחוץ ✓ → stamp + מעבר ל"הושלמו".

---

## Phase 5 — Schedule + Library + Detail + Settings

- [x] **5.1** ✅ `src/app/(tabs)/schedule.tsx` — Day view  
  port מ-[screens.jsx:85](design/kosher-jew/project/hifi/screens.jsx). משלב `ZmanimService.getZmanim()` + mitzvot פעילות. קו "עכשיו" אדום לפי `new Date()`. Toggle יום/שבוע/חודש (שבוע+חודש ב-Phase 7).

- [x] **5.2** ✅ `src/app/(tabs)/library.tsx`  
  port מ-[screens.jsx:187](design/kosher-jew/project/hifi/screens.jsx). pills קטגוריות דינמיות. toggle → `useMitzvotStore.setEnabled()`.

- [x] **5.3** ✅ `src/app/mitzvah/[id].tsx`  
  port מ-[screens.jsx:277](design/kosher-jew/project/hifi/screens.jsx). gradient ribbon, reminders CRUD, כפתור "חזרה ל-default".

- [x] **5.4** ✅ `src/components/ReminderEditor.tsx`  
  modal: anchor (start/end) + offsetMin + label + skipIfDone toggle

- [x] **5.5** ✅ `src/app/settings.tsx`  
  נוסח, מיקום (GPS/ידני), theme, שפה, דעות (גר"א/MA), ישראל/חו"ל

**Acceptance**: library → toggle mitzvah → detail → ערוך reminder → שינוי נשמר ב-MMKV → חזור → מופיע.

---

## Phase 6 — NotificationScheduler

- [x] **6.1** ✅ `src/services/NotificationScheduler.ts`  
  - `scheduleAll(date, activeMitzvot, location, settings)` — 48 שעות קדימה
  - `cancelForMitzvah(mitzvahId, date)` — אחרי ✓
  - `cancelAll()`
  - `rebuild()` = `cancelAll()` + `scheduleAll()`
  - identifier: `${mitzvahId}__${YYYY-MM-DD}__${reminderIndex}`

- [x] **6.2** ✅ Background task — `daily-rebuild`  
  `expo-task-manager` רץ ב-00:15 לוקאלי. רישום ב-`_layout.tsx`.

- [x] **6.3** ✅ Hook: markDone → cancelForMitzvah  
  ב-`useCompletionsStore.markDone()`

- [x] **6.4** ✅ Hook: location/nusach change → rebuild  
  ב-`useUserStore` subscribers

- [x] **6.5** ✅ Permission flow  
  `expo-notifications` setup + UI למצב denied (banner ב-Home)

- [x] **6.6** ✅ `skipOn` handling  
  אם `isShabbat(date) && mitzvah.skipOn.includes('shabbat')` → דלג

- [x] **6.7** ✅ Pending notifications guard  
  אם `pending > 60` → rebuild ב-24 שעות במקום 48 (iOS limit 64)

**Acceptance**:
- [ ] Enable תפילין → +0 reminder → המתן → מגיעה התראה
- [ ] סמן ✓ → reminders עתידיים של אותו יום מתבטלים
- [ ] שבת: אין התראות ל-`skipOn: ['shabbat']`
- [ ] שנה GPS → rebuild אוטומטי → זמני מחר מעודכנים

---

## Phase 7 — Polish

- [x] **7.1** ✅ אנימציות  
  staggered reveal ב-Home (`delay: i*40ms`), fadeIn במעברי tabs

- [x] **7.2** ✅ Schedule — Week + Month views  
  שבוע: 7 עמודות. חודש: קלנדר עברי grid + פינג על ר"ח/חגים.

- [x] **7.3** ✅ i18n  
  `src/i18n/he.json` + `en.json`. כל טקסט דרך `t()`. שפה ב-settings.

- [x] **7.4** ✅ a11y  
  `accessibilityLabel`, `accessibilityRole`, focus order, dynamic type scaling

- [x] **7.5** ✅ Empty + error states  
  no-location, notifications-denied, GPS-timeout

- [x] **7.6** ✅ Haptics  
  `expo-haptics` בסימון ✓ (`ImpactFeedbackStyle.Medium`)

- [x] **7.7** ✅ Long-press bottom sheet  
  כרטיס → sheet עם: פרטים / דלג היום / עריכה

- [x] **7.8** ✅ Splash + app icon  
  AppLogo → 1024×1024 + Android adaptive

**Acceptance**: production-grade feel; dark mode עקבי; עברית + אנגלית עובדים.

---

## Phase 8 — Build & Ship

- [ ] **8.1** EAS Build production — iOS + Android
- [ ] **8.2** App Store assets  
  screenshots (light+dark × 6.7"/6.5"/5.5"), תיאור he+en, privacy policy, age rating
- [ ] **8.3** Play Console assets  
  screenshots, Data Safety form, content rating
- [ ] **8.4** TestFlight internal  
  5-10 בודקים חיצוניים
- [ ] **8.5** Error tracking  
  Sentry או `expo-error-reporter`
- [ ] **8.6** Launch

---

## מבנה קבצים יעד

```
src/
  app/
    _layout.tsx
    (tabs)/{home,schedule,library}.tsx
    mitzvah/[id].tsx
    settings.tsx
    onboarding/{index,nusach,location,ready}.tsx
  components/
    {AppLogo,MitzvahCard,TimeRibbon,CompletedRow,NavBar,BottomTabs,ReminderEditor,HebrewDate}.tsx
  data/
    {mitzvot,nuschaot,cities}.ts
  services/
    {ZmanimService,HebcalService,NotificationScheduler,LocationService,StorageService,CompletionService}.ts
  stores/
    {useUserStore,useMitzvotStore,useCompletionsStore}.ts
  theme/{colors,typography,tokens}.ts
  i18n/{he,en}.json
  types/{mitzvah,zmanim}.ts
```

---

## קבצים קריטיים

1. [src/services/ZmanimService.ts](src/services/ZmanimService.ts)
2. [src/services/NotificationScheduler.ts](src/services/NotificationScheduler.ts)
3. [src/data/mitzvot.ts](src/data/mitzvot.ts)
4. [src/components/TimeRibbon.tsx](src/components/TimeRibbon.tsx)
5. [src/components/MitzvahCard.tsx](src/components/MitzvahCard.tsx)
6. [src/app/(tabs)/home.tsx](src/app/(tabs)/home.tsx)
7. [src/app/mitzvah/[id].tsx](src/app/mitzvah/[id].tsx)

---

## Risks

| סיכון | מיטיגציה |
|-------|----------|
| דיוק kosher-zmanim | Unit tests השוואה ל-MyZmanim (Phase 1.4) |
| Android 12+ background limits | fallback ל-FCM silent push אחרי MVP |
| iOS 64 pending notifications limit | rebuild 24h אם pending > 60 (task 6.7) |
| RTL bugs ב-iOS dev | בדוק early; forceRTL דורש reload אחרי התקנה |
| נוסח ≠ דעה הלכתית | הפרד בהגדרות — נוסח=תפילה, דעה=זמני ק"ש |

---

## שאלות פתוחות

1. Android parity מיום 1? (משפיע על Phase 6 — background tasks)
2. settings screen נפרד או tab 4? (כרגע בתוכנית: מסך נפרד ב-5.5)
3. Sentry מ-MVP או אחרי? (כרגע ב-Phase 8.5)

---

## לוח זמנים

| Phase | ימים | מצטבר |
|-------|------|-------|
| 0 Bootstrap | 1-2 | 2 |
| 1 Zmanim | 2 | 4 |
| 2 Registry | 2 | 6 |
| 3 Storage | 1 | 7 |
| 4 UI Core | 3-4 | 11 |
| 5 Screens | 3 | 14 |
| 6 Notifications | 2-3 | 17 |
| 7 Polish | 2-3 | 20 |
| 8 Ship | 2-3 | **~23** |

MVP playable בסוף Phase 4. Production-ready בסוף Phase 8.
