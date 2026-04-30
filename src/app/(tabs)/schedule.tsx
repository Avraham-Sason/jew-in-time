import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DateTime } from 'luxon';
import { NavBar } from '@/components/NavBar';
import { getLocationName } from '@/data/cities';
import { MITZVOT } from '@/data/mitzvot';
import { customToMitzvah } from '@/data/customMitzvotAdapter';
import { useCustomMitzvotStore } from '@/stores/useCustomMitzvotStore';
import { HebcalService } from '@/services/HebcalService';
import { ZmanimService } from '@/services/ZmanimService';
import { useCompletionsStore, dateKey } from '@/stores/useCompletionsStore';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { ComputeContext, Mitzvah } from '@/types/mitzvah';
import { useI18n } from '@/i18n';

type ViewMode = 'day' | 'week' | 'month';

type TimelineItem = {
  id: string;
  name: string;
  time: Date;
  type: 'zman' | 'mitzvah';
  done?: boolean;
  urgent?: boolean;
  mitzvahId?: string;
};

const ZMAN_KEYS = [
  'alotHaShachar',
  'netzHaChama',
  'sofZmanShmaGra',
  'sofZmanTfilaGra',
  'minchaGedola',
  'plagHaMincha',
  'shkia',
  'tzeitHakochavim',
] as const;

