import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { DateTime } from 'luxon';
import { HDate } from '@hebcal/core';
import { hilulaDateLabel, upcomingHilulot } from '@/data/hilulot';
import { SettingsSection } from '@/components/SettingsSection';
import { useNow } from '@/hooks/useNow';
import { HebcalService } from '@/services/HebcalService';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';

export default function HilulotScreen() {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const router = useRouter();
  const location = useUserStore((s) => s.location);
  const inIsrael = useUserStore((s) => s.inIsrael);
  const enabled = useUserStore((s) => s.hilulotEnabled);
  const setEnabled = useUserStore((s) => s.setHilulotEnabled);
  const now = useNow();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'));
  // The Hebrew day in effect now, so a hilula that began at this evening's shkia reads as today.
  const todayAbs = HebcalService.hebrewDayAt(now, location).abs();
  const upcoming = useMemo(() => upcomingHilulot(new HDate(todayAbs), inIsrael), [todayAbs, inIsrael]);
  const locale = language === 'en' ? 'en' : 'he';

  const whenLabel = (dayAbs: number) => {
    const days = dayAbs - todayAbs;
    if (days === 0) return t('hilulot.today');
    if (days === 1) return t('hilulot.tomorrow');
    return t('hilulot.inDays', { count: days });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: pressed ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)' },
          ]}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d={language === 'he' ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'}
              stroke={colors.headerText}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={[typography.captionBold, { color: colors.headerText }]}>{t('common.back')}</Text>
        </Pressable>
        <Text style={[typography.title, { color: colors.headerText, marginTop: 10 }]}>{t('hilulot.title')}</Text>
        <Text style={[typography.caption, { color: colors.headerSub, marginTop: 2 }]}>{t('hilulot.subtitle')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <SettingsSection title={t('hilulot.notifications')}>
          <View style={styles.switchRow}>
            <Text style={[typography.small, styles.switchHint, { color: colors.textMuted }]}>
              {t('hilulot.notificationsHint')}
            </Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              accessibilityLabel={t('hilulot.notifications')}
              thumbColor="#fff"
              trackColor={{ false: colors.border, true: colors.gold }}
            />
          </View>
        </SettingsSection>
        <Text style={[typography.captionBold, styles.groupLabel, { color: colors.textSub }]}>
          {t('hilulot.upcoming')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {upcoming.map(({ hilula, day }) => (
            <View key={hilula.id} style={[styles.row, { borderBottomColor: colors.border }]}>
              <View style={[styles.icon, { backgroundColor: colors.goldLight }]}>
                <Text style={{ fontSize: 17, color: colors.gold }}>✦</Text>
              </View>
              <View style={styles.rowMeta}>
                <Text style={[typography.bodyBold, { color: colors.text }]}>
                  {language === 'en' ? hilula.name.en : hilula.name.he}
                </Text>
                <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
                  {hilulaDateLabel(day, locale)}
                  {' · '}
                  {DateTime.fromJSDate(day.greg()).setLocale(locale).toFormat('ccc d.M')}
                </Text>
              </View>
              <Text style={[typography.captionBold, { color: colors.goldText }]}>{whenLabel(day.abs())}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  list: {
    padding: 18,
    paddingBottom: 32,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchHint: {
    flex: 1,
    paddingEnd: 12,
  },
  groupLabel: {
    marginTop: 6,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowMeta: {
    flex: 1,
    minWidth: 0,
  },
});
