import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { AppLogo } from '@/components/AppLogo';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';

export default function WelcomeScreen() {
  const { colors, isDark } = useTheme();
  const { t, language } = useI18n();
  const router = useRouter();
  const profileName = useUserStore((s) => s.profileName);
  const profilePhone = useUserStore((s) => s.profilePhone);
  const setProfileName = useUserStore((s) => s.setProfileName);
  const setProfilePhone = useUserStore((s) => s.setProfilePhone);
  const [name, setName] = useState(profileName);
  const [phone, setPhone] = useState(profilePhone);
  const [error, setError] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('onboarding.nameRequired'));
      return;
    }
    setProfileName(trimmed);
    setProfilePhone(phone.trim());
    router.push('/onboarding/nusach');
  };

  const inputStyle = {
    backgroundColor: colors.surface2,
    color: colors.text,
    borderColor: colors.border,
    writingDirection: language === 'he' ? 'rtl' : 'ltr',
    textAlign: language === 'he' ? 'right' : 'left',
  } as const;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <AppLogo size={64} isDark={isDark} />
            <Text style={[typography.title, { color: colors.text, marginTop: 12 }]}>
              {t('onboarding.registerTitle')}
            </Text>
            <Text style={[typography.body, styles.body, { color: colors.textSub }]}>
              {t('onboarding.registerBody')}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[typography.captionBold, { color: colors.textSub, marginBottom: 6 }]}>
              {t('settings.profileName')} *
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
            {error ? (
              <Text style={[typography.small, { color: colors.urgent, marginTop: 4 }]}>{error}</Text>
            ) : null}

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
          <Dots step={0} />
          <Pressable onPress={submit} style={[styles.cta, { backgroundColor: colors.gold }]}>
            <Text style={[typography.bodyBold, { color: '#fff' }]}>{t('common.continue')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  dots: {
    flexDirection: 'row',
    gap: 5,
    alignSelf: 'center',
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
});
