import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';

type TabOptionsWithHref = BottomTabNavigationOptions & { href?: string | null };

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

function CalIcon({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={3} stroke={color} strokeWidth={2} />
      <Path d="M8 2V6M16 2V6M3 10H21" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ListIcon({ color }: { color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6H20M9 12H20M9 18H20M4 6H4.01M4 12H4.01M4 18H4.01" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function BottomTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const visibleRoutes = state.routes.filter(
    (route) => route.name !== 'index' && (descriptors[route.key].options as TabOptionsWithHref).href !== null,
  );
  const labels: Record<string, string> = {
    home: t('nav.home'),
    schedule: t('nav.schedule'),
    library: t('nav.library'),
  };
  const icons: Record<string, (color: string) => React.ReactNode> = {
    home: (color) => <HomeIcon color={color} />,
    schedule: (color) => <CalIcon color={color} />,
    library: (color) => <ListIcon color={color} />,
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.tabBg, borderTopColor: colors.tabBorder }]}>
      {visibleRoutes.map((route) => {
        const focused = state.routes[state.index]?.key === route.key;
        const color = focused ? colors.gold : colors.textMuted;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        const label = labels[route.name] ?? descriptors[route.key].options.title ?? route.name;
        const icon = icons[route.name];

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={styles.tab}
          >
            {icon?.(color)}
            <Text style={[typography.micro, { color, fontFamily: focused ? 'Heebo_700Bold' : 'Heebo_400Regular' }]}>
              {label}
            </Text>
            {focused ? <View style={[styles.indicator, { backgroundColor: colors.gold }]} /> : <View style={styles.indicatorPlaceholder} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    height: 58,
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  indicator: {
    width: 18,
    height: 3,
    borderRadius: 2,
    marginTop: -1,
  },
  indicatorPlaceholder: {
    width: 18,
    height: 3,
    marginTop: -1,
  },
});
