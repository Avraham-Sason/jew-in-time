import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { DateTime } from 'luxon';
import { MitzvahCard } from '@/components/MitzvahCard';
import { MITZVOT } from '@/data/mitzvot';
import { customToMitzvah } from '@/data/customMitzvotAdapter';
import { useCustomMitzvotStore } from '@/stores/useCustomMitzvotStore';
import { Completions, useCompletionsStore } from '@/stores/useCompletionsStore';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { buildDayTimeline } from '@/utils/buildDayTimeline';
import { useI18n, t as translate } from '@/i18n';

const EMPTY_COMPLETIONS = Object.freeze({}) as Completions;

function formatRemaining(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  if (totalMin >= 60) {
    const hours = Math.floor(totalMin / 60);
    const minutes = String(totalMin % 60).padStart(2, '0');
    return `${hours}:${minutes} ${translate('time.unit.hours')}`;
  }
  return `${totalMin} ${translate('time.unit.minutes')}`;
}

export default function DayRoute() {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const activeMap = useMitzvotStore((s) => s.activeMitzvot);
  const customMap = useCustomMitzvotStore((s) => s.items);
  const completions = useCompletionsStore((s) => s.completions);
  const markDone = useCompletionsStore((s) => s.markDone);
  const location = useUserStore((s) => s.location);
  const nusach = useUserStore((s) => s.nusach);
  const halachicOpinions = useUserStore((s) => s.halachicOpinions);
  const inIsrael = useUserStore((s) => s.inIsrael);

  const dateParam = typeof params.date === 'string' ? params.date : '';
  const parsed = useMemo(() => DateTime.fromISO(dateParam).startOf('day'), [dateParam]);
  const valid = Boolean(dateParam.match(/^\d{4}-\d{2}-\d{2}$/)) && parsed.isValid;
  const today = DateTime.now().startOf('day');
  const isToday = valid && parsed.hasSame(today, 'day');
  const isPast = valid && parsed < today;
  const isFuture = valid && parsed > today;
  const readOnly = valid && !isToday;

  const allMitzvot = useMemo(() => {
    const customs = Object.values(customMap)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(customToMitzvah);
    return [...MITZVOT, ...customs];
  }, [customMap]);

  const enabled = useMemo(() => allMitzvot.filter((mitzvah) => activeMap[mitzvah.id]?.enabled), [allMitzvot, activeMap]);
  const settings = useMemo(() => ({ nusach, halachicOpinions, inIsrael }), [nusach, halachicOpinions, inIsrael]);
  const date = useMemo(() => (valid ? parsed.toJSDate() : new Date()), [valid, parsed]);
  const displayCompletions = isFuture ? EMPTY_COMPLETIONS : completions;
  const items = useMemo(
    () =>
      valid
        ? buildDayTimeline(date, enabled, displayCompletions, location, settings, language, t).filter((item) => item.type === 'mitzvah')
        : [],
    [valid, date, enabled, displayCompletions, location, settings, language, t],
  );

  const title = valid ? parsed.setLocale(language).toFormat(language === 'he' ? 'cccc d LLLL yyyy' : 'cccc, LLL d yyyy') : t('day.title');
  const bannerText = isPast ? t('day.readOnlyBanner') : isFuture ? t('day.futureReadOnlyBanner') : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
          <Text style={[typography.captionBold, { color: colors.headerText }]}>{t('common.back')}</Text>
        </Pressable>
        <Text style={[typography.heading, { color: colors.headerText }]}>{t('day.title')}</Text>
        <Text style={[typography.caption, { color: colors.headerSub, marginTop: 2 }]}>{title}</Text>
      </View>
      {!valid ? (
        <Text style={[typography.body, { color: colors.urgent, padding: 18, textAlign: 'center' }]}>{t('day.invalid')}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {bannerText ? (
            <View style={[styles.banner, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <Text style={[typography.captionBold, { color: colors.textSub }]}>{bannerText}</Text>
            </View>
          ) : null}
          {items.map((item) => {
            const totalMs = item.windowEnd ? item.windowEnd.getTime() - item.time.getTime() : 1;
            const remainingMs = item.windowEnd ? item.windowEnd.getTime() - Date.now() : 0;
            const pct = totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
            const timeRange = t('detail.timeRange', {
              start: DateTime.fromJSDate(item.time).toFormat('HH:mm'),
              end: DateTime.fromJSDate(item.windowEnd ?? item.time).toFormat('HH:mm'),
            });
            const missed = isPast && !item.done;
            const statusText = missed ? t('day.missed') : isFuture ? timeRange : undefined;
            return (
              <MitzvahCard
                key={item.id}
                name={item.name}
                timeLeft={missed ? t('day.missed') : isFuture ? timeRange : formatRemaining(remainingMs)}
                pct={missed ? 0 : pct}
                urgent={missed || (isToday && item.urgent)}
                done={item.done}
                readOnly={readOnly}
                statusText={statusText}
                statusTone={missed ? 'urgent' : 'muted'}
                hideProgress={!isToday}
                onComplete={isToday ? () => item.mitzvahId && markDone(item.mitzvahId, date) : undefined}
                onPress={() => item.mitzvahId && router.push({ pathname: '/mitzvah/[id]', params: { id: item.mitzvahId } })}
              />
            );
          })}
          {!items.length ? (
            <Text style={[typography.body, { color: colors.textSub, textAlign: 'center', paddingTop: 28 }]}>{t('day.noItems')}</Text>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
  },
  content: {
    padding: 14,
    paddingBottom: 28,
  },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
});
