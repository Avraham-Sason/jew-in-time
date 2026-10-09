import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { typography } from '@/theme/typography';

type Props = { text: string; count?: number; style?: StyleProp<TextStyle> };

export function SectionLabel({ text, count, style }: Props) {
  const { colors } = useTheme();
  return (
    <Text style={[typography.captionBold, styles.label, { color: colors.textSub }, style]}>
      {count === undefined ? text : `${text} (${count})`}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
});
