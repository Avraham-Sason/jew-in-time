import React, { createContext, useContext, useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HolyBlock } from '@/types/zmanim';
import { clockOf } from '@/utils/clock';
import { holyBlockLabelKeys } from '@/utils/skipRules';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/tokens';
import { useI18n } from '@/i18n';
import { IconTile } from './IconTile';

// The block the app is quiet inside, provided by the root layout. Every screen-level Modal closes
// while it holds: a native modal sits above any in-tree view, and on iOS a second one cannot be
// presented over it.
export const QuietBlockContext = createContext<HolyBlock | null>(null);

export function useQuietBlock(): HolyBlock | null {
  return useContext(QuietBlockContext);
}

type Props = { block: HolyBlock | null; subtitle?: string };

// An overlay above the whole navigator rather than a Modal, so it can never fail to present
// because a screen's own modal got there first. Android back closes the app instead of reaching a
// route underneath.
export function ShabbatScreen({ block, subtitle }: Props) {
  const { colors } = useTheme();
  const { language, t } = useI18n();

  useEffect(() => {
    if (!block) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => sub.remove();
  }, [block]);

  if (!block) return null;
  const labels = holyBlockLabelKeys(block);
  const until = t('holyBlock.screen.until', {
    exit: t(labels.exit),
    time: clockOf(block.end),
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: colors.bg }]} accessibilityViewIsModal>
      <SafeAreaView style={[styles.safe, { direction: language === 'he' ? 'rtl' : 'ltr' }]} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <IconTile name="candles" tone="accent" size={64} />
          <Text style={[typography.display, styles.centered, { color: colors.text, marginTop: spacing.xl }]}>
            {t(labels.title)}
          </Text>
          {subtitle ? (
            <Text style={[typography.caption, styles.centered, { color: colors.textMuted, marginTop: spacing.sm }]}>
              {subtitle}
            </Text>
          ) : null}
          <Text style={[typography.heading, styles.centered, { color: colors.goldText, marginTop: spacing.xxl }]}>
            {until}
          </Text>
          <Text style={[typography.body, styles.centered, { color: colors.textSub, marginTop: spacing.sm }]}>
            {t('holyBlock.screen.quiet')}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 1000,
    elevation: 1000,
  },
  safe: {
    flex: 1,
    padding: spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  centered: {
    textAlign: 'center',
  },
});
