import React from 'react';
import { Tabs } from 'expo-router';
import { BottomTabs } from '@/components/BottomTabs';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <BottomTabs {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="home" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="library" />
    </Tabs>
  );
}
