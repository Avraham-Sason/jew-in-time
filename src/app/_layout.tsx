import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { I18nManager, View, ActivityIndicator } from 'react-native';
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

if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

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
    setLocale(language);
  }, [language]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="mitzvah/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </>
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
