import 'expo-dev-client';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { I18nManager, View, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Heebo_300Light,
  Heebo_400Regular,
  Heebo_500Medium,
  Heebo_600SemiBold,
  Heebo_700Bold,
  Heebo_800ExtraBold,
  Heebo_900Black,
} from '@expo-google-fonts/heebo';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { useUserStore } from '@/stores/useUserStore';
import { initNotificationHandlers } from '@/services/NotificationScheduler';
import { setLocale } from '@/i18n';

function syncDocumentDirection(language: 'he' | 'en') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const dir = language === 'he' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', language);
  document.body?.setAttribute('dir', dir);
}

function syncLayoutDirection(language: 'he' | 'en') {
  const wantRTL = language === 'he';
  setLocale(language);
  syncDocumentDirection(language);
  I18nManager.allowRTL(wantRTL);
  if (I18nManager.isRTL !== wantRTL) {
    I18nManager.forceRTL(wantRTL);
  }
}

const initialLanguage = useUserStore.getState().language;
syncLayoutDirection(initialLanguage);

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootInner() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const isOnboarded = useUserStore((s) => s.isOnboarded);
  const language = useUserStore((s) => s.language);

  useEffect(() => {
    const first = segments[0];
    const inOnboarding = first === 'onboarding';
    if (!isOnboarded && !inOnboarding) {
      router.replace('/onboarding');
    } else if (isOnboarded && inOnboarding) {
      router.replace('/(tabs)/home');
    }
  }, [isOnboarded, segments, router]);

  useEffect(() => {
    syncLayoutDirection(language);
  }, [language]);

  return (
    <View style={{ flex: 1, direction: language === 'he' ? 'rtl' : 'ltr' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="mitzvah/[id]" options={{ presentation: 'card' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Heebo_300Light,
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_600SemiBold,
    Heebo_700Bold,
    Heebo_800ExtraBold,
    Heebo_900Black,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
      initNotificationHandlers();
    }
  }, [loaded]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootInner />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
