import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { DateTime } from 'luxon';
import { ReminderEditor } from '@/components/ReminderEditor';
import { MITZVOT, findMitzvah } from '@/data/mitzvot';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { Reminder } from '@/types/mitzvah';
import { ZmanimService } from '@/services/ZmanimService';
import { useI18n } from '@/i18n';

function nextWindowFor(id: string) {
  const mitzvah = findMitzvah(id);
  if (!mitzvah) return null;
  const { location, nusach, halachicOpinions, inIsrael } = useUserStore.getState();
  const dates = [new Date(), new Date(Date.now() + 24 * 60 * 60 * 1000)];
  for (const date of dates) {
    const ctx = {
      date,
      location,
      settings: { nusach, halachicOpinions, inIsrael },
      zmanim: ZmanimService.getZmanim(date, location),
    };
    const window = mitzvah.computeWindow(ctx);
    if (window && window.end.getTime() > Date.now()) return window;
  }
  return null;
}

export default function MitzvahDetailScreen() {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const mitzvah = useMemo(() => findMitzvah(params.id), [params.id]);
  const user = useUserStore();
  const active = useMitzvotStore((s) => s.activeMitzvot[params.id] ?? { enabled: false });
  const setEnabled = useMitzvotStore((s) => s.setEnabled);
  const setReminders = useMitzvotStore((s) => s.setReminders);
  const resetToDefault = useMitzvotStore((s) => s.resetToDefault);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const reminders = active.customReminders ?? mitzvah?.defaultReminders ?? [];
  const window = params.id ? nextWindowFor(params.id) : null;
  const nextTrigger = useMemo(() => {
    if (!window) return null;
    const candidates = reminders
      .map((reminder) => {
        const base = reminder.anchor === 'start' ? window.start : window.end;
        return new Date(base.getTime() + reminder.offsetMin * 60_000);
      })
      .filter((date) => date.getTime() > Date.now())
      .sort((a, b) => a.getTime() - b.getTime());
    return candidates[0] ?? null;
  }, [reminders, window]);

  if (!mitzvah) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <Text style={[typography.body, { color: colors.text, padding: 16 }]}>{t('errors.generic')}</Text>
      </SafeAreaView>
    );
  }

  const name = language === 'en' && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he;
  const cycle =
    mitzvah.category === 'weekly'
      ? t('mitzvah.cycle.weekly')
      : mitzvah.category === 'seasonal'
        ? t('mitzvah.cycle.seasonal')
        : t('mitzvah.cycle.daily');

  const saveReminder = (value: Reminder) => {
    const next = [...reminders];
    if (editIndex === null) next.push(value);
    else next[editIndex] = value;
    setReminders(mitzvah.id, next);
    setEditIndex(null);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[typography.small, { color: 'rgba(255,255,255,0.4)' }]}>← {t('nav.library')}</Text>
        </Pressable>
        <View style={styles.headerRow}>
          <View style={[styles.heroIcon, { backgroundColor: colors.goldLight }]}>
            <Text style={{ fontSize: 22, color: colors.gold }}>✦</Text>
          </View>
          <View>
            <Text style={[typography.heading, { color: colors.headerText }]}>{name}</Text>
            <Text style={[typography.micro, { color: colors.headerSub, marginTop: 2 }]}>
              {cycle} · {window ? t('detail.timeRange', {
                start: DateTime.fromJSDate(window.start).toFormat('HH:mm'),
                end: DateTime.fromJSDate(window.end).toFormat('HH:mm'),
              }) : '-'}
            </Text>
            {nextTrigger ? (
              <Text style={[typography.micro, { color: colors.gold, marginTop: 2 }]}>
                {t('detail.previewNext', { time: DateTime.fromJSDate(nextTrigger).toFormat('dd/MM HH:mm') })}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: 10 }]}>{t('detail.timeWindow')}</Text>
          <View style={styles.windowRow}>
            <Text style={[typography.micro, { color: colors.textMuted, width: 40, textAlign: 'right' }]}>
              {window ? DateTime.fromJSDate(window.start).toFormat('HH:mm') : '--:--'}
            </Text>
            <View style={styles.ribbon}>
              <Svg width="100%" height="10" viewBox="0 0 100 10" preserveAspectRatio="none">
                <Defs>
                  <LinearGradient id="timeGradient" x1="0%" x2="100%">
                    <Stop offset="0%" stopColor={colors.safe} />
                    <Stop offset="40%" stopColor={colors.warning} />
                    <Stop offset="100%" stopColor={colors.urgent} />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width={100} height={10} rx={5} fill="url(#timeGradient)" />
              </Svg>
            </View>
            <Text style={[typography.micro, { color: colors.textMuted, width: 40 }]}>
              {window ? DateTime.fromJSDate(window.end).toFormat('HH:mm') : '--:--'}
            </Text>
          </View>
          <View style={styles.legend}>
            {[['time.safe', colors.safe], ['time.warning', colors.warning], ['time.urgent', colors.urgent]].map(([key, color]) => (
              <Text key={key} style={[typography.micro, { color }]}>● {t(key)}</Text>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.row}>
            <Text style={[typography.subheading, { color: colors.text }]}>{t('detail.settings')}</Text>
            <Switch
              value={active.enabled}
              onValueChange={(value) => setEnabled(mitzvah.id, value)}
              thumbColor="#fff"
              trackColor={{ false: colors.border, true: colors.gold }}
            />
          </View>
            <InfoRow label={t('detail.nusach')} value={t(`nusach.${user.nusach}`)} />
          <InfoRow label={t('detail.cycle')} value={cycle} />
          <InfoRow label={t('detail.enabled')} value={active.enabled ? t('state.enabled') : t('state.disabled')} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow, paddingBottom: 0 }]}>
          <Text style={[typography.subheading, { color: colors.text, marginBottom: 10 }]}>{t('detail.reminders')}</Text>
          {reminders.map((reminder, index) => (
            <View
              key={`${reminder.label}-${index}`}
              style={[styles.reminderRow, { borderBottomColor: colors.border }]}
            >
              <Pressable
                onPress={() => {
                  setEditIndex(index);
                  setEditorVisible(true);
                }}
                style={{ flex: 1 }}
              >
                <Text style={[typography.bodyBold, { color: colors.text }]}>{reminder.label}</Text>
                <Text style={[typography.micro, { color: colors.textMuted, marginTop: 2 }]}>
                  {t(`reminder.anchor.${reminder.anchor}`)} · {reminder.offsetMin >= 0 ? '+' : ''}{reminder.offsetMin} {t('reminder.minutesShort')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setReminders(mitzvah.id, reminders.filter((_, itemIndex) => itemIndex !== index))}
                style={[styles.deleteBtn, { backgroundColor: colors.surface2 }]}
              >
                <Text style={[typography.captionBold, { color: colors.textMuted }]}>✕</Text>
              </Pressable>
            </View>
          ))}
          {!reminders.length ? (
            <Text style={[typography.body, { color: colors.textMuted, paddingVertical: 12 }]}>
              {t('detail.noReminders')}
            </Text>
          ) : null}
          <Pressable
            onPress={() => {
              setEditIndex(null);
              setEditorVisible(true);
            }}
            style={[styles.addRow, { borderTopColor: `${colors.gold}44` }]}
          >
            <View style={[styles.plus, { backgroundColor: colors.goldLight }]}>
              <Text style={{ fontSize: 16, color: colors.gold }}>＋</Text>
            </View>
            <Text style={[typography.bodyBold, { color: colors.gold }]}>{t('detail.addReminder')}</Text>
          </Pressable>
          <Pressable onPress={() => resetToDefault(mitzvah.id)} style={[styles.resetBtn, { backgroundColor: colors.surface2 }]}>
            <Text style={[typography.bodyBold, { color: colors.textSub }]}>{t('detail.defaultReset')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ReminderEditor
        visible={editorVisible}
        initialValue={editIndex === null ? null : reminders[editIndex]}
        onClose={() => {
          setEditorVisible(false);
          setEditIndex(null);
        }}
        onSave={saveReminder}
      />
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { marginTop: 10 }]}>
      <Text style={[typography.bodyBold, { color: colors.text }]}>{label}</Text>
      <Text style={[typography.body, { color: colors.gold }]}>{value}</Text>
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
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 14,
    gap: 10,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 10,
  },
  windowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  ribbon: {
    flex: 1,
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1.5,
  },
  plus: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 14,
  },
});
