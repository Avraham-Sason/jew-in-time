import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ChoiceRow } from '@/components/ChoiceRow';
import { ONBOARDING_STEPS, OnboardingDots } from '@/components/OnboardingDots';
import { chooseNusach } from '@/stores/taharahOptIn';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';

const OPTIONS = ['ashkenaz', 'sefard', 'edot_hamizrach', 'chabad'] as const;

export default function NusachScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const selected = useUserStore((s) => s.nusach);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={[typography.title, { color: colors.text }]}>{t('onboarding.nusachTitle')}</Text>
      <Text style={[typography.body, { color: colors.textSub, marginTop: 4 }]}>{t('onboarding.nusachBody')}</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {OPTIONS.map((option) => (
          <ChoiceRow key={option} label={t(`nusach.${option}`)} selected={selected === option} onPress={() => chooseNusach(option)} />
        ))}
      </ScrollView>
      <OnboardingDots step={2} total={ONBOARDING_STEPS} style={styles.dots} />
      <Pressable onPress={() => router.push('/onboarding/location')} accessibilityRole="button" style={[styles.cta, { backgroundColor: colors.gold }]}>
        <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('common.continue')}</Text>
      </Pressable>
      <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.backBtn}>
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
  list: {
    paddingTop: 16,
    gap: 8,
    flexGrow: 1,
  },
  dots: {
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
