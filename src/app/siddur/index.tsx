import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { HDate } from '@hebcal/core';
import {
  SIDDUR_GROUPS,
  STANDALONE_TEXTS,
  hasStandaloneText,
  siddurPlace,
  standaloneTextDay,
  standaloneTextsIn,
} from '@/data/siddur';
import { useNow } from '@/hooks/useNow';
import { useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/theme/typography';
import { StandaloneTextId } from '@/types/siddur';
import { dayFeatures } from '@/utils/siddur';
import { useI18n } from '@/i18n';

export default function SiddurCatalogScreen() {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const router = useRouter();
  const nusach = useUserStore((s) => s.nusach);
  const location = useUserStore((s) => s.location);
  const inIsrael = useUserStore((s) => s.inIsrael);
  const now = useNow();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'));
  const groups = useMemo(
    () => SIDDUR_GROUPS.map((group) => ({ group, ids: standaloneTextsIn(group) })).filter(({ ids }) => ids.length),
    [],
  );
  // Keyed by each text's day number, so the clock tick re-checks availability only when a day turns.
  const dayKey = groups.flatMap(({ ids }) => ids.map((id) => standaloneTextDay(id, now, location).abs())).join(',');
  const available = useMemo(() => {
    const place = siddurPlace(location, inIsrael);
    const days = dayKey.split(',').map(Number);
    const ids = groups.flatMap((entry) => entry.ids);
    return new Map(
      ids.map((id, index) => [id, hasStandaloneText(id, nusach, dayFeatures(new HDate(days[index]), place))]),
    );
  }, [dayKey, groups, location, inIsrael, nusach]);
  const label = (entry: { he: string; en: string }) => (language === 'en' ? entry.en : entry.he);

  const row = (id: StandaloneTextId) => {
    const { name, availableLabel } = STANDALONE_TEXTS[id];
    const open = available.get(id) ?? false;
    return (
      <Pressable
        key={id}
        disabled={!open}
        onPress={() => router.push({ pathname: '/siddur/[id]', params: { id } })}
        accessibilityRole="button"
        accessibilityState={{ disabled: !open }}
        style={({ pressed }) => [
          styles.row,
          { borderBottomColor: colors.border, opacity: !open ? 0.55 : pressed ? 0.7 : 1 },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: open ? colors.goldLight : colors.surface2 }]}>
          <Text style={{ fontSize: 17, color: open ? colors.gold : colors.textMuted }}>✦</Text>
        </View>
        <View style={styles.rowMeta}>
          <Text style={[typography.bodyBold, { color: open ? colors.text : colors.textMuted }]}>{label(name)}</Text>
          {!open ? (
            <Text style={[typography.small, { color: colors.textMuted, marginTop: 2 }]}>
              {availableLabel ? label(availableLabel) : t('siddur.catalog.notToday')}
            </Text>
          ) : null}
        </View>
        {open ? (
          <Text style={[typography.bodyBold, { color: colors.textMuted }]}>{language === 'he' ? '‹' : '›'}</Text>
        ) : null}
      </Pressable>
    );
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
        <Text style={[typography.title, { color: colors.headerText, marginTop: 10 }]}>{t('siddur.catalog.title')}</Text>
        <Text style={[typography.caption, { color: colors.headerSub, marginTop: 2 }]}>
          {t('siddur.catalog.subtitle')} · {t(`nusach.${nusach}`)}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {groups.map(({ group, ids }) => (
          <View key={group} style={styles.group}>
            <Text style={[typography.captionBold, styles.groupLabel, { color: colors.textSub }]}>
              {t(`siddur.group.${group}`)}
            </Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {ids.map(row)}
            </View>
          </View>
        ))}
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
  group: {
    marginBottom: 18,
  },
  groupLabel: {
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
