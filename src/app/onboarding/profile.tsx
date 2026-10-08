import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ONBOARDING_STEPS, OnboardingDots } from '@/components/OnboardingDots';
import { chooseGender, setTaharahTracking } from '@/stores/taharahOptIn';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';

const GENDERS = ['male', 'female'] as const;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const gender = useUserStore((s) => s.gender);
  const taharahEnabled = useUserStore((s) => s.taharahEnabled);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={[typography.title, { color: colors.text }]}>{t('onboarding.profileTitle')}</Text>
      <Text style={[typography.body, { color: colors.textSub, marginTop: 4 }]}>{t('onboarding.profileBody')}</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {GENDERS.map((option) => {
          const isSelected = gender === option;
          return (
            <Pressable
              key={option}
              onPress={() => chooseGender(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              style={[
                styles.option,
                {
                  borderColor: isSelected ? colors.gold : colors.border,
                  backgroundColor: isSelected ? colors.goldLight : colors.surface,
                },
              ]}
            >
              <Text style={[typography.bodyBold, { color: isSelected ? colors.gold : colors.text }]}>{t(`profile.gender.${option}`)}</Text>
              {isSelected ? (
                <View style={[styles.tick, { backgroundColor: colors.gold }]}>
                  <Text style={[typography.micro, { color: colors.onGold }]}>✓</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}

        {gender ? (
          <View style={[styles.card, { backgroundColor: colors.goldLight, borderColor: colors.gold }]}>
            <Text style={[typography.subheading, { color: colors.text }]}>
              {t(gender === 'female' ? 'taharah.optIn.woman.title' : 'taharah.optIn.husband.title')}
            </Text>
            <Text style={[typography.small, { color: colors.textSub, marginTop: 4 }]}>
              {t(gender === 'female' ? 'taharah.optIn.woman.body' : 'taharah.optIn.husband.body')}
            </Text>
            <View style={styles.switchRow}>
              <Text style={[typography.bodyBold, styles.switchLabel, { color: colors.text }]}>{t('taharah.optIn.toggle')}</Text>
              <Switch
                value={taharahEnabled}
                onValueChange={setTaharahTracking}
                thumbColor="#fff"
                trackColor={{ false: colors.border, true: colors.gold }}
              />
            </View>
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 10 }]}>{t('taharah.disclaimer')}</Text>
          </View>
        ) : null}
      </ScrollView>
      <OnboardingDots step={1} total={ONBOARDING_STEPS} style={styles.dots} />
      <Pressable
        onPress={() => router.push('/onboarding/nusach')}
        disabled={!gender}
        accessibilityRole="button"
        style={[styles.cta, { backgroundColor: colors.gold, opacity: gender ? 1 : 0.5 }]}
      >
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
  option: {
    borderRadius: 13,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginTop: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  switchLabel: {
    flex: 1,
    paddingEnd: 12,
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
