# משימות — שדרוג "יהודי בזמן"

מבוסס על תכנית `C:\Users\avrah\.claude\plans\luminous-dancing-sifakis.md`. שלב A הושלם חלקית (`app.json` ושדות types). שאר המשימות פתוחות, ממוינות לפי תלות וחשיבות.

## High Priority

- [x] ✅ בדיקת נכסי גרפיקה לטקסט צרוב "יהודי כשר"
  **מה זה:** סקירה ויזואלית של `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash.png` כדי לוודא ששם האפליקציה הישן לא מופיע בתוך התמונות. אם כן — להחליף בנכסים מעודכנים עם "יהודי בזמן".
  **מה זה פותר:** שינוי שם האפליקציה ב-`app.json` משנה רק את המטא-דאטה; טקסט בתוך לוגו או splash יישאר ויסתור את המיתוג החדש.
  **תוצאה צפויה:** הרצה מקומית של `npm run start:dev` מציגה רק "יהודי בזמן" ב-launcher, ב-Splash ובאייקון; אפס מופעים של השם הישן בתמונות.

- [x] ✅ עדכון מחרוזות i18n שמכילות את שם האפליקציה
  **מה זה:** סריקה של `i18n/he.json` ו-`i18n/en.json` למפתחות שמכילים "יהודי כשר" / "Jew In Time" (למשל `appName`, hero של onboarding, About). החלפה ל-"יהודי בזמן" / שווה-ערך באנגלית.
  **מה זה פותר:** משלים את מהלך שינוי השם — בלי זה מסכי onboarding/about יציגו מותג סותר.
  **תוצאה צפויה:** grep ב-`src/i18n/` לא מחזיר את השם הישן; כל המסכים שטוענים מפתחות הללו מציגים את החדש.

- [x] ✅ הוספת `pickBodyForReminder` ב-`NotificationScheduler.ts`
  **מה זה:** פונקציה חדשה שמחזירה body להתראה: בוחרת variant מ-`r.bodyVariants` לפי `Math.floor(triggerMs / 86_400_000) % variants.length` עם fallback ל-`r.label`. אם `r.includeContentInBody === true` — משרשרת את `mitzvah.contentBlocks` (סוגי text/blessing) מתחת ל-variant.
  **מה זה פותר:** הבסיס לשתי תכונות — ניסוחי תזכורת מתחלפים, ותוכן עשיר (ברכה) בתוך גוף ההתראה.
  **תוצאה צפויה:** קריאות עם אותו `trigger`+`bodyVariants` מחזירות variant זהה (דטרמיניסטי). variants ריקים → label הקיים. `includeContentInBody` עם contentBlocks → body כולל את התוכן.

- [x] ✅ חיבור `pickBodyForReminder` ל-`scheduleOne`
  **מה זה:** ב-`src/services/NotificationScheduler.ts` שורות 115–131, להחליף `body: r.label` ב-`body: pickBodyForReminder(r, mitzvah, trigger)`. להוסיף ל-`data` את השדה `fullContent: mitzvah.contentBlocks ?? null` לטובת תצוגה מורחבת בעת פתיחת ההתראה.
  **מה זה פותר:** מעביר את הלוגיקה החדשה לפעולה — לא יהיה השפעה על המאגר עד שמצוות יקבלו `bodyVariants`.
  **תוצאה צפויה:** התראות שנקבעות עם `Reminder.bodyVariants` מציגות את ה-variant הנכון; התראות בלי השדה ממשיכות להציג את `label` כמקודם.

- [x] ✅ טסט יחידה ל-`pickBodyForReminder`
  **מה זה:** קובץ חדש `src/services/__tests__/NotificationScheduler.bodyVariants.test.ts` עם שני טסטים: (1) Reminder עם 3 variants, triggers ב-2026-05-06/07/08 → אינדקסים 0/1/2. (2) שני קריאות באותו trigger → אותו variant.
  **מה זה פותר:** מאמת את החוזה הדטרמיניסטי שעליו מסתמכת תכונת הטקסט המתחלף.
  **תוצאה צפויה:** `npm test -- bodyVariants` עובר.

