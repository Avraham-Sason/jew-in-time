import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { DateTime } from 'luxon';
import { useShallow } from 'zustand/react/shallow';
import { ChipRow } from '@/components/ChipRow';
import { DayStepper, formatDayLine } from '@/components/DayStepper';
import { useNow } from '@/hooks/useNow';
import { HebcalService } from '@/services/HebcalService';
import { ZmanimService } from '@/services/ZmanimService';
import { useTaharahStore } from '@/stores/useTaharahStore';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';
import { BedikaResult, OnahKind, PauseReason } from '@/types/taharah';
import { TIME_PATTERN } from '@/utils/clock';
import { locationNoon } from '@/utils/locationDay';
import { HefsekOutcome, deriveCycle, earliestTevilaNight, hefsekOutcome } from '@/utils/taharah/cycle';
import { OnahResolution, civilHebrewDayAt, currentOnah, hebrewDay, onahAt, onahIndex } from '@/utils/taharah/onot';

const LOG_TYPES = ['onset', 'hefsek', 'tevila', 'pause'] as const;
type LogType = (typeof LOG_TYPES)[number];
const HUSBAND_TYPES: readonly LogType[] = ['onset', 'tevila'];

const TYPE_LABEL: Record<LogType, string> = {
  onset: 'taharah.log.onset',
  hefsek: 'taharah.event.hefsek',
  tevila: 'taharah.log.tevila',
  pause: 'taharah.log.pause',
};

const SAVED_DELAY_MS = 700;
const ONAH_KINDS: OnahKind[] = ['day', 'night'];
const BEDIKA_RESULTS: BedikaResult[] = ['clean', 'notClean', 'doubtful'];
const PAUSE_REASONS: PauseReason[] = ['pregnancy', 'postpartum', 'menopause', 'other'];

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const hebrewDateOf = (abs: number) => HebcalService.getHebrewDate(hebrewDay(abs).greg()).hebrewDateStr;
const HEFSEK_BLOCKED_KEY: Partial<Record<HefsekOutcome, string>> = {
  noCycle: 'taharah.log.hefsekNoCycle',
  tahor: 'taharah.log.hefsekAfterTevila',
  restartsCount: 'taharah.log.hefsekDuringCount',
};

