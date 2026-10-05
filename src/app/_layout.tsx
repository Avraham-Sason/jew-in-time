import 'expo-dev-client';
import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { DevSettings, I18nManager, View, ActivityIndicator, Platform, Pressable, StyleSheet, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
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
import { NotoSerifHebrew_400Regular, NotoSerifHebrew_700Bold } from '@expo-google-fonts/noto-serif-hebrew';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { useUserStore } from '@/stores/useUserStore';
import { initNotificationHandlers } from '@/services/NotificationScheduler';
import {
  initNotificationResponseHandler,
  consumePendingNotificationRoute,
} from '@/services/notificationResponseHandler';
import { setLocale, t } from '@/i18n';
import { StorageService } from '@/services/StorageService';

function syncDocumentDirection(language: 'he' | 'en') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const dir = language === 'he' ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', language);
  document.body?.setAttribute('dir', dir);
}

async function reloadApp() {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.location.reload();
    return;
  }
  try {
    await Updates.reloadAsync();
  } catch {
    if (__DEV__ && DevSettings && typeof DevSettings.reload === 'function') {
      DevSettings.reload();
    }
  }
}

const RTL_BOOTSTRAP_KEY = 'layout:rtl-bootstrapped';

function syncLayoutDirection(language: 'he' | 'en', allowReload = false) {
  const wantRTL = language === 'he';
  setLocale(language);
  syncDocumentDirection(language);
  I18nManager.allowRTL(wantRTL);
  if (I18nManager.isRTL !== wantRTL) {
    I18nManager.forceRTL(wantRTL);
    if (allowReload && Platform.OS !== 'web') {
      reloadApp();
    }
  }
}

// `I18nManager.isRTL` is snapshotted at JS load and `forceRTL` only takes effect on the NEXT
// process start, so a fresh install on a non-RTL device renders the whole first session LTR — the
// root `direction: 'rtl'` style is iOS-only, so Android gets nothing. Reload once, guarded by a
// persisted flag so a reload that does not take cannot become a boot loop.
const initialLanguage = useUserStore.getState().language;
const needsRtlBootstrap =
  Platform.OS !== 'web' &&
  I18nManager.isRTL !== (initialLanguage === 'he') &&
  !StorageService.get<boolean>(RTL_BOOTSTRAP_KEY);
if (needsRtlBootstrap) StorageService.set(RTL_BOOTSTRAP_KEY, true);
syncLayoutDirection(initialLanguage, needsRtlBootstrap);

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

  const prevLanguageRef = useRef(language);
  useEffect(() => {
    const changed = prevLanguageRef.current !== language;
    syncLayoutDirection(language, changed);
    prevLanguageRef.current = language;
  }, [language]);

  useEffect(() => {
    const sub = initNotificationResponseHandler();
    // Replays a tap that arrived before the router was mounted (cold start from a notification).
    consumePendingNotificationRoute();
    return () => sub.remove();
  }, []);

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
        <Stack.Screen name="siddur/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="day/[date]" options={{ presentation: 'card' }} />
        <Stack.Screen name="custom-mitzvah" options={{ presentation: 'card' }} />
      </Stack>
    </View>
  );
}

// Picked up automatically by expo-router. Deliberately self-contained: it must render even when
// ThemeProvider or a store is the thing that failed, so it uses no context and no hooks.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={errorStyles.wrap}>
      <Text style={errorStyles.title}>{t('errors.boundaryTitle')}</Text>
      <Text style={errorStyles.body}>{t('errors.boundaryBody')}</Text>
      {__DEV__ ? <Text style={errorStyles.detail}>{error.message}</Text> : null}
      <Pressable onPress={() => retry()} style={errorStyles.button} accessibilityRole="button">
        <Text style={errorStyles.buttonLabel}>{t('errors.retry')}</Text>
      </Pressable>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#F5EFE4' },
  title: { fontSize: 20, fontWeight: '700', color: '#1C2B4A', textAlign: 'center' },
  body: { fontSize: 15, color: '#42506B', textAlign: 'center', marginTop: 10, lineHeight: 22 },
  detail: { fontSize: 12, color: '#8A93A6', textAlign: 'center', marginTop: 14 },
  button: {
    marginTop: 24,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 32,
    backgroundColor: '#C9922A',
  },
  buttonLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default function RootLayout() {
  // A failed font fetch must not brick the app: `loaded` would stay false forever, leaving a bare
  // spinner behind an un-hidden splash with notifications never initialised and no way out.
  const [loaded, fontError] = useFonts({
    Heebo_300Light,
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_600SemiBold,
    Heebo_700Bold,
    Heebo_800ExtraBold,
    Heebo_900Black,
    NotoSerifHebrew_400Regular,
    NotoSerifHebrew_700Bold,
  });
  const ready = loaded || Boolean(fontError);

  useEffect(() => {
    if (!ready) return undefined;
    SplashScreen.hideAsync().catch(() => {});
    return initNotificationHandlers();
  }, [ready]);

  if (!ready) {
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
