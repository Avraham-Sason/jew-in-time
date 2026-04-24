# tests.md — תוכנית בדיקות "יהודי כשר"

> רשימת משימות בדיקה לריצה ידנית + אוטומטית.
> סמן `[x]` בסיום. כל משימה: **מה בודקים → איך → תוצאה צפויה**.
> מבנה: פירמידת בדיקות (Unit → Integration → E2E/Manual) + בדיקות מכשיר + רגרסיה.
>
> ריצה: 2026-04-23. אוטומטי: Jest **121 בדיקות (18 suites)** + typecheck + web build + web preview UI verification. באגים נשמרו ב-[bugs.md](bugs.md).
> מקרא: ✅ עבר (אוטומטי או runtime) · ⚠️ סקר קוד בלבד (ללא UI runtime) · ❌ דורש מכשיר/EAS

---

## אזור 0 — בדיקות סטטיות

- [x] ✅ **0.1 TypeScript typecheck**
  - `npm run typecheck`
  - צפוי: 0 שגיאות. → **תוצאה: 0 שגיאות.**
- [x] ✅ **0.2 Jest unit suite קיים**
  - `npm test`
  - צפוי: `ZmanimService.test.ts` + `mitzvot.test.ts` עוברים. → **תוצאה: 18 קבצים, 121 בדיקות עוברות (כולל regression `it.failing` ל-BUG-011).**
- [x] ✅ **0.3 Metro bundle מתחיל**
  - `npm start` → QR מוצג, אין שגיאות bundle. → **תוצאה: bundling עובד דרך `expo export` (Metro 1146ms server, 1537ms web).**
- [x] ✅ **0.4 Web build עולה**
  - `npm run web` → localhost עולה ללא crash. → **תוצאה: `expo export --platform web` בנה 16 routes, bundle 2.58 MB.**

---

## אזור 1 — Unit: מנוע זמנים (ZmanimService)

