import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  Linking,
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
import * as Updates from 'expo-updates';
import { NavBar } from '@/components/NavBar';
import { MitzvahCard } from '@/components/MitzvahCard';
import { CompletedRow } from '@/components/CompletedRow';
import { HebrewDate } from '@/components/HebrewDate';
import { useNow } from '@/hooks/useNow';
import { getLocationName } from '@/data/cities';
import { MITZVOT } from '@/data/mitzvot';
import { hasSiddurText, siddurPlace } from '@/data/siddur';
import { customToMitzvah } from '@/data/customMitzvotAdapter';
import { useCustomMitzvotStore } from '@/stores/useCustomMitzvotStore';
import { HebcalService } from '@/services/HebcalService';
import { StorageService } from '@/services/StorageService';
import { CompletionService } from '@/services/CompletionService';
import { useCompletionsStore } from '@/stores/useCompletionsStore';
import { enabledSinceOf, useMitzvotStore } from '@/stores/useMitzvotStore';
import { useTaharahStore } from '@/stores/useTaharahStore';
import { useUserStore } from '@/stores/useUserStore';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from '@/theme/ThemeProvider';
import { useQuietBlock } from '@/components/ShabbatScreen';
import { shadowPresets, shadowStyle } from '@/theme/shadowStyle';
import { typography } from '@/theme/typography';
import { durations } from '@/theme/tokens';
import { isSkippedAt } from '@/utils/skipRules';
import { checkInLastDay, checkInPhraseKey, latestCheckIn, overlapsBlock } from '@/utils/checkIn';
import { ComputeContext, Mitzvah, MitzvahWindow } from '@/types/mitzvah';
import { TaharahEvent, TaharahSettings } from '@/types/taharah';
import { Location } from '@/types/zmanim';
import { deriveCycle } from '@/utils/taharah/cycle';
import { currentOnah } from '@/utils/taharah/onot';
import { renderHint, stageHint, visibleStage } from '@/utils/taharah/summary';
import { taharahTasksFor } from '@/utils/taharah/tasks';
import { ZmanimService } from '@/services/ZmanimService';
import {
  syncNotificationPermissionStatus,
  dismissCompletedPresentedNotifications,
  refreshSchedulingOnForeground,
} from '@/services/NotificationScheduler';
import { downloadNewUpdate, reloadIntoUpdate } from '@/services/appUpdates';
import { useI18n, t as translate } from '@/i18n';

type LiveItem = {
  mitzvah: Mitzvah;
  window: Exclude<MitzvahWindow, null>;
  pct: number;
  timeLeft: string;
  urgent: boolean;
  name: string;
  hasText: boolean;
};

const EMPTY_DAY_STATE = Object.freeze({}) as Record<string, number>;
const PROFILE_INTRO_KEY = 'profile:intro-dismissed';

type Translate = (scope: string, options?: Record<string, unknown>) => string;
type TaharahCardData = { title: string; caption: string; concealed: boolean };

function formatRemaining(ms: number, language: 'he' | 'en'): string {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  if (totalMin >= 60) {
    const hours = Math.floor(totalMin / 60);
    const minutes = String(totalMin % 60).padStart(2, '0');
    return `${hours}:${minutes} ${translate('time.unit.hours')}`;
  }
  return `${totalMin} ${translate('time.unit.minutes')}`;
}

const clockOf = (date: Date) => DateTime.fromJSDate(date).toFormat('HH:mm');

