import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChipRow } from '@/components/ChipRow';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useCustomMitzvotStore, makeCustomMitzvahId } from '@/stores/useCustomMitzvotStore';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { BRAND } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';
import { TIME_PATTERN, timeToMinutes } from '@/utils/clock';
import { ContentBlock, CustomMitzvah, MitzvahCategory, Reminder, ReminderAnchor, SkipContext } from '@/types/mitzvah';

const CATEGORIES: MitzvahCategory[] = ['daily-morning', 'daily-afternoon', 'daily-evening', 'daily-allday', 'learning'];
const CONTENT_TYPES: ContentBlock['type'][] = ['text', 'blessing', 'link'];

function emptyReminder(): Reminder {
  return { anchor: 'start', offsetMin: 0, label: '' };
}

function cleanVariants(value: string): string[] | undefined {
  const variants = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return variants.length ? variants : undefined;
}

function cleanContentBlocks(blocks: ContentBlock[]): ContentBlock[] | undefined {
  const cleaned = blocks
    .map((block) => {
      const he = block.he.trim();
      if (block.type === 'link') return { type: 'link' as const, he, en: block.en, url: block.url.trim() };
      return { ...block, he };
    })
    .filter((block) => block.he.length > 0 && (block.type !== 'link' || block.url.length > 0));
  return cleaned.length ? cleaned : undefined;
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
  const [selectedReminderIndex, setSelectedReminderIndex] = useState(0);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>(existing?.contentBlocks ?? []);
  const [error, setError] = useState<string | null>(null);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const titleText = useMemo(() => (editingId ? t('custom.editTitle') : t('custom.title')), [editingId, t]);

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
      .map((r) => ({
        ...r,
        label: r.label.trim(),
        bodyVariants: r.bodyVariants?.map((variant) => variant.trim()).filter(Boolean),
      }))
      .map((r) => ({ ...r, bodyVariants: r.bodyVariants?.length ? r.bodyVariants : undefined }));
    // The form seeds one reminder with an empty label, and blank-label reminders are stripped on
    // save — so the default flow produced a mitzvah that could never notify, silently.
    if (!cleanedReminders.length) {
      setError(t('custom.errors.reminderRequired'));
      return;
    }
    const cleanedContentBlocks = cleanContentBlocks(contentBlocks);
    if (editingId && existing) {
      updateCustom(editingId, {
        name: name.trim(),
        startHHMM: startTime,
        endHHMM: endTime,
        category,
        skipOn,
        reminders: cleanedReminders,
        contentBlocks: cleanedContentBlocks,
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
        contentBlocks: cleanedContentBlocks,
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
    setSelectedReminderIndex((prev) => Math.max(0, Math.min(prev, reminders.length - 2)));
  };
  const addReminder = () => {
    setReminders((prev) => [...prev, emptyReminder()]);
  };
  const updateSelectedVariants = (value: string) => {
    updateReminder(selectedReminderIndex, { bodyVariants: cleanVariants(value) });
  };
  const addContentBlock = () => {
    setContentBlocks((prev) => [...prev, { type: 'text', he: '' }]);
  };
  const removeContentBlock = (idx: number) => {
    setContentBlocks((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateContentBlock = (idx: number, next: ContentBlock) => {
    setContentBlocks((prev) => prev.map((block, i) => (i === idx ? next : block)));
  };
  const changeContentType = (idx: number, type: ContentBlock['type']) => {
    setContentBlocks((prev) =>
      prev.map((block, i) => {
        if (i !== idx) return block;
        if (type === 'link') return { type, he: block.he, url: block.type === 'link' ? block.url : '' };
        return { type, he: block.he };
      }),
    );
  };

  const inputDir = language === 'he' ? 'rtl' : 'ltr';
  const selectedReminder = reminders[selectedReminderIndex];
  const anchorOptions: { value: ReminderAnchor; label: string }[] = [
    { value: 'start', label: t('reminder.anchor.start') },
    { value: 'end', label: t('reminder.anchor.end') },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <Stack.Screen options={{ title: titleText, headerShown: false }} />
      <ScreenHeader title={titleText} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: spacing.sm }]}>
          {t('custom.name')}
        </Text>
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
            },
          ]}
        />

        <View style={[styles.row, { marginTop: spacing.lg }]}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: spacing.sm }]}>
              {t('custom.startTime')}
            </Text>
            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface2,
                  color: colors.text,
                  borderColor: colors.border,
                  textAlign: 'center',
                },
              ]}
              maxLength={5}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: spacing.sm }]}>
              {t('custom.endTime')}
            </Text>
            <TextInput
              value={endTime}
              onChangeText={setEndTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textMuted}
              keyboardType="numbers-and-punctuation"
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface2,
                  color: colors.text,
                  borderColor: colors.border,
                  textAlign: 'center',
                },
              ]}
              maxLength={5}
            />
          </View>
        </View>
        <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm }]}>
          {t('custom.timeFormatHint')}
        </Text>

        <Text
          style={[typography.captionBold, { color: colors.textSub, marginTop: spacing.xl, marginBottom: spacing.sm }]}
        >
          {t('custom.category')}
        </Text>
        <ChipRow
          values={CATEGORIES}
          selected={category}
          onSelect={setCategory}
          renderLabel={(value) => t(`library.category.${value}`)}
        />

        <View style={[styles.switchRow, { marginTop: spacing.xl }]}>
          <Text style={[typography.bodyBold, { color: colors.text }]}>{t('custom.skipShabbat')}</Text>
          <Switch
            value={skipShabbat}
            onValueChange={setSkipShabbat}
            thumbColor={BRAND.white}
            trackColor={{ false: colors.border, true: colors.gold }}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={[typography.bodyBold, { color: colors.text }]}>{t('custom.skipYomtov')}</Text>
          <Switch
            value={skipYomtov}
            onValueChange={setSkipYomtov}
            thumbColor={BRAND.white}
            trackColor={{ false: colors.border, true: colors.gold }}
          />
        </View>

        <Text style={[typography.subheading, { color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md }]}>
          {t('custom.reminders')}
        </Text>
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
                  marginBottom: spacing.md,
                },
              ]}
            />
            <View style={styles.row}>
              <SegmentedControl
                tone="surface"
                options={anchorOptions}
                value={r.anchor}
                onChange={(v) => updateReminder(idx, { anchor: v })}
                style={styles.anchor}
              />
              <View style={{ flex: 1 }}>
                <Text style={[typography.small, { color: colors.textMuted, marginBottom: spacing.xs }]}>
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
                    {
                      backgroundColor: colors.surface2,
                      color: colors.text,
                      borderColor: colors.border,
                      textAlign: 'center',
                    },
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
        <Pressable
          onPress={addReminder}
          style={[styles.addBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
        >
          <Text style={[typography.bodyBold, { color: colors.text }]}>+ {t('custom.addReminder')}</Text>
        </Pressable>

        {reminders.length ? (
          <View style={[styles.editorSection, { borderColor: colors.border }]}>
            <Text style={[typography.subheading, { color: colors.text, marginBottom: spacing.sm }]}>
              {t('custom.bodyVariants')}
            </Text>
            <ChipRow
              values={reminders.map((_, idx) => idx)}
              selected={selectedReminderIndex}
              onSelect={setSelectedReminderIndex}
              renderLabel={(idx) => String(idx + 1)}
            />
            <Text
              style={[typography.small, { color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.sm }]}
            >
              {t('custom.bodyVariantsHint')}
            </Text>
            <TextInput
              value={selectedReminder?.bodyVariants?.join('\n') ?? ''}
              onChangeText={updateSelectedVariants}
              multiline
              placeholder={t('custom.reminderLabelPlaceholder')}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                styles.multiInput,
                {
                  backgroundColor: colors.surface2,
                  color: colors.text,
                  borderColor: colors.border,
                  writingDirection: inputDir,
                },
              ]}
            />
          </View>
        ) : null}

        <View style={[styles.editorSection, { borderColor: colors.border }]}>
          <Text style={[typography.subheading, { color: colors.text, marginBottom: spacing.md }]}>
            {t('custom.contentBlocks')}
          </Text>
          {contentBlocks.map((block, idx) => (
            <View
              key={idx}
              style={[styles.contentEditorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <ChipRow
                values={CONTENT_TYPES}
                selected={block.type}
                onSelect={(type) => changeContentType(idx, type)}
                renderLabel={(type) => t(`custom.contentType.${type}`)}
              />
              <TextInput
                value={block.he}
                onChangeText={(value) => updateContentBlock(idx, { ...block, he: value } as ContentBlock)}
                placeholder={t('custom.contentTextPlaceholder')}
                placeholderTextColor={colors.textMuted}
                multiline
                style={[
                  styles.input,
                  styles.multiInput,
                  {
                    backgroundColor: colors.surface2,
                    color: colors.text,
                    borderColor: colors.border,
                    writingDirection: inputDir,
                    marginTop: spacing.md,
                  },
                ]}
              />
              {block.type === 'link' ? (
                <TextInput
                  value={block.url}
                  onChangeText={(value) => updateContentBlock(idx, { ...block, url: value })}
                  placeholder={t('custom.contentUrlPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="url"
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface2,
                      color: colors.text,
                      borderColor: colors.border,
                      writingDirection: 'ltr',
                      textAlign: 'left',
                      marginTop: spacing.md,
                    },
                  ]}
                />
              ) : null}
              <Pressable
                onPress={() => removeContentBlock(idx)}
                style={[styles.deleteBlockBtn, { backgroundColor: colors.urgentBg, borderColor: colors.urgent }]}
              >
                <Text style={[typography.captionBold, { color: colors.urgent }]}>{t('custom.deleteContentBlock')}</Text>
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={addContentBlock}
            style={[styles.addBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
          >
            <Text style={[typography.bodyBold, { color: colors.text }]}>+ {t('custom.addContentBlock')}</Text>
          </Pressable>
        </View>

        {error ? (
          <Text style={[typography.captionBold, { color: colors.urgent, marginTop: spacing.lg, textAlign: 'center' }]}>
            {error}
          </Text>
        ) : null}

        <Pressable onPress={onSave} style={[styles.primaryBtn, { backgroundColor: colors.gold }]}>
          <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('custom.save')}</Text>
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

      <ConfirmDialog
        visible={deleteVisible}
        title={t('custom.deleteConfirmTitle')}
        body={t('custom.deleteConfirmBody')}
        confirmLabel={t('common.delete')}
        destructive
        onConfirm={onDelete}
        onCancel={() => setDeleteVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  multiInput: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-end' },
  anchor: { flex: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  reminderCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  editorSection: {
    borderTopWidth: 1,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
  contentEditorCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  deleteBlockBtn: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryBtn: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  dangerBtn: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
});
