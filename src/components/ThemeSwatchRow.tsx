import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { THEMES, THEME_NAMES, ThemeName } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';

type Props = {
  selected: ThemeName;
  onSelect: (name: ThemeName) => void;
  labelFor: (name: ThemeName) => string;
};

export function ThemeSwatchRow({ selected, onSelect, labelFor }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {THEME_NAMES.map((name) => {
        const palette = THEMES[name];
        const active = name === selected;
        return (
          <Pressable
            key={name}
            onPress={() => onSelect(name)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, checked: active }}
            accessibilityLabel={labelFor(name)}
            style={styles.item}
          >
            <View style={[styles.ring, { borderColor: active ? colors.gold : colors.border }]}>
              <View style={[styles.swatch, { backgroundColor: palette.bg }]}>
                <View style={[styles.dot, { backgroundColor: palette.gold }]} />
              </View>
            </View>
            <Text style={[typography.micro, { color: active ? colors.text : colors.textSub }]}>{labelFor(name)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  item: {
    alignItems: 'center',
    gap: 6,
  },
  ring: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