- [x] ✅ אכלוס `bodyVariants` למצוות תפילה במאגר
  **מה זה:** ב-`src/data/mitzvot.ts`, להוסיף שדה `bodyVariants` לתזכורות של ערבית, שחרית, ומנחה. דוגמה לערבית: `['צדיק, זמן ערבית הגיע', 'תפילת ערבית 15 דקות ויש לך מצווה', 'זמן ערבית — מעמדך מול הקב״ה']`. נוסחים מקבילים לשחרית/מנחה בסגנון אישי.
  **מה זה פותר:** מימוש מוחשי של דרישת המשתמש לטקסטים מתחלפים בתפילות היומיות הכי נצפות.
  **תוצאה צפויה:** התראות ערבית/שחרית/מנחה מציגות אחד מ-3 ניסוחים בסבב יומי דטרמיניסטי; הקיים נשאר תקין למצוות אחרות.

- [x] ✅ אכלוס `contentBlocks` לספירת העומר עם `includeContentInBody`
  **מה זה:** ב-`src/data/mitzvot.ts`, למצוות ספירת העומר להוסיף `contentBlocks: [{ type: 'blessing', he: 'ברוך אתה ה׳ אלוקינו מלך העולם אשר קדשנו במצוותיו וצוונו על ספירת העומר' }]`. בתזכורת הראשית של המצווה לסמן `includeContentInBody: true`.
  **מה זה פותר:** מימוש דרישת המשתמש שהברכה תופיע בהתראה עצמה.
  **תוצאה צפויה:** התראת ספירת העומר מציגה את הברכה בגוף ההתראה (תחת ה-variant/label); תצוגה ב-iOS+Android לא נחתכת לפני סיום הברכה.

- [x] ✅ הרחבת `customMitzvotAdapter` להעתקת `contentBlocks`
  **מה זה:** ב-`src/data/customMitzvotAdapter.ts`, פונקציית `customToMitzvah()` תעתיק את `contentBlocks` מקלט `CustomMitzvah` לפלט `Mitzvah`.
  **מה זה פותר:** מצוות מותאמות אישית של המשתמש יוכלו גם הן לשאת תוכן עשיר.
  **תוצאה צפויה:** יצירת custom-mitzvah עם contentBlocks → אובייקט Mitzvah המוחזר ב-`getAllMitzvot()` כולל את אותם contentBlocks.

- [x] ✅ רישום קטגוריית התראות `mitzvah_reminder`
  **מה זה:** ב-`src/services/NotificationScheduler.ts`, פונקציית `initNotificationHandlers` (שורה ~265): אחרי `ensureAndroidChannel()` הקיים, קריאה ל-`Notifications.setNotificationCategoryAsync('mitzvah_reminder', [{ identifier: 'MARK_DONE', buttonTitle: 'עשיתי', options: { opensAppToForeground: false } }])` בתוך try/catch (web shim זורק).
  **מה זה פותר:** מגדיר את הפעולה "עשיתי" ברמת ה-OS כך שכפתור יוצג בהתראות.
  **תוצאה צפויה:** ב-iOS swipe על התראה מציג כפתור "עשיתי"; ב-Android long-press מציג את הפעולה. ב-web אין שגיאות הרצה.

- [x] ✅ הוספת `categoryIdentifier` בכל קריאה ל-`scheduleNotificationAsync`
  **מה זה:** ב-`scheduleOne` שורות 115–131, להוסיף לתוך `content` את `categoryIdentifier: 'mitzvah_reminder'`.
  **מה זה פותר:** מקשר כל התראה לקטגוריה שהוגדרה — בלי זה הכפתור לא יופיע.
  **תוצאה צפויה:** כל התראה חדשה שמתוזמנת נושאת categoryIdentifier; ה-OS מציג את הפעולה.

- [x] ✅ יצירת `notificationResponseHandler.ts`
  **מה זה:** קובץ חדש `src/services/notificationResponseHandler.ts` שמייצא `initNotificationResponseHandler(): Subscription`. רושם listener דרך `Notifications.addNotificationResponseReceivedListener`. כש-`actionIdentifier === 'MARK_DONE'`, חולץ `mitzvahId` ו-`dateKey` מ-`response.notification.request.content.data`, פרסור התאריך ל-`Date`, וקריאה ל-`useCompletionsStore.getState().markDone(mitzvahId, date)` ואז `NotificationScheduler.cancelForMitzvah(...)`.
  **מה זה פותר:** מבצע את הסימון "ביצעתי" בלי שהמשתמש יפתח את האפליקציה.
  **תוצאה צפויה:** הקשה על "עשיתי" מתוך ההתראה מעדכנת את הסטור; עדכון ה-store מפעיל subscription קיים שמריץ rebuild → ההתראות הבאות עבור אותה מצווה בטלות (אם `skipIfDone`).

