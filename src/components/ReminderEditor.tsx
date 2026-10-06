import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Reminder, ReminderAnchor } from '@/types/mitzvah';
import { useTheme } from '@/theme/ThemeProvider';
import { useQuietBlock } from './ShabbatScreen';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';

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
  const quiet = useQuietBlock() !== null;
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

  return (
    <Modal visible={visible && !quiet} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[typography.heading, { color: colors.text, marginBottom: 14 }]}>
            {initialValue ? t('reminder.edit') : t('reminder.add')}
          </Text>
          <View style={styles.segmentRow}>
            {(['start', 'end'] as ReminderAnchor[]).map((value) => {
              const selected = value === anchor;
              return (
                <Pressable
                  key={value}
                  onPress={() => setAnchor(value)}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: selected ? colors.gold : colors.surface2,
                      borderColor: selected ? colors.gold : colors.border,
                    },
                  ]}
                >
                  <Text style={[typography.captionBold, { color: selected ? colors.onGold : colors.textSub }]}>
                    {t(`reminder.anchor.${value}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[typography.captionBold, { color: colors.text, marginBottom: 6 }]}>{t('reminder.label')}</Text>
          <TextInput
            accessibilityLabel={t('reminder.label')}
            value={label}
            onChangeText={setLabel}
            placeholder={t('detail.addReminder')}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.surface2, color: colors.text, borderColor: colors.border }]}
          />
          <Text style={[typography.captionBold, { color: colors.text, marginBottom: 6 }]}>{t('reminder.offset')}</Text>
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
              style={[styles.input, styles.offsetInput, { backgroundColor: colors.surface2, color: colors.text, borderColor: colors.border }]}
            />
            <Pressable
              onPress={() => setOffsetMin(String((Number(offsetMin) || 0) + 5))}
              style={[styles.stepper, { backgroundColor: colors.surface2, borderColor: colors.border }]}
            >
              <Text style={[typography.bodyBold, { color: colors.text }]}>+5</Text>
            </Pressable>
          </View>
          <View style={[styles.switchRow, { borderTopColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.subheading, { color: colors.text }]}>{t('reminder.skipIfDone')}</Text>
            </View>
            <Switch value={skipIfDone} onValueChange={setSkipIfDone} thumbColor="#fff" trackColor={{ false: colors.border, true: colors.gold }} />
          </View>
          {error ? (
            <Text style={[typography.small, { color: colors.urgent, marginTop: 4 }]}>{error}</Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.actionBtn, { backgroundColor: colors.surface2 }]}>
              <Text style={[typography.bodyBold, { color: colors.textSub }]}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable onPress={save} style={[styles.actionBtn, { backgroundColor: colors.gold }]}>
              <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('common.save')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,20,32,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  offsetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepper: {
    width: 54,
    height: 48,
    borderRadius: 12,
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
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 13,
  },
});
