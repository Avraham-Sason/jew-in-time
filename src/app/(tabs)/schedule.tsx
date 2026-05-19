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
import { Completions, useCompletionsStore } from '@/stores/useCompletionsStore';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { Mitzvah } from '@/types/mitzvah';
import { buildDayTimeline } from '@/utils/buildDayTimeline';
import { useI18n } from '@/i18n';

type ViewMode = 'day' | 'week' | 'month';

const EMPTY_COMPLETIONS = Object.freeze({}) as Completions;

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const router = useRouter();
  const activeMap = useMitzvotStore((s) => s.activeMitzvot);
  const customMap = useCustomMitzvotStore((s) => s.items);
  const completions = useCompletionsStore((s) => s.completions);
  const location = useUserStore((s) => s.location);
  const nusach = useUserStore((s) => s.nusach);
  const halachicOpinions = useUserStore((s) => s.halachicOpinions);
  const inIsrael = useUserStore((s) => s.inIsrael);

  const allMitzvot = useMemo<Mitzvah[]>(() => {
    const customs = Object.values(customMap)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(customToMitzvah);
    return [...MITZVOT, ...customs];
  }, [customMap]);
  const enabledMitzvot = useMemo(
    () => allMitzvot.filter((item) => activeMap[item.id]?.enabled),
    [allMitzvot, activeMap],
  );
  const settings = useMemo(
    () => ({ nusach, halachicOpinions, inIsrael }),
    [nusach, halachicOpinions, inIsrael],
  );
  const [view, setView] = useState<ViewMode>('day');
  const [cursor, setCursor] = useState(DateTime.now());
  const today = DateTime.now().startOf('day');
  const cursorDay = cursor.startOf('day');
  const isSelectedToday = cursorDay.hasSame(today, 'day');
  const isSelectedPast = cursorDay < today;
  const isSelectedFuture = cursorDay > today;
  const dayCompletions = isSelectedFuture ? EMPTY_COMPLETIONS : completions;

  const dayItems = useMemo(() => {
    if (view !== 'day') return [];
    const date = cursor.startOf('day').toJSDate();
    return buildDayTimeline(date, enabledMitzvot, dayCompletions, location, settings, language, t);
  }, [view, enabledMitzvot, dayCompletions, cursor, location, settings, language, t]);

  const weekDays = useMemo(() => {
    if (view !== 'week') return [];
    const start = cursor.startOf('week');
    return Array.from({ length: 7 }, (_, index) => {
      const day = start.plus({ days: index });
      const items = buildDayTimeline(day.toJSDate(), enabledMitzvot, completions, location, settings, language, t)
        .filter((item) => item.type === 'mitzvah');
      const count = items.length;
      const holidays = HebcalService.getHolidays(day.toJSDate(), location);
      return { day, count, holidays, items: items.slice(0, 4) };
    });
  }, [view, enabledMitzvot, completions, cursor, location, settings, language, t]);

  const monthGrid = useMemo(() => {
    if (view !== 'month') return [];
    const monthStart = cursor.startOf('month');
    const gridStart = monthStart.minus({ days: monthStart.weekday % 7 });
    return Array.from({ length: 42 }, (_, index) => {
      const day = gridStart.plus({ days: index });
      const holidays = HebcalService.getHolidays(day.toJSDate(), location);
      const hebrew = HebcalService.getHebrewDate(day.toJSDate());
      const openCount = buildDayTimeline(day.toJSDate(), enabledMitzvot, completions, location, settings, language, t)
        .filter((item) => item.type === 'mitzvah' && !item.done).length;
      return {
        day,
        inMonth: day.month === cursor.month,
        holidays,
        hebrewDay: hebrew.day,
        openCount,
      };
    });
  }, [view, cursor, enabledMitzvot, completions, location, settings, language, t]);

  const highlightIndex = useMemo(() => {
    if (!isSelectedToday) return -1;
    const nowMs = Date.now();
    return dayItems.findIndex((item, index) => {
      const next = dayItems[index + 1];
      return nowMs >= item.time.getTime() && (!next || nowMs < next.time.getTime());
    });
  }, [isSelectedToday, dayItems]);

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
            const missed = isSelectedPast && item.type === 'mitzvah' && !item.done;
            const rowUrgent = missed || (isSelectedToday && item.urgent);
            const statusText = item.type === 'mitzvah'
              ? missed
                ? t('day.missed')
                : isSelectedPast && item.done
                  ? t('state.completed')
                  : isSelectedFuture
                    ? t('day.scheduled')
                    : undefined
              : undefined;
            const statusColor = missed ? colors.urgent : item.done ? colors.safe : colors.textMuted;
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
                          : rowUrgent
                            ? colors.urgent
                            : item.type === 'zman'
                              ? 'transparent'
                              : colors.textMuted,
                        borderColor: item.done
                          ? colors.gold
                          : rowUrgent
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
                        color: item.done ? colors.textMuted : rowUrgent ? colors.urgent : item.type === 'zman' ? colors.textSub : colors.text,
                        fontFamily: item.type === 'mitzvah' ? 'Heebo_600SemiBold' : 'Heebo_400Regular',
                        textDecorationLine: item.done ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {statusText ? (
                    <Text style={[typography.micro, { color: statusColor, fontWeight: '600', marginTop: 2 }]}>
                      {statusText}
                    </Text>
                  ) : null}
                </View>
                {item.type === 'mitzvah' && (isSelectedToday || item.done) ? (
                  <View
                    style={[
                      styles.trailing,
                      {
                        backgroundColor: item.done ? colors.gold : 'transparent',
                        borderColor: item.done ? colors.gold : rowUrgent ? colors.urgent : colors.border,
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
          {weekDays.map(({ day, count, holidays, items }) => (
            <Pressable
              key={day.toISODate()}
              onPress={() => router.push({ pathname: '/day/[date]', params: { date: day.toISODate() ?? '' } })}
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
              {items.length ? (
                <View style={styles.weekPreview}>
                  {items.map((item) => (
                    <Text key={item.id} style={[typography.micro, styles.weekPreviewText, { color: colors.textSub }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  ))}
                </View>
              ) : null}
              {holidays.length ? (
                <Text style={[typography.micro, { color: colors.urgent, marginTop: 8, textAlign: 'center' }]} numberOfLines={2}>
                  {holidays[0]}
                </Text>
              ) : null}
            </Pressable>
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
              <Pressable
                key={cell.day.toISODate()}
                onPress={() => router.push({ pathname: '/day/[date]', params: { date: cell.day.toISODate() ?? '' } })}
                style={[
                  styles.monthCell,
                  {
                    backgroundColor: cell.day.hasSame(DateTime.now(), 'day') ? `${colors.gold}18` : colors.surface,
                    borderColor: colors.border,
                    opacity: cell.inMonth ? 1 : 0.45,
                  },
                ]}
              >
                {cell.openCount > 0 ? (
                  <View style={[styles.monthBadge, { backgroundColor: colors.gold }]}>
                    <Text style={[typography.micro, { color: '#fff', fontFamily: 'Heebo_700Bold' }]}>{cell.openCount}</Text>
                  </View>
                ) : null}
                <Text style={[typography.captionBold, { color: colors.text }]}>{cell.day.day}</Text>
                <Text style={[typography.micro, { color: colors.textMuted }]}>{cell.hebrewDay}</Text>
                {cell.holidays.length ? <View style={[styles.ping, { backgroundColor: colors.urgent }]} /> : null}
              </Pressable>
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
  weekPreview: {
    width: '100%',
    marginTop: 10,
    gap: 2,
  },
  weekPreviewText: {
    textAlign: 'center',
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
    position: 'relative',
  },
  monthBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  ping: {
    width: 7,
    height: 7,
    borderRadius: 7,
    marginTop: 'auto',
  },
});
