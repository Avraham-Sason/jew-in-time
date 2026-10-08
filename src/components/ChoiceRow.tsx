import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function ChoiceRow({ label, selected, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.row,
        {
          borderColor: selected ? colors.gold : colors.border,
          backgroundColor: selected ? colors.goldLight : colors.surface,
        },
      ]}
    >
      <Text style={[typography.bodyBold, { color: selected ? colors.gold : colors.text }]}>{label}</Text>
      {selected ? (
        <View style={[styles.tick, { backgroundColor: colors.gold }]}>
          <Text style={[typography.micro, { color: colors.onGold }]}>✓</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 13,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
