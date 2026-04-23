import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { ribbonThresholds } from '@/theme/tokens';
import { useI18n } from '@/i18n';

type Props = {
  pct: number;
  timeLeft: string;
};

export function TimeRibbon({ pct, timeLeft }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const p = Math.max(0, Math.min(1, pct));
  const col = p > ribbonThresholds.safe ? colors.safe : p > ribbonThresholds.warning ? colors.warning : colors.urgent;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={[typography.small, { color: col, fontWeight: '600' }]}>{t('time.left', { value: timeLeft })}</Text>
        <Text style={[typography.micro, { color: colors.textMuted }]}>{Math.round(p * 100)}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
        <View style={[styles.fill, { width: `${p * 100}%`, backgroundColor: col }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  track: { height: 5, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
