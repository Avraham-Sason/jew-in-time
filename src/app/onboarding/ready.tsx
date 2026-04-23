import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { NotificationScheduler } from '@/services/NotificationScheduler';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';

export default function ReadyScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const setOnboarded = useUserStore((s) => s.setOnboarded);

  const finish = async () => {
    setOnboarded(true);
    await NotificationScheduler.rebuild().catch(() => {});
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.center}>
        <View style={[styles.iconWrap, { backgroundColor: colors.goldLight }]}>
          <Text style={{ fontSize: 36 }}>✦</Text>
        </View>
        <Text style={[typography.title, { color: colors.text, marginTop: 14 }]}>{t('onboarding.readyTitle')}</Text>
        <Text style={[typography.body, { color: colors.textSub, textAlign: 'center', marginTop: 8 }]}>
          {t('onboarding.readyBody')}
        </Text>
        <Dots step={3} />
      </View>
      <Pressable onPress={finish} style={[styles.cta, { backgroundColor: colors.gold }]}>
        <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('onboarding.finish')}</Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 18,
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
});