- [x] ✅ חיווט `notificationResponseHandler` ב-`_layout.tsx`
  **מה זה:** ב-`src/app/_layout.tsx` בתוך `RootInner`, useEffect שקורא ל-`initNotificationResponseHandler()` ב-mount ומחזיר `sub.remove()` ב-cleanup. אחרי ה-`initNotificationHandlers()` הקיים.
  **מה זה פותר:** הפעלה בפועל של ה-listener; בלי החיווט הקובץ לא רץ.
  **תוצאה צפויה:** לוג mount-once ב-DEV; הקשה על "עשיתי" משפיעה על הסטור.

- [x] ✅ טסט יחידה ל-`notificationResponseHandler`
  **מה זה:** קובץ חדש `src/services/__tests__/notificationResponseHandler.test.ts` עם mock של `Notifications.addNotificationResponseReceivedListener`. סימולציה של response עם `actionIdentifier: 'MARK_DONE'` ואימות ש-`useCompletionsStore.getState().markDone` נקרא עם הפרמטרים הנכונים.
  **מה זה פותר:** מאמת את ההתנהגות הקריטית בלי תלות ב-OS.
  **תוצאה צפויה:** `npm test -- notificationResponseHandler` עובר.

- [x] ✅ רפקטור `dayItems` ל-`src/utils/buildDayTimeline.ts`
  **מה זה:** הוצאת לוגיקת בניית `dayItems` מ-`src/app/(tabs)/schedule.tsx` לפונקציה טהורה: `buildDayTimeline(date, mitzvot, completions, location, settings, zmanim) → TimelineItem[]`. החלפת השימוש המקורי ב-`schedule.tsx` בקריאה לפונקציה החדשה.
  **מה זה פותר:** מאפשר שימוש חוזר ב-`day/[date].tsx` ו-`history.tsx` בלי שכפול קוד.
  **תוצאה צפויה:** התנהגות `schedule.tsx` תצוגת `day` זהה לפני ואחרי; הפונקציה ניתנת לבדיקה בנפרד.

- [x] ✅ יצירת route `src/app/day/[date].tsx`
  **מה זה:** מסך חדש הנפתח עם `router.push({ pathname: '/day/[date]', params: { date: 'YYYY-MM-DD' } })`. שימוש ב-`useLocalSearchParams<{ date: string }>()` עם ולידציה. רינדור באמצעות `MitzvahCard` עבור פריטים מ-`buildDayTimeline`. דגל `isPast = DateTime.fromISO(date) < DateTime.now().startOf('day')` שמעביר prop `readOnly` לכרטיסים. כותרת "תצוגה היסטורית — לא ניתן לסמן" כשהדגל פעיל.
  **מה זה פותר:** דריל-דאון מתצוגות שבוע/חודש לרשימת מצוות של יום ספציפי, עם הגנה מפני כתיבה לתאריכי עבר.
  **תוצאה צפויה:** ניווט ל-`/day/2026-04-15` מציג את כל המצוות של אותו יום, עם וי disabled לכרטיסים. ניווט ליום נוכחי או עתידי מציג כרטיסים אינטראקטיביים.

