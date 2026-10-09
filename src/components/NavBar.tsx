import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppLogo } from '@/components/AppLogo';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { typography } from '@/theme/typography';

type Props = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export function NavBar({ title, subtitle, actions }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.headerBg }]}>
      <AppLogo size={28} />
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
      <View style={styles.edge}>{actions}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
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