export default function TaharahLog() {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const router = useRouter();
  const { type: rawType } = useLocalSearchParams<{ type?: string }>();
  const { events, settings } = useTaharahStore(useShallow((s) => ({ events: s.events, settings: s.settings })));
  const addEvent = useTaharahStore((s) => s.addEvent);
  const location = useUserStore((s) => s.location);
  const now = useNow();
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const types: readonly LogType[] = settings.role === 'husband' ? HUSBAND_TYPES : LOG_TYPES;
  const [type, setType] = useState<LogType>(() => types.find((value) => value === rawType) ?? 'onset');
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [time, setTime] = useState(() => DateTime.now().setZone(location.tz).toFormat('HH:mm'));
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [kind, setKind] = useState<OnahKind>('day');
  const [result, setResult] = useState<BedikaResult>('clean');
  // Off until she says so: the switch records what was placed, not what the custom expects.
  const [moch, setMoch] = useState(false);
  const [reason, setReason] = useState<PauseReason | null>(null);
  const [saved, setSaved] = useState(false);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/taharah');
  }, [router]);

  useEffect(() => {
    if (!saved) return undefined;
    const timeout = setTimeout(close, SAVED_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [saved, close]);

  const today = startOfDay(now);
  const isToday = date.getTime() === today.getTime();
  const dayAbs = useMemo(() => civilHebrewDayAt(locationNoon(date, location), location).abs(), [date, location]);
  const state = useMemo(
    () => deriveCycle(events, settings.rules, location, now),
    [events, settings.rules, location, now],
  );

  const instant = useMemo(() => {
    if (timeUnknown || !TIME_PATTERN.test(time)) return null;
    const [hour, minute] = time.split(':').map(Number);
    return DateTime.fromObject(
      { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate(), hour, minute },
      { zone: location.tz },
    ).toJSDate();
  }, [timeUnknown, time, date, location.tz]);

  const resolution = useMemo<OnahResolution | null>(() => {
    if (timeUnknown) return { onah: { abs: dayAbs + (kind === 'night' ? 1 : 0), kind }, doubtful: false };
    if (!instant) return null;
    return onahAt(instant, location) ?? { onah: currentOnah(instant, location), doubtful: false };
  }, [timeUnknown, kind, dayAbs, instant, location]);

  const zmanim = useMemo(() => ZmanimService.getZmanim(locationNoon(date, location), location), [date, location]);
  const shkia = zmanim?.shkia ?? null;
  const tzeit = zmanim?.tzeitHakochavim ?? null;
  const afterSunsetAt = (at: Date) => isToday && shkia !== null && at.getTime() > shkia.getTime();
  const afterSunset = type === 'hefsek' && afterSunsetAt(new Date());
  const timeInFuture = type === 'onset' && instant !== null && instant.getTime() > Date.now();

  const latestBegunOnah = useMemo(() => {
    const resolved = onahAt(now, location);
    return resolved ? onahIndex(resolved.onah) + (resolved.doubtful ? 1 : 0) : onahIndex(currentOnah(now, location));
  }, [now, location]);
  const onahInFuture =
    type === 'onset' && timeUnknown && resolution !== null && onahIndex(resolution.onah) > latestBegunOnah;

  const hefsekVerdict = type === 'hefsek' ? hefsekOutcome(state, dayAbs, result) : 'accepted';
  const hefsekEarliest =
    state.hefsekEarliestDay === null ? '' : formatDayLine(hebrewDay(state.hefsekEarliestDay).greg(), language);
  const hefsekBlockedKey = HEFSEK_BLOCKED_KEY[hefsekVerdict];
  const hefsekBlockedText =
    hefsekVerdict === 'tooEarly'
      ? t('taharah.log.hefsekTooEarly', { date: hefsekEarliest })
      : hefsekBlockedKey
        ? t(hefsekBlockedKey)
        : null;

  const isWoman = settings.role === 'woman';
  const firstTevilaNight = earliestTevilaNight(state, location);
  const tevilaNeedsHefsek = type === 'tevila' && isWoman && state.hefsekDay === null;
  const tevilaTooEarly = type === 'tevila' && isWoman && firstTevilaNight !== null && dayAbs + 1 < firstTevilaNight;
  const tevilaBeforeTzeit = type === 'tevila' && isToday && tzeit !== null && now.getTime() < tzeit.getTime();

  const canSave =
    !saved &&
    {
      onset: resolution !== null && !timeInFuture && !onahInFuture,
      hefsek: hefsekBlockedText === null && !afterSunset,
      tevila: !tevilaNeedsHefsek && !tevilaTooEarly && !tevilaBeforeTzeit,
      pause: reason !== null,
    }[type];

  const save = () => {
    if (!canSave) return;
    if (type === 'hefsek' && afterSunsetAt(new Date())) {
      refresh();
      return;
    }
    if (type === 'onset' && resolution) {
      addEvent({ type: 'onset', onah: resolution.onah, doubtful: resolution.doubtful, instant: instant?.getTime() });
    } else if (type === 'hefsek') {
      addEvent({ type: 'hefsek', day: dayAbs, result, moch });
    } else if (type === 'tevila') {
      addEvent({ type: 'tevila', day: dayAbs + 1 });
    } else if (type === 'pause' && reason) {
      addEvent({ type: 'pause', day: dayAbs, reason });
    }
    setSaved(true);
  };

  const timeInvalid = !timeUnknown && !instant;

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
        <Text style={[typography.heading, { color: colors.headerText }]}>{t('taharah.log.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ChipRow values={types} selected={type} onSelect={setType} renderLabel={(value) => t(TYPE_LABEL[value])} />

        <Text style={[typography.captionBold, styles.label, { color: colors.textSub }]}>{t('taharah.log.date')}</Text>
        <DayStepper value={date} onChange={setDate} max={today} />

        {type === 'onset' ? (
          <>
            <Text style={[typography.captionBold, styles.label, { color: colors.textSub }]}>
              {timeUnknown ? t('taharah.log.onahChoice') : t('taharah.log.time')}
            </Text>
            {timeUnknown ? (
              <ChipRow
                values={ONAH_KINDS}
                selected={kind}
                onSelect={setKind}
                renderLabel={(value) => t(`taharah.onah.${value}`)}
              />
            ) : (
              <>
                <TextInput
                  value={time}
                  onChangeText={setTime}
                  placeholder="HH:mm"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface2,
                      color: colors.text,
                      borderColor: timeInvalid ? colors.urgent : colors.border,
                    },
                  ]}
                />
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 6 }]}>
                  {t('custom.timeFormatHint')}
                </Text>
              </>
            )}
            <View style={styles.switchRow}>
              <Text style={[typography.bodyBold, styles.switchLabel, { color: colors.text }]}>
                {t('taharah.log.timeUnknown')}
              </Text>
              <Switch
                value={timeUnknown}
                onValueChange={setTimeUnknown}
                thumbColor="#fff"
                trackColor={{ false: colors.border, true: colors.gold }}
              />
            </View>
            {resolution ? (
              <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>
                  {hebrewDateOf(resolution.onah.abs)} · {t(`taharah.onah.${resolution.onah.kind}`)}
                </Text>
              </View>
            ) : null}
            {timeInFuture ? <Notice tone="urgent" text={t('taharah.log.timeInFuture')} /> : null}
            {onahInFuture ? <Notice tone="urgent" text={t('taharah.log.onahInFuture')} /> : null}
            {resolution?.doubtful ? <Notice tone="warning" text={t('taharah.log.doubtfulOnset')} /> : null}
          </>
        ) : null}

        {type === 'hefsek' ? (
          <>
            <Text style={[typography.captionBold, styles.label, { color: colors.textSub }]}>
              {t('taharah.log.resultLabel')}
            </Text>
            <ChipRow
              values={BEDIKA_RESULTS}
              selected={result}
              onSelect={setResult}
              renderLabel={(value) => t(`taharah.bedika.result.${value}`)}
            />
            <View style={styles.switchRow}>
              <Text style={[typography.bodyBold, styles.switchLabel, { color: colors.text }]}>
                {t('taharah.log.moch')}
              </Text>
              <Switch
                value={moch}
                onValueChange={setMoch}
                thumbColor="#fff"
                trackColor={{ false: colors.border, true: colors.gold }}
              />
            </View>
            <Text style={[typography.small, { color: colors.textMuted }]}>
              {`${t('taharah.rule.mochDachuk')}: ${t(`taharah.moch.${settings.rules.mochDachuk}`)}`}
            </Text>
            {!moch && settings.rules.mochDachuk === 'required' ? (
              <Notice tone="warning" text={t('taharah.log.mochRequired')} />
            ) : null}
            {hefsekBlockedText ? <Notice tone="urgent" text={hefsekBlockedText} /> : null}
            {hefsekVerdict === 'notClean' ? <Notice tone="warning" text={t('taharah.log.hefsekNotClean')} /> : null}
            {afterSunset ? <Notice tone="urgent" text={t('taharah.log.hefsekAfterSunset')} /> : null}
          </>
        ) : null}

        {type === 'tevila' ? (
          <>
            <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>
                {t('taharah.onah.night')} · {hebrewDateOf(dayAbs + 1)}
              </Text>
            </View>
            {tevilaNeedsHefsek ? <Notice tone="urgent" text={t('taharah.log.tevilaNeedsHefsek')} /> : null}
            {tevilaTooEarly && firstTevilaNight !== null ? (
              <Notice
                tone="urgent"
                text={t('taharah.log.tevilaTooEarly', {
                  date: formatDayLine(hebrewDay(firstTevilaNight - 1).greg(), language),
                })}
              />
            ) : null}
            {tevilaBeforeTzeit && tzeit !== null ? (
              <Notice
                tone="urgent"
                text={t('taharah.log.tevilaBeforeTzeit', {
                  time: DateTime.fromJSDate(tzeit).setZone(location.tz).toFormat('HH:mm'),
                })}
              />
            ) : null}
          </>
        ) : null}

        {type === 'pause' ? (
          <>
            <Text style={[typography.captionBold, styles.label, { color: colors.textSub }]}>
              {t('taharah.log.pauseReason')}
            </Text>
            <ChipRow
              values={PAUSE_REASONS}
              selected={reason}
              onSelect={setReason}
              renderLabel={(value) => t(`taharah.pause.${value}`)}
            />
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={save}
          disabled={!canSave}
          accessibilityRole="button"
          style={[styles.saveBtn, { backgroundColor: colors.gold, opacity: canSave || saved ? 1 : 0.45 }]}
        >
          <Text style={[typography.heading, { color: colors.onGold }]}>
            {saved ? `✓ ${t('taharah.log.saved')}` : t('common.save')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Notice({ tone, text }: { tone: 'urgent' | 'warning'; text: string }) {
  const { colors } = useTheme();
  const accent = tone === 'urgent' ? colors.urgent : colors.warning;
  return (
    <View
      style={[
        styles.notice,
        { borderColor: accent, backgroundColor: tone === 'urgent' ? colors.urgentBg : colors.goldLight },
      ]}
    >
      <Text style={[typography.caption, { color: accent }]}>{text}</Text>
    </View>
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
    padding: 16,
    paddingBottom: 28,
  },
  label: {
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  switchLabel: {
    flex: 1,
  },
  preview: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  notice: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
  },
});
