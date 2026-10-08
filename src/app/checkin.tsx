import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { DateTime } from 'luxon';
import { MitzvahCard } from '@/components/MitzvahCard';
import { CompletedRow } from '@/components/CompletedRow';
import { MITZVOT } from '@/data/mitzvot';
import { customToMitzvah } from '@/data/customMitzvotAdapter';
import { StorageService } from '@/services/StorageService';
import { useCompletionsStore } from '@/stores/useCompletionsStore';
import { useCustomMitzvotStore } from '@/stores/useCustomMitzvotStore';
import { enabledSinceOf, useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { HolyBlock } from '@/types/zmanim';
import { CHECK_IN_PROMPTED_KEY, checkInFor, checkInLastDay, checkInPhraseKey, latestCheckIn } from '@/utils/checkIn';
import { useI18n } from '@/i18n';

// Marks for the days of a Shabbat / Yom Tov block, written after it ends. The one route allowed to
// write a past day: those days could not be marked while they happened.
export default function CheckInRoute() {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const router = useRouter();
  const activeMap = useMitzvotStore((s) => s.activeMitzvot);
  const customMap = useCustomMitzvotStore((s) => s.items);
  const completions = useCompletionsStore((s) => s.completions);
  const skipped = useCompletionsStore((s) => s.skipped);
  const markDone = useCompletionsStore((s) => s.markDone);
  const unmark = useCompletionsStore((s) => s.unmark);
  const finishCheckIn = useCompletionsStore((s) => s.finishCheckIn);
  const location = useUserStore((s) => s.location);
  const nusach = useUserStore((s) => s.nusach);
  const halachicOpinions = useUserStore((s) => s.halachicOpinions);
  const inIsrael = useUserStore((s) => s.inIsrael);

  const mitzvot = useMemo(() => {
    const customs = Object.values(customMap)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(customToMitzvah);
    return [...MITZVOT, ...customs].filter((m) => m.nuschaotSupported.includes(nusach) && activeMap[m.id]?.enabled);
  }, [customMap, activeMap, nusach]);
  const settings = useMemo(() => ({ nusach, halachicOpinions, inIsrael }), [nusach, halachicOpinions, inIsrael]);
  const enabledSince = useMemo(() => enabledSinceOf(activeMap), [activeMap]);

  // The block whose check-in was open on arrival. It stays on screen after the last mark, which
  // finishes the check-in, so the user sees the list complete rather than an empty page.
  const [block] = useState<HolyBlock | null>(() => {
    const { checkIns } = useCompletionsStore.getState();
    const open = latestCheckIn({ mitzvot, completions, skipped, checkIns, enabledSince, location, settings });
    return open?.open ? open.block : null;
  });
  const checkIn = useMemo(
    () =>
      block
        ? checkInFor(
            block,
            { mitzvot, completions, skipped, checkIns: {}, enabledSince, location, settings },
            new Date(),
          )
        : null,
    [block, mitzvot, completions, skipped, enabledSince, location, settings],
  );

  const checkInId = checkIn?.id;
  useEffect(() => {
    if (checkInId) StorageService.set(CHECK_IN_PROMPTED_KEY, checkInId);
  }, [checkInId]);

  // Leaving with everything marked is the same as "done": nothing is left to remind about.
  const allMarked = Boolean(checkIn?.days.every((day) => day.items.every((item) => item.done)));
  const leaveState = useRef({ id: checkIn?.id, allMarked });
  leaveState.current = { id: checkIn?.id, allMarked };
  useEffect(
    () => () => {
      const { id, allMarked: marked } = leaveState.current;
      if (id && marked) finishCheckIn(id);
    },
    [finishCheckIn],
  );

  // Past the deadline a mark would rewrite a day that is already decided — and revive a broken streak.
  const mark = (id: string, date: Date) => {
    if (!checkIn || Date.now() >= checkIn.deadline.getTime()) {
      close();
      return;
    }
    markDone(id, date);
  };

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  const finish = () => {
    if (checkIn) finishCheckIn(checkIn.id);
    close();
  };

  const nameOf = (mitzvah: { name: { he: string; en?: string } }) =>
    language === 'en' && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he;
  const title = checkIn ? t('checkin.title', { in: t(checkInPhraseKey(checkIn.block)) }) : t('checkin.empty');
  const deadline = checkIn
    ? t('checkin.deadline', {
        day: DateTime.fromJSDate(checkInLastDay(checkIn.block)).setLocale(language).toFormat('cccc'),
      })
    : '';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <Pressable
          onPress={close}
          accessibilityRole="button"
          hitSlop={10}
          style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
        >
          <Text style={[typography.captionBold, { color: colors.headerText }]}>{t('common.back')}</Text>
        </Pressable>
        <Text style={[typography.heading, { color: colors.headerText }]}>{title}</Text>
        {checkIn ? (
          <Text style={[typography.caption, { color: colors.headerSub, marginTop: 2 }]}>
            {t('checkin.subtitle', { deadline })}
          </Text>
        ) : null}
      </View>
      {checkIn ? (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            {checkIn.days.map((day) => (
              <View key={day.key} style={styles.day}>
                <Text style={[typography.captionBold, styles.dayTitle, { color: colors.textSub }]}>
                  {DateTime.fromJSDate(day.date)
                    .setLocale(language)
                    .toFormat(language === 'he' ? 'cccc · d LLLL' : 'cccc · LLL d')}
                </Text>
                <View style={styles.list}>
                  {day.items
                    .filter((item) => !item.done)
                    .map((item) => (
                      <MitzvahCard
                        key={item.mitzvah.id}
                        name={nameOf(item.mitzvah)}
                        timeLeft=""
                        pct={0}
                        hideProgress
                        statusText={t('checkin.pending')}
                        // The whole card marks it too: screen readers reach only the card, not the
                        // check button inside it.
                        onPress={() => mark(item.mitzvah.id, day.date)}
                        onComplete={() => mark(item.mitzvah.id, day.date)}
                      />
                    ))}
                </View>
                {day.items.some((item) => item.done) ? (
                  <View style={[styles.doneCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {day.items
                      .filter((item) => item.done)
                      .map((item) => (
                        <CompletedRow
                          key={item.mitzvah.id}
                          name={nameOf(item.mitzvah)}
                          time={DateTime.fromJSDate(item.window.start).toFormat('HH:mm')}
                          onUndo={() => unmark(item.mitzvah.id, day.date)}
                          undoLabel={t('home.undo')}
                        />
                      ))}
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
          <View style={styles.footer}>
            <Pressable onPress={finish} style={[styles.finishBtn, { backgroundColor: colors.gold }]}>
              <Text style={[typography.heading, { color: colors.onGold }]}>{t('checkin.finish')}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Text style={[typography.body, { color: colors.textSub, textAlign: 'center', paddingTop: 28 }]}>
          {t('checkin.empty')}
        </Text>
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
  day: {
    marginBottom: 14,
  },
  dayTitle: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  list: {
    gap: 8,
  },
  doneCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  finishBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
  },
});
