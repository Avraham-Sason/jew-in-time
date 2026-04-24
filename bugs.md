# bugs.md — באגים שנמצאו במהלך הריצה האוטומטית

תאריך: 2026-04-23. רץ Jest + typecheck + סקר קוד לאזורים 7-17.

חומרה: 🔴 קריטי · 🟠 בינוני · 🟡 קל

---

## 🔴 BUG-001 — `HebcalService.isShabbat` שגוי הלכתית ✅

**קובץ:** [src/services/HebcalService.ts:58-60](src/services/HebcalService.ts:58)
**נמצא ב:** test 2.4 + 6.6 + 16.1

```ts
isShabbat(date: Date): boolean {
  return date.getDay() === 6;
}
```

**בעיה:** `getDay() === 6` = יום שבת בלוח גרגוריאני בלבד. שבת ההלכתית מתחילה שישי אחרי שקיעה. כרגע:
- שישי בלילה אחרי shkia → `false` (אמור `true`)
- מוצ"ש אחרי tzeit → `true` (אמור `false`)

**השפעה:**
- `NotificationScheduler.shouldSkip` עם `skipOn:['shabbat']` (תפילין) — מתזמן התראות בליל שבת ולא מתזמן במוצ"ש.
- כל מצווה עם `skipOn:['shabbat']` נשברת בקצוות.

**תיקון מוצע:** קח shkia מ-ZmanimService של ערב שישי + tzeit של מוצ"ש והשתמש בהם. או הוסף פרמטר `loc: Location`.

---

## 🔴 BUG-002 — Selector של אובייקט ב-Zustand v5 בלי `shallow` (אומת Runtime: Maximum update depth) ✅

**קבצים:**
- [src/app/(tabs)/home.tsx:64-68](src/app/(tabs)/home.tsx:64) — `useUserStore((s) => ({ location, locationStatus, notificationPermission }))`
- [src/app/settings.tsx:29](src/app/settings.tsx:29) — `const user = useUserStore();`
- [src/app/mitzvah/[id].tsx:48](src/app/mitzvah/[id].tsx:48) — `const user = useUserStore();`
- [src/app/onboarding/location.tsx:17](src/app/onboarding/location.tsx:17) — `const user = useUserStore();`

**בעיה:** ב-Zustand v5, selector שמחזיר אובייקט חדש כל קריאה גורם re-render כל שינוי כלשהו ב-store. `useUserStore()` בלי selector מחזיר את כל ה-state — כל setX מסכן re-render.

**השפעה:** **קריטי — Home קורס** עם "Maximum update depth exceeded" (אומת ב-web preview, 2026-04-23). Stack: `forceStoreRerender → updateStoreInstance → commitHookEffectListMount`. לא רק ביצועים — האפליקציה לא ניתנת לשימוש. settings.tsx + mitzvah/[id].tsx + onboarding/location.tsx (`const user = useUserStore()` בלי selector) — לא קורסים כי מחזירים reference יציב לכל ה-state.

**תיקון מוצע:** השתמש ב-selectors נפרדים, או `useShallow` מ-`zustand/react/shallow`.

---

## 🟠 BUG-003 — `I18nManager.forceRTL(true)` ללא תנאי ✅

**קובץ:** [src/app/_layout.tsx:24-27](src/app/_layout.tsx:24)

```ts
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}
```

**בעיה:** מאלץ RTL גם אם המשתמש בחר אנגלית. test 12.5 + 15.7 דורשים מעבר RTL/LTR לפי שפה.

**השפעה:** באנגלית הטקסט יהיה אנגלי אבל הפריסה תהיה RTL — כפתורים, scroll, gestures הפוכים.

**תיקון מוצע:** קרא ל-`forceRTL(language === 'he')` ועשה `Updates.reloadAsync()` בעת מעבר.

---

## 🟠 BUG-004 — `home.tsx` "דלג היום" קורא `complete()` במקום skip ✅

**קובץ:** [src/app/(tabs)/home.tsx:246-251](src/app/(tabs)/home.tsx:246)

```ts
<SheetAction
  label={t('home.quick.skipToday')}
  onPress={() => { if (!selectedId) return; complete(selectedId); }}
/>
```

