import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ChipRow } from '@/components/ChipRow';
import { SettingsSection } from '@/components/SettingsSection';
import { useQuietBlock } from '@/components/ShabbatScreen';
import { TAHARAH_PRESET_IDS } from '@/data/taharahPresets';
import { markUnlocked } from '@/services/biometricLock';
import { useTaharahStore } from '@/stores/useTaharahStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { TaharahRole } from '@/types/taharah';
import { useI18n } from '@/i18n';

const HEFSEK_DAYS = [4, 5] as const;
const MOCH_RULES = ['required', 'recommended', 'optional'] as const;
const ONAH_DAYS: Record<string, number[]> = { '30': [30], '3031': [30, 31] };
const ONAH_DAY_IDS = Object.keys(ONAH_DAYS);
const SPANS = ['onah', 'fullDay'] as const;
const HAFLAGA_METHODS = ['days', 'onot'] as const;
const ROLES: readonly TaharahRole[] = ['woman', 'husband'];
const LEAD_MINUTES: readonly number[] = [30, 60, 90, 120, 180];
const LEAD_FIELDS = [
  { key: 'hefsekLeadMin', label: 'taharah.settings.hefsekLead' },
  { key: 'bedikaEveningLeadMin', label: 'taharah.settings.bedikaLead' },
  { key: 'tevilaPrepLeadMin', label: 'taharah.settings.tevilaLead' },
] as const;

export default function TaharahSettingsScreen() {
  const { colors } = useTheme();
  const quiet = useQuietBlock() !== null;
  const { t } = useI18n();
  const router = useRouter();
  const store = useTaharahStore();
  const { rules } = store.settings;
  const [deleteVisible, setDeleteVisible] = useState(false);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/settings');
  };

  const toggleLock = (next: boolean) => {
    // Before the store write: TaharahLock reacts to lockEnabled and would cover this very screen.
    if (next) markUnlocked();
    store.setLockEnabled(next);
  };

  const deleteData = () => {
    store.clearEvents();
    setDeleteVisible(false);
    close();
  };

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
        <Text style={[typography.heading, { color: colors.headerText }]}>{t('taharah.settings.title')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title={t('taharah.settings.preset')}>
          <ChipRow
            values={TAHARAH_PRESET_IDS}
            selected={store.settings.preset}
            onSelect={store.setPreset}
            renderLabel={(value) => t(`taharah.preset.${value}`)}
          />
          <Text style={[typography.small, { color: colors.textMuted, marginTop: 8 }]}>
            {t('taharah.settings.rulesHint')}
          </Text>
          <Field label={t('taharah.rule.hefsekEarliestDay')}>
            <ChipRow
              values={HEFSEK_DAYS}
              selected={rules.hefsekEarliestDay}
              onSelect={(value) => store.setRule('hefsekEarliestDay', value)}
              renderLabel={String}
            />
          </Field>
          <Field label={t('taharah.rule.mochDachuk')}>
            <ChipRow
              values={MOCH_RULES}
              selected={rules.mochDachuk}
              onSelect={(value) => store.setRule('mochDachuk', value)}
              renderLabel={(value) => t(`taharah.moch.${value}`)}
            />
          </Field>
          <Field label={t('taharah.rule.onahBeinonitDays')}>
            <ChipRow
              values={ONAH_DAY_IDS}
              selected={rules.onahBeinonitDays.includes(31) ? '3031' : '30'}
              onSelect={(id) => store.setRule('onahBeinonitDays', [...ONAH_DAYS[id]])}
              renderLabel={(id) => t(`taharah.onahBeinonit.${id}`)}
            />
          </Field>
          <Field label={t('taharah.rule.onahBeinonitSpan')}>
            <ChipRow
              values={SPANS}
              selected={rules.onahBeinonitSpan}
              onSelect={(value) => store.setRule('onahBeinonitSpan', value)}
              renderLabel={(value) => t(`taharah.span.${value}`)}
            />
          </Field>
          <SwitchRow
            label={t('taharah.rule.ohrZarua')}
            value={rules.ohrZarua}
            onValueChange={(value) => store.setRule('ohrZarua', value)}
          />
          <Field label={t('taharah.rule.haflagaMethod')}>
            <ChipRow
              values={HAFLAGA_METHODS}
              selected={rules.haflagaMethod}
              onSelect={(value) => store.setRule('haflagaMethod', value)}
              renderLabel={(value) => t(`taharah.haflaga.${value}`)}
            />
          </Field>
        </SettingsSection>

        <SettingsSection title={t('taharah.settings.role')}>
          <ChipRow
            values={ROLES}
            selected={store.settings.role}
            onSelect={store.setRole}
            renderLabel={(value) => t(`taharah.role.${value}`)}
          />
          {store.settings.role === 'husband' ? (
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 8 }]}>
              {t('taharah.husband.hint')}
            </Text>
          ) : null}
        </SettingsSection>

        <SettingsSection title={t('taharah.settings.reminders')}>
          <SwitchRow
            label={t('taharah.settings.discreet')}
            hint={t('taharah.settings.discreetHint')}
            value={store.discreetNotifications}
            onValueChange={store.setDiscreetNotifications}
          />
          <SwitchRow
            label={t('taharah.settings.lock')}
            hint={t('taharah.settings.lockHint')}
            value={store.lockEnabled}
            onValueChange={toggleLock}
          />
          {LEAD_FIELDS.map((field) => (
            <Field key={field.key} label={t(field.label)}>
              <ChipRow
                values={LEAD_MINUTES}
                selected={store[field.key]}
                onSelect={(minutes) => store.setLeads({ [field.key]: minutes })}
                renderLabel={(minutes) => t('taharah.settings.minutes', { n: minutes })}
              />
            </Field>
          ))}
        </SettingsSection>

        <Pressable
          onPress={() => router.push('/taharah/calendar')}
          accessibilityRole="button"
          style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
        >
          <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('taharah.settings.calendar')}</Text>
        </Pressable>

        <Pressable
          onPress={() => setDeleteVisible(true)}
          accessibilityRole="button"
          style={[styles.dangerBtn, { backgroundColor: colors.urgentBg, borderColor: colors.urgent }]}
        >
          <Text style={[typography.bodyBold, { color: colors.urgent }]}>{t('taharah.settings.deleteData')}</Text>
        </Pressable>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={deleteVisible && !quiet}
        onRequestClose={() => setDeleteVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.heading, { color: colors.text, marginBottom: 8 }]}>
              {t('taharah.settings.deleteConfirmTitle')}
            </Text>
            <Text style={[typography.body, { color: colors.textSub, marginBottom: 18 }]}>
              {t('taharah.settings.deleteConfirmBody')}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setDeleteVisible(false)}
                accessibilityRole="button"
                style={[styles.modalBtn, { backgroundColor: colors.surface2 }]}
              >
                <Text style={[typography.bodyBold, { color: colors.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={deleteData}
                accessibilityRole="button"
                style={[styles.modalBtn, { backgroundColor: colors.urgent }]}
              >
                <Text style={[typography.bodyBold, { color: colors.onGold }]}>
                  {t('taharah.settings.deleteAction')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: 8 }]}>{label}</Text>
      {children}
    </View>
  );
}

function SwitchRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.switchRow, styles.field]}>
      <View style={{ flex: 1, paddingEnd: 12 }}>
        <Text style={[typography.bodyBold, { color: colors.text }]}>{label}</Text>
        {hint ? <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor="#fff"
        trackColor={{ false: colors.border, true: colors.gold }}
      />
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
  field: {
    marginTop: 14,
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dangerBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
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
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
