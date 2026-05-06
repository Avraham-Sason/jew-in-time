import React, { useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { DateTime } from 'luxon';
import { ReminderEditor } from '@/components/ReminderEditor';
import { findAnyMitzvah } from '@/data/customMitzvotAdapter';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { shadowPresets, shadowStyle } from '@/theme/shadowStyle';
import { typography } from '@/theme/typography';
import { ContentBlock, Reminder } from '@/types/mitzvah';
import { ZmanimService } from '@/services/ZmanimService';
import { useI18n } from '@/i18n';

function nextWindowFor(
  id: string,
  location: ReturnType<typeof useUserStore.getState>['location'],
  nusach: ReturnType<typeof useUserStore.getState>['nusach'],
  ksSofZman: ReturnType<typeof useUserStore.getState>['halachicOpinions']['ksSofZman'],
  inIsrael: boolean,
) {
  const mitzvah = findAnyMitzvah(id);
  if (!mitzvah) return null;
  const dates = [new Date(), new Date(Date.now() + 24 * 60 * 60 * 1000)];
  for (const date of dates) {
    const ctx = {
      date,
      location,
      settings: { nusach, halachicOpinions: { ksSofZman }, inIsrael },
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
  const params = useLocalSearchParams<{ id: string; highlightContent?: string }>();
  const mitzvah = useMemo(() => findAnyMitzvah(params.id), [params.id]);
  const location = useUserStore((s) => s.location);
  const nusach = useUserStore((s) => s.nusach);
  const ksSofZman = useUserStore((s) => s.halachicOpinions.ksSofZman);
  const inIsrael = useUserStore((s) => s.inIsrael);
  const active = useMitzvotStore((s) => s.activeMitzvot[params.id] ?? { enabled: false });
  const setEnabled = useMitzvotStore((s) => s.setEnabled);
  const setReminders = useMitzvotStore((s) => s.setReminders);
  const resetToDefault = useMitzvotStore((s) => s.resetToDefault);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const reminders = active.customReminders ?? mitzvah?.defaultReminders ?? [];
  const includeContentInNotification = reminders.some((reminder) => reminder.includeContentInBody);
  const window = useMemo(
    () => (params.id ? nextWindowFor(params.id, location, nusach, ksSofZman, inIsrael) : null),
    [params.id, location, nusach, ksSofZman, inIsrael],
  );
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
  const setIncludeContent = (value: boolean) => {
    setReminders(mitzvah.id, reminders.map((reminder) => ({ ...reminder, includeContentInBody: value })));
  };
  const confirmDeleteReminder = () => {
    if (deleteIndex === null) return;
    setReminders(mitzvah.id, reminders.filter((_, itemIndex) => itemIndex !== deleteIndex));
    if (editIndex === deleteIndex) {
      setEditIndex(null);
      setEditorVisible(false);
    }
    setDeleteIndex(null);
  };
  const pendingDeleteReminder = deleteIndex === null ? null : reminders[deleteIndex] ?? null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: pressed ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)',
              borderColor: 'rgba(255,255,255,0.18)',
            },
          ]}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d={language === 'he' ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
              stroke={colors.headerText}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={[typography.captionBold, { color: colors.headerText }]}>{t('common.back')}</Text>
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
        <View style={[styles.card, { backgroundColor: colors.surface }, shadowStyle(colors.shadow, shadowPresets.cardSoft)]}>
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

        {mitzvah.description ? (
          <View style={[styles.card, { backgroundColor: colors.surface }, shadowStyle(colors.shadow, shadowPresets.cardSoft)]}>
            <Text style={[typography.body, { color: colors.text }]}>
              {language === 'en' && mitzvah.description.en ? mitzvah.description.en : mitzvah.description.he}
            </Text>
          </View>
        ) : null}

        {mitzvah.contentBlocks?.length ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: params.highlightContent === '1' ? colors.goldLight : colors.surface,
                borderWidth: params.highlightContent === '1' ? 1 : 0,
                borderColor: params.highlightContent === '1' ? colors.gold : 'transparent',
              },
              shadowStyle(colors.shadow, shadowPresets.cardSoft),
            ]}
          >
            <Text style={[typography.subheading, { color: colors.text, marginBottom: 10 }]}>{t('detail.content')}</Text>
            {mitzvah.contentBlocks.map((block, index) => (
              <ContentBlockView key={`${block.type}-${index}`} block={block} highlighted={params.highlightContent === '1'} />
            ))}
            <View style={[styles.row, { marginTop: 12 }]}>
              <Text style={[typography.bodyBold, { color: colors.text, flex: 1 }]}>{t('detail.includeContentInNotification')}</Text>
              <Switch
                value={includeContentInNotification}
                onValueChange={setIncludeContent}
                thumbColor="#fff"
                trackColor={{ false: colors.border, true: colors.gold }}
              />
            </View>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: colors.surface }, shadowStyle(colors.shadow, shadowPresets.cardSoft)]}>
          <View style={styles.row}>
            <Text style={[typography.subheading, { color: colors.text }]}>{t('detail.settings')}</Text>
            <Switch
              value={active.enabled}
              onValueChange={(value) => setEnabled(mitzvah.id, value)}
              thumbColor="#fff"
              trackColor={{ false: colors.border, true: colors.gold }}
            />
          </View>
          <InfoRow label={t('detail.nusach')} value={t(`nusach.${nusach}`)} />
          <InfoRow label={t('detail.cycle')} value={cycle} />
          <InfoRow label={t('detail.enabled')} value={active.enabled ? t('state.enabled') : t('state.disabled')} />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, paddingBottom: 0 },
            shadowStyle(colors.shadow, shadowPresets.cardSoft),
          ]}
        >
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
                onPress={() => setDeleteIndex(index)}
                accessibilityRole="button"
                accessibilityLabel={t('reminder.delete')}
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
      <Modal
        visible={deleteIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteIndex(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.confirmDialog, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.heading, { color: colors.text }]}>{t('reminder.deleteConfirmTitle')}</Text>
            <Text style={[typography.body, { color: colors.textSub, marginTop: 8 }]}>
              {t('reminder.deleteConfirmBody', { label: pendingDeleteReminder?.label ?? t('detail.addReminder') })}
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                onPress={() => setDeleteIndex(null)}
                style={[styles.confirmBtn, { backgroundColor: colors.surface2 }]}
              >
                <Text style={[typography.bodyBold, { color: colors.textSub }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={confirmDeleteReminder}
                style={[styles.confirmBtn, { backgroundColor: colors.urgent }]}
              >
                <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('reminder.deleteConfirmAction')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

function ContentBlockView({ block, highlighted }: { block: ContentBlock; highlighted: boolean }) {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const text = language === 'en' && block.en ? block.en : block.he;
  if (block.type === 'link') {
    return (
      <Pressable
        onPress={() => Linking.openURL(block.url).catch(() => {})}
        style={[styles.contentBlock, styles.linkBlock, { backgroundColor: colors.surface2, borderColor: colors.border }]}
      >
        <Text style={[typography.bodyBold, { color: colors.gold, flex: 1 }]}>{text}</Text>
        <Text style={[typography.micro, { color: colors.textMuted }]}>{t('detail.openLink')}</Text>
      </Pressable>
    );
  }
  return (
    <View
      style={[
        styles.contentBlock,
        block.type === 'blessing' ? styles.blessingBlock : null,
        {
          backgroundColor: block.type === 'blessing' || highlighted ? colors.goldLight : colors.surface2,
          borderColor: block.type === 'blessing' || highlighted ? colors.gold : colors.border,
        },
      ]}
    >
      <Text style={[typography.body, { color: colors.text, textAlign: language === 'he' ? 'right' : 'left' }]}>{text}</Text>
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
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
  contentBlock: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  blessingBlock: {
    borderWidth: 1.5,
  },
  linkBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9,20,32,0.45)',
    padding: 20,
  },
  confirmDialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 13,
  },
});
