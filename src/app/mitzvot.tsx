import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ChipRow } from '@/components/ChipRow';
import { ListRow } from '@/components/ListRow';
import { iconFor } from '@/components/MitzvahIcon';
import { HeaderPill, ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useDayModel } from '@/hooks/useDayModel';
import { useMitzvotStore } from '@/stores/useMitzvotStore';
import { useUserStore } from '@/stores/useUserStore';
import { BRAND } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { typography } from '@/theme/typography';
import { useI18n } from '@/i18n';
import { MitzvahCategory } from '@/types/mitzvah';

const HILULOT_CATEGORY: MitzvahCategory = 'seasonal';

export default function MitzvotScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { allMitzvot, nameFor } = useDayModel();
  const router = useRouter();
  const active = useMitzvotStore((s) => s.activeMitzvot);
  const setEnabled = useMitzvotStore((s) => s.setEnabled);
  const hilulotEnabled = useUserStore((s) => s.hilulotEnabled);
  const setHilulotEnabled = useUserStore((s) => s.setHilulotEnabled);
  const [visibility, setVisibility] = useState<'active' | 'available'>('active');
  const [category, setCategory] = useState<MitzvahCategory | 'all'>('all');
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'));

  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(allMitzvot.map((item) => item.category)))] as (MitzvahCategory | 'all')[];
  }, [allMitzvot]);

  const items = useMemo(() => {
    return allMitzvot.filter((item) => {
      const enabled = active[item.id]?.enabled ?? false;
      if (visibility === 'active' && !enabled) return false;
      if (visibility === 'available' && enabled) return false;
      if (category !== 'all' && item.category !== category) return false;
      return true;
    });
  }, [allMitzvot, active, category, visibility]);
  // Hilulot are a notification setting, not a mitzvah: listed here as the user asked, but kept out
  // of the registry so they never reach history, home or the check-in.
  const showHilulot =
    (visibility === 'active') === hilulotEnabled && (category === 'all' || category === HILULOT_CATEGORY);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title={t('library.title')}
        subtitle={t('library.subtitle')}
        onBack={goBack}
        actions={
          <HeaderPill
            label="+"
            accessibilityLabel={t('library.addCustom')}
            onPress={() => router.push('/custom-mitzvah')}
          />
        }
      />
      <SegmentedControl
        tone="surface"
        options={[
          { value: 'active', label: t('common.active') },
          { value: 'available', label: t('common.available') },
        ]}
        value={visibility}
        onChange={setVisibility}
        style={styles.visibility}
      />
      <ChipRow
        values={categories}
        selected={category}
        onSelect={setCategory}
        renderLabel={(value) => (value === 'all' ? t('common.all') : t(`library.category.${value}`))}
        style={styles.categories}
      />
      <ScrollView style={styles.listScroll} contentContainerStyle={styles.list}>
        {items.map((item) => {
          const enabled = active[item.id]?.enabled ?? false;
          const label = nameFor(item);
          return (
            <ListRow
              key={item.id}
              icon={iconFor(item.icon)}
              iconTone={enabled ? 'accent' : 'muted'}
              title={label}
              caption={t(`library.category.${item.category}`)}
              onPress={() =>
                item.isCustom
                  ? router.push({ pathname: '/custom-mitzvah', params: { id: item.id } })
                  : router.push(`/mitzvah/${item.id}`)
              }
              trailing={<EnabledSwitch value={enabled} onChange={() => setEnabled(item.id, !enabled)} label={label} />}
            />
          );
        })}
        {showHilulot ? (
          <ListRow
            icon="hilula"
            iconTone={hilulotEnabled ? 'accent' : 'muted'}
            title={t('hilulot.title')}
            caption={t('hilulot.caption')}
            onPress={() => router.push('/hilulot')}
            trailing={
              <EnabledSwitch
                value={hilulotEnabled}
                onChange={() => setHilulotEnabled(!hilulotEnabled)}
                label={t('hilulot.title')}
              />
            }
          />
        ) : null}
        {!items.length && !showHilulot ? (
          <Text style={[typography.body, styles.emptyText, { color: colors.textSub }]}>{t('library.empty')}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function EnabledSwitch({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  const { colors } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      thumbColor={BRAND.white}
      trackColor={{ false: colors.border, true: colors.gold }}
      accessibilityLabel={label}
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  visibility: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  categories: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  listScroll: {
    flex: 1,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    paddingTop: spacing.xxl,
  },
});