- [x] ✅ הוספת prop `readOnly` ל-`MitzvahCard`
  **מה זה:** ב-`src/components/MitzvahCard.tsx`, prop בוליאני אופציונלי `readOnly` שמשתיק את `onComplete` (אופציה: גם להפחית opacity של כפתור הסימון או להחליפו ב-בייג').
  **מה זה פותר:** דרישת התצוגה ההיסטורית — אין מצב שתאריך עבר יקבל timestamp של ביצוע עכשווי.
  **תוצאה צפויה:** קריאה עם `readOnly` → לחיצה על כפתור ה-check לא משנה את הסטור; הוויזואל מבדל את המצב.

- [x] ✅ שבוע — Pressable וברשימת items inline
  **מה זה:** ב-`src/app/(tabs)/schedule.tsx` שורות 275–304: עטיפת `<View style={styles.weekCard}>` ב-`<Pressable onPress={() => router.push(...)}>`. הרחבת `weekDays` useMemo להחזיר גם `items: TimelineItem[]` (קריאה ל-`buildDayTimeline` לכל יום, מוגבל ל-4). רינדור הפריטים תחת `weekDots` כ-Text micro.
  **מה זה פותר:** מאפשר ניווט מתצוגת שבוע ל-`/day/[date]` + מציג preview אינלייני של מצוות היום בלי לחיצה.
  **תוצאה צפויה:** כל כרטיס שבוע מציג עד 4 שמות מצוות ופותח את `/day/[date]` בלחיצה.

- [x] ✅ חודש — Pressable + badge ספירה
  **מה זה:** ב-`src/app/(tabs)/schedule.tsx` שורות 306–335: עטיפת `<View style={styles.monthCell}>` ב-`<Pressable onPress={() => router.push(...)}>`. הוספת badge קטן בפינה עליונה-ימנית עם ספירת מצוות פתוחות אם > 0 (לא רשימה — תאי החודש צרים מדי).
  **מה זה פותר:** מאפשר ניווט מתצוגת חודש ל-`/day/[date]` + רמיזה ויזואלית לעומס היומי.
  **תוצאה צפויה:** לחיצה על תא יום פותחת את `/day/[date]`; תאים עמוסים מבליטים badge.

## Medium Priority

- [x] ✅ יצירת `src/utils/historyStats.ts`
  **מה זה:** מודול לוגיקה טהורה עם פונקציה `computeStats(mitzvot, completions, location, settings, daysBack=30)` המחזירה `{ streak, daily: Array<{date, doneCount, totalCount}>, perMitzvah: Record<id, {done, eligible, percent}>, missedYesterday: string[] }`. לכל יום בטווח: `computeWindow` + `shouldSkip` קובעים eligibility, השוואה ל-`completions[date]`.
  **מה זה פותר:** הבסיס לתכונת היסטוריה ועקביות; לוגיקה טהורה ניתנת לבדיקה.
  **תוצאה צפויה:** קריאה עם fixtures מחזירה streak, גריד יומי, אחוזים לכל מצווה. אין תופעות לוואי, אין קריאות לסטור.

- [x] ✅ טסט יחידה ל-`historyStats`
  **מה זה:** `src/utils/__tests__/historyStats.test.ts` עם fixtures: 7 ימים אחורה, אימות `streak=3` כשיש פער ביום ה-4. גבול חצות: completion ב-23:59 שייך ליום הזה. שבת: ב-`skipOn: ['shabbat']` ה-eligible יורד.
  **מה זה פותר:** מאמת חישוב streak, התנהגות גבולות, וכבוד ל-skip rules.
  **תוצאה צפויה:** `npm test -- historyStats` עובר את כל המקרים.

- [x] ✅ הוספת tab "history" ל-`(tabs)/_layout.tsx`
  **מה זה:** רישום `<Tabs.Screen name="history" options={{ title: t('tabs.history'), tabBarIcon: ... }} />` כ-tab חמישי. הוספת מפתח `tabs.history` ב-`he.json` ו-`en.json`. אייקון מתאים מ-`react-native-vector-icons`.
  **מה זה פותר:** תכונה צריכה discoverability גבוהה — לא קבורה ב-settings.
  **תוצאה צפויה:** ה-tab החמישי גלוי ב-bottom-bar ופותח את `history.tsx`.

- [x] ✅ יצירת `src/app/(tabs)/history.tsx`
  **מה זה:** מסך חדש שצורך את `historyStats`. מציג: (1) Streak נוכחי בכותרת בולטת, (2) גריד 30 יום בריבועים בצבע מ-light gray ל-gold לפי אחוז, (3) רשימת מצוות ממוינת לפי % עולה, (4) רשימת "החמצת אתמול" כ-CTA.
  **מה זה פותר:** מימוש דרישת המשתמש למעקב היסטורי ועקביות.
  **תוצאה צפויה:** המסך נטען עם נתונים אמיתיים מהסטור; ניווט ליום במגרסה הגריד פותח `/day/[date]`.

- [x] ✅ רינדור `contentBlocks` ב-`mitzvah/[id].tsx`
  **מה זה:** ב-`src/app/mitzvah/[id].tsx`, אחרי `description`: רינדור `mitzvah.contentBlocks` לפי type. text/blessing → `<Text style={typography.body}>` (ברכה ברקע מודגש זהב). link → `<Pressable onPress={() => Linking.openURL(block.url)}>` עם אייקון.
  **מה זה פותר:** משתמש רואה את התוכן העשיר (ברכות, קישורים) במסך פרטי המצווה.
  **תוצאה צפויה:** מצווה עם contentBlocks מציגה אותם בעיצוב מתאים לכל type. קישור פותח דפדפן חיצוני.

- [x] ✅ מתג "כלול תוכן בהתראה" ב-`mitzvah/[id].tsx`
  **מה זה:** מתחת ל-`contentBlocks`, Switch שכאשר מופעל מעדכן את כל `reminders[i].includeContentInBody = true` עבור המצווה דרך `useMitzvotStore.setReminders(id, ...)`. מצב התחלתי תואם לערך הקיים ב-reminders.
  **מה זה פותר:** שליטת משתמש האם הברכה/תוכן יופיעו בהתראה — לא תמיד נרצה body ארוך.
  **תוצאה צפויה:** הפעלת המתג → התראות הבאות של המצווה מציגות את התוכן; כיבוי → רק ה-variant/label.

- [x] ✅ עורך `bodyVariants` ב-`custom-mitzvah.tsx`
  **מה זה:** ב-`src/app/custom-mitzvah.tsx`, שדה חדש "ניסוחים מתחלפים" — בורר reminder + TextInput multi-line, כל שורה = variant. שמירה ב-`reminders[selectedIdx].bodyVariants` של ה-`CustomMitzvah` הנוצרת/נערכת.
  **מה זה פותר:** משתמש יכול ליצור ניסוחים מתחלפים גם למצוות שיצר בעצמו (מעבר למאגר).
  **תוצאה צפויה:** יצירה/עריכה של custom mitzvah עם variants → התראות שלה מסתובבות בין הניסוחים בדיוק כמו במצוות מהמאגר.

- [x] ✅ עורך `contentBlocks` ב-`custom-mitzvah.tsx`
  **מה זה:** באותו מסך, רשימה דינמית של בלוקי תוכן: כל שורה type-picker (טקסט/ברכה/קישור), שדה he, שדה url מותנה ב-type=link. כפתור "+ בלוק חדש" ו-"מחק" לכל שורה.
  **מה זה פותר:** משתמש יכול להצמיד ברכה או קישור גם למצוות שיצר.
  **תוצאה צפויה:** custom mitzvah עם contentBlocks מציגה אותם ב-`mitzvah/[id].tsx` ו-(אם `includeContentInBody`) בהתראות.

## Low Priority

- [x] ✅ אכלוס הדרגתי של `bodyVariants` לשאר המצוות
  **מה זה:** מעבר על שאר רשומות `mitzvot.ts` (תפילין, קריאת שמע, ברכות שחר, ספרי תורה, נטילת ידיים, וכו') והוספת `bodyVariants` לתזכורות הראשיות. 2–3 ניסוחים לכל אחת.
  **מה זה פותר:** חוויה אחידה בכל המצוות, לא רק בתפילות הראשיות.
  **תוצאה צפויה:** רוב המצוות הפעילות מציגות ניסוחי תזכורת מתחלפים.

- [x] ✅ חיווט `fullContent` בלחיצה על התראה (לא על הכפתור)
  **מה זה:** ב-`notificationResponseHandler.ts`, כש-`actionIdentifier === 'expo.modules.notifications.actions.DEFAULT'` (לחיצה על גוף ההתראה), קריאת `data.fullContent` ופתיחת `mitzvah/[id]` עם state ראשוני שמדגיש את ה-contentBlocks.
  **מה זה פותר:** משתמש שלוחץ על ההתראה (לא על "עשיתי") מגיע ישר לתוכן הברכה/קישור.
  **תוצאה צפויה:** לחיצה על התראת ספירת העומר → פתיחה במסך פרטי עם ה-blessing block בולט.

- [ ] אימות מובייל manual end-to-end
  **מה זה:** הרצת `npm run start:dev` על dev-client iOS+Android. תזמון תזכורת ל-+30s, אימות variant rotation, אימות כפתור "עשיתי" משפיע על הסטור גם כשהאפליקציה ב-background.
  **מה זה פותר:** וידוא שכל הזרימה עובדת על OS אמיתי, לא רק ב-Jest.
  **תוצאה צפויה:** דוח קצר עם screenshots של ההתראות ותוצאות הסטור.

## Open Questions

- נפתר: נוספה תלות `@types/node`, וגם `@react-navigation/bottom-tabs` כתלות ישירה כדי ש-`npm run typecheck` יעבור תחת pnpm strict.
- נפתר: לשונית history כוללת גריד 30 יום כברירת מחדל, ללא גרף שבועי/חודשי נוסף.
- נפתר: קישורים מוצגים בתוך האפליקציה בלבד; לא נוסף action button שני להתראה.
- נפתר: בתאריכי עבר `day/[date]` מציג את כל המצוות הרלוונטיות לקריאה בלבד, כולל הושלמו והוחמצו.
