import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ThemeColors } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { typography } from '@/theme/typography';

export type BannerTone = 'warning' | 'urgent' | 'safe' | 'accent' | 'info';

type Props = { text: string; tone: BannerTone; onPress?: () => void; style?: StyleProp<ViewStyle> };

type BannerPalette = { border: string; background: string; text: string };

// The status colours read under 3:1 on their own tint, so the text colour is chosen apart from the border.
export function bannerPalette(tone: BannerTone, colors: ThemeColors): BannerPalette {
  switch (tone) {
    case 'warning':
      return { border: colors.warning, background: `${colors.warning}18`, text: colors.text };
    case 'urgent':
      return { border: colors.urgent, background: colors.urgentBg, text: colors.urgent };
    case 'safe':
      return { border: colors.safe, background: `${colors.safe}18`, text: colors.text };
    case 'accent':
      return { border: colors.gold, background: colors.goldLight, text: colors.goldText };
    case 'info':
      return { border: colors.border, background: colors.surface2, text: colors.textSub };
  }
}

export function Banner({ text, tone, onPress, style }: Props) {
  const { colors } = useTheme();
  const palette = bannerPalette(tone, colors);
  const base = [styles.banner, { backgroundColor: palette.background, borderColor: palette.border }, style];
  const label = <Text style={[typography.captionBold, { color: palette.text }]}>{text}</Text>;

  if (!onPress) return <View style={base}>{label}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [base, pressed && styles.pressed]}>
      {label}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
});
