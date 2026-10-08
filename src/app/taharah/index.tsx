import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { DateTime } from 'luxon';
import { useShallow } from 'zustand/react/shallow';
import { ChipRow } from '@/components/ChipRow';
import { formatDayLine } from '@/components/DayStepper';
import { useQuietBlock } from '@/components/ShabbatScreen';
import { useNow } from '@/hooks/useNow';
import { useTaharahStore } from '@/stores/useTaharahStore';
import { useUserStore } from '@/stores/useUserStore';
import { ThemeColors } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';
import { BedikaResult, BedikaSlot, CleanDay, TaharahEvent, TaharahTask } from '@/types/taharah';
import { locationNoon } from '@/utils/locationDay';
import { cleanDayIndex, deriveCycle } from '@/utils/taharah/cycle';
import { civilHebrewDayAt, currentOnah, hebrewDay, onahIndex } from '@/utils/taharah/onot';
import { onahStartDate, renderHint, stageHint, visibleStage } from '@/utils/taharah/summary';
import { taharahTasksFor } from '@/utils/taharah/tasks';
import { kavuaHints, perishaOnot } from '@/utils/taharah/vestot';

type Translate = (scope: string, options?: Record<string, unknown>) => string;
type BedikaTarget = { day: number; slot: BedikaSlot };

const UPCOMING_LIMIT = 6;
const RECENT_LIMIT = 8;
const BEDIKA_SLOTS: BedikaSlot[] = ['morning', 'evening'];
const BEDIKA_RESULTS: BedikaResult[] = ['clean', 'notClean', 'doubtful'];

const clock = (date: Date) => DateTime.fromJSDate(date).toFormat('HH:mm');

function resultColor(colors: ThemeColors, result: BedikaResult | null): string {
  if (result === 'clean') return colors.safe;
  if (result === 'notClean') return colors.urgent;
  if (result === 'doubtful') return colors.warning;
  return colors.border;
}

function eventDate(event: TaharahEvent): Date {
  if (event.type === 'onset') return onahStartDate(event.onah);
  return hebrewDay(event.type === 'tevila' ? event.day - 1 : event.day).greg();
}

function eventDetail(event: TaharahEvent, t: Translate): string {
  switch (event.type) {
    case 'onset':
      return t(`taharah.onah.${event.onah.kind}`);
    case 'hefsek':
      return t(`taharah.bedika.result.${event.result}`);
    case 'bedika':
      return `${t(`taharah.bedika.${event.slot}`)} · ${t(`taharah.bedika.result.${event.result}`)}`;
    case 'tevila':
      return t('taharah.onah.night');
    case 'pause':
      return t(`taharah.pause.${event.reason}`);
    case 'ruling':
      return t(`taharah.ruling.${event.decision}`);
    default:
      return '';
  }
}