function taharahCardFor(
  events: readonly TaharahEvent[],
  settings: TaharahSettings,
  location: Location,
  now: Date,
  language: 'he' | 'en',
  t: Translate,
  lockEnabled: boolean,
): TaharahCardData {
  // The session is always locked while home is showing, so the stage and tasks must not leak onto it.
  if (lockEnabled) return { title: t('taharah.home.title'), caption: t('taharah.home.open'), concealed: true };
  const state = deriveCycle(events, settings.rules, location, now);
  const task = taharahTasksFor(now, events, settings, location, now).find((item) => !item.done && item.end > now);
  return {
    concealed: false,
    title: t(`taharah.stage.${visibleStage(state, settings.role, currentOnah(now, location), location)}`),
    caption: task
      ? `${t(`taharah.task.${task.kind}`)} · ${t('taharah.task.until', { time: clockOf(task.end) })}`
      : renderHint(
          stageHint(state, events, settings.rules, settings.role, location, now, {
            date: (civil) => DateTime.fromJSDate(civil).setLocale(language).toFormat('d LLLL'),
            clock: clockOf,
          }),
          t,
        ),
  };
}

function buildContext(date: Date): ComputeContext | null {
  const { location, nusach, halachicOpinions, inIsrael } = useUserStore.getState();
  const zmanim = ZmanimService.getZmanim(date, location);
  if (!zmanim) return null;
  return { date, location, settings: { nusach, halachicOpinions, inIsrael }, zmanim };
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const quiet = useQuietBlock() !== null;
  const { language, t } = useI18n();
  const router = useRouter();
  const { isUpdatePending } = Updates.useUpdates();
  const user = useUserStore(
    useShallow((s) => ({
      location: s.location,
      locationStatus: s.locationStatus,
      notificationPermission: s.notificationPermission,
    })),
  );
  const nusach = useUserStore((s) => s.nusach);
  const inIsrael = useUserStore((s) => s.inIsrael);
  const isOnboarded = useUserStore((s) => s.isOnboarded);
  const gender = useUserStore((s) => s.gender);
  const maritalStatus = useUserStore((s) => s.maritalStatus);
  const taharahEnabled = useUserStore((s) => s.taharahEnabled);
  const taharahEvents = useTaharahStore((s) => s.events);
  const taharahSettings = useTaharahStore((s) => s.settings);
  const taharahLockEnabled = useTaharahStore((s) => s.lockEnabled);
  const activeMap = useMitzvotStore((s) => s.activeMitzvot);
  const customMap = useCustomMitzvotStore((s) => s.items);
  const todayKey = CompletionService.getDateKey();
  const doneMap = useCompletionsStore((s) => s.completions[todayKey] ?? EMPTY_DAY_STATE);
  const skippedMap = useCompletionsStore((s) => s.skipped[todayKey] ?? EMPTY_DAY_STATE);
  const completions = useCompletionsStore((s) => s.completions);
  const checkIns = useCompletionsStore((s) => s.checkIns);
  const skipped = useCompletionsStore((s) => s.skipped);
  const [tick, setTick] = useState(0);
  // Only a memo dependency: each tick re-runs the memo, which reads the time itself.
  const tickedAt = useNow();
  const [stampingId, setStampingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [introDismissed, setIntroDismissed] = useState(() => StorageService.get<boolean>(PROFILE_INTRO_KEY) === true);
  const stampTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { current, missed, completed, nextUp, totalActive, doneCount, hebrewTitle, subtitle, zmanimUnavailable, checkIn, taharahCard } = useMemo(() => {
    const now = new Date();
    const ctx = buildContext(now);
    const hebrew = HebcalService.getHebrewDateAt(now, user.location);
    const greg = DateTime.fromJSDate(now).setLocale(language).toFormat(language === 'he' ? 'cccc · d LLLL' : 'cccc · LLL d');
    const parasha = HebcalService.getParasha(now, user.location);
    const subtitleText = [greg, getLocationName(user.location, language), parasha].filter(Boolean).join(' · ');

    const customs = Object.values(customMap)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(customToMitzvah);
    const allMitzvot = [...MITZVOT, ...customs].filter((m) => m.nuschaotSupported.includes(nusach));
    const enabled = allMitzvot.filter((mitzvah) => activeMap[mitzvah.id]?.enabled);
    const place = siddurPlace(user.location, inIsrael);
    const { halachicOpinions } = useUserStore.getState();
    const found = latestCheckIn(
      {
        mitzvot: enabled,
        completions,
        skipped,
        checkIns,
        enabledSince: enabledSinceOf(activeMap),
        location: user.location,
        settings: { nusach, halachicOpinions, inIsrael },
      },
      now,
    );
    const openCheckIn = found?.open ? found : null;
    const currentItems: LiveItem[] = [];
    const upcomingItems: LiveItem[] = [];
    const missedItems: LiveItem[] = [];
    const completedItems = Object.entries(doneMap)
      .filter(([mitzvahId]) => mitzvahId !== stampingId)
      .map(([mitzvahId, ts]) => {
        const mitzvah = allMitzvot.find((item) => item.id === mitzvahId);
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

    // Counts what actually applies today: enabled, has a window, and not skipped for Shabbat/Yom
    // Tov. Using `enabled.length` made Shabbat read "5/6" with everything applicable done.
    let applicable = 0;
    for (const mitzvah of enabled) {
      const window = ctx ? mitzvah.computeWindow(ctx) : null;
      if (!window) continue;
      if (isSkippedAt(mitzvah, window.start, user.location, { nusach, inIsrael })) continue;
      applicable += 1;
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
        hasText: hasSiddurText(mitzvah, nusach, now, place),
      };
      // The card being stamped stays put until its animation ends, even though the completion is
      // already persisted.
      if ((doneMap[mitzvah.id] || skippedMap[mitzvah.id]) && mitzvah.id !== stampingId) {
        continue;
      }
      if (now > window.end) {
        // Waiting in the check-in of the block that just ended, not missed.
        // Judged by the window itself, not by a date key, which differs once the device's zone is not
        // the location's.
        if (!openCheckIn || !overlapsBlock(window, openCheckIn.block)) missedItems.push(item);
      } else if (now >= window.start && now <= window.end) {
        currentItems.push(item);
      } else if (now < window.start) {
        upcomingItems.push(item);
      }
    }

    currentItems.sort((a, b) => a.window.end.getTime() - b.window.end.getTime());
    upcomingItems.sort((a, b) => a.window.start.getTime() - b.window.start.getTime());
    missedItems.sort((a, b) => b.window.end.getTime() - a.window.end.getTime());

    return {
      current: currentItems,
      missed: missedItems,
      completed: completedItems,
      nextUp: upcomingItems[0] ?? null,
      totalActive: applicable,
      doneCount: completedItems.length,
      hebrewTitle: hebrew.hebrewDateStr,
      subtitle: subtitleText,
      zmanimUnavailable: !ctx,
      checkIn: openCheckIn,
      taharahCard:
        taharahEnabled && !quiet
          ? taharahCardFor(taharahEvents, taharahSettings, user.location, now, language, t, taharahLockEnabled)
          : null,
    };
  }, [activeMap, customMap, doneMap, skippedMap, completions, skipped, checkIns, language, t, user.location, tick, stampingId, nusach, inIsrael, taharahEnabled, taharahEvents, taharahSettings, taharahLockEnabled, quiet, tickedAt]);

  // Persist first — the stamp is decoration. Deferring the write behind the 1.3s animation meant
  // leaving the screen mid-animation silently discarded the completion, and the `stampingId` gate
  // dropped every other card tapped during it. The card is held on screen while it animates.
  const complete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    CompletionService.markDone(id).catch(() => {});
    setSelectedId(null);
    setStampingId(id);
    if (stampTimeoutRef.current) clearTimeout(stampTimeoutRef.current);
    stampTimeoutRef.current = setTimeout(() => {
      setStampingId((current) => (current === id ? null : current));
      stampTimeoutRef.current = null;
    }, durations.stamp);
  };

  const skipToday = async (id: string) => {
    await CompletionService.markSkipped(id).catch(() => {});
    setSelectedId(null);
  };

  const undoComplete = async (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    await CompletionService.unmark(id).catch(() => {});
  };

  const openProfileIntro = () => {
    StorageService.set(PROFILE_INTRO_KEY, true);
    setIntroDismissed(true);
    router.push('/(tabs)/settings');
  };

  const openText = (item: LiveItem) =>
    item.hasText ? () => router.push({ pathname: '/siddur/[id]', params: { id: item.mitzvah.id, date: todayKey } }) : undefined;

  const openDetail = (id: string) => {
    if (id.startsWith('custom_')) {
      router.push({ pathname: '/custom-mitzvah', params: { id } });
    } else {
      router.push(`/mitzvah/${id}`);
    }
  };

  const selectedNameRaw = selectedId
    ? (() => {
        const standard = MITZVOT.find((item) => item.id === selectedId);
        if (standard) return language === 'en' && standard.name.en ? standard.name.en : standard.name.he;
        const custom = customMap[selectedId];
        return custom?.name;
      })()
    : undefined;
  const selectedName = selectedNameRaw;
  const selectedMitzvah = selectedId && selectedNameRaw ? { id: selectedId } : undefined;

  useEffect(() => {
    return () => {
      if (stampTimeoutRef.current) {
        clearTimeout(stampTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    syncNotificationPermissionStatus().catch(() => {});
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setTick((value) => value + 1);
        syncNotificationPermissionStatus().catch(() => {});
        dismissCompletedPresentedNotifications().catch(() => {});
        refreshSchedulingOnForeground().catch(() => {});
        downloadNewUpdate().catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <NavBar
        title={hebrewTitle}
        subtitle={subtitle}
        left={
          <View style={[styles.counter, { backgroundColor: `${colors.headerAccent}22` }]}>
            <Text style={[typography.small, { color: colors.headerAccent, fontFamily: 'Heebo_700Bold' }]}>
              {doneCount}/{Math.max(totalActive, doneCount)}
            </Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topInfo}>
          <HebrewDate location={user.location} showParasha />
        </View>

        {zmanimUnavailable ? (
          <Banner text={t('home.zmanimUnavailable')} color={colors.warning} background={`${colors.warning}18`} />
        ) : null}
        {user.locationStatus === 'missing' ? (
          <Banner text={t('home.noLocation')} color={colors.warning} background={`${colors.warning}18`} />
        ) : null}
        {user.locationStatus === 'timeout' ? (
          <Banner text={t('home.gpsTimeout')} color={colors.warning} background={`${colors.warning}18`} />
        ) : null}
        {checkIn ? (
          <Banner
            text={t('checkin.banner', {
              in: t(checkInPhraseKey(checkIn.block)),
              deadline: t('checkin.deadline', {
                day: DateTime.fromJSDate(checkInLastDay(checkIn.block)).setLocale(language).toFormat('cccc'),
              }),
            })}
            color={colors.gold}
            background={colors.goldLight}
            onPress={() => router.push('/checkin')}
          />
        ) : null}
        {user.notificationPermission !== 'granted' ? (
          <Banner
            text={t('home.notificationsDenied')}
            color={colors.urgent}
            background={colors.urgentBg}
            onPress={() => Linking.openSettings().catch(() => {})}
          />
        ) : null}
        {isUpdatePending ? (
          <Banner
            text={t('home.updateReady')}
            color={colors.safe}
            background={`${colors.safe}18`}
            onPress={() => reloadIntoUpdate()}
          />
        ) : null}
        {isOnboarded && (gender === null || maritalStatus === null) && !introDismissed ? (
          <Banner
            text={t('home.completeProfile')}
            color={colors.gold}
            background={colors.goldLight}
            onPress={openProfileIntro}
          />
        ) : null}

        <Pressable
          onPress={() => router.push('/siddur')}
          accessibilityRole="button"
          accessibilityLabel={t('siddur.catalog.open')}
          style={({ pressed }) => [
            styles.siddurRow,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
            shadowStyle(colors.shadow, shadowPresets.cardSoft),
          ]}
        >
          <View style={[styles.siddurIcon, { backgroundColor: colors.goldLight }]}>
            <Text style={{ fontSize: 15, color: colors.gold }}>✦</Text>
          </View>
          <View style={styles.siddurMeta}>
            <Text style={[typography.bodyBold, { color: colors.text }]}>{t('siddur.catalog.title')}</Text>
            <Text style={[typography.small, { color: colors.textMuted }]} numberOfLines={1}>
              {t('siddur.catalog.caption')}
            </Text>
          </View>
          <Text style={[typography.bodyBold, { color: colors.textMuted }]}>{language === 'he' ? '‹' : '›'}</Text>
        </Pressable>

        {taharahCard ? (
          <Pressable
            onPress={() => router.push('/taharah')}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.nextCard,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
              shadowStyle(colors.shadow, shadowPresets.cardSoft),
            ]}
          >
            {taharahCard.concealed ? null : (
              <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: 6 }]}>{t('taharah.home.title')}</Text>
            )}
            <Text style={[typography.heading, { color: colors.text }]}>{taharahCard.title}</Text>
            {taharahCard.caption ? (
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>{taharahCard.caption}</Text>
            ) : null}
          </Pressable>
        ) : null}

        {nextUp ? (
          <Pressable
            onPress={() => openDetail(nextUp.mitzvah.id)}
            onLongPress={() => setSelectedId(nextUp.mitzvah.id)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.nextCard,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
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
          </Pressable>
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
                  onOpenText={openText(item)}
                  onPress={() => openDetail(item.mitzvah.id)}
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

        <SectionLabel text={`${t('home.missed')} (${missed.length})`} />
        <View style={styles.list}>
          {missed.length ? (
            missed.map((item, index) => (
              <Animated.View key={item.mitzvah.id} entering={FadeInDown.delay(index * 30).duration(260)}>
                <MitzvahCard
                  name={item.name}
                  timeLeft={item.timeLeft}
                  pct={0}
                  urgent
                  stamping={stampingId === item.mitzvah.id}
                  onComplete={() => complete(item.mitzvah.id)}
                  onOpenText={openText(item)}
                  onPress={() => openDetail(item.mitzvah.id)}
                  onLongPress={() => setSelectedId(item.mitzvah.id)}
                />
              </Animated.View>
            ))
          ) : (
            <Text style={[typography.body, { color: colors.textMuted, padding: 14 }]}>{t('home.noMissed')}</Text>
          )}
        </View>

        <SectionLabel text={`${t('home.completed')} (${completed.length})`} />
        <View style={[styles.completedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {completed.map((item) => (
            <CompletedRow
              key={item.id}
              name={item.name}
              time={item.time}
              onPress={() => openDetail(item.id)}
              onUndo={() => undoComplete(item.id)}
              undoLabel={t('home.undo')}
            />
          ))}
          {!completed.length ? (
            <Text style={[typography.body, { color: colors.textMuted, padding: 18 }]}>-</Text>
          ) : null}
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent visible={Boolean(selectedMitzvah) && !quiet} onRequestClose={() => setSelectedId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.heading, { color: colors.text, marginBottom: 10 }]}>{t('home.quick.title')}</Text>
            <Text style={[typography.caption, { color: colors.textMuted, marginBottom: 14 }]}>{selectedName}</Text>
            <SheetAction
              label={t('home.quick.details')}
              onPress={() => {
                if (!selectedId) return;
                setSelectedId(null);
                openDetail(selectedId);
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
                openDetail(selectedId);
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

function Banner({
  text,
  color,
  background,
  onPress,
}: {
  text: string;
  color: string;
  background: string;
  onPress?: () => void;
}) {
  const content = <Text style={[typography.captionBold, { color }]}>{text}</Text>;
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.banner,
          { backgroundColor: background, borderColor: color, opacity: pressed ? 0.7 : 1 },
        ]}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }
  return (
    <View style={[styles.banner, { backgroundColor: background, borderColor: color }]}>
      {content}
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
  siddurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  siddurIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siddurMeta: {
    flex: 1,
    minWidth: 0,
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