**בעיה:** "דלג היום" מסמן הושלם — לא מדלג. test 8.7 דורש 3 פעולות נפרדות.

**השפעה:** משתמש שלוחץ "דלג" יסומן כמי שביצע. סטטיסטיקה שגויה.

**תיקון מוצע:** הוסף `markSkipped` או דרגה שניה של completion ("skipped").

---

## 🟠 BUG-005 — Schedule arrows lookup labels (UX confusion) ✅

**קובץ:** [src/app/(tabs)/schedule.tsx:159-169](src/app/(tabs)/schedule.tsx:159)

```ts
<Pressable onPress={() => setCursor((prev) => shift(prev, view, -1))} ...>
  <Text>→</Text>
</Pressable>
... 
<Pressable onPress={() => setCursor((prev) => shift(prev, view, 1))} ...>
  <Text>←</Text>
</Pressable>
```

**בעיה:** ב-RTL זה הגיוני (→ הולך אחורה כי קוראים ימין-לשמאל), אבל אם אנגלית פעילה (LTR) זה הפוך. ראה גם BUG-003.

**השפעה:** באנגלית או RTL+LTR mixed: ניווט יום הפוך ממה שהמשתמש חושב.

**תיקון מוצע:** בחר אייקון לפי `language === 'he'`.

---

## 🟡 BUG-006 — `cities.ts` שמות עיר רק בעברית ✅

**קובץ:** [src/data/cities.ts:3-24](src/data/cities.ts:3)

**בעיה:** כל ה-`name` בעברית. כש-`language === 'en'`, ה-Home/Settings מציגים את שם העיר בעברית בתוך טקסט אנגלי.

**השפעה:** עקביות UX באנגלית. test 15.7 (i18n coverage) — נכשל.

**תיקון מוצע:** הוסף `nameEn?: string` לכל עיר ובחר ב-Home/Settings לפי שפה.

---

## 🟡 BUG-007 — `NotificationScheduler.scheduleAll` לא חוסם הרצה מקבילה ✅

**קובץ:** [src/services/NotificationScheduler.ts:116-135](src/services/NotificationScheduler.ts:116)

**בעיה:** אין lock/mutex. שני `rebuild()` מקבילים (subscriber location + nusach בו-זמנית) → race: שניהם מנקים, שניהם מתזמנים → התראות כפולות.

**השפעה:** ייתכנו התראות כפולות, או חורגים מ-IOS_MAX=64. test 6.7.

**תיקון מוצע:** הוסף `private inFlight: Promise<void> | null` ו-`if (inFlight) return inFlight`.

---

## 🟡 BUG-008 — `omerDayFor` מתעלם מ-timezone ✅

**קובץ:** [src/data/mitzvot.ts:26-35](src/data/mitzvot.ts:26)

**בעיה:** מחשב לפי `Date.now()` UTC. בנסיעה בין tz, יום-העומר עלול לקפוץ ב-±1.

**השפעה:** דק בקצוות יום (לפני tzeit/אחרי chatzot). edge case.

**תיקון מוצע:** העבר את ה-date דרך `DateTime.fromJSDate(...).setZone(loc.tz)` לפני חישוב `start/end`.

---

## 🟡 BUG-009 — `home.tsx` `complete()` setTimeout לא מבוטל ב-unmount ✅

**קובץ:** [src/app/(tabs)/home.tsx:137-146](src/app/(tabs)/home.tsx:137)

**בעיה:** `setTimeout(... 1300)` בלי `clearTimeout`. אם המסך נסגר תוך כדי stamp → `setStampingId(null)` רץ אחרי unmount → React warning.

**השפעה:** אזהרת קונסולה. לא קריסה.

**תיקון מוצע:** שמור id ב-ref + cleanup ב-`useEffect`.

---

## 🟡 BUG-010 — `nextWindowFor` ב-mitzvah/[id] לא מסונכרן עם re-render ✅

**קובץ:** [src/app/mitzvah/[id].tsx:24-40, 57](src/app/mitzvah/[id].tsx:24)

**בעיה:** `window = nextWindowFor(params.id)` נקרא בכל render בלי `useMemo`. כל render מבצע 2× ZmanimService.getZmanim — חישוב יקר.

