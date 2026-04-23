import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppLogo } from '@/components/AppLogo';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';

export default function WelcomeScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.center}>
        <AppLogo size={72} isDark={isDark} />
        <Text style={[typography.display, { color: colors.text, marginTop: 14 }]}>{t('onboarding.welcomeTitle')}</Text>
        <Text style={[typography.body, styles.body, { color: colors.textSub }]}>{t('onboarding.welcomeBody')}</Text>
        <Dots step={0} />
      </View>
      <Pressable onPress={() => router.push('/onboarding/nusach')} style={[styles.cta, { backgroundColor: colors.gold }]}>
        <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('onboarding.start')}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function Dots({ step }: { step: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.dots}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              width: index === step ? 22 : 7,
              backgroundColor: index === step ? colors.gold : colors.border,
            },
          ]}
        />
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
  body: {
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 13,
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
});
