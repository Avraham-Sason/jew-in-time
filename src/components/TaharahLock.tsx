import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  authenticate,
  biometricsAvailable,
  isSessionUnlocked,
  lockStatusFor,
  markUnlocked,
} from '@/services/biometricLock';
import { useTaharahStore } from '@/stores/useTaharahStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';

type Props = { children: React.ReactNode; recheck?: number };

export function TaharahLock({ children, recheck = 0 }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const lockEnabled = useTaharahStore((s) => s.lockEnabled);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [, refresh] = useReducer((n: number) => n + 1, 0);

  const unlock = useCallback(async () => {
    if (!(await authenticate(t('taharah.locked.prompt')))) return;
    markUnlocked();
    refresh();
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    biometricsAvailable().then((ok) => {
      if (cancelled) return;
      setAvailable(ok);
      if (ok && lockEnabled && !isSessionUnlocked() && AppState.currentState === 'active') unlock();
    });
    return () => {
      cancelled = true;
    };
  }, [lockEnabled, recheck, unlock]);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  if (lockEnabled && available === null) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  const status = lockStatusFor(lockEnabled, available === true, isSessionUnlocked());

  if (status === 'locked') {
    return (
      <View style={[styles.fill, { backgroundColor: colors.bg }]}>
        <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
          <View style={[styles.center, styles.fill, styles.cover]}>
            <Text style={[typography.title, styles.text, { color: colors.text }]}>{t('taharah.locked.title')}</Text>
            <Text style={[typography.body, styles.text, { color: colors.textSub, marginTop: 8 }]}>
              {t('taharah.locked.body')}
            </Text>
            <Pressable
              onPress={unlock}
              accessibilityRole="button"
              style={[styles.button, { backgroundColor: colors.gold }]}
            >
              <Text style={[typography.heading, { color: colors.onGold }]}>{t('taharah.locked.unlock')}</Text>
            </Pressable>
            <Pressable onPress={goBack} accessibilityRole="button" hitSlop={12} style={styles.back}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>{t('common.back')}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg }]}>
      {status === 'unavailable' ? (
        <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface2 }}>
          <Text style={[typography.caption, styles.banner, { color: colors.textMuted }]}>
            {t('taharah.locked.unavailable')}
          </Text>
        </SafeAreaView>
      ) : null}
      <View style={styles.fill}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cover: {
    paddingHorizontal: 28,
  },
  text: {
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  back: {
    marginTop: 18,
    padding: 6,
  },
  banner: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    textAlign: 'center',
  },
});