**השפעה:** ביצועים במסך פרטים.

**תיקון מוצע:** עטוף ב-`useMemo` עם תלות ב-`location, nusach, halachicOpinions, inIsrael, params.id`.

---

## הערות לאזורים שלא נבדקו אוטומטית

- **Zone 7-12 Manual E2E:** דורש מכשיר/אמולטור או webapp-testing skill.
- **Zone 13 Device-only:** דורש physical phone.
- **Zone 14 Permissions runtime:** דורש מכשיר.
- **Zone 17 EAS builds:** דורש חשבון EAS + רשת.

הקוד מבחינה סטטית כתוב נכון בכל המסכים — הבאגים לעיל הם הליקויים האמיתיים שנתפסו בסקר.

---

## 🔴 BUG-011 — i18n keys שטוחים, i18n-js צריך nested → כל המחרוזות "[missing X translation]" ✅

**קבצים:**
- [src/i18n/he.json](src/i18n/he.json) — 166 מפתחות עם נקודה בשם, כגון `"onboarding.welcomeTitle": "..."`
- [src/i18n/en.json](src/i18n/en.json) — אותו מבנה

**בעיה:** `i18n-js` מפענח dot-notation כ-nesting. כשקוראים `t('onboarding.welcomeTitle')` הספרייה מחפשת `he.onboarding.welcomeTitle` במבנה nested (`{ onboarding: { welcomeTitle: ... } }`), אך ה-JSON מכיל key flat בשם `"onboarding.welcomeTitle"`. תוצאה: **כל מחרוזת t() באפליקציה חוזרת `[missing "he.<key>" translation]`**.

**אומת ב-Runtime (web preview, 2026-04-23):** Welcome / Nusach / Location / Settings / Library / Mitzvah Detail — כולם זרועים ב-`[missing ...]` במקום טקסט.

**השפעה:** האפליקציה לא יכולה לצאת לפרסום. המשתמש רואה "[missing he.onboarding.start translation]" בכפתור הראשי.

**תיקון מוצע:** או (א) הסב את שני קבצי ה-JSON ל-nested objects (`{ "onboarding": { "welcomeTitle": "..." } }`), או (ב) הוסף `i18n.missingBehavior = 'guess'` + עטוף את `t()` להמיר dot-keys לפני lookup, או (ג) שנה ל-`i18n.translations.he['onboarding.welcomeTitle']` בעזרת `defaultTranslations` API. הכי נקי — (א).

**בדיקת רגרסיה:** הוסף test שקורא `t('onboarding.welcomeTitle')` ומוודא שלא מחזיר מחרוזת שמתחילה ב-`[missing`.

---

## 🟠 BUG-012 — `<Stack.Screen name="onboarding" />` מצביע על route group שלא קיים ✅

**קובץ:** [src/app/_layout.tsx:63](src/app/_layout.tsx:63)

```tsx
<Stack.Screen name="onboarding" />
```

**בעיה:** הקבצים תחת `src/app/onboarding/` הם `index/nusach/location/ready` — expo-router מציב אותם כ-`onboarding/index`, `onboarding/nusach` וכו'. אין route בשם flat `onboarding`. בקונסולה: `[Layout children]: No route named "onboarding" exists in nested children: index,settings,_sitemap,+not-found,(tabs),mitzvah/[id],onboarding/index,onboarding/location,onboarding/nusach,onboarding/ready`.

**השפעה:** Warning בקונסולה בכל render. הפונקציונליות עובדת כי expo-router auto-discover. רעש בקונסולה.

**תיקון מוצע:** הסר את ה-`<Stack.Screen name="onboarding" />`, או הוסף `src/app/onboarding/_layout.tsx` עם `<Stack />` משלו.

---

## 🔴 BUG-013 — Maximum update depth exceeded ב-Home (פועל יוצא של BUG-002) ✅

**קובץ:** [src/app/(tabs)/home.tsx:64-68](src/app/(tabs)/home.tsx:64)

**בעיה:** `useUserStore((s) => ({ location: s.location, locationStatus: s.locationStatus, notificationPermission: s.notificationPermission }))` — selector מחזיר אובייקט חדש בכל קריאה. Zustand v5 משתמש ב-`useSyncExternalStore`; כש-snapshot מחזיר ref חדש, React מבצע forceStoreRerender → snapshot שונה שוב → loop אינסופי.

