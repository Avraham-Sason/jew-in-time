import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DateTime } from 'luxon';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { NavBar } from '@/components/NavBar';
import { MitzvahCard } from '@/components/MitzvahCard';
import { CompletedRow } from '@/components/CompletedRow';
import { HebrewDate } from '@/components/HebrewDate';
import { getLocationName } from '@/data/cities';
import { MITZVOT } from '@/data/mitzvot';
import { HebcalService } from '@/services/HebcalService';
import { CompletionService } from '@/services/CompletionService';
import { useCompletionsStore } from '@/stores/useCompletionsStore';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from '@/theme/ThemeProvider';
import { shadowPresets, shadowStyle } from '@/theme/shadowStyle';
import { typography } from '@/theme/typography';
import { ComputeContext, Mitzvah, MitzvahWindow } from '@/types/mitzvah';
import { ZmanimService } from '@/services/ZmanimService';
import { useI18n, t as translate } from '@/i18n';

type LiveItem = {
  mitzvah: Mitzvah;
  window: Exclude<MitzvahWindow, null>;
  pct: number;
  timeLeft: string;
  urgent: boolean;
  name: string;
};

const EMPTY_DAY_STATE = Object.freeze({}) as Record<string, number>;

function formatRemaining(ms: number, language: 'he' | 'en'): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  if (totalMin >= 60) {
    const hours = Math.floor(totalMin / 60);
    const minutes = String(totalMin % 60).padStart(2, '0');
    return `${hours}:${minutes} ${translate('time.unit.hours')}`;
  }
  return `${totalMin} ${translate('time.unit.minutes')}`;
}

