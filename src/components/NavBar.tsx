import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppLogo } from '@/components/AppLogo';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';

type Props = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
};

export function NavBar({ title, subtitle, left, right }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.headerBg }]}>
      {right ?? <AppLogo size={28} isDark={isDark} />}
      <View style={styles.center}>
        <Text style={[typography.subheading, styles.title, { color: colors.headerText }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[typography.micro, { color: colors.headerSub }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.edge}>{left}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  center: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    lineHeight: 18,
  },
  edge: {
    minWidth: 28,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
