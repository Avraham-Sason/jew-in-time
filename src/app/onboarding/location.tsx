import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ONBOARDING_STEPS, OnboardingDots } from '@/components/OnboardingDots';
import { LocationService } from '@/services/LocationService';
import { requestNotificationPermissions } from '@/services/NotificationScheduler';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';
import { CITIES, getLocationName } from '@/data/cities';

export default function OnboardingLocationScreen() {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const router = useRouter();
  const user = useUserStore();
  const [busy, setBusy] = useState(false);

  const refreshLocation = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const resolved = await LocationService.getCurrentLocation();
      if (resolved.location) {
        user.setLocationState(resolved.location, resolved.status, resolved.source);
      } else {
        user.setLocationStatus(resolved.status);
      }
    } finally {
      // Without this a rejection left the button reading "..." forever, dead-ending onboarding.
      setBusy(false);
    }
  };

  const allowNotifications = async () => {
    const granted = await requestNotificationPermissions();
    user.setNotificationPermission(granted ? 'granted' : 'denied');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={[typography.title, { color: colors.text }]}>{t('onboarding.locationTitle')}</Text>
      <Text style={[typography.body, { color: colors.textSub, marginTop: 4 }]}>{t('onboarding.locationBody')}</Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.bodyBold, { color: colors.text }]}>{getLocationName(user.location, language)}</Text>
        <Text style={[typography.small, { color: colors.textMuted, marginTop: 4 }]}>
          {t(`settings.locationStatus.${user.locationStatus}`)}
        </Text>
        <Pressable onPress={refreshLocation} style={[styles.secondaryBtn, { backgroundColor: colors.surface2 }]}>
          <Text style={[typography.bodyBold, { color: colors.text }]}>{busy ? '...' : t('onboarding.locationRefresh')}</Text>
        </Pressable>
      </View>

      <View style={[styles.cityWrap, { borderColor: colors.border }]}>
        {CITIES.map((city) => {
          const selected = city.name === user.location.name;
          return (
            <Pressable
              key={city.name}
              onPress={() => user.setLocationState(city, 'ready', 'manual')}
              style={[styles.cityPill, { backgroundColor: selected ? colors.gold : colors.surface2 }]}
            >
              <Text style={[typography.small, { color: selected ? colors.onGold : colors.textSub }]}>{getLocationName(city, language)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.card, { backgroundColor: colors.goldLight, borderColor: colors.gold }]}>
        <Text style={[typography.subheading, { color: colors.text }]}>{t('onboarding.notificationsTitle')}</Text>
        <Text style={[typography.small, { color: colors.textSub, marginTop: 4 }]}>{t('onboarding.notificationsBody')}</Text>
        <Pressable onPress={allowNotifications} style={[styles.secondaryBtn, { borderColor: colors.gold, borderWidth: 1.5 }]}>
          <Text style={[typography.bodyBold, { color: colors.gold }]}>{t('onboarding.notificationsAction')}</Text>
        </Pressable>
      </View>

      <OnboardingDots step={3} total={ONBOARDING_STEPS} style={styles.dots} />
      <Pressable onPress={() => router.push('/onboarding/ready')} style={[styles.cta, { backgroundColor: colors.gold }]}>
        <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('common.continue')}</Text>
      </Pressable>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[typography.small, { color: colors.textSub }]}>{t('common.back')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: 18,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginTop: 18,
  },
  secondaryBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  cityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  cityPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dots: {
    marginTop: 'auto',
    marginBottom: 10,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 13,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
