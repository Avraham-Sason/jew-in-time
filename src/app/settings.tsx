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
import { Stack } from 'expo-router';
import { LocationService } from '@/services/LocationService';
import { requestNotificationPermissions } from '@/services/NotificationScheduler';
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

  const requestNotifications = async () => {
    const granted = await requestNotificationPermissions();
    user.setNotificationPermission(granted ? 'granted' : 'denied');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <Stack.Screen options={{ title: t('settings.title'), headerShown: false }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.title, { color: colors.text, marginBottom: 12 }]}>{t('settings.title')}</Text>

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

        <Section title={t('settings.notifications')}>
          <Row label={t('settings.notifications')} value={user.notificationPermission === 'granted' ? t('settings.notificationsGranted') : t('settings.notificationsDenied')} />
          <Pressable onPress={requestNotifications} style={[styles.primaryBtn, { backgroundColor: colors.surface2 }]}>
            <Text style={[typography.bodyBold, { color: colors.text }]}>{t('onboarding.notificationsAction')}</Text>
          </Pressable>
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

        <Section title={t('settings.inIsrael')}>
          <View style={styles.switchRow}>
            <Text style={[typography.body, { color: colors.text }]}>
              {user.inIsrael ? t('settings.inIsrael') : t('settings.outsideIsrael')}
            </Text>
            <Switch
              value={user.inIsrael}
              onValueChange={user.setInIsrael}
              thumbColor="#fff"
              trackColor={{ false: colors.border, true: colors.gold }}
            />
          </View>
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
    <View style={styles.row}>
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
});
