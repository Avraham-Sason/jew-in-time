import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppLogo } from '@/components/AppLogo';
import { ONBOARDING_STEPS, OnboardingDots } from '@/components/OnboardingDots';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const router = useRouter();
  const profileName = useUserStore((s) => s.profileName);
  const profilePhone = useUserStore((s) => s.profilePhone);
  const setProfileName = useUserStore((s) => s.setProfileName);
  const setProfilePhone = useUserStore((s) => s.setProfilePhone);
  const [name, setName] = useState(profileName);
  const [phone, setPhone] = useState(profilePhone);
  const [error, setError] = useState('');

  // Name and phone are stored locally and used by no feature, so nothing is gained by blocking
  // onboarding on them.
  const submit = () => {
    setProfileName(name.trim());
    setProfilePhone(phone.trim());
    router.push('/onboarding/profile');
  };

  const inputStyle = {
    backgroundColor: colors.surface2,
    color: colors.text,
    borderColor: colors.border,
    writingDirection: language === 'he' ? 'rtl' : 'ltr',
  } as const;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <AppLogo size={64} />
            <Text style={[typography.title, { color: colors.text, marginTop: 12 }]}>
              {t('onboarding.registerTitle')}
            </Text>
            <Text style={[typography.body, styles.body, { color: colors.textSub }]}>
              {t('onboarding.registerBody')}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: 6 }]}>
              {t('settings.profileName')}
            </Text>
            <TextInput
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (error) setError('');
              }}
              placeholder={t('settings.profileNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              style={[styles.input, inputStyle, error ? { borderColor: colors.urgent } : null]}
            />
            {error ? <Text style={[typography.small, { color: colors.urgent, marginTop: 4 }]}>{error}</Text> : null}

            <Text style={[typography.captionBold, { color: colors.textSub, marginTop: 14, marginBottom: 6 }]}>
              {t('settings.profilePhone')}
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder={t('settings.profilePhonePlaceholder')}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              style={[styles.input, inputStyle]}
            />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <OnboardingDots step={0} total={ONBOARDING_STEPS} />
          <Pressable onPress={submit} style={[styles.cta, { backgroundColor: colors.gold }]}>
            <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('common.continue')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    padding: 18,
  },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  header: {
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 22,
  },
  body: {
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
  },
  form: {
    paddingHorizontal: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  footer: {
    gap: 12,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 13,
  },
});