export default function TaharahDashboard() {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const router = useRouter();
  const { events, settings } = useTaharahStore(useShallow((s) => ({ events: s.events, settings: s.settings })));
  const addEvent = useTaharahStore((s) => s.addEvent);
  const removeEvent = useTaharahStore((s) => s.removeEvent);
  const location = useUserStore((s) => s.location);
  const now = useNow();
  const [bedika, setBedika] = useState<BedikaTarget | null>(null);
  const husband = settings.role === 'husband';

  const { state, tasks, upcoming, todayAbs, onah } = useMemo(() => {
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const onahNow = currentOnah(now, location);
    const current = onahIndex(onahNow);
    return {
      onah: onahNow,
      state: deriveCycle(events, settings.rules, location, now),
      tasks: taharahTasksFor(todayDate, events, settings, location, now),
      upcoming: perishaOnot(events, settings.rules).filter((entry) => onahIndex(entry.onah) >= current),
      todayAbs: civilHebrewDayAt(locationNoon(todayDate, location), location).abs(),
    };
  }, [events, settings, location, now]);
  const kavua = useMemo(() => kavuaHints(events), [events]);
  const recent = useMemo(
    () =>
      events
        .filter((event) => !husband || event.type === 'onset')
        .sort((a, b) => b.recordedAt - a.recordedAt)
        .slice(0, RECENT_LIMIT),
    [events, husband],
  );

  const stage = visibleStage(state, settings.role, onah, location);
  // The safek banner below already carries the safek line.
  const hint =
    stage === 'safek'
      ? ''
      : renderHint(
          stageHint(state, events, settings.rules, settings.role, location, now, {
            date: (civil) => formatDayLine(civil, language),
            clock,
          }),
          t,
        );
  const goLog = (type: string) => router.push({ pathname: '/taharah/log', params: { type } });
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  const openTask = (task: TaharahTask) => {
    if (task.kind === 'bedikaMorning') setBedika({ day: task.day, slot: 'morning' });
    else if (task.kind === 'bedikaEvening') setBedika({ day: task.day, slot: 'evening' });
    else if (task.kind === 'hefsek' || task.kind === 'tevila') goLog(task.kind);
  };
  const isActionable = (task: TaharahTask) =>
    task.kind === 'bedikaMorning' || task.kind === 'bedikaEvening' || task.kind === 'hefsek' || task.kind === 'tevila';

  const openCleanDay = (day: CleanDay) => {
    if (day.day > todayAbs) return;
    setBedika({ day: day.day, slot: day.morning === null ? 'morning' : 'evening' });
  };

  const showHefsek = !husband && (stage === 'niddah' || stage === 'awaitingHefsek');
  const showTevila = !husband && (stage === 'tevilaNight' || stage === 'awaitingTevila');
  const paused = stage === 'paused';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
          >
            <Text style={[typography.captionBold, { color: colors.headerText }]}>{t('common.back')}</Text>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/taharah/calendar')}
              accessibilityRole="button"
              style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
            >
              <Text style={[typography.captionBold, { color: colors.headerText }]}>{t('taharah.calendar.title')}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/taharah/settings')}
              accessibilityRole="button"
              style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
            >
              <Text style={[typography.captionBold, { color: colors.headerText }]}>{t('common.settings')}</Text>
            </Pressable>
          </View>
        </View>
        <Text style={[typography.heading, { color: colors.headerText }]}>{t('taharah.home.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.title, { color: colors.text }]}>{t(`taharah.stage.${stage}`)}</Text>
          {hint ? <Text style={[typography.body, { color: colors.textSub, marginTop: 4 }]}>{hint}</Text> : null}
          {state.tevilaDeferred ? (
            <Text style={[typography.captionBold, { color: colors.warning, marginTop: 8 }]}>{t('taharah.tevilaDeferred')}</Text>
          ) : null}
        </View>

        {!husband && state.stage === 'safek' && state.safekReason ? (
          <View style={[styles.banner, { backgroundColor: colors.urgentBg, borderColor: colors.urgentBorder }]}>
            <Text style={[typography.bodyBold, { color: colors.urgent }]}>{t(`taharah.safek.${state.safekReason}`)}</Text>
            <Text style={[typography.caption, { color: colors.urgent, marginTop: 4 }]}>{t('taharah.askRav')}</Text>
            <View style={styles.bannerActions}>
              {(['continue', 'restart'] as const).map((decision) => (
                <Pressable
                  key={decision}
                  onPress={() => addEvent({ type: 'ruling', day: todayAbs, decision })}
                  accessibilityRole="button"
                  style={[styles.bannerBtn, { backgroundColor: colors.surface, borderColor: colors.urgent }]}
                >
                  <Text style={[typography.captionBold, { color: colors.urgent }]}>{t(`taharah.ruling.${decision}`)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {kavua.map((pattern) => (
          <View
            key={pattern.kind}
            style={[styles.banner, { backgroundColor: colors.goldLight, borderColor: colors.gold }]}
          >
            <Text style={[typography.body, { color: colors.text }]}>
              {pattern.kind === 'date'
                ? t('taharah.kavuaHint.date', { day: pattern.dayOfMonth })
                : t('taharah.kavuaHint.interval', { days: pattern.days })}
            </Text>
          </View>
        ))}

        <Section title={t('taharah.today')}>
          {tasks.length ? (
            tasks.map((task, index) => (
              <TaskRow
                key={`${task.kind}-${task.day}-${index}`}
                task={task}
                last={index === tasks.length - 1}
                onPress={isActionable(task) ? () => openTask(task) : undefined}
              />
            ))
          ) : (
            <Text style={[typography.body, styles.empty, { color: colors.textSub }]}>{t('taharah.todayEmpty')}</Text>
          )}
        </Section>

        {!husband && state.cleanDays.length ? (
          <Section title={t('taharah.cleanDays.title')} plain>
            <View style={styles.cleanGrid}>
              {state.cleanDays.map((day) => (
                <CleanDayCell
                  key={day.day}
                  day={day}
                  current={day.day === todayAbs}
                  enabled={day.day <= todayAbs}
                  onPress={() => openCleanDay(day)}
                />
              ))}
            </View>
          </Section>
        ) : null}

        {upcoming.length ? (
          <Section title={t('taharah.perishaList')}>
            {upcoming.slice(0, UPCOMING_LIMIT).map((entry, index, list) => (
              <View
                key={onahIndex(entry.onah)}
                style={[styles.row, index < list.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
              >
                <View style={styles.rowMain}>
                  <Text style={[typography.bodyBold, { color: colors.text }]}>
                    {formatDayLine(onahStartDate(entry.onah), language)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSub }]}>
                    {entry.reasons.map((reason) => t(`taharah.reason.${reason}`)).join(' · ')}
                  </Text>
                  {entry.disputed ? (
                    <Text style={[typography.captionBold, { color: colors.warning }]}>{t('taharah.disputed')}</Text>
                  ) : null}
                </View>
                <Text style={[typography.captionBold, { color: colors.gold }]}>{t(`taharah.onah.${entry.onah.kind}`)}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        {recent.length ? (
          <Section title={t('taharah.history.title')}>
            {recent.map((event, index) => (
              <View
                key={event.id}
                style={[styles.row, index < recent.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
              >
                <View style={styles.rowMain}>
                  <Text style={[typography.bodyBold, { color: colors.text }]}>{t(`taharah.event.${event.type}`)}</Text>
                  <Text style={[typography.caption, { color: colors.textSub }]}>
                    {[formatDayLine(eventDate(event), language), eventDetail(event, t)].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {index === 0 ? (
                  <Pressable
                    onPress={() => removeEvent(event.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    style={[styles.undoBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[typography.small, { color: colors.gold, fontFamily: 'Heebo_700Bold' }]}>
                      {t('taharah.log.undo')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </Section>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <Pressable
          onPress={() => goLog('onset')}
          accessibilityRole="button"
          style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
        >
          <Text style={[typography.heading, { color: colors.onGold }]}>{t('taharah.log.onset')}</Text>
        </Pressable>
        {husband ? null : (
          <View style={styles.secondaryRow}>
            {showHefsek ? (
              <SecondaryButton label={t('taharah.task.hefsek')} onPress={() => goLog('hefsek')} />
            ) : null}
            {showTevila ? (
              <SecondaryButton label={t('taharah.log.tevila')} onPress={() => goLog('tevila')} />
            ) : null}
            {paused ? (
              <SecondaryButton
                label={t('taharah.log.resume')}
                onPress={() => addEvent({ type: 'resume', day: todayAbs })}
              />
            ) : (
              <SecondaryButton label={t('taharah.log.pause')} onPress={() => goLog('pause')} />
            )}
          </View>
        )}
      </View>

      <BedikaSheet
        target={bedika}
        index={bedika ? cleanDayIndex(state, bedika.day) : null}
        past={bedika ? bedika.day < todayAbs : false}
        onClose={() => setBedika(null)}
        onSave={(day, slot, result) => {
          addEvent({ type: 'bedika', day, slot, result });
          setBedika(null);
        }}
      />
    </SafeAreaView>
  );
}

function Section({ title, plain = false, children }: { title: string; plain?: boolean; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[typography.captionBold, styles.sectionTitle, { color: colors.textSub }]}>{title}</Text>
      {plain ? (
        children
      ) : (
        <View style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>
      )}
    </View>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.secondaryBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
    >
      <Text style={[typography.captionBold, { color: colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function TaskRow({ task, last, onPress }: { task: TaharahTask; last: boolean; onPress?: () => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const timeLine =
    task.kind === 'tevila'
      ? t('taharah.task.from', { time: clock(task.start) })
      : t('taharah.task.until', { time: clock(task.end) });
  const details = [
    timeLine,
    task.cleanDayIndex ? t('taharah.cleanDays.day', { index: task.cleanDayIndex }) : null,
    task.reasons?.length ? task.reasons.map((reason) => t(`taharah.reason.${reason}`)).join(' · ') : null,
  ].filter(Boolean);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[
        styles.row,
        { opacity: task.done ? 0.6 : 1 },
        !last && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}
    >
      <View style={styles.rowMain}>
        <Text style={[typography.bodyBold, { color: colors.text }]}>{t(`taharah.task.${task.kind}`)}</Text>
        <Text style={[typography.caption, { color: colors.textSub }]}>{details.join(' · ')}</Text>
        {task.disputed ? (
          <Text style={[typography.captionBold, { color: colors.warning }]}>{t('taharah.disputed')}</Text>
        ) : null}
      </View>
      {task.done ? (
        <Text style={[typography.captionBold, { color: colors.safe }]}>✓ {t('taharah.task.done')}</Text>
      ) : (
        <View
          style={[
            styles.badge,
            task.required
              ? { backgroundColor: colors.goldLight, borderColor: colors.gold }
              : { backgroundColor: colors.surface2, borderColor: colors.border },
          ]}
        >
          <Text style={[typography.micro, { color: task.required ? colors.text : colors.textSub, fontFamily: 'Heebo_700Bold' }]}>
            {task.required ? t('taharah.task.required') : t('taharah.task.recommended')}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function CleanDayCell({
  day,
  current,
  enabled,
  onPress,
}: {
  day: CleanDay;
  current: boolean;
  enabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      style={[
        styles.cleanCell,
        {
          backgroundColor: current ? `${colors.gold}18` : colors.surface,
          borderColor: current ? colors.gold : colors.border,
          opacity: enabled ? 1 : 0.55,
        },
      ]}
    >
      <Text style={[typography.micro, { color: colors.textMuted }]} numberOfLines={1}>
        {t('taharah.cleanDays.day', { index: day.index })}
      </Text>
      <Text style={[typography.bodyBold, { color: colors.text }]}>{hebrewDay(day.day).greg().getDate()}</Text>
      <View style={styles.dots}>
        {[day.morning, day.evening].map((result, slot) => (
          <View
            key={slot}
            style={[
              styles.dot,
              {
                backgroundColor: result === null ? 'transparent' : resultColor(colors, result),
                borderColor: resultColor(colors, result),
              },
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
}

type SheetProps = {
  target: BedikaTarget | null;
  index: number | null;
  past: boolean;
  onClose: () => void;
  onSave: (day: number, slot: BedikaSlot, result: BedikaResult) => void;
};

function BedikaSheet({ target, index, past, onClose, onSave }: SheetProps) {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const quiet = useQuietBlock() !== null;
  const [slot, setSlot] = useState<BedikaSlot>('morning');
  const [result, setResult] = useState<BedikaResult>('clean');

  useEffect(() => {
    if (!target) return;
    setSlot(target.slot);
    setResult('clean');
  }, [target]);

  const subtitle = target
    ? [formatDayLine(hebrewDay(target.day).greg(), language), index ? t('taharah.cleanDays.day', { index }) : null]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <Modal animationType="fade" transparent visible={target !== null && !quiet} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.heading, { color: colors.text }]}>{t('taharah.bedika.record')}</Text>
          <Text style={[typography.caption, { color: colors.textSub, marginTop: 2, marginBottom: 14 }]}>{subtitle}</Text>
          <ChipRow values={BEDIKA_SLOTS} selected={slot} onSelect={setSlot} renderLabel={(value) => t(`taharah.bedika.${value}`)} />
          <ChipRow
            values={BEDIKA_RESULTS}
            selected={result}
            onSelect={setResult}
            renderLabel={(value) => t(`taharah.bedika.result.${value}`)}
            style={styles.resultRow}
          />
          {past ? (
            <Text style={[typography.caption, { color: colors.textMuted, marginTop: 12 }]}>{t('taharah.bedika.pastDay')}</Text>
          ) : null}
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} accessibilityRole="button" style={[styles.modalBtn, { backgroundColor: colors.surface2 }]}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              onPress={() => target && onSave(target.day, slot, result)}
              accessibilityRole="button"
              style={[styles.modalBtn, { backgroundColor: colors.gold }]}
            >
              <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('common.save')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  content: {
    padding: 14,
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  banner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  bannerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  bannerBtn: {
    flexGrow: 1,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    paddingHorizontal: 4,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
  empty: {
    padding: 14,
    textAlign: 'center',
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  undoBtn: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cleanGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cleanCell: {
    flexGrow: 1,
    flexBasis: 38,
    alignItems: 'center',
    gap: 2,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  resultRow: {
    marginTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,20,32,0.55)',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
});
