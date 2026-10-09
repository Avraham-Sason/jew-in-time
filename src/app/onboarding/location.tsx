import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  PressableStateCallbackType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Animated, { FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ChipRow } from '@/components/ChipRow';
import { ONBOARDING_STEPS, OnboardingDots } from '@/components/OnboardingDots';
import { LocationService } from '@/services/LocationService';
import { reportError } from '@/services/errors';
import { requestNotificationPermissions, syncNotificationPermissionStatus } from '@/services/NotificationScheduler';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';
import { CITIES, findCityByName, getLocationName } from '@/data/cities';

const CITY_NAMES = CITIES.map((city) => city.name);

export default function OnboardingLocationScreen() {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const router = useRouter();
  const user = useUserStore();
  const [busy, setBusy] = useState(false);
  const [requesting, setRequesting] = useState(false);
  // Only an answer to this screen's own request counts as "blocked": the stored status reads
  // 'denied' for a permission never asked yet.
  const [refused, setRefused] = useState(false);
  const notificationsGranted = user.notificationPermission === 'granted';
  const locationReady = user.locationStatus === 'ready';

  useEffect(() => {
    syncNotificationPermissionStatus().catch((error) => reportError('schedule', error));
  }, []);

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
    if (requesting) return;
    Haptics.selectionAsync().catch(() => {});
    setRequesting(true);
    try {
      const granted = await requestNotificationPermissions();
      user.setNotificationPermission(granted ? 'granted' : 'denied');
      setRefused(!granted);
    } catch {
      setRefused(true);
    } finally {
      setRequesting(false);
    }
  };

  const pressFeedback = ({ pressed }: PressableStateCallbackType) =>
    pressed ? { opacity: 0.6, transform: [{ scale: 0.97 }] } : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={[typography.title, { color: colors.text }]}>{t('onboarding.locationTitle')}</Text>
      <Text style={[typography.body, { color: colors.textSub, marginTop: spacing.xs }]}>
        {t('onboarding.locationBody')}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typography.bodyBold, { color: colors.text }]}>{getLocationName(user.location, language)}</Text>
        <Text style={[typography.small, { color: colors.textMuted, marginTop: spacing.xs }]}>
          {t(`settings.locationStatus.${user.locationStatus}`)}
        </Text>
        <Pressable
          onPress={refreshLocation}
          accessibilityRole="button"
          style={(state) => [styles.secondaryBtn, { backgroundColor: colors.surface2 }, pressFeedback(state)]}
        >
          <Text style={[typography.bodyBold, { color: colors.text }]}>
            {busy ? '...' : t('onboarding.locationRefresh')}
          </Text>
        </Pressable>
      </View>

      <ChipRow
        values={CITY_NAMES}
        selected={user.location.name}
        onSelect={(name) => {
          const city = findCityByName(name);
          if (city) user.setLocationState(city, 'ready', 'manual');
        }}
        renderLabel={(name) => {
          const city = findCityByName(name);
          return city ? getLocationName(city, language) : name;
        }}
        style={styles.cities}
      />

      {notificationsGranted ? null : (
        <Animated.View
          exiting={FadeOut.duration(250)}
          style={[styles.card, { backgroundColor: colors.goldLight, borderColor: colors.gold }]}
        >
          <Text style={[typography.subheading, { color: colors.text }]}>{t('onboarding.notificationsTitle')}</Text>
          <Text style={[typography.small, { color: colors.textSub, marginTop: spacing.xs }]}>
            {refused ? t('onboarding.notificationsBlocked') : t('onboarding.notificationsBody')}
          </Text>
          <Pressable
            onPress={refused ? () => Linking.openSettings().catch(() => {}) : allowNotifications}
            disabled={requesting}
            accessibilityRole="button"
            accessibilityState={{ busy: requesting }}
            style={(state) => [
              styles.secondaryBtn,
              { borderColor: colors.gold, borderWidth: 1.5 },
              pressFeedback(state),
            ]}
          >
            {requesting ? (
              <ActivityIndicator color={colors.gold} />
            ) : (
              <Text style={[typography.bodyBold, { color: colors.goldText }]}>
                {refused ? t('onboarding.notificationsOpenSettings') : t('onboarding.notificationsAction')}
              </Text>
            )}
          </Pressable>
        </Animated.View>
      )}

      <OnboardingDots step={3} total={ONBOARDING_STEPS} style={styles.dots} />
      <Pressable
        onPress={() => router.push('/onboarding/ready')}
        disabled={!locationReady}
        accessibilityRole="button"
        accessibilityState={{ disabled: !locationReady }}
        style={[styles.cta, { backgroundColor: colors.gold }, locationReady ? null : styles.ctaDisabled]}
      >
        <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('common.continue')}</Text>
      </Pressable>
      {locationReady ? null : (
        <Text style={[typography.small, styles.locationHint, { color: colors.textMuted }]}>
          {t('onboarding.locationRequired')}
        </Text>
      )}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[typography.small, { color: colors.textSub }]}>{t('common.back')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: spacing.xl,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  secondaryBtn: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  cities: {
    marginTop: spacing.lg,
  },
  dots: {
    marginTop: 'auto',
    marginBottom: spacing.md,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  locationHint: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
});
