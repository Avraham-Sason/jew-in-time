# תכנון אפליקציה — "יהודי כשר"

## Context

אפליקציה לסידור יומיומי של מצוות ומנהגים יהודיים דרך מערכת התראות חכמה. המשתמש בוחר מצוות מרשימה, האפליקציה מחשבת זמני הלכה מדויקים לפי מיקום ונוסח, ושולחת התראות בזמנים הנכונים. אם המשתמש לא סימן שביצע — תזכורת חוזרת עד סוף הזמן ההלכתי.

**בעיה שפותרים**: שומרי מצוות מפסידים זמנים/מצוות בגלל שכחה או חוסר מעקב אחר הזמנים ההלכתיים המשתנים.

**תוצאה מבוקשת**: יהודי שפותח את האפליקציה בבוקר יודע בדיוק איזה מצוות הוא צריך לעשות היום, מקבל התראות מותאמות, ומסמן תוך כדי יום מה הוא כבר עשה.

---

## החלטות טכנולוגיות עיקריות

| תחום | בחירה | סיבה |
|------|--------|------|
| **פלטפורמה** | React Native + **Expo** (managed workflow) | קוד אחד ל-iOS+Android, תחושת נייטיב, EAS Build להעלאה לחנויות, expo-notifications מטפל בהתראות מקומיות native |
| **Navigation** | React Navigation (Bottom Tabs + Native Stack) | סטנדרט בתעשייה, ביצועים native |
| **State** | Zustand + MMKV (`react-native-mmkv`) | MMKV הכי מהיר ל-persistence, Zustand פשוט ומהיר |
| **זמנים הלכתיים** | `kosher-zmanim` (npm) — פורט JS של KosherJava | עובד offline, מדויק ברמת ייצור, הסטנדרט בעולם הזה |
| **לוח עברי** | `@hebcal/core` | פרשת שבוע, חגים, ראש חודש, דף יומי, ספירת העומר, חוק לישראל |
| **מיקום** | `expo-location` (GPS) + fallback לבחירת עיר ידנית | זמנים חייבים להיות לפי קו רוחב/אורך |
| **התראות** | `expo-notifications` (local only) + `expo-task-manager` לתזמון יומי | ללא backend, הכל local |
| **RTL / i18n** | `I18nManager.forceRTL(true)` + `i18n-js` | עברית ראשית, אנגלית אופציונלית |
| **Backend** | **אין** — הכל local | MMKV לנתוני משתמש, KosherZmanim+Hebcal מחשבים לוקאלית |

---

## כיוון עיצובי

**קונספט**: "סידור מואר" מפגש מודרני — מסורת איקונית נפגשת עם iOS נקי. לא גנרי, לא "בוטסטרפי".

