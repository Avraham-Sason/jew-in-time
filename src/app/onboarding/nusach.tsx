import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
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
  const setNusach = useUserStore((s) => s.setNusach);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={[typography.title, { color: colors.text }]}>{t('onboarding.nusachTitle')}</Text>
      <Text style={[typography.body, { color: colors.textSub, marginTop: 4 }]}>{t('onboarding.nusachBody')}</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {OPTIONS.map((option) => {
          const isSelected = selected === option;
          return (
            <Pressable
              key={option}
              onPress={() => setNusach(option)}
              style={[
                styles.option,
                {
                  borderColor: isSelected ? colors.gold : colors.border,
                  backgroundColor: isSelected ? colors.goldLight : colors.surface,
                },
              ]}
            >
              <Text style={[typography.bodyBold, { color: isSelected ? colors.gold : colors.text }]}>{t(`nusach.${option}`)}</Text>
              {isSelected ? (
                <View style={[styles.tick, { backgroundColor: colors.gold }]}>
                  <Text style={[typography.micro, { color: '#fff' }]}>✓</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <Dots step={1} />
      <Pressable onPress={() => router.push('/onboarding/location')} style={[styles.cta, { backgroundColor: colors.gold }]}>
        <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('common.continue')}</Text>
      </Pressable>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[typography.small, { color: colors.textSub }]}>{t('common.back')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Dots({ step }: { step: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dots}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={[styles.dot, { width: index === step ? 22 : 7, backgroundColor: index === step ? colors.gold : colors.border }]} />
      ))}
    </View>
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
  dots: {
    flexDirection: 'row',
    gap: 5,
    alignSelf: 'center',
    marginBottom: 10,
  },
  dot: {
    height: 7,
    borderRadius: 4,
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