function buildContext(date: Date): ComputeContext {
  const { location, nusach, halachicOpinions, inIsrael } = useUserStore.getState();
  return {
    date,
    location,
    settings: { nusach, halachicOpinions, inIsrael },
    zmanim: ZmanimService.getZmanim(date, location),
  };
}

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const router = useRouter();
  const activeMap = useMitzvotStore((s) => s.activeMitzvot);
  const customMap = useCustomMitzvotStore((s) => s.items);
  const completions = useCompletionsStore((s) => s.completions);
  const location = useUserStore((s) => s.location);

  const allMitzvot = useMemo<Mitzvah[]>(() => {
    const customs = Object.values(customMap)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(customToMitzvah);
    return [...MITZVOT, ...customs];
  }, [customMap]);
  const [view, setView] = useState<ViewMode>('day');
  const [cursor, setCursor] = useState(DateTime.now());

  const dayItems = useMemo(() => {
    const date = cursor.startOf('day').toJSDate();
    const ctx = buildContext(date);
    const timeline: TimelineItem[] = ZMAN_KEYS.map((key) => ({
      id: key,
      name: t(`zman.${key}`),
      time: ctx.zmanim[key],
      type: 'zman',
    }));

    const enabled = allMitzvot.filter((item) => activeMap[item.id]?.enabled);
    const doneToday = completions[dateKey(date)] ?? {};

    enabled.forEach((mitzvah) => {
      const window = mitzvah.computeWindow(ctx);
      if (!window) return;
      timeline.push({
        id: `${mitzvah.id}-${window.start.toISOString()}`,
        name: language === 'en' && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he,
        time: window.start,
        type: 'mitzvah',
        done: Boolean(doneToday[mitzvah.id]),
        urgent: window.end.getTime() - Date.now() <= 45 * 60 * 1000,
        mitzvahId: mitzvah.id,
      });
    });

    timeline.sort((a, b) => a.time.getTime() - b.time.getTime());
    return timeline;
  }, [allMitzvot, activeMap, completions, cursor, language, t]);

  const weekDays = useMemo(() => {
    const start = cursor.startOf('week');
    return Array.from({ length: 7 }, (_, index) => {
      const day = start.plus({ days: index });
      const ctx = buildContext(day.toJSDate());
      const count = allMitzvot.filter((item) => activeMap[item.id]?.enabled && item.computeWindow(ctx)).length;
      const holidays = HebcalService.getHolidays(day.toJSDate(), location);
      return { day, count, holidays };
    });
  }, [allMitzvot, activeMap, cursor, location]);

  const monthGrid = useMemo(() => {
    const monthStart = cursor.startOf('month');
    const gridStart = monthStart.minus({ days: monthStart.weekday % 7 });
    return Array.from({ length: 42 }, (_, index) => {
      const day = gridStart.plus({ days: index });
      const holidays = HebcalService.getHolidays(day.toJSDate(), location);
      const hebrew = HebcalService.getHebrewDate(day.toJSDate());
      return {
        day,
        inMonth: day.month === cursor.month,
        holidays,
        hebrewDay: hebrew.day,
      };
    });
  }, [cursor, location]);

  const highlightIndex = useMemo(() => {
    if (!cursor.hasSame(DateTime.now(), 'day')) return -1;
    const nowMs = Date.now();
    return dayItems.findIndex((item, index) => {
      const next = dayItems[index + 1];
      return nowMs >= item.time.getTime() && (!next || nowMs < next.time.getTime());
    });
  }, [cursor, dayItems]);

  const subtitle = `${cursor.setLocale(language).toFormat(language === 'he' ? 'd LLLL yyyy' : 'LLL d, yyyy')} · ${getLocationName(location, language)}`;
  const prevArrow = language === 'he' ? '→' : '←';
  const nextArrow = language === 'he' ? '←' : '→';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <NavBar title={t('schedule.title')} subtitle={subtitle} />
      <View style={[styles.controls, { backgroundColor: colors.headerBg }]}>
        <View style={[styles.toggleWrap, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
          {(['day', 'week', 'month'] as ViewMode[]).map((value) => (
            <Pressable
              key={value}
              onPress={() => setView(value)}
              style={[
                styles.toggle,
                {
                  backgroundColor: view === value ? colors.gold : 'transparent',
                },
              ]}
            >
              <Text style={[typography.small, { color: view === value ? '#fff' : 'rgba(255,255,255,0.5)' }]}>
                {t(`schedule.${value}`)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.navRow}>
          <Pressable onPress={() => setCursor((prev) => shift(prev, view, -1))} style={styles.navBtn}>
            <Text style={[typography.bodyBold, { color: colors.headerText }]}>{prevArrow}</Text>
          </Pressable>
          <Text style={[typography.captionBold, { color: colors.headerText }]}>
            {view === 'month'
              ? t(`month.${cursor.month - 1}`)
              : cursor.setLocale(language).toFormat(language === 'he' ? 'cccc d LLL' : 'ccc LLL d')}
          </Text>
          <Pressable onPress={() => setCursor((prev) => shift(prev, view, 1))} style={styles.navBtn}>
            <Text style={[typography.bodyBold, { color: colors.headerText }]}>{nextArrow}</Text>
          </Pressable>
        </View>
      </View>

      {view === 'day' ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {dayItems.map((item, index) => {
            const highlight = index === highlightIndex;
            return (
              <Pressable
                key={item.id}
                onPress={() =>
                  item.mitzvahId &&
                  router.push(
                    item.mitzvahId.startsWith('custom_')
                      ? { pathname: '/custom-mitzvah', params: { id: item.mitzvahId } }
                      : `/mitzvah/${item.mitzvahId}`,
                  )
                }
                disabled={!item.mitzvahId}
                style={[
                  styles.timelineRow,
                  {
                    backgroundColor: highlight ? `${colors.gold}09` : colors.surface,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                {highlight ? <View style={[styles.nowLine, { backgroundColor: colors.urgent }]} /> : null}
                <Text style={[typography.small, styles.timeCol, { color: colors.textMuted }]}>
                  {DateTime.fromJSDate(item.time).toFormat('HH:mm')}
                </Text>
                <View style={styles.dotCol}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: item.done
                          ? colors.gold
                          : item.urgent
                            ? colors.urgent
                            : item.type === 'zman'
                              ? 'transparent'
                              : colors.textMuted,
                        borderColor: item.done
                          ? colors.gold
                          : item.urgent
                            ? colors.urgent
                            : item.type === 'zman'
                              ? colors.border
                              : colors.textSub,
                      },
                    ]}
                  />
                </View>
                <View style={styles.rowMeta}>
                  <Text
                    style={[
                      typography.body,
                      {
                        color: item.done ? colors.textMuted : item.urgent ? colors.urgent : item.type === 'zman' ? colors.textSub : colors.text,
                        fontFamily: item.type === 'mitzvah' ? 'Heebo_600SemiBold' : 'Heebo_400Regular',
                        textDecorationLine: item.done ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                </View>
                {item.type === 'mitzvah' ? (
                  <View
                    style={[
                      styles.trailing,
                      {
                        backgroundColor: item.done ? colors.gold : 'transparent',
                        borderColor: item.done ? colors.gold : item.urgent ? colors.urgent : colors.border,
                      },
                    ]}
                  >
                    {item.done ? <Text style={[typography.micro, { color: '#fff' }]}>✓</Text> : null}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
          {!dayItems.length ? (
            <Text style={[typography.body, { color: colors.textSub, textAlign: 'center', paddingTop: 28 }]}>
              {t('schedule.noItems')}
            </Text>
          ) : null}
        </ScrollView>
      ) : null}

      {view === 'week' ? (
        <ScrollView horizontal contentContainerStyle={styles.weekWrap} showsHorizontalScrollIndicator={false}>
          {weekDays.map(({ day, count, holidays }) => (
            <View
              key={day.toISODate()}
              style={[
                styles.weekCard,
                {
                  backgroundColor: day.hasSame(DateTime.now(), 'day') ? colors.goldLight : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[typography.captionBold, { color: colors.text }]}>{t(`weekday.short.${day.weekday % 7}`)}</Text>
              <Text style={[typography.title, { color: colors.text, marginTop: 6 }]}>{day.day}</Text>
              <Text style={[typography.small, { color: colors.textMuted, marginTop: 8 }]}>{t('schedule.weekCount', { count })}</Text>
              <View style={styles.weekDots}>
                {Array.from({ length: Math.min(4, count) }).map((_, index) => (
                  <View key={index} style={[styles.weekDot, { backgroundColor: colors.gold }]} />
                ))}
              </View>
              {holidays.length ? (
                <Text style={[typography.micro, { color: colors.urgent, marginTop: 8, textAlign: 'center' }]} numberOfLines={2}>
                  {holidays[0]}
                </Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}

      {view === 'month' ? (
        <View style={styles.monthWrap}>
          <View style={styles.monthHeader}>
            {Array.from({ length: 7 }).map((_, index) => (
              <Text key={index} style={[typography.micro, styles.monthHeaderCell, { color: colors.textMuted }]}>
                {t(`weekday.short.${index}`)}
              </Text>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {monthGrid.map((cell) => (
              <View
                key={cell.day.toISODate()}
                style={[
                  styles.monthCell,
                  {
                    backgroundColor: cell.day.hasSame(DateTime.now(), 'day') ? `${colors.gold}18` : colors.surface,
                    borderColor: colors.border,
                    opacity: cell.inMonth ? 1 : 0.45,
                  },
                ]}
              >
                <Text style={[typography.captionBold, { color: colors.text }]}>{cell.day.day}</Text>
                <Text style={[typography.micro, { color: colors.textMuted }]}>{cell.hebrewDay}</Text>
                {cell.holidays.length ? <View style={[styles.ping, { backgroundColor: colors.urgent }]} /> : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function shift(value: DateTime, mode: ViewMode, amount: number) {
  if (mode === 'month') return value.plus({ months: amount });
  if (mode === 'week') return value.plus({ weeks: amount });
  return value.plus({ days: amount });
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  controls: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  toggleWrap: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
  },
  toggle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    paddingVertical: 6,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scrollContent: {
    paddingBottom: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  nowLine: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: 2,
  },
  timeCol: {
    width: 40,
    textAlign: 'right',
  },
  dotCol: {
    width: 14,
    alignItems: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  rowMeta: {
    flex: 1,
  },
  trailing: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekWrap: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  weekCard: {
    width: 120,
    minHeight: 160,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  weekDots: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 12,
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  monthWrap: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  monthHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  monthHeaderCell: {
    flex: 1,
    textAlign: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  monthCell: {
    width: '13%',
    aspectRatio: 0.9,
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
  },
  ping: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginTop: 'auto',
  },
});