- **פלטה**: קלף חם (#F4EBD9) כרקע, כחול-כהה עמוק (#1E2A4A) לטקסט, זהב עמום (#B08D3F) להדגשות, ובורדו (#7B1E2A) ל-CTA ואירועים דחופים. Dark mode: לילה כחלחל (#0D1429) עם זהב.
- **טיפוגרפיה**: **Frank Ruhl Libre** לכותרות (serif עברי קלאסי), **Assistant** לגוף טקסט (sans-serif נקי), **Heebo** למספרים.
- **מיקרו-אינטראקציות**: כאשר מסמנים מצווה כבוצעה — stamp animation של "נעשה" מוטבע בזהב. Staggered reveal בטעינת הרשימה. Long-press → פעולות מהירות.
- **ייחודיות**: כל מצווה מקבלת **ribbon אינדיקטור זמן** — פס אופקי מתמלא ככל שזמן המצווה מתקצר (ירוק → כתום → אדום), ויזואליזציה ייחודית לזמני הלכה.

---

## מודל הנתונים — סוגי מצוות

חלוקה לפי **סוג חלון זמן**:

```ts
type TimeType =
  | 'fixed-moment'       // רגע בודד, לדוג' ברכת הלבנה
  | 'range-within-day'   // בין שני זמנים הלכתיים, לדוג' תפילין (משיכיר→שקיעה), שחרית (נץ→סוף זמן תפילה)
  | 'all-day'            // כל היום, לדוג' ציצית
  | 'sunset-trigger'     // נכנס בשקיעה, לדוג' כניסת שבת
  | 'date-range'         // טווח ימים עם זמן בתוך היום, לדוג' ספירת העומר (49 ימים, מצה"כ)
  | 'monthly-window'     // חלון חודשי, לדוג' קידוש לבנה (מ-3 לחודש עד 15)
  | 'annual-seasonal'    // פעם בשנה, לדוג' ברכת האילנות (ניסן בלבד)
```

**Mitzvah Registry** — רשימת מצוות מוגדרת בקובץ סטטי `src/data/mitzvot.ts`, כל אחת:

```ts
{
  id: 'tefillin',
  name: { he: 'הנחת תפילין' },
  icon: 'tefillin-svg',
  timeType: 'range-within-day',
  category: 'daily-morning',
  computeWindow(date, location, settings) {
    const zmanim = new ComplexZmanimCalendar(location);
    zmanim.setDate(date);
    return { start: zmanim.getMisheyakir(), end: zmanim.getSunset() };
  },
  defaultReminders: [
    { anchor: 'start', offsetMin: 0,   label: 'הגיע זמן הנחת תפילין' },
    { anchor: 'start', offsetMin: 180, label: 'תזכורת — עדיין לא הנחת תפילין', skipIfDone: true },
    { anchor: 'end',   offsetMin: -45, label: 'נותרה שעה להנחת תפילין',        skipIfDone: true },
  ],
  skipOn: ['shabbat', 'yomtov'],
  nuschaotSupported: ['ashkenaz','sefard','edot_hamizrach','chabad'],
}
```

**מצוות ל-MVP** (סלקציה, רחיב בהמשך):
- יומיות: תפילין, ציצית, ק"ש, שחרית, מנחה, ערבית, ברכות השחר, ברכת המזון
- שבועיות: כניסת שבת, הדלקת נרות, הבדלה
- חודשיות: ראש חודש, קידוש לבנה, ברכת החודש
- טווח תאריכים: ספירת העומר (מזמן המעריב עד עלוה"ש), עשרת ימי תשובה, חנוכה
- עונתי: ברכת האילנות (ניסן), מחצית השקל, מגילה, מצה, ד' מינים
- לימוד יומי: דף היומי, חוק לישראל, הלכה יומית

---

## ארכיטקטורת ההתראות

**מנוע תזמון** (`src/services/NotificationScheduler.ts`):
1. **Daily rebuild** — כל יום ב-00:15 (background task), מחיקת כל ההתראות המתוזמנות ובנייה מחדש ל-48 שעות קדימה.
2. לכל מצווה פעילה של המשתמש: חשב `window` ליום → לכל `reminder` חשב `triggerTime` → `Notifications.scheduleNotificationAsync`.
3. כאשר משתמש מסמן מצווה כ-✓ → מחיקת התראות עתידיות עם `skipIfDone` של אותה מצווה באותו יום.
4. כשמשתמש משנה הגדרות/מיקום → triggerים rebuild מיידי.

**מבנה התראה**:
```ts
{
  identifier: `${mitzvahId}__${YYYY-MM-DD}__${reminderIndex}`,
  content: { title, body, data: { mitzvahId, windowEnd } },
  trigger: { date: Date }
}
```

**הרשאות**: בהתקנה ראשונה מסך onboarding מבקש notifications + location, מסביר למה.

---

## מסכים (UI)

### Bottom Tabs (3)

**1. בית (ראשי) — `HomeScreen`**
- כותרת: תאריך עברי + לועזי, פרשת שבוע.
- **"כעת רלוונטי"** — כל המצוות שבתוך החלון שלהן ברגע זה, ממוינות לפי כמה נשאר.
- כל כרטיס: שם מצווה, ribbon זמן (ירוק/כתום/אדום), זמן שנשאר, כפתור ✓ גדול.
- Swipe-to-complete, long-press לפרטים.
- כרטיס "הבא בתור" — מצווה קרובה שעוד לא נכנסה לחלון.

**2. לוח זמנים — `ScheduleScreen`**
- Toggle: יום / שבוע / חודש.
- **יום**: timeline אנכי מזריחה לשקיעה, מצוות ממוקמות לפי החלון שלהן.
- **שבוע**: 7 עמודות, indicatorים קטנים.
- **חודש**: קלנדר עברי (grid), פינג על ימים עם אירועים מיוחדים (ר"ח, חגים).
- לחיצה על מצווה → sheet עם פרטים, נוסח תפילה/ברכה, כפתור ✓.

**3. מצוות שלי — `MitzvotLibraryScreen`**
- Tabs עליונים: "פעילות" / "זמינות להוספה".
- Categories: יומית / שבועית / חודשית / עונתית / לימוד.
- כל שורה: שם, איקון, badge "פעיל", toggle הפעלה.
- לחיצה → `MitzvahSettingsScreen`:
  - On/Off
  - **רשימת התראות** — כל reminder עם anchor, offset, label. כפתור ➕ להוסיף, swipe למחוק.
  - Preview: "ההתראה הבאה תשלח ב-15:42 מחר".
  - נוסח (אם רלוונטי למצווה).
  - הערות אישיות.

### מסכי עזר
- **Onboarding** (פעם ראשונה): ברוכים הבאים → בחירת נוסח → אישור מיקום → אישור התראות → בחירה מהירה של 5 מצוות מומלצות.
- **הגדרות**: נוסח, מיקום (GPS/ידני), ארץ/חו"ל, דעות הלכתיות (מגן אברהם/גר"א לזמן ק"ש), theme, שפה.

---

## מבנה קבצים

```
src/
  app/
    _layout.tsx              # Tab navigator root
    home.tsx
    schedule.tsx
    library.tsx
    settings.tsx
    onboarding/
    mitzvah/[id].tsx         # הגדרות מצווה בודדת
  components/
    MitzvahCard.tsx
    TimeRibbon.tsx           # הויזואליזציה של חלון הזמן
    ReminderEditor.tsx
    HebrewDate.tsx
  data/
    mitzvot.ts               # Registry של כל המצוות
    nuschaot.ts              # הגדרות נוסחים
  services/
    ZmanimService.ts         # wrapper סביב kosher-zmanim
    HebcalService.ts         # wrapper סביב @hebcal/core
    NotificationScheduler.ts # המוח של ההתראות
    LocationService.ts
    StorageService.ts        # MMKV wrapper
    CompletionService.ts     # סימוני ✓
  stores/
    useUserStore.ts          # Zustand
    useMitzvotStore.ts
    useCompletionsStore.ts
  theme/
    colors.ts
    typography.ts
    tokens.ts
  i18n/
    he.json
    en.json
  types/
    mitzvah.ts
    zmanim.ts
```

---

## תוכנית פיתוח (Phases)

**Phase 0 — Bootstrap**
- `npx create-expo-app`, התקנות, הגדרת EAS, RTL, fonts, theme.

**Phase 1 — מנוע הזמנים**
- `ZmanimService` עם kosher-zmanim. Unit tests על 3-4 ערים ישראליות/ארה"ב.
- `HebcalService` — תאריך עברי, פרשה, חגים, דף יומי, סה"ע.

**Phase 2 — Registry מצוות (MVP: 10 מצוות)**
- `src/data/mitzvot.ts` עם פונקציות computeWindow.
- נוסחים שונים → דעות חישוב שונות.

**Phase 3 — Storage + Stores**
- MMKV, Zustand stores, helpers.

**Phase 4 — UI Core**
- Tabs + Onboarding + HomeScreen עם mock data.
- MitzvahCard + TimeRibbon (the signature element).

**Phase 5 — Schedule + Library screens**

**Phase 6 — NotificationScheduler**
- scheduling + rebuild יומי + תגובה לסימון ✓.

**Phase 7 — Polish**
- אנימציות (stamp, staggered reveal), dark mode, a11y, תרגומים.

**Phase 8 — Build & Ship**
- EAS Build, TestFlight, Play Console internal track.

---

## קבצים קריטיים ליצירה

- `src/services/ZmanimService.ts` — לב המערכת לחישובי זמנים
- `src/services/NotificationScheduler.ts` — המוח שמחבר בין מצוות→זמנים→התראות
- `src/data/mitzvot.ts` — Registry של המצוות ופונקציות computeWindow
- `src/components/TimeRibbon.tsx` — הרכיב החתימתי של ה-UI
- `src/app/mitzvah/[id].tsx` — מסך הגדרת התראות למצווה

---

## ספריות עיקריות

```json
{
  "expo": "~SDK latest",
  "expo-router": "*",
  "expo-notifications": "*",
  "expo-location": "*",
  "expo-task-manager": "*",
  "expo-background-fetch": "*",
  "expo-font": "*",
  "react-navigation": "*",
  "zustand": "*",
  "react-native-mmkv": "*",
  "kosher-zmanim": "*",
  "@hebcal/core": "*",
  "luxon": "*",
  "react-native-reanimated": "*",
  "react-native-gesture-handler": "*",
  "react-native-svg": "*",
  "i18n-js": "*"
}
```

---

## Verification (איך בודקים שעובד)

1. **Zmanim accuracy**: הרצת unit tests להשוות את kosher-zmanim שלנו מול MyZmanim/Hebcal לעיר ירושלים, ת"א, ניו יורק ב-3 תאריכים שונים. סטייה <1 דקה = pass.
2. **Notification timing**: שנה את הזמן במכשיר, הפעל מצב "simulation", וודא שההתראה המדומה יוצאת בזמן הצפוי.
3. **End-to-end ביד**: התקן build על iPhone אמיתי, בחר "תפילין", הגדר התראה +0 מתחילת החלון. המתן → צריכה להגיע התראה. סמן ✓ → התראות המשך מתבטלות.
4. **שבת**: וודא שמצוות עם `skipOn: ['shabbat']` לא שולחות התראה בשבת.
5. **מעבר יום**: בדוק שב-00:15 בלילה ה-daily rebuild רץ והתראות מחר מתוזמנות.
6. **שינוי מיקום**: שנה GPS → וודא שזמני המחר מתעדכנים.
7. **Offline**: כבה אינטרנט → כל החישובים חייבים לעבוד (KosherZmanim+Hebcal local).

---

## נקודות שאולי נרצה לדון בהן אחרי MVP

- חשבון משתמש אופציונלי לסנכרון בין מכשירים (אם הרבה ביקוש)
- Widget ל-iOS/Android home screen
- Apple Watch companion
- קהילה/חברים — לראות מי עוד מתפלל עכשיו
- שילוב סידור דיגיטלי מלא
- התראות חכמות יותר (הנשארים 15 דקות לשקיעה יום שישי → "תדליק נרות!")
