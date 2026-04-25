import React, { useMemo, useState } from 'react';
import {
  Linking,
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
import { Stack } from 'expo-router';
import { LocationService } from '@/services/LocationService';
import {
  NotificationScheduler,
  requestNotificationPermissions,
  syncNotificationPermissionStatus,
} from '@/services/NotificationScheduler';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';
import { CITIES, getLocationName } from '@/data/cities';
import { Nusach } from '@/types/mitzvah';

const NUSACHAOT: Nusach[] = ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'];
const THEMES = ['system', 'light', 'dark'] as const;
const LANGS = ['he', 'en'] as const;
const OPINIONS = ['GRA', 'MA'] as const;

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const user = useUserStore();
  const [statusText, setStatusText] = useState('');

  const cityOptions = useMemo(() => CITIES.slice(0, 12), []);

  const refreshLocation = async () => {
    const resolved = await LocationService.getCurrentLocation();
    user.setLocationState(resolved.location, resolved.status, resolved.source);
    setStatusText(resolved.status === 'ready' ? t('settings.gpsUpdated') : t('settings.gpsFallback'));
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

        <Section title={t('settings.profile')}>
          <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: 6 }]}>
            {t('settings.profileName')}
          </Text>
          <TextInput
            value={user.profileName}
            onChangeText={user.setProfileName}
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
            value={user.profilePhone}
            onChangeText={user.setProfilePhone}
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
        </Section>

        <Section title={t('settings.notifications')}>
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
              <Text style={[typography.bodyBold, { color: '#fff' }]}>
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
        </Section>

        <Section title={t('settings.nusach')}>
          <ChipRow values={NUSACHAOT} selected={user.nusach} onSelect={(value) => user.setNusach(value)} renderLabel={(value) => t(`nusach.${value}`)} />
        </Section>

        <Section title={t('settings.location')}>
          <Text style={[typography.bodyBold, { color: colors.text }]}>{getLocationName(user.location, language)}</Text>
          <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
            {t(`settings.locationStatus.${user.locationStatus}`)}
          </Text>
          <Pressable onPress={refreshLocation} style={[styles.primaryBtn, { backgroundColor: colors.gold }]}>
            <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('settings.useCurrentLocation')}</Text>
          </Pressable>
          {statusText ? <Text style={[typography.small, { color: colors.textMuted, marginTop: 8 }]}>{statusText}</Text> : null}
          <Text style={[typography.captionBold, { color: colors.textSub, marginTop: 14, marginBottom: 8 }]}>{t('settings.pickCity')}</Text>
          <View style={styles.wrapRow}>
            {cityOptions.map((city) => {
              const selected = city.name === user.location.name;
              return (
                <Pressable
                  key={city.name}
                  onPress={() => user.setLocationState(city, 'ready', 'manual')}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: selected ? colors.gold : colors.surface2,
                    },
                  ]}
                >
                  <Text style={[typography.small, { color: selected ? '#fff' : colors.textSub }]}>{getLocationName(city, language)}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title={t('settings.theme')}>
          <ChipRow
            values={THEMES}
            selected={user.theme}
            onSelect={(value) => user.setTheme(value)}
            renderLabel={(value) => t(`settings.theme.${value}`)}
          />
        </Section>

        <Section title={t('settings.language')}>
          <ChipRow values={LANGS} selected={user.language} onSelect={(value) => user.setLanguage(value)} renderLabel={(value) => value.toUpperCase()} />
        </Section>

        <Section title={t('settings.opinion')}>
          <ChipRow
            values={OPINIONS}
            selected={user.halachicOpinions.ksSofZman}
            onSelect={(value) => user.setKsOpinion(value)}
            renderLabel={(value) => value}
          />
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[typography.subheading, { color: colors.text, marginBottom: 12 }]}>{title}</Text>
      {children}
    </View>
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

function ChipRow<T extends string>({
  values,
  selected,
  onSelect,
  renderLabel,
}: {
  values: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  renderLabel: (value: T) => string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapRow}>
      {values.map((value) => {
        const active = selected === value;
        return (
          <Pressable
            key={value}
            onPress={() => onSelect(value)}
            style={[
              styles.pill,
              {
                backgroundColor: active ? colors.gold : colors.surface2,
              },
            ]}
          >
            <Text style={[typography.small, { color: active ? '#fff' : colors.textSub }]}>{renderLabel(value)}</Text>
          </Pressable>
        );
      })}
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
  section: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  primaryBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
});
