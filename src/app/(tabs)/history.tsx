import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DateTime } from 'luxon';
import { NavBar } from '@/components/NavBar';
import { MITZVOT } from '@/data/mitzvot';
import { customToMitzvah } from '@/data/customMitzvotAdapter';
import { useCustomMitzvotStore } from '@/stores/useCustomMitzvotStore';
import { useCompletionsStore } from '@/stores/useCompletionsStore';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { computeStats } from '@/utils/historyStats';
import { useI18n } from '@/i18n';

function alphaFor(percent: number) {
  if (percent <= 0) return '1A';
  if (percent < 35) return '44';
  if (percent < 70) return '88';
  return 'DD';
}

export default function HistoryScreen() {
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

  const allMitzvot = useMemo(() => {
    const customs = Object.values(customMap)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(customToMitzvah);
    return [...MITZVOT, ...customs];
  }, [customMap]);
  const enabled = useMemo(() => allMitzvot.filter((mitzvah) => activeMap[mitzvah.id]?.enabled), [allMitzvot, activeMap]);
  const settings = useMemo(() => ({ nusach, halachicOpinions, inIsrael }), [nusach, halachicOpinions, inIsrael]);
  const stats = useMemo(() => computeStats(enabled, completions, location, settings, 30), [enabled, completions, location, settings]);
  const byMitzvah = useMemo(
    () =>
      enabled
        .map((mitzvah) => ({
          mitzvah,
          stat: stats.perMitzvah[mitzvah.id] ?? { done: 0, eligible: 0, percent: 0 },
        }))
        .sort((a, b) => a.stat.percent - b.stat.percent),
    [enabled, stats.perMitzvah],
  );

  const nameFor = (id: string) => {
    const mitzvah = enabled.find((item) => item.id === id);
    if (!mitzvah) return id;
    return language === 'en' && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <NavBar title={t('history.title')} subtitle={t('history.gridTitle')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.streakCard, { backgroundColor: colors.headerBg }]}>
          <Text style={[styles.streakNumber, { color: colors.gold }]}>{stats.streak}</Text>
          <Text style={[typography.subheading, { color: colors.headerText }]}>{t('history.streak', { count: stats.streak })}</Text>
        </View>

        <Text style={[typography.captionBold, styles.sectionTitle, { color: colors.textSub }]}>{t('history.gridTitle')}</Text>
        <View style={styles.grid}>
          {stats.daily.map((day) => {
            const percent = day.totalCount > 0 ? Math.round((day.doneCount / day.totalCount) * 100) : 0;
            const date = DateTime.fromISO(day.date);
            return (
              <Pressable
                key={day.date}
                onPress={() => router.push({ pathname: '/day/[date]', params: { date: day.date } })}
                style={[
                  styles.gridCell,
                  {
                    backgroundColor: day.totalCount ? `${colors.gold}${alphaFor(percent)}` : colors.surface2,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[typography.micro, { color: percent > 65 ? '#fff' : colors.textSub }]}>
                  {date.isValid ? date.day : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[typography.captionBold, styles.sectionTitle, { color: colors.textSub }]}>{t('history.perMitzvah')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {byMitzvah.map(({ mitzvah, stat }) => (
            <Pressable
              key={mitzvah.id}
              onPress={() => router.push({ pathname: '/mitzvah/[id]', params: { id: mitzvah.id } })}
              style={[styles.statRow, { borderBottomColor: colors.border }]}
            >
              <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {language === 'en' && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he}
              </Text>
              <Text style={[typography.captionBold, { color: colors.gold }]}>{t('history.percent', { percent: stat.percent })}</Text>
            </Pressable>
          ))}
          {!byMitzvah.length ? (
            <Text style={[typography.body, { color: colors.textMuted, padding: 14 }]}>{t('history.empty')}</Text>
          ) : null}
        </View>

        <Text style={[typography.captionBold, styles.sectionTitle, { color: colors.textSub }]}>{t('history.missedYesterday')}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {stats.missedYesterday.map((id) => (
            <Pressable
              key={id}
              onPress={() => router.push({ pathname: '/mitzvah/[id]', params: { id } })}
              style={[styles.statRow, { borderBottomColor: colors.border }]}
            >
              <Text style={[typography.bodyBold, { color: colors.text }]}>{nameFor(id)}</Text>
            </Pressable>
          ))}
          {!stats.missedYesterday.length ? (
            <Text style={[typography.body, { color: colors.textMuted, padding: 14 }]}>{t('history.noMissedYesterday')}</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 14,
    paddingBottom: 26,
  },
  streakCard: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
  },
  streakNumber: {
    fontSize: 54,
    fontFamily: 'Heebo_900Black',
    lineHeight: 62,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  gridCell: {
    width: '15%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statRow: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
});
