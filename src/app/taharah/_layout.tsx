import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { TaharahLock } from '@/components/TaharahLock';
import { isAuthenticating, relock } from '@/services/biometricLock';
import { useTheme } from '@/theme/ThemeProvider';

export default function TaharahLayout() {
  const { colors } = useTheme();
  const [recheck, setRecheck] = useState(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (isAuthenticating()) return;
      if (state !== 'active') relock();
      setRecheck((n) => n + 1);
    });
    return () => {
      sub.remove();
      relock();
    };
  }, []);

  return (
    <TaharahLock recheck={recheck}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="log" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="calendar" />
      </Stack>
    </TaharahLock>
  );
}