function buildContext(date: Date) {
  const { location, nusach, halachicOpinions, inIsrael } = useUserStore.getState();
  return {
    date,
    location,
    settings: { nusach, halachicOpinions, inIsrael },
    zmanim: ZmanimService.getZmanim(date, location),
  } satisfies ComputeContext;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const router = useRouter();
  const user = useUserStore(
    useShallow((s) => ({
      location: s.location,
      locationStatus: s.locationStatus,
      notificationPermission: s.notificationPermission,
    })),
  );
  const activeMap = useMitzvotStore((s) => s.activeMitzvot);
  const todayKey = CompletionService.getDateKey();
  const doneMap = useCompletionsStore((s) => s.completions[todayKey] ?? EMPTY_DAY_STATE);
  const skippedMap = useCompletionsStore((s) => s.skipped[todayKey] ?? EMPTY_DAY_STATE);
  const [stampingId, setStampingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stampTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { current, completed, nextUp, totalActive, doneCount, hebrewTitle, subtitle } = useMemo(() => {
    const now = new Date();
    const ctx = buildContext(now);
    const hebrew = HebcalService.getHebrewDate(now);
    const greg = DateTime.fromJSDate(now).setLocale(language).toFormat(language === 'he' ? 'cccc · d LLLL' : 'cccc · LLL d');
    const parasha = HebcalService.getParasha(now, user.location);
    const subtitleText = [greg, getLocationName(user.location, language), parasha].filter(Boolean).join(' · ');

    const enabled = MITZVOT.filter((mitzvah) => activeMap[mitzvah.id]?.enabled);
    const currentItems: LiveItem[] = [];
    const upcomingItems: LiveItem[] = [];
    const completedItems = Object.entries(doneMap)
      .map(([mitzvahId, ts]) => {
        const mitzvah = MITZVOT.find((item) => item.id === mitzvahId);
        if (!mitzvah) return null;
        return {
          id: mitzvahId,
          name: language === 'en' && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he,
          time: DateTime.fromMillis(ts).toFormat('HH:mm'),
          timestamp: ts,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.timestamp ?? 0) - (a?.timestamp ?? 0)) as Array<{ id: string; name: string; time: string }>;

    for (const mitzvah of enabled) {
      const window = mitzvah.computeWindow(ctx);
      if (!window) continue;
      const name = language === 'en' && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he;
      const totalMs = window.end.getTime() - window.start.getTime();
      const remainingMs = window.end.getTime() - now.getTime();
      const item: LiveItem = {
        mitzvah,
        window,
        pct: totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0,
        timeLeft: formatRemaining(remainingMs, language),
        urgent: remainingMs <= 45 * 60 * 1000,
        name,
      };
      if (doneMap[mitzvah.id] || skippedMap[mitzvah.id]) {
        continue;
      }
      if (now >= window.start && now <= window.end) {
        currentItems.push(item);
      } else if (now < window.start) {
        upcomingItems.push(item);
      }
    }

    currentItems.sort((a, b) => a.window.end.getTime() - b.window.end.getTime());
    upcomingItems.sort((a, b) => a.window.start.getTime() - b.window.start.getTime());

    return {
      current: currentItems,
      completed: completedItems,
      nextUp: upcomingItems[0] ?? null,
      totalActive: enabled.length,
      doneCount: completedItems.length,
      hebrewTitle: hebrew.hebrewDateStr,
      subtitle: subtitleText,
    };
  }, [activeMap, doneMap, skippedMap, language, user.location]);

  const complete = async (id: string) => {
    if (stampingId) return;
    setStampingId(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    stampTimeoutRef.current = setTimeout(() => {
      CompletionService.markDone(id).catch(() => {});
      setStampingId(null);
      setSelectedId(null);
      stampTimeoutRef.current = null;
    }, 1300);
  };

  const skipToday = async (id: string) => {
    await CompletionService.markSkipped(id).catch(() => {});
    setSelectedId(null);
  };

  const selectedMitzvah = selectedId ? MITZVOT.find((item) => item.id === selectedId) : undefined;
  const selectedName =
    selectedMitzvah && language === 'en' && selectedMitzvah.name.en
      ? selectedMitzvah.name.en
      : selectedMitzvah?.name.he;

  useEffect(() => {
    return () => {
      if (stampTimeoutRef.current) {
        clearTimeout(stampTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <NavBar
        title={hebrewTitle}
        subtitle={subtitle}
        left={
          <View style={[styles.counter, { backgroundColor: `${colors.gold}22` }]}>
            <Text style={[typography.small, { color: colors.gold, fontFamily: 'Heebo_700Bold' }]}>
              {doneCount}/{Math.max(totalActive, doneCount)}
            </Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topInfo}>
          <HebrewDate location={user.location} showParasha />
        </View>

        {user.locationStatus === 'missing' ? (
          <Banner text={t('home.noLocation')} color={colors.warning} background={`${colors.warning}18`} />
        ) : null}
        {user.locationStatus === 'timeout' ? (
          <Banner text={t('home.gpsTimeout')} color={colors.warning} background={`${colors.warning}18`} />
        ) : null}
        {user.notificationPermission === 'denied' ? (
          <Banner text={t('home.notificationsDenied')} color={colors.urgent} background={colors.urgentBg} />
        ) : null}

        {nextUp ? (
          <View
            style={[
              styles.nextCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadowStyle(colors.shadow, shadowPresets.cardSoft),
            ]}
          >
            <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: 6 }]}>{t('home.nextUp')}</Text>
            <Text style={[typography.heading, { color: colors.text }]}>{nextUp.name}</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
              {DateTime.fromJSDate(nextUp.window.start).toFormat('HH:mm')} · {t('detail.timeRange', {
                start: DateTime.fromJSDate(nextUp.window.start).toFormat('HH:mm'),
                end: DateTime.fromJSDate(nextUp.window.end).toFormat('HH:mm'),
              })}
            </Text>
          </View>
        ) : null}

        <SectionLabel text={t('home.relevantNow')} />
        <View style={styles.list}>
          {current.length ? (
            current.map((item, index) => (
              <Animated.View key={item.mitzvah.id} entering={FadeInDown.delay(index * 40).duration(280)}>
                <MitzvahCard
                  name={item.name}
                  timeLeft={item.timeLeft}
                  pct={item.pct}
                  urgent={item.urgent}
                  stamping={stampingId === item.mitzvah.id}
                  onComplete={() => complete(item.mitzvah.id)}
                  onLongPress={() => setSelectedId(item.mitzvah.id)}
                />
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyStar, { color: colors.gold }]}>✦</Text>
              <Text style={[typography.body, { color: colors.textSub, textAlign: 'center' }]}>
                {doneCount >= totalActive && totalActive > 0 ? t('home.allDone') : t('home.noActive')}
              </Text>
            </View>
          )}
        </View>

        <SectionLabel text={`${t('home.completed')} (${completed.length})`} />
        <View style={[styles.completedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {completed.map((item) => (
            <CompletedRow key={item.id} name={item.name} time={item.time} />
          ))}
          {!completed.length ? (
            <Text style={[typography.body, { color: colors.textMuted, padding: 18 }]}>-</Text>
          ) : null}
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent visible={Boolean(selectedMitzvah)} onRequestClose={() => setSelectedId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.heading, { color: colors.text, marginBottom: 10 }]}>{t('home.quick.title')}</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 14 }]}>{selectedName}</Text>
            <SheetAction
              label={t('home.quick.details')}
              onPress={() => {
                if (!selectedId) return;
                setSelectedId(null);
                router.push(`/mitzvah/${selectedId}`);
              }}
            />
            <SheetAction
              label={t('home.quick.skipToday')}
              onPress={() => {
                if (!selectedId) return;
                skipToday(selectedId);
              }}
            />
            <SheetAction
              label={t('home.quick.edit')}
              onPress={() => {
                if (!selectedId) return;
                setSelectedId(null);
                router.push(`/mitzvah/${selectedId}`);
              }}
            />
            <Pressable onPress={() => setSelectedId(null)} style={[styles.closeBtn, { backgroundColor: colors.surface2 }]}>
              <Text style={[typography.bodyBold, { color: colors.textSub }]}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Banner({ text, color, background }: { text: string; color: string; background: string }) {
  return (
    <View style={[styles.banner, { backgroundColor: background, borderColor: color }]}>
      <Text style={[typography.captionBold, { color }]}>{text}</Text>
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  const { colors } = useTheme();
  return <Text style={[typography.captionBold, styles.sectionLabel, { color: colors.textSub }]}>{text}</Text>;
}

function SheetAction({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.sheetAction, { borderBottomColor: colors.border }]}>
      <Text style={[typography.subheading, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  topInfo: {
    paddingTop: 6,
    paddingBottom: 12,
  },
  counter: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  nextCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  sectionLabel: {
    marginTop: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  list: {
    marginBottom: 8,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyStar: {
    fontSize: 32,
    marginBottom: 10,
  },
  completedCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(9,20,32,0.4)',
    padding: 16,
  },
  sheet: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  sheetAction: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 14,
  },
});
