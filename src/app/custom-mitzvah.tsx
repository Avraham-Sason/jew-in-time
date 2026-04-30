import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCustomMitzvotStore, makeCustomMitzvahId } from '@/stores/useCustomMitzvotStore';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';
import {
  CustomMitzvah,
  MitzvahCategory,
  Reminder,
  ReminderAnchor,
  SkipContext,
} from '@/types/mitzvah';

const CATEGORIES: MitzvahCategory[] = [
  'daily-morning',
  'daily-afternoon',
  'daily-evening',
  'daily-allday',
  'learning',
];

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function emptyReminder(): Reminder {
  return { anchor: 'start', offsetMin: 0, label: '' };
}

export default function CustomMitzvahScreen() {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id?: string }>();
  const editingId = typeof rawId === 'string' && rawId.length > 0 ? rawId : null;

  const existing = useCustomMitzvotStore((s) => (editingId ? s.items[editingId] : undefined));
  const addCustom = useCustomMitzvotStore((s) => s.add);
  const updateCustom = useCustomMitzvotStore((s) => s.update);
  const removeCustom = useCustomMitzvotStore((s) => s.remove);
  const setEnabled = useMitzvotStore((s) => s.setEnabled);
  const removeFromActive = useMitzvotStore((s) => s.removeMitzvah);

  const [name, setName] = useState(existing?.name ?? '');
  const [startTime, setStartTime] = useState(existing?.startHHMM ?? '08:00');
  const [endTime, setEndTime] = useState(existing?.endHHMM ?? '12:00');
  const [category, setCategory] = useState<MitzvahCategory>(existing?.category ?? 'daily-allday');
  const [skipShabbat, setSkipShabbat] = useState(existing?.skipOn.includes('shabbat') ?? false);
  const [skipYomtov, setSkipYomtov] = useState(existing?.skipOn.includes('yomtov') ?? false);
  const [reminders, setReminders] = useState<Reminder[]>(
    existing?.reminders ?? [{ anchor: 'start', offsetMin: 0, label: '' }],
  );
  const [error, setError] = useState<string | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const titleText = useMemo(
    () => (editingId ? t('custom.editTitle') : t('custom.title')),
    [editingId, t],
  );

  const onSave = () => {
    setError(null);
    if (!name.trim()) {
      setError(t('custom.errors.nameRequired'));
      return;
    }
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      setError(t('custom.errors.timeInvalid'));
      return;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setError(t('custom.errors.endBeforeStart'));
      return;
    }
    const skipOn: SkipContext[] = [];
    if (skipShabbat) skipOn.push('shabbat');
    if (skipYomtov) skipOn.push('yomtov');
    const cleanedReminders = reminders
      .filter((r) => (r.label ?? '').trim().length > 0)
      .map((r) => ({ ...r, label: r.label.trim() }));
    if (editingId && existing) {
      updateCustom(editingId, {
        name: name.trim(),
        startHHMM: startTime,
        endHHMM: endTime,
        category,
        skipOn,
        reminders: cleanedReminders,
      });
    } else {
      const id = makeCustomMitzvahId();
      const newItem: CustomMitzvah = {
        id,
        name: name.trim(),
        startHHMM: startTime,
        endHHMM: endTime,
        category,
        skipOn,
        reminders: cleanedReminders,
        createdAt: Date.now(),
      };
      addCustom(newItem);
      setEnabled(id, true);
    }
    router.back();
  };

  const onDelete = () => {
    if (!editingId) return;
    removeCustom(editingId);
    removeFromActive(editingId);
    setDeleteVisible(false);
    router.back();
  };

  const updateReminder = (idx: number, patch: Partial<Reminder>) => {
    setReminders((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const removeReminder = (idx: number) => {
    setReminders((prev) => prev.filter((_, i) => i !== idx));
  };
  const addReminder = () => {
    setReminders((prev) => [...prev, emptyReminder()]);
  };

  const inputDir = language === 'he' ? 'rtl' : 'ltr';
  const textAlign = language === 'he' ? 'right' : 'left';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <Stack.Screen options={{ title: titleText, headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface2 }]}>
            <Text style={[typography.bodyBold, { color: colors.text }]}>{t('common.back')}</Text>
          </Pressable>
          <Text style={[typography.title, { color: colors.text }]}>{titleText}</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: 6 }]}>{t('custom.name')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('custom.namePlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface2,
              color: colors.text,
              borderColor: colors.border,
              writingDirection: inputDir,
              textAlign,
            },
          ]}
        />

        <View style={[styles.row, { marginTop: 14 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: 6 }]}>{t('custom.startTime')}</Text>
            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              style={[
                styles.input,
                { backgroundColor: colors.surface2, color: colors.text, borderColor: colors.border, textAlign: 'center' },
              ]}
              maxLength={5}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: 6 }]}>{t('custom.endTime')}</Text>
            <TextInput
              value={endTime}
              onChangeText={setEndTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              style={[
                styles.input,
                { backgroundColor: colors.surface2, color: colors.text, borderColor: colors.border, textAlign: 'center' },
              ]}
              maxLength={5}
            />
          </View>
        </View>
        <Text style={[typography.small, { color: colors.textMuted, marginTop: 6 }]}>{t('custom.timeFormatHint')}</Text>

        <Text style={[typography.captionBold, { color: colors.textSub, marginTop: 18, marginBottom: 8 }]}>{t('custom.category')}</Text>
        <View style={styles.wrapRow}>
          {CATEGORIES.map((value) => {
            const active = category === value;
            return (
              <Pressable
                key={value}
                onPress={() => setCategory(value)}
                style={[styles.pill, { backgroundColor: active ? colors.gold : colors.surface2 }]}
              >
                <Text style={[typography.small, { color: active ? '#fff' : colors.textSub }]}>
                  {t(`library.category.${value}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.switchRow, { marginTop: 18 }]}>
          <Text style={[typography.bodyBold, { color: colors.text }]}>{t('custom.skipShabbat')}</Text>
          <Switch
            value={skipShabbat}
            onValueChange={setSkipShabbat}
            thumbColor="#fff"
            trackColor={{ false: colors.border, true: colors.gold }}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={[typography.bodyBold, { color: colors.text }]}>{t('custom.skipYomtov')}</Text>
          <Switch
            value={skipYomtov}
            onValueChange={setSkipYomtov}
            thumbColor="#fff"
            trackColor={{ false: colors.border, true: colors.gold }}
          />
        </View>

        <Text style={[typography.subheading, { color: colors.text, marginTop: 20, marginBottom: 10 }]}>{t('custom.reminders')}</Text>
        {reminders.map((r, idx) => (
          <View
            key={idx}
            style={[styles.reminderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <TextInput
              value={r.label}
              onChangeText={(v) => updateReminder(idx, { label: v })}
              placeholder={t('custom.reminderLabelPlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface2,
                  color: colors.text,
                  borderColor: colors.border,
                  writingDirection: inputDir,
                  textAlign,
                  marginBottom: 10,
                },
              ]}
            />
            <View style={styles.row}>
              <AnchorPick value={r.anchor} onChange={(v) => updateReminder(idx, { anchor: v })} />
              <View style={{ flex: 1 }}>
                <Text style={[typography.small, { color: colors.textMuted, marginBottom: 4, textAlign }]}>
                  {r.anchor === 'start' ? t('custom.reminderOffsetFromStart') : t('custom.reminderOffsetBeforeEnd')}
                </Text>
                <TextInput
                  value={String(r.anchor === 'end' ? Math.abs(r.offsetMin) : r.offsetMin)}
                  onChangeText={(v) => {
                    const num = Math.max(0, Math.min(720, Number(v.replace(/[^0-9]/g, '')) || 0));
                    updateReminder(idx, { offsetMin: r.anchor === 'end' ? -num : num });
                  }}
                  keyboardType="number-pad"
                  style={[
                    styles.input,
                    { backgroundColor: colors.surface2, color: colors.text, borderColor: colors.border, textAlign: 'center' },
                  ]}
                  maxLength={3}
                />
              </View>
              <Pressable
                onPress={() => removeReminder(idx)}
                style={[styles.iconBtn, { backgroundColor: colors.urgentBg, borderColor: colors.urgent }]}
              >
                <Text style={[typography.bodyBold, { color: colors.urgent }]}>×</Text>
              </Pressable>
            </View>
          </View>
        ))}
        <Pressable onPress={addReminder} style={[styles.addBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Text style={[typography.bodyBold, { color: colors.text }]}>+ {t('custom.addReminder')}</Text>
        </Pressable>

        {error ? (
          <Text style={[typography.captionBold, { color: colors.urgent, marginTop: 14, textAlign: 'center' }]}>{error}</Text>
        ) : null}

        <Pressable onPress={onSave} style={[styles.primaryBtn, { backgroundColor: colors.gold }]}>
          <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('custom.save')}</Text>
        </Pressable>

        {editingId ? (
          <Pressable
            onPress={() => setDeleteVisible(true)}
            style={[styles.dangerBtn, { backgroundColor: colors.urgentBg, borderColor: colors.urgent }]}
          >
            <Text style={[typography.bodyBold, { color: colors.urgent }]}>{t('custom.delete')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <Modal animationType="fade" transparent visible={deleteVisible} onRequestClose={() => setDeleteVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.heading, { color: colors.text, marginBottom: 8 }]}>{t('custom.deleteConfirmTitle')}</Text>
            <Text style={[typography.body, { color: colors.textSub, marginBottom: 18 }]}>{t('custom.deleteConfirmBody')}</Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setDeleteVisible(false)} style={[styles.modalBtn, { backgroundColor: colors.surface2 }]}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable onPress={onDelete} style={[styles.modalBtn, { backgroundColor: colors.urgent }]}>
                <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('common.delete')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function AnchorPick({ value, onChange }: { value: ReminderAnchor; onChange: (v: ReminderAnchor) => void }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {(['start', 'end'] as ReminderAnchor[]).map((opt) => {
        const active = value === opt;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.anchorPill, { backgroundColor: active ? colors.gold : colors.surface2 }]}
          >
            <Text style={[typography.small, { color: active ? '#fff' : colors.textSub }]}>
              {t(`reminder.anchor.${opt}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function timeToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  anchorPill: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  reminderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },
  dangerBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,20,32,0.55)',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: { borderRadius: 18, borderWidth: 1, padding: 20 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});
