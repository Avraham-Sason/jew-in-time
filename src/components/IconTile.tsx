import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { MitzvahIcon, type IconName } from '@/components/MitzvahIcon';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Props = {
  name: IconName;
  tone?: 'accent' | 'muted' | 'done';
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function IconTile({ name, tone = 'accent', size = 38, style }: Props) {
  const { colors } = useTheme();
  const accent = tone === 'accent';
  const background = accent ? colors.goldLight : colors.surface2;
  return (
    <View accessible={false} style={[styles.tile, { width: size, height: size, backgroundColor: background }, style]}>
      <MitzvahIcon
        name={name}
        size={Math.round(size * 0.58)}
        color={accent ? colors.gold : colors.textMuted}
        tint={background}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
