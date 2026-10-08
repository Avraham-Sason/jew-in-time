import React, { useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { appVersionLabel } from '@/services/appUpdates';
import { LocationService } from '@/services/LocationService';
import {
  NotificationScheduler,
  requestNotificationPermissions,
  syncNotificationPermissionStatus,
} from '@/services/NotificationScheduler';
import { AppResetService } from '@/services/AppResetService';
import {
  openBatteryOptimizationSettings,
  supportsBatteryOptimizationSettings,
} from '@/services/deviceSettings';
import { chooseGender, chooseNusach, setTaharahTracking } from '@/stores/taharahOptIn';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { ChipRow } from '@/components/ChipRow';
import { SettingsSection } from '@/components/SettingsSection';
import { useQuietBlock } from '@/components/ShabbatScreen';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';
import { CITIES, getLocationName } from '@/data/cities';
import { Nusach } from '@/types/mitzvah';

const NUSACHAOT: Nusach[] = ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'];
const THEMES = ['system', 'light', 'dark'] as const;
const LANGS = ['he', 'en'] as const;
const OPINIONS = ['GRA', 'MA'] as const;
const GENDERS = ['male', 'female'] as const;
const CITY_INDEXES = CITIES.map((_, index) => index);

export default function SettingsScreen() {
  const { colors } = useTheme();
  const quiet = useQuietBlock() !== null;
  const { t, language } = useI18n();
  const router = useRouter();
  const user = useUserStore();
  // Held locally and committed on blur. Bound straight to the store, every keystroke serialised
  // the whole user store to MMKV and re-rendered the entire settings tree.
  const [nameDraft, setNameDraft] = useState(user.profileName);
  const [phoneDraft, setPhoneDraft] = useState(user.profilePhone);
  const [statusText, setStatusText] = useState('');
  const [resetVisible, setResetVisible] = useState(false);
  const [resetting, setResetting] = useState(false);

  const performReset = async () => {
    setResetting(true);
    try {
      await AppResetService.reset();
      setResetVisible(false);
      router.replace('/onboarding');
    } finally {
      setResetting(false);
    }
  };

  const [locating, setLocating] = useState(false);

  const refreshLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const resolved = await LocationService.getCurrentLocation();
      // Only commit a location the lookup actually produced. A failed refresh must keep the city
      // the user chose, not silently move them to the default.
      if (resolved.location) {
        user.setLocationState(resolved.location, resolved.status, resolved.source);
      } else {
        user.setLocationStatus(resolved.status);
      }
      setStatusText(resolved.location ? t('settings.gpsUpdated') : t('settings.gpsFallback'));
    } finally {
      setLocating(false);
    }
  };

  const openOsSettings = () => {
    Linking.openSettings().catch(() => {});
  };

  const onToggleNotifications = async (next: boolean) => {
    if (next) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        user.setNotificationsEnabled(false);
        openOsSettings();
        return;
      }
      user.setNotificationsEnabled(true);
      NotificationScheduler.rebuild().catch(() => {});
    } else {
      user.setNotificationsEnabled(false);
      NotificationScheduler.cancelAll().catch(() => {});
    }
  };

  const refreshPermStatus = async () => {
    await syncNotificationPermissionStatus();
  };

  const permGranted = user.notificationPermission === 'granted';
  const notifActive = user.notificationsEnabled && permGranted;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <Stack.Screen options={{ title: t('settings.title'), headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[typography.title, { color: colors.text, marginBottom: 12 }]}>{t('settings.title')}</Text>

        <SettingsSection title={t('settings.profile')}>
          <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: 6 }]}>
            {t('settings.profileName')}
          </Text>
          <TextInput
            value={nameDraft}
            onChangeText={setNameDraft}
            onBlur={() => user.setProfileName(nameDraft.trim())}
            placeholder={t('settings.profileNamePlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface2,
                color: colors.text,
                borderColor: colors.border,
                writingDirection: language === 'he' ? 'rtl' : 'ltr',
                textAlign: language === 'he' ? 'right' : 'left',
              },
            ]}
            autoCapitalize="words"
          />
          <Text style={[typography.captionBold, { color: colors.textSub, marginTop: 12, marginBottom: 6 }]}>
            {t('settings.profilePhone')}
          </Text>
          <TextInput
            value={phoneDraft}
            onChangeText={setPhoneDraft}
            onBlur={() => user.setProfilePhone(phoneDraft.trim())}
            placeholder={t('settings.profilePhonePlaceholder')}
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            style={[
              styles.input,
              {
                backgroundColor: colors.surface2,
                color: colors.text,
                borderColor: colors.border,
                writingDirection: language === 'he' ? 'rtl' : 'ltr',
                textAlign: language === 'he' ? 'right' : 'left',
              },
            ]}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.notifications')}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingEnd: 12 }}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>
                {t('settings.notificationsToggle')}
              </Text>
              <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
                {notifActive
                  ? t('settings.notificationsActiveHint')
                  : user.notificationsEnabled && !permGranted
                  ? t('settings.notificationsBlockedHint')
                  : t('settings.notificationsOffHint')}
              </Text>
            </View>
            <Switch
              value={user.notificationsEnabled}
              onValueChange={onToggleNotifications}
              thumbColor="#fff"
              trackColor={{ false: colors.border, true: colors.gold }}
            />
          </View>
          <Row
            label={t('settings.notificationsOsStatus')}
            value={permGranted ? t('settings.notificationsGranted') : t('settings.notificationsDenied')}
          />
          {!permGranted ? (
            <Pressable onPress={openOsSettings} style={[styles.primaryBtn, { backgroundColor: colors.gold }]}>
              <Text style={[typography.bodyBold, { color: colors.onGold }]}>
                {t('settings.openOsSettings')}
              </Text>
            </Pressable>
          ) : null}
          <Pressable onPress={refreshPermStatus} style={[styles.primaryBtn, { backgroundColor: colors.surface2 }]}>
            <Text style={[typography.bodyBold, { color: colors.text }]}>
              {t('settings.refreshPermStatus')}
            </Text>
          </Pressable>
          <Text style={[typography.small, { color: colors.textMuted, marginTop: 8 }]}>
            {Platform.OS === 'ios' ? t('settings.iosHint') : t('settings.androidHint')}
          </Text>
        </SettingsSection>

        {/* Exact alarms are declared in the manifest, but OEM battery managers can still defer
            them. Exempting the app is the one part only the user can do. */}
        {supportsBatteryOptimizationSettings() ? (
          <SettingsSection title={t('settings.batteryTitle')}>
            <Text style={[typography.small, { color: colors.textMuted }]}>{t('settings.batteryHint')}</Text>
            <Pressable
              onPress={() => openBatteryOptimizationSettings()}
              accessibilityRole="button"
              style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
            >
              <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('settings.batteryAction')}</Text>
            </Pressable>
          </SettingsSection>
        ) : null}

        <SettingsSection title={t('settings.nusach')}>
          <ChipRow values={NUSACHAOT} selected={user.nusach} onSelect={chooseNusach} renderLabel={(value) => t(`nusach.${value}`)} />
        </SettingsSection>

        <SettingsSection title={t('settings.taharah')}>
          <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: 8 }]}>{t('profile.gender')}</Text>
          <ChipRow values={GENDERS} selected={user.gender} onSelect={chooseGender} renderLabel={(value) => t(`profile.gender.${value}`)} />
          <View style={[styles.switchRow, { marginTop: 14 }]}>
            <View style={{ flex: 1, paddingEnd: 12 }}>
              <Text style={[typography.bodyBold, { color: colors.text }]}>{t('settings.taharahEnabled')}</Text>
              {user.gender ? (
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
                  {t(user.gender === 'female' ? 'taharah.optIn.woman.body' : 'taharah.optIn.husband.body')}
                </Text>
              ) : null}
            </View>
            <Switch
              value={user.taharahEnabled}
              onValueChange={setTaharahTracking}
              disabled={!user.gender}
              thumbColor="#fff"
              trackColor={{ false: colors.border, true: colors.gold }}
            />
          </View>
          {user.taharahEnabled ? (
            <Pressable
              onPress={() => router.push('/taharah/settings')}
              accessibilityRole="button"
              style={[styles.primaryBtn, { backgroundColor: colors.gold }]}
            >
              <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('settings.taharahOpen')}</Text>
            </Pressable>
          ) : null}
          <Text style={[typography.small, { color: colors.textMuted, marginTop: 8 }]}>{t('taharah.disclaimer')}</Text>
        </SettingsSection>

        <SettingsSection title={t('settings.location')}>
          <Text style={[typography.bodyBold, { color: colors.text }]}>{getLocationName(user.location, language)}</Text>
          <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
            {t(`settings.locationStatus.${user.locationStatus}`)}
          </Text>
          <Pressable onPress={refreshLocation} style={[styles.primaryBtn, { backgroundColor: colors.gold }]}>
            <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('settings.useCurrentLocation')}</Text>
          </Pressable>
          {statusText ? <Text style={[typography.small, { color: colors.textMuted, marginTop: 8 }]}>{statusText}</Text> : null}
          <Text style={[typography.captionBold, { color: colors.textSub, marginTop: 14, marginBottom: 8 }]}>{t('settings.pickCity')}</Text>
          <ChipRow
            values={CITY_INDEXES}
            selected={CITIES.findIndex((city) => city.name === user.location.name)}
            onSelect={(index) => user.setLocationState(CITIES[index], 'ready', 'manual')}
            renderLabel={(index) => getLocationName(CITIES[index], language)}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.theme')}>
          <ChipRow
            values={THEMES}
            selected={user.theme}
            onSelect={(value) => user.setTheme(value)}
            renderLabel={(value) => t(`settings.theme.${value}`)}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.language')}>
          <ChipRow
            values={LANGS}
            selected={user.language}
            onSelect={(value) => user.setLanguage(value)}
            renderLabel={(value) => t(`settings.language.${value}`)}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.opinion')}>
          <ChipRow
            values={OPINIONS}
            selected={user.halachicOpinions.ksSofZman}
            onSelect={(value) => user.setKsOpinion(value)}
            renderLabel={(value) => t(`settings.opinion.${value}`)}
          />
        </SettingsSection>

        <Pressable
          onPress={() => setResetVisible(true)}
          style={[styles.dangerBtn, { backgroundColor: colors.urgentBg, borderColor: colors.urgent }]}
        >
          <Text style={[typography.bodyBold, { color: colors.urgent }]}>{t('settings.logout')}</Text>
        </Pressable>

        <Text style={[typography.small, styles.versionText, { color: colors.textMuted }]}>
          {t('settings.version', { version: appVersionLabel() })}
        </Text>

      </ScrollView>

      <Modal animationType="fade" transparent visible={resetVisible && !quiet} onRequestClose={() => setResetVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.heading, { color: colors.text, marginBottom: 8 }]}>
              {t('settings.logoutConfirmTitle')}
            </Text>
            <Text style={[typography.body, { color: colors.textSub, marginBottom: 18 }]}>
              {t('settings.logoutConfirmBody')}
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setResetVisible(false)}
                disabled={resetting}
                style={[styles.modalBtn, { backgroundColor: colors.surface2 }]}
              >
                <Text style={[typography.bodyBold, { color: colors.text }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                onPress={performReset}
                disabled={resetting}
                style={[styles.modalBtn, { backgroundColor: colors.urgent, opacity: resetting ? 0.6 : 1 }]}
              >
                <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('settings.logoutConfirmAction')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { marginTop: 12 }]}>
      <Text style={[typography.bodyBold, { color: colors.text }]}>{label}</Text>
      <Text style={[typography.body, { color: colors.gold }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  dangerBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 16,
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