**אומת:** "Uncaught Error: Maximum update depth exceeded" עם stack `forceStoreRerender → updateStoreInstance → commitHookEffectListMount` (web preview, 2026-04-23).

**השפעה:** **Home קורס מיד עם פתיחה.** האפליקציה לא ניתנת לשימוש לאחר onboarding.

**תיקון מוצע:**
```tsx
import { useShallow } from 'zustand/react/shallow';
const { location, locationStatus, notificationPermission } = useUserStore(
  useShallow((s) => ({ location: s.location, locationStatus: s.locationStatus, notificationPermission: s.notificationPermission }))
);
```
או 3 selectors נפרדים: `const location = useUserStore(s => s.location); ...`.

---

## 🟡 BUG-014 — טאב "index" מוצג בלי כוונה ב-BottomTabs ✅

**קובץ:** [src/app/(tabs)/_layout.tsx:18-22](src/app/(tabs)/_layout.tsx:18)

**בעיה:** `<Tabs.Screen name="home/schedule/library" />` הוצהרו אך `(tabs)/index.tsx` לא — expo-router auto-discover שלו ומוסיף עוד טאב בשם "index" בסוף ה-BottomTabs.

**אומת:** Screenshot מ-/(tabs)/schedule מציג 4 פריטי טאב (home/schedule/library + index).

**השפעה:** UX — המשתמש רואה טאב מיותר בלי label תקני.

**תיקון מוצע:**
```tsx
<Tabs.Screen name="index" options={{ href: null }} />
```
או החלף את index.tsx ב-redirect ב-`_layout.tsx` `initialRouteName`.

---

## 🟡 BUG-015 — `getCandleLighting` משתמש ב-`getSunset()` בעוד `getZmanim.shkia` משתמש ב-`getSeaLevelSunset()` ✅

**קובץ:** [src/services/ZmanimService.ts:42 vs 61](src/services/ZmanimService.ts:42)

```ts
// line 42 (getZmanim):
const sunset = cal.getSeaLevelSunset();
// ...
shkia: toDate(sunset),

// line 61 (getCandleLighting):
const shkia = toDate(cal.getSunset());
```

**בעיה:** `getSeaLevelSunset()` מחשב שקיעה כאילו אין הרים (sea-level), `getSunset()` מתחשב בגובה (apparent). בירושלים (`elevation: 754`) ההפרש ~4 דקות. כל המצוות שמסתמכות על `zmanim.shkia` (מנחה end, תפילין end דרך לכאורה) פועלות לפי sea-level, אבל הדלקת נרות חישבה לפי apparent — נוצר offset לא עקבי.

**אומת:** test 12.7 הראשוני נכשל עם הפרש של 259519ms (=4.3min) בירושלים.

**השפעה:** משתמש בירושלים — הדלקת נרות 4 דקות מאוחר ממה שצפוי לפי שקיעה במצוות אחרות. ב-elevation גבוה יותר (Aspen, Denver) ההפרש מתעצם.

**תיקון מוצע:** בחר עקביות אחת לכל הקובץ. ב-Israel המנהג הוא לרוב לפי sea-level לזמני halacha; הדלקת נרות לפי apparent שקיעה היא חומרה. אם החלטה — הוסף הערה ב-code. אחרת:
```ts
const shkia = toDate(cal.getSeaLevelSunset()); // עקבי עם getZmanim
```

---

## סיכום סטטיסטי לאחר בדיקות runtime

| חומרה | כמות | באגים |
|-------|------|-------|
| 🔴 קריטי | 3 | BUG-001, BUG-002 (=BUG-013), BUG-011 |
| 🟠 בינוני | 4 | BUG-003, BUG-004, BUG-005, BUG-012 |
| 🟡 קל | 7 | BUG-006, BUG-007, BUG-008, BUG-009, BUG-010, BUG-014, BUG-015 |
| **סה"כ** | **14** | |

**Show-stoppers ל-release:** BUG-011 (אין שום טקסט) + BUG-013 (Home קורס) + BUG-001 (שבת שגויה הלכתית).
