import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Reminder, ReminderAnchor } from '@/types/mitzvah';
import { BRAND } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';
import { BottomSheet } from './BottomSheet';
import { SegmentedControl } from './SegmentedControl';

const MAX_OFFSET_MIN = 720;

type Props = {
  visible: boolean;
  initialValue?: Reminder | null;
  window?: { start: Date; end: Date } | null;
  mitzvahName?: string;
  onClose: () => void;
  onSave: (value: Reminder) => void;
};

export function ReminderEditor({ visible, initialValue, window, mitzvahName, onClose, onSave }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [anchor, setAnchor] = useState<ReminderAnchor>('start');
  const [offsetMin, setOffsetMin] = useState('0');
  const [label, setLabel] = useState('');
  const [skipIfDone, setSkipIfDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAnchor(initialValue?.anchor ?? 'start');
    setOffsetMin(String(initialValue?.offsetMin ?? 0));
    setLabel(initialValue?.label ?? '');
    setSkipIfDone(initialValue?.skipIfDone ?? false);
    setError(null);
  }, [initialValue, visible]);

  const [error, setError] = useState<string | null>(null);

  // The scheduler drops any trigger outside its window, so an unbounded offset produced a reminder
  // that looked saved and could never fire. Reject it here instead, with the reason.
  const save = () => {
    const minutes = Number(offsetMin) || 0;
    if (Math.abs(minutes) > MAX_OFFSET_MIN) {
      setError(t('reminder.errors.offsetRange', { max: MAX_OFFSET_MIN }));
      return;
    }
    if (window) {
      const anchorTime = anchor === 'start' ? window.start : window.end;
      const trigger = anchorTime.getTime() + minutes * 60_000;
      if (trigger < window.start.getTime() || trigger > window.end.getTime()) {
        setError(t('reminder.errors.outsideWindow'));
        return;
      }
    }
    setError(null);
    onSave({ anchor, offsetMin: minutes, label: label.trim() || mitzvahName || t('detail.addReminder'), skipIfDone });
    onClose();
  };

  const anchorOptions: { value: ReminderAnchor; label: string }[] = [
    { value: 'start', label: t('reminder.anchor.start') },
    { value: 'end', label: t('reminder.anchor.end') },
  ];

  return (
    <BottomSheet
      visible={visible}
      title={initialValue ? t('reminder.edit') : t('reminder.add')}
      caption={mitzvahName}
      onClose={onClose}
    >
      <View style={styles.fields}>
        <SegmentedControl
          tone="surface"
          options={anchorOptions}
          value={anchor}
          onChange={setAnchor}
          style={styles.anchor}
        />
        <Text style={[typography.captionBold, styles.fieldLabel, { color: colors.text }]}>{t('reminder.label')}</Text>
        <TextInput
          accessibilityLabel={t('reminder.label')}
          value={label}
          onChangeText={setLabel}
          placeholder={t('detail.addReminder')}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { backgroundColor: colors.surface2, color: colors.text, borderColor: colors.border }]}
        />
        <Text style={[typography.captionBold, styles.fieldLabel, { color: colors.text }]}>{t('reminder.offset')}</Text>
        <View style={styles.offsetRow}>
          <Pressable
            onPress={() => setOffsetMin(String((Number(offsetMin) || 0) - 5))}
            style={[styles.stepper, { backgroundColor: colors.surface2, borderColor: colors.border }]}
          >
            <Text style={[typography.bodyBold, { color: colors.text }]}>-5</Text>
          </Pressable>
          <TextInput
            accessibilityLabel={t('reminder.offset')}
            keyboardType="numbers-and-punctuation"
            value={offsetMin}
            onChangeText={setOffsetMin}
            style={[
              styles.input,
              styles.offsetInput,
              { backgroundColor: colors.surface2, color: colors.text, borderColor: colors.border },
            ]}
          />
          <Pressable
            onPress={() => setOffsetMin(String((Number(offsetMin) || 0) + 5))}
            style={[styles.stepper, { backgroundColor: colors.surface2, borderColor: colors.border }]}
          >
            <Text style={[typography.bodyBold, { color: colors.text }]}>+5</Text>
          </Pressable>
        </View>
        <View style={[styles.switchRow, { borderTopColor: colors.border }]}>
          <View style={styles.switchLabel}>
            <Text style={[typography.subheading, { color: colors.text }]}>{t('reminder.skipIfDone')}</Text>
          </View>
          <Switch
            value={skipIfDone}
            onValueChange={setSkipIfDone}
            thumbColor={BRAND.white}
            trackColor={{ false: colors.border, true: colors.gold }}
          />
        </View>
        {error ? <Text style={[typography.small, styles.error, { color: colors.urgent }]}>{error}</Text> : null}
        <Pressable onPress={save} accessibilityRole="button" style={[styles.saveBtn, { backgroundColor: colors.gold }]}>
          <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('common.save')}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: spacing.sm,
  },
  anchor: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  offsetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepper: {
    width: 54,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offsetInput: {
    flex: 1,
    marginBottom: 0,
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  switchLabel: {
    flex: 1,
  },
  error: {
    marginTop: spacing.xs,
  },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
});