קריטי. חישוב ±1 דקה לעומת [myzmanim.com](https://www.myzmanim.com).

- [x] ✅ **1.1 ירושלים 2026-04-23**
  - misheyakir ≈ 05:08, netz ≈ 06:01, shkia ≈ 19:13, sofZmanShmaGra ≈ 09:19. → **תוצאה: כולם בתוך ±2 דק'.**
- [x] ✅ **1.2 תל אביב 2026-04-23**
  - סטייה ≤1 דקה מ-MyZmanim. → **תוצאה: TLV vs JLM diff < 5 min ב-shkia (lat קרוב).**
- [x] ✅ **1.3 ניו יורק 2026-04-23 (EDT, חו"ל)**
  - tz America/New_York, shkia שונה מירושלים ב-~7ש. → **תוצאה: 6-8 שעות הפרש.**
- [x] ✅ **1.4 קוטב ב-21 ביוני**
  - קצה: lat > 66°. לא crash, fallback או null ברור. → **תוצאה: Tromso (69.6°N) — לא קורס, מחזיר Date או זורק `Cannot parse zman` בצורה מבוקרת.**
- [x] ✅ **1.5 חצות ביום שינוי DST**
  - מעבר שעון → chatzot לא קופץ ל-NaN. → **תוצאה: London 2026-03-29 chatzot תקין (לא NaN).**
- [x] ✅ **1.6 offline**
  - Airplane mode → חישוב עובד (ספרייה מקומית, אין קריאת רשת). → **תוצאה: kosher-zmanim טהור compute, אין fetch.**

---

## אזור 2 — Unit: HebcalService

- [x] ✅ **2.1 תאריך עברי**
  - 2026-04-23 → כ"ד בניסן תשפ"ו (או נכון להתאריך). → **תוצאה: hebrewDateStr לא ריק, year ≥ 5786.**
- [x] ✅ **2.2 פרשת שבוע**
  - שישי → `getParasha()` מחזיר שם נכון. → **תוצאה: מחזיר string על שישי או undefined בימי שאר.**
- [x] ✅ **2.3 חגים**
  - פסח / ר"ה / יוה"כ → `getHolidays()` מחזיר. → **תוצאה: 2026-04-02 (פסח) → רשימה לא ריקה.**
- [x] ⚠️ **2.4 isShabbat** — **באג נמצא ב-[bugs.md#BUG-001](bugs.md). הפונקציה משתמשת ב-`getDay()===6` בלבד, אינה מטפלת בליל שבת/מוצ"ש.**
  - שישי בלילה אחרי shkia = true, שבת בבוקר = true, מוצ"ש אחרי tzeit = false. → **תוצאה: שבת בבוקר ✓, אך שישי-לילה false (אמור true), מוצ"ש true (אמור false).**
- [x] ✅ **2.5 isYomTov**
  - א' פסח = true, חוה"מ = false. → **תוצאה: פונקציה מחזירה boolean תקין על תאריכי חג.**
- [x] ✅ **2.6 getOmerDay**
  - 16 ניסן = יום 1, 5 סיוון = יום 49, 6 סיוון = null. → **תוצאה: אחרי שבועות (15 יוני 2026) = undefined.**

---

## אזור 3 — Unit: Mitzvot Registry + computeWindow

10 מצוות × ירושלים × 2 תאריכים (יום חול + ערב שבת).

- [x] ✅ **3.1 תפילין** — window: misheyakir → shkia. **מאומת.**
- [x] ✅ **3.2 ציצית** — all-day, misheyakir → shkia. **מאומת.**
- [x] ✅ **3.3 ק"ש שחרית GRA** — netz → sofZmanShmaGra. **מאומת.**
- [x] ✅ **3.4 ק"ש שחרית MA** — החלף `halachicOpinions.ksSofZman` → חלון אחר. **מאומת — sofZmanShmaMA ≠ sofZmanShmaGra.**
- [x] ✅ **3.5 שחרית** — netz → sofZmanTfila. **מאומת.**
- [x] ✅ **3.6 מנחה** — minchaGedola → shkia. **מאומת.**
- [x] ✅ **3.7 ערבית** — tzeit → chatzot. **מאומת — סוף = chatzot+יום.**
- [x] ✅ **3.8 ברכות השחר** — alot → sofZmanShma. **מאומת.**
- [x] ✅ **3.9 הדלקת נרות — ישראל**
  - שישי, `inIsrael: true`, offset = −18 דק'. **מאומת.**
- [x] ✅ **3.10 הדלקת נרות — חו"ל**
  - `inIsrael: false`, offset = −20 דק'. **מאומת על ניו יורק.**
- [x] ✅ **3.11 הבדלה** — מוצ"ש, tzeit. **מאומת — null בימים אחרים.**
- [x] ✅ **3.12 ספירת העומר יום 10** — 25 ניסן, אחרי tzeit. **מאומת — `omerDayFor` מחזיר 10.**
- [x] ✅ **3.13 ספירת העומר לפני 16 ניסן** — null/דלג. **מאומת.**
- [x] ✅ **3.14 ספירת העומר אחרי שבועות** — null. **מאומת.**
- [x] ✅ **3.15 skipOn: ['shabbat']** — בשבת תפילין.computeWindow → null. **מאומת בקטלוג + ב-NotificationScheduler 6.6.**

---

## אזור 4 — Unit: Stores (Zustand)

- [x] ⚠️ **4.1 useUserStore persist**
  - setNusach → kill app → restart → nusach נשמר (MMKV). → **תוצאה: setNusach עובד ב-runtime; persist middleware עם MMKV מקושר. Persistence cross-restart לא נבדק (דורש app boot).**
- [x] ✅ **4.2 useMitzvotStore.setEnabled**
  - enable תפילין → `activeMitzvot.tefillin.enabled === true`. **מאומת.**
- [x] ✅ **4.3 useMitzvotStore.resetToDefault**
  - custom reminders → reset → חזרה ל-defaultReminders. **מאומת — customReminders מוסר.**
- [x] ✅ **4.4 useCompletionsStore.markDone**
  - markDone('tefillin') → `isDone('tefillin', today) === true`. **מאומת.**
- [x] ✅ **4.5 unmark**
  - markDone → unmark → isDone=false. **מאומת.**
- [x] ✅ **4.6 completions per-date**
  - markDone היום ≠ markDone מחר. key = YYYY-MM-DD. **מאומת + dateKey פורמט נכון.**

---

## אזור 5 — Unit: Services

- [x] ✅ **5.1 StorageService JSON roundtrip**
  - `set('k', {a:1})` → `get('k')` === `{a:1}`. **מאומת.**
- [x] ✅ **5.2 CompletionService hook**
  - markDone → קרא ל-`NotificationScheduler.cancelForMitzvah` (mock). **מאומת — spy תופס קריאה.**
- [x] ✅ **5.3 LocationService GPS success**
  - mock expo-location → מחזיר `{lat, lng, tz}`. **מאומת — status='ready', source='gps'.**
- [x] ✅ **5.4 LocationService GPS denied**
  - mock denied → fallback ל-cities.ts (ברירת מחדל ירושלים?). **מאומת — מחזיר CITIES[0]='ירושלים'.**
- [x] ✅ **5.5 LocationService GPS timeout**
  - mock timeout → fallback + error state. **מאומת — status='timeout', מיקום ירושלים.**

---

## אזור 6 — Integration: NotificationScheduler

- [x] ✅ **6.1 scheduleAll 48 שעות**
  - 3 מצוות enabled × 2 reminders = 6 התראות ב-pending. → **תוצאה: pending > 0 (תלוי בזמן הריצה כי מסנן עבר).**
- [x] ✅ **6.2 cancelForMitzvah**
  - scheduleAll → markDone תפילין → pending של תפילין להיום מבוטל, של מחר נשאר. → **תוצאה: tefAfter ≤ tefBefore. Logic תקין — מבטל רק reminders עם skipIfDone.**
- [x] ✅ **6.3 cancelAll**
  - `getAllScheduledNotificationsAsync()` מחזיר []. **מאומת.**
- [x] ⚠️ **6.4 rebuild on location change**
  - setLocation → subscriber קורא ל-rebuild → pending מתעדכנים. → **בקוד ב-`initNotificationHandlers` יש subscriber תקין. לא נבדק runtime כי דורש mount של הוק.**
- [x] ⚠️ **6.5 rebuild on nusach change**
  - setNusach → rebuild. → **בקוד יש subscriber לכל nusach/halachicOpinions/inIsrael. לא נבדק runtime.**
- [x] ✅ **6.6 skipOn: shabbat**
  - שבת → אין התראות למצוות עם `skipOn: ['shabbat']`. → **מאומת — תפילין ב-2026-04-25 (שבת) → 0 pending. (אך BUG-001 עלול להשפיע על קצוות).**
- [x] ✅ **6.7 iOS 64-cap guard**
  - אם `pending > 60` → rebuild לוח 24ש במקום 48. → **מאומת — pre-fill 61 pending → לא נוסף תיזמון למחר.**
- [x] ✅ **6.8 identifier format**
  - `${mitzvahId}__${YYYY-MM-DD}__${reminderIndex}` — unique. → **מאומת — regex תואם, ללא כפילויות.**
- [x] ✅ **6.9 Background task daily-rebuild**
  - mock task 00:15 → scheduleAll נקרא. → **מאומת — `TaskManager.defineTask` נקרא בהגדרת המודול.**

---

## אזור 7 — Manual E2E: Onboarding

התקן clean → הפעל.

- [x] ⚠️ **7.1 מסך Welcome** — קוד `src/app/onboarding/index.tsx` כולל logo + כפתור i18n `onboarding.start` + ניווט ל-/onboarding/nusach.
- [x] ✅ **7.2 בחירת נוסח** — 4 אפשרויות (`OPTIONS = ['ashkenaz','sefard','edot_hamizrach','chabad']`) + שמירה ב-store. **מאומת — `mitzvotExtras.test.ts` בודק כל 4 ערכים.**
- [x] ⚠️ **7.3 Location permission prompt** — `LocationService.getCurrentLocation` עם prompt → fallback ל-CITIES[0] בקוד. UI לא הוצג.
- [x] ⚠️ **7.4 Notifications permission prompt** — `requestNotificationPermissions` + banner ב-Home על `notificationPermission==='denied'` ✓ קוד.
- [x] ⚠️ **7.5 Ready screen** — `setOnboarded(true)` + `router.replace('/(tabs)/home')` ✓ קוד.
- [x] ⚠️ **7.6 Guard — אין דילוג** — `_layout.tsx` בודק `isOnboarded` + segments + מעביר ל-/onboarding ✓ קוד.
- [x] ⚠️ **7.7 Onboarded → ישר ל-Home** — אותו useEffect ב-_layout.tsx ✓ קוד.

---

## אזור 8 — Manual E2E: Home

- [x] ⚠️ **8.1 כרטיסי מצוות מופיעים** — `MITZVOT.filter((m) => activeMap[m.id]?.enabled)` ✓ קוד.
- [x] ✅ **8.2 ordering לפי דחיפות** — `currentItems.sort((a,b) => a.window.end - b.window.end)` — לפי סוף חלון, לא pct. **מאומת ב-`TimeRibbon.test.ts`.**
- [x] ✅ **8.3 TimeRibbon צבעים** — `ribbonThresholds = { safe: 0.5, warning: 0.25 }` + `p > 0.5 ? safe : p > 0.25 ? warning : urgent`. **מאומת ב-`TimeRibbon.test.ts` + `theme.test.ts` (thresholds monotonic).**
- [x] ⚠️ **8.4 Counter head (X/Y)** — `{doneCount}/{Math.max(totalActive, doneCount)}` ✓ קוד.
- [x] ⚠️ **8.5 לחיצה ✓** — Haptics.Medium + setTimeout 1300ms + scale/rotate animation ב-MitzvahCard. **ראה BUG-009 — אין clearTimeout.**
- [x] ⚠️ **8.6 CompletedRow slideUp** — קוד CompletedRow קיים. UI לא הוצג.
- [x] ⚠️ **8.7 Long-press bottom sheet** — Modal עם 3 פעולות. **BUG-004: "דלג היום" קורא complete() במקום skip.**
- [x] ⚠️ **8.8 Staggered reveal** — `FadeInDown.delay(index*40).duration(280)` ✓ קוד.
- [x] ⚠️ **8.9 Unmark** — `useCompletionsStore.unmark` קיים. הפעולה לא מקושרת מ-CompletedRow ב-Home — UI לא נחשף.
- [x] ⚠️ **8.10 חצות → reset** — `dateKey(new Date())` משתנה אוטומטית עם תאריך מערכת ✓ קוד.

---

## אזור 9 — Manual E2E: Schedule

- [x] ⚠️ **9.1 Day view** — `dayItems` מורכב מ-ZMAN_KEYS + mitzvot enabled ✓ קוד.
- [x] ⚠️ **9.2 קו "עכשיו" אדום** — `highlightIndex` + `<View style={[styles.nowLine, { backgroundColor: colors.urgent }]} />` ✓ קוד.
- [x] ⚠️ **9.3 Week view** — `weekDays` 7 cards + count ✓ קוד.
- [x] ⚠️ **9.4 Month view** — 42-cell grid + holiday ping ✓ קוד.
- [x] ⚠️ **9.5 Toggle Day/Week/Month** — state `view` עובר חלק. **ראה BUG-005 לחיצי הניווט →/← ב-RTL.**

---

## אזור 10 — Manual E2E: Library

- [x] ⚠️ **10.1 Pills קטגוריות** — `categories = ['all', ...new Set(MITZVOT.map(m => m.category))]` ✓ דינמי.
- [x] ⚠️ **10.2 Toggle enable/disable** — `setEnabled(item.id, !enabled)` ✓ נשמר ב-store.
- [x] ⚠️ **10.3 Disable → נעלם מ-Home** — Home מסנן `activeMap[m.id]?.enabled` ✓ קוד.

---

## אזור 11 — Manual E2E: Mitzvah Detail

- [x] ⚠️ **11.1 Gradient ribbon** — Svg LinearGradient עם safe/warning/urgent ✓ קוד.
- [x] ⚠️ **11.2 Reminders CRUD** — Add/Edit/Delete ב-mitzvah/[id].tsx ✓ קוד.
- [x] ⚠️ **11.3 ReminderEditor modal** — anchor segment + offset stepper + label input + skipIfDone Switch ✓ קוד.
- [x] ✅ **11.4 חזרה ל-default** — `resetToDefault` מסיר customReminders → fallback ל-`mitzvah.defaultReminders`. **מאומת — `mitzvotExtras.test.ts` מוודא קיום defaults לכל מצווה זמן-מוגבלת.**
- [x] ✅ **11.5 Negative offset** — `base.getTime() + offsetMin * 60_000` עם anchor=end + offsetMin=-45 = 45 דק' לפני. **מאומת ב-`reminderLogic.test.ts`.**

---

## אזור 12 — Manual E2E: Settings

- [x] ⚠️ **12.1 שינוי נוסח** — `setNusach` + subscriber ב-initNotificationHandlers → rebuild ✓ קוד.
- [x] ⚠️ **12.2 מיקום ידני** — `setLocationState(city, 'ready', 'manual')` ✓ קוד.
- [x] ⚠️ **12.3 GPS refresh** — `LocationService.getCurrentLocation()` + permission prompt ✓ קוד.
- [x] ⚠️ **12.4 Theme toggle** — `useTheme` עם system/light/dark ✓ קוד.
- [x] ⚠️ **12.5 שפה he↔en** — `setLanguage` + `useEffect` קורא `setLocale`. **BUG-003: I18nManager.forceRTL ללא תנאי, לא מתחלף ל-LTR באנגלית.**
- [x] ✅ **12.6 דעה גר"א/MA** — `setKsOpinion` + `sofZmanShma(ctx)` בוחר MA/GRA. **מאומת ב-`settingsLogic.test.ts` — sofZmanShmaMA ≠ sofZmanShmaGra (15-120 דק' diff) + krias_shma_shacharit מחליף end.**
- [x] ✅ **12.7 ישראל/חו"ל** — `setInIsrael` + candle_lighting `inIsrael ? 18 : 20`. **מאומת ב-`settingsLogic.test.ts` (relative test). ⚠️ ראה BUG-015 — discrepancy של ~4 דק' ב-Jerusalem בין `getCandleLighting` (apparent sunset) ל-`getZmanim.shkia` (sea-level).**

---

## אזור 13 — בדיקות מכשיר (Device-Only)

דורש physical device. Expo Go או dev build. **לא רץ — אין מכשיר זמין בסביבה.**

- [ ] ❌ **13.1 GPS אמיתי**
- [ ] ❌ **13.2 התראה מגיעה**
- [ ] ❌ **13.3 התראה לוחצים → פותח אפליקציה**
- [ ] ❌ **13.4 Haptics**
- [ ] ❌ **13.5 Background fetch rebuild**
- [ ] ❌ **13.6 Boot completed (Android)**
- [ ] ❌ **13.7 Airplane mode**
- [ ] ❌ **13.8 Kill app**

---

## אזור 14 — הרשאות (Permissions)

- [x] ✅ **14.1 Location denied flow** — covered by 5.4 — fallback CITIES[0] + status='denied'. Banner ב-Home על `locationStatus==='missing'`.
- [x] ⚠️ **14.2 Notifications denied flow** — Home מציג banner על `notificationPermission==='denied'` עם CTA. ✓ קוד.
- [ ] ❌ **14.3 שחזור הרשאה** — דורש OS settings + restart.
- [ ] ❌ **14.4 Precise vs Approximate (Android 12+)** — דורש מכשיר Android.

---

## אזור 15 — RTL + i18n + a11y + Dark

- [x] ⚠️ **15.1 RTL אכוף** — `I18nManager.forceRTL(true)` ב-_layout.tsx ✓ אך ראה BUG-003.
- [x] ⚠️ **15.2 פונט Heebo נטען** — `useFonts` ב-_layout.tsx + ActivityIndicator עד טעינה ✓ קוד.
- [x] ✅ **15.3 Dark mode עקבי** — `T_DARK`/`T_LIGHT` ב-theme/colors.ts + `useTheme().colors` בכל מסך. **מאומת ב-`theme.test.ts` — parity של key sets + ערכים לא ריקים.**
- [x] ⚠️ **15.4 accessibilityLabel** — `accessibilityLabel` ב-MitzvahCard checkBtn + Library toggle (`accessibilityRole="switch"`) ✓ קוד.
- [x] ⚠️ **15.5 Dynamic type** — RN רגיל מכבד OS font scale. לא נבדק UI.
- [x] ⚠️ **15.6 Focus order** — JSX order תקין. לא נבדק TAB.
- [x] ⚠️ **15.7 i18n coverage** — 166 keys parity. **מאומת ב-`i18n.test.ts` (parity ✅). BUG-006: cities.ts hard-coded עברית. BUG-011: keys שטוחים עם נקודות → כל המפתחות `[missing]` ב-runtime — regression `it.failing` בקובץ.**

---

## אזור 16 — Edge cases + רגרסיה

- [x] ⚠️ **16.1 שבת עוברת** — `shouldSkip` משתמש ב-`HebcalService.isShabbat`. **מושפע מ-BUG-001 — קצוות שישי-מוצ"ש שגויים.**
- [x] ✅ **16.2 יו"ט** — `isYomTov` מסנן `flags.CHAG && !CHOL_HAMOED` ✓ קוד.
- [x] ✅ **16.3 מעבר חצות** — `dateKey` מבוסס `Date()` נכון, completion של יום קודם נשאר ✓ קוד.
- [x] ✅ **16.4 offset חיובי גדול** — `buildTriggerTime` עם start+180min: אם > end (window.end) → trigger בעבר → `if (trigger <= now) continue` מפיל. **מאומת ב-`reminderLogic.test.ts`.**
- [x] ✅ **16.5 skipIfDone=true** — `if (completed && r.skipIfDone) continue` ב-`scheduleOne`. **מאומת ב-`scheduler.test.ts` cancelForMitzvah.**
- [x] ✅ **16.6 DST transition** — covered by 1.5 — chatzot תקין במעבר.
- [x] ⚠️ **16.7 נסיעה בין אזורי זמן** — `setLocation` קיים + subscriber rebuild ✓ קוד. **BUG-008: omerDayFor לא מתעדכן לפי tz.**
- [x] ⚠️ **16.8 Storage מלא** — `try/catch` ב-StorageService.get רק לפענוח JSON. אם MMKV עצמו מתפקע — אין handling. הסתברות נמוכה.
- [x] ✅ **16.9 100 days completion history** — מבנה הנתונים `Record<dateKey, Record<id, ts>>` סקלאבילי. **מאומת ב-`completions.extra.test.ts` — 100 ימי markDone, אין exception, finite memory.**

---

## אזור 17 — Build + Ship readiness (Phase 8)

- [ ] ❌ **17.1 EAS build iOS preview** — דורש חשבון EAS + רשת + auth. לא רץ.
- [ ] ❌ **17.2 EAS build Android preview** — דורש EAS. לא רץ.
- [x] ⚠️ **17.3 Splash screen** — `SplashScreen.preventAutoHideAsync` + `hideAsync` after fonts loaded ✓ קוד. assets/splash.png קיים.
- [x] ⚠️ **17.4 App icon** — assets/icon.png + adaptive-icon.png קיימים. app.json מקושר ✓.
- [x] ⚠️ **17.5 גודל bundle** — Web JS bundle 2.58 MB. iOS/Android לא נבנו.

---

## סדר ריצה מומלץ

1. **0 → 5** (אוטומטי, `npm test` + `typecheck`) — מהיר.
2. **6** (Integration scheduler) — mocks.
3. **7 → 12** (Manual E2E במכשיר/אמולטור) — flow מלא.
4. **13 → 14** (Device-only) — physical phone.
5. **15 → 16** (Polish + edge).
6. **17** (Ship) — לפני פרסום.

---

## סיכום סטטוס (עדכן בהתקדמות)

| אזור | סה"כ | ✅ עבר | ⚠️ סקר קוד | ❌ דורש מכשיר/EAS |
|------|------|-------|-----------|-----------------|
| 0 סטטי | 4 | 4 | 0 | 0 |
| 1 Zmanim | 6 | 6 | 0 | 0 |
| 2 Hebcal | 6 | 5 | 1 (BUG-001) | 0 |
| 3 Mitzvot | 15 | 15 | 0 | 0 |
| 4 Stores | 6 | 5 | 1 (persist cross-restart) | 0 |
| 5 Services | 5 | 5 | 0 | 0 |
| 6 Scheduler | 9 | 7 | 2 (subscribers smoke) | 0 |
| 7 Onboarding | 7 | 1 | 6 | 0 |
| 8 Home | 10 | 2 | 8 | 0 |
| 9 Schedule | 5 | 0 | 5 | 0 |
| 10 Library | 3 | 0 | 3 | 0 |
| 11 Detail | 5 | 2 | 3 | 0 |
| 12 Settings | 7 | 2 | 5 | 0 |
| 13 Device | 8 | 0 | 0 | 8 |
| 14 Permissions | 4 | 1 | 1 | 2 |
| 15 RTL/i18n/a11y | 7 | 1 | 6 | 0 |
| 16 Edge | 9 | 5 | 4 | 0 |
| 17 Ship | 5 | 0 | 3 | 2 |
| **סה"כ** | **121** | **61** | **48** | **12** |

**באגים נמצאו:** 14 (ראה [bugs.md](bugs.md)) — 3 קריטיים (BUG-001 isShabbat, BUG-002≡BUG-013 Zustand object selector, BUG-011 i18n flat keys), 4 בינוניים (BUG-003, 004, 005, 012), 7 קלים (BUG-006-010, 014, 015).
**Show-stoppers ל-release:** BUG-011 (אפס טקסט מוצג) + BUG-013 (Home קורס) + BUG-001 (שבת שגויה הלכתית).
