import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, I18nManager, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View, ViewToken } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { DateTime } from 'luxon';
import Svg, { Path } from 'react-native-svg';
import { findAnyMitzvah } from '@/data/customMitzvotAdapter';
import { SIDDUR_TEXTS, customSiddurText, hasSiddurText, siddurPlace, siddurTextId } from '@/data/siddur';
import { loadSiddurText } from '@/services/SiddurService';
import { HebcalService } from '@/services/HebcalService';
import { useCompletionsStore, dateKey } from '@/stores/useCompletionsStore';
import { SIDDUR_FONT_SIZES, useUserStore } from '@/stores/useUserStore';
import { useTheme } from '@/theme/ThemeProvider';
import { shadowPresets, shadowStyle } from '@/theme/shadowStyle';
import { fontFamilies, typography } from '@/theme/typography';
import { PassageLabel, Run, SegmentBlock, SiddurSection, SiddurSegment, SiddurText } from '@/types/siddur';
import { dayFeatures, liturgicalDay, resolveSiddurText, segmentBlocks } from '@/utils/siddur';
import { useI18n } from '@/i18n';

const KEEP_AWAKE_TAG = 'siddur-reader';
// Native RN swaps physical left/right under RTL (Android and iOS); react-native-web keeps them literal.
const RIGHT_EDGE = I18nManager.isRTL ? ('left' as const) : ('right' as const);
const LEFT_EDGE = I18nManager.isRTL ? ('right' as const) : ('left' as const);
const SECTION_VIEWABILITY = { viewAreaCoveragePercentThreshold: 2 };

type LoadState = { status: 'loading' } | { status: 'ready'; text: SiddurText } | { status: 'error' };

function parseDateParam(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = DateTime.fromISO(value);
  return parsed.isValid ? parsed.toJSDate() : null;
}

function isAddedForToday(segment: SiddurSegment, section: SiddurSection): boolean {
  if (segment.when?.omerDay !== undefined) return true;
  const sharedFlags = section.segments
    .map((item) => item.when?.all ?? [])
    .reduce((shared, flags) => shared.filter((flag) => flags.includes(flag)));
  return (segment.when?.all ?? []).some((flag) => !sharedFlags.includes(flag));
}

export default function SiddurScreen() {
  const { colors } = useTheme();
  const { language, t } = useI18n();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; date?: string }>();
  const mitzvah = useMemo(() => findAnyMitzvah(params.id), [params.id]);
  const nusach = useUserStore((s) => s.nusach);
  const location = useUserStore((s) => s.location);
  const inIsrael = useUserStore((s) => s.inIsrael);
  const fontSize = useUserStore((s) => s.siddurFontSize);
  const setFontSize = useUserStore((s) => s.setSiddurFontSize);
  const requestedDate = useMemo(() => parseDateParam(params.date), [params.date]);
  const windowDate = useMemo(() => requestedDate ?? new Date(), [requestedDate]);
  const textId = mitzvah && !mitzvah.isCustom ? siddurTextId(mitzvah.id) : null;
  const evening = textId ? SIDDUR_TEXTS[textId].evening : false;
  const hebrewDay = useMemo(() => liturgicalDay(windowDate, evening), [windowDate, evening]);
  const place = useMemo(() => siddurPlace(location, inIsrael), [location, inIsrael]);
  const features = useMemo(() => dayFeatures(hebrewDay, place), [hebrewDay, place]);
  const available = Boolean(requestedDate && mitzvah && hasSiddurText(mitzvah, nusach, requestedDate, place));
  const done = useCompletionsStore((s) => Boolean(mitzvah && s.completions[dateKey(windowDate)]?.[mitzvah.id]));
  const markDone = useCompletionsStore((s) => s.markDone);
  const [attempt, setAttempt] = useState(0);
  const [load, setLoad] = useState<LoadState>({ status: 'loading' });
  const listRef = useRef<FlatList<SiddurSection>>(null);
  const pickerRef = useRef<ScrollView>(null);
  const [shownSection, setShownSection] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openedOptional, setOpenedOptional] = useState<ReadonlySet<string>>(() => new Set());
  const toggleOptional = (key: string) =>
    setOpenedOptional((opened) => {
      const next = new Set(opened);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  const onViewableSectionsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<SiddurSection>[] }) => {
    const top = viewableItems[0]?.index;
    if (top != null) setShownSection(top);
  }).current;

  useEffect(() => {
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!mitzvah || !available) return undefined;
    if (mitzvah.isCustom) {
      const text = customSiddurText(mitzvah, nusach);
      setLoad(text ? { status: 'ready', text } : { status: 'error' });
      return undefined;
    }
    if (!textId) return undefined;
    let active = true;
    setLoad({ status: 'loading' });
    loadSiddurText(nusach, textId)
      .then((text) => active && setLoad({ status: 'ready', text }))
      .catch(() => active && setLoad({ status: 'error' }));
    return () => {
      active = false;
    };
  }, [mitzvah, available, nusach, textId, attempt]);

  const sections = useMemo(
    () => (load.status === 'ready' ? resolveSiddurText(load.text, features) : []),
    [load, features],
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'));
  const name = mitzvah ? (language === 'en' && mitzvah.name.en ? mitzvah.name.en : mitzvah.name.he) : '';
  const hebrewDateLabel = language === 'he' ? hebrewDay.renderGematriya() : hebrewDay.render('en');
  const occasions = HebcalService.getHolidays(hebrewDay.greg(), location, language);
  const subtitle = (requestedDate ? [t(`nusach.${nusach}`), hebrewDateLabel, ...occasions] : [t(`nusach.${nusach}`)]).join(' · ');
  const listExtraData = useMemo(() => ({ fontSize, language, colors, openedOptional }), [fontSize, language, colors, openedOptional]);
  const titleOf = (section: SiddurSection) => (language === 'en' ? section.title.en : section.title.he);
  const labelOf = (label: PassageLabel) => (language === 'en' ? label.en : label.he);
  const labeledEdge = (language === 'he') === I18nManager.isRTL ? styles.labeledLeftEdge : styles.labeledRightEdge;
  const segmentViews = (section: SiddurSection, segments: SiddurSegment[], start: number, color: string) => {
    const runs: { added: boolean; start: number; segments: SiddurSegment[] }[] = [];
    segments.forEach((segment, offset) => {
      const added = isAddedForToday(segment, section);
      const previous = runs[runs.length - 1];
      if (previous?.added === added) previous.segments.push(segment);
      else runs.push({ added, start: start + offset, segments: [segment] });
    });
    return runs.flatMap((run) => {
      const views = run.segments.map((segment, offset) => (
        <SegmentView key={run.start + offset} segment={segment} fontSize={fontSize} showEnglish={language === 'en'} color={color} />
      ));
      if (!run.added) return views;
      return [
        <View key={`added#${run.start}`} style={[styles.addedToday, { backgroundColor: colors.goldLight, borderColor: colors.gold }]}>
          <Text style={[typography.micro, styles.addedTodayLabel, { color: colors.gold }]}>{t('siddur.addedToday')}</Text>
          {views}
        </View>,
      ];
    });
  };
  const minyanViews = (section: SiddurSection, block: SegmentBlock, color: string) =>
    segmentBlocks(block.segments, 'minyan', block.start).flatMap((inner) =>
      inner.label
        ? [
            <View key={`minyan#${inner.start}`} style={[styles.labeledBody, labeledEdge, { borderColor: colors.minyan }]}>
              <Text style={[typography.captionBold, styles.minyanLabel, { color: colors.minyan }]}>{labelOf(inner.label)}</Text>
              {segmentViews(section, inner.segments, inner.start, colors.minyan)}
            </View>,
          ]
        : segmentViews(section, inner.segments, inner.start, color),
    );
  const sectionBody = (section: SiddurSection) =>
    segmentBlocks(section.segments, 'optional').flatMap((block) => {
      if (!block.label) return minyanViews(section, block, section.optional ? colors.optional : colors.text);
      const key = `${section.title.he}#${block.start}`;
      const expanded = openedOptional.has(key);
      return [
        <View key={key}>
          <OptionalToggle label={labelOf(block.label)} expanded={expanded} onPress={() => toggleOptional(key)} />
          {expanded ? (
            <View style={[styles.labeledBody, labeledEdge, { borderColor: colors.optional }]}>{minyanViews(section, block, colors.optional)}</View>
          ) : null}
        </View>,
      ];
    });
  const currentSection = sections[Math.min(shownSection, sections.length - 1)];
  const jumpTo = (index: number) => {
    setPickerOpen(false);
    setShownSection(index);
    listRef.current?.scrollToIndex({ index, animated: true });
  };
  const sizeIndex = SIDDUR_FONT_SIZES.findIndex((size) => size >= fontSize);
  const currentIndex = sizeIndex === -1 ? SIDDUR_FONT_SIZES.length - 1 : sizeIndex;

  const body = (() => {
    if (!mitzvah) return <Message text={t('errors.generic')} />;
    if (!available) return <Message text={t('siddur.unavailable')} />;
    if (load.status === 'loading') {
      return (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
          <Text style={[typography.body, { color: colors.textSub, marginTop: 10 }]}>{t('siddur.loading')}</Text>
        </View>
      );
    }
    if (load.status === 'error') {
      return (
        <View style={styles.center}>
          <Text style={[typography.body, { color: colors.textSub }]}>{t('siddur.error')}</Text>
          <Pressable
            onPress={() => setAttempt((value) => value + 1)}
            accessibilityRole="button"
            style={[styles.pill, { backgroundColor: colors.gold, marginTop: 12 }]}
          >
            <Text style={[typography.bodyBold, { color: colors.onGold }]}>{t('errors.retry')}</Text>
          </Pressable>
        </View>
      );
    }
    if (!sections.length) return <Message text={t('siddur.unavailable')} />;
    return null;
  })();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <View style={styles.headerTop}>
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
          <View style={styles.sizeControls}>
            <SizeButton
              label="A−"
              accessibilityLabel={t('siddur.smaller')}
              disabled={currentIndex === 0}
              onPress={() => setFontSize(SIDDUR_FONT_SIZES[Math.max(0, currentIndex - 1)])}
            />
            <SizeButton
              label="A+"
              accessibilityLabel={t('siddur.larger')}
              disabled={currentIndex === SIDDUR_FONT_SIZES.length - 1}
              onPress={() => setFontSize(SIDDUR_FONT_SIZES[Math.min(SIDDUR_FONT_SIZES.length - 1, currentIndex + 1)])}
            />
          </View>
        </View>
        <Text style={[typography.title, { color: colors.headerText, marginTop: 10 }]}>{name}</Text>
        <Text style={[typography.caption, { color: colors.headerSub, marginTop: 2 }]}>{subtitle}</Text>
        {sections.length > 1 && currentSection ? (
          <Pressable
            onPress={() => setPickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`${t('siddur.pickSection')}: ${titleOf(currentSection)}`}
            style={({ pressed }) => [
              styles.picker,
              { backgroundColor: pressed ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)' },
            ]}
          >
            <Text style={[typography.bodyBold, styles.pickerLabel, { color: colors.headerText }]} numberOfLines={1}>
              {titleOf(currentSection)}
            </Text>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M6 9l6 6 6-6" stroke={colors.headerText} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        ) : null}
      </View>

      {body ?? (
        <FlatList
          ref={listRef}
          data={sections}
          extraData={listExtraData}
          keyExtractor={(section) => section.title.he}
          initialNumToRender={4}
          viewabilityConfig={SECTION_VIEWABILITY}
          onViewableItemsChanged={onViewableSectionsChanged}
          contentContainerStyle={styles.content}
          onScrollToIndexFailed={({ index, highestMeasuredFrameIndex }) => {
            listRef.current?.scrollToIndex({ index: highestMeasuredFrameIndex, animated: false });
            setTimeout(() => listRef.current?.scrollToIndex({ index, animated: true }), 50);
          }}
          renderItem={({ item: section }) => {
            const expanded = openedOptional.has(section.title.he);
            return (
              <View style={[styles.card, { backgroundColor: colors.surface }, shadowStyle(colors.shadow, shadowPresets.cardSoft)]}>
                {section.optional ? (
                  <>
                    <OptionalToggle
                      large
                      label={labelOf(section.optional)}
                      expanded={expanded}
                      onPress={() => toggleOptional(section.title.he)}
                    />
                    {expanded ? (
                      <View style={[styles.labeledBody, labeledEdge, { borderColor: colors.optional }]}>{sectionBody(section)}</View>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Text style={[typography.heading, { color: colors.gold, marginBottom: 8 }]}>{titleOf(section)}</Text>
                    {sectionBody(section)}
                  </>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            <>
              {mitzvah ? (
                done ? (
                  <Text style={[typography.bodyBold, styles.doneText, { color: colors.safe }]}>{t('siddur.doneAlready')}</Text>
                ) : (
                  <Pressable
                    onPress={() => markDone(mitzvah.id, windowDate)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.doneBtn, { backgroundColor: colors.gold, opacity: pressed ? 0.85 : 1 }]}
                  >
                    <Text style={[typography.heading, { color: colors.onGold }]}>{t('siddur.done')}</Text>
                  </Pressable>
                )
              ) : null}

              {load.status === 'ready' && load.text.credits.length ? (
                <View style={styles.credits}>
                  <Text style={[typography.captionBold, { color: colors.textSub }]}>{t('siddur.sources')}</Text>
                  <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{t('siddur.adapted')}</Text>
                  {load.text.credits.map((credit) => (
                    <Pressable key={credit.title} onPress={() => Linking.openURL(credit.url).catch(() => {})} accessibilityRole="link">
                      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 4 }]}>
                        {credit.title} · {credit.license}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          }
        />
      )}

      <Modal animationType="slide" transparent visible={pickerOpen} onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPickerOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
          />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[typography.heading, { color: colors.text, marginBottom: 6 }]}>{t('siddur.pickSection')}</Text>
            <ScrollView ref={pickerRef} style={styles.sheetList}>
              {sections.map((section, index) => {
                const selected = section === currentSection;
                return (
                  <Pressable
                    key={section.title.he}
                    onPress={() => jumpTo(index)}
                    onLayout={
                      selected
                        ? (event) => pickerRef.current?.scrollTo({ y: Math.max(0, event.nativeEvent.layout.y - 96), animated: false })
                        : undefined
                    }
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.sheetAction,
                      { borderBottomColor: colors.border, backgroundColor: selected ? colors.goldLight : 'transparent' },
                    ]}
                  >
                    <Text style={[typography.subheading, { color: selected ? colors.gold : colors.text }]}>{titleOf(section)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => setPickerOpen(false)} style={[styles.closeBtn, { backgroundColor: colors.surface2 }]}>
              <Text style={[typography.bodyBold, { color: colors.textSub }]}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Message({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <Text style={[typography.body, { color: colors.textSub, textAlign: 'center' }]}>{text}</Text>
    </View>
  );
}

function SizeButton({
  label,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={6}
      style={[styles.sizeBtn, { backgroundColor: 'rgba(255,255,255,0.12)', opacity: disabled ? 0.4 : 1 }]}
    >
      <Text style={[typography.captionBold, { color: colors.headerText }]}>{label}</Text>
    </Pressable>
  );
}

function OptionalToggle({
  label,
  expanded,
  onPress,
  large = false,
}: {
  label: string;
  expanded: boolean;
  onPress: () => void;
  large?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      aria-expanded={expanded}
      style={({ pressed }) => [styles.optionalToggle, { backgroundColor: colors.optionalBg, opacity: pressed ? 0.75 : 1 }]}
    >
      <Text style={[large ? typography.heading : typography.bodyBold, styles.optionalLabel, { color: colors.optional }]}>{label}</Text>
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d={expanded ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}
          stroke={colors.optional}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

function SegmentView({
  segment,
  fontSize,
  showEnglish,
  color,
}: {
  segment: SiddurSegment;
  fontSize: number;
  showEnglish: boolean;
  color: string;
}) {
  const { colors } = useTheme();
  const runStyle = (run: Run) => {
    if (run.s === 'n') {
      return { fontFamily: fontFamilies.heebo.regular, fontSize: Math.round(fontSize * 0.62), color: colors.textMuted };
    }
    if (run.s === 'b') return { fontFamily: fontFamilies.siddur.bold };
    return null;
  };
  return (
    <View style={styles.segment}>
      {segment.he.map((runs, index) => (
        <Text
          key={index}
          style={[
            styles.hebrew,
            { fontFamily: fontFamilies.siddur.regular, fontSize, lineHeight: Math.round(fontSize * 1.75), color },
          ]}
        >
          {runs.map((run, runIndex) => (
            <Text key={runIndex} style={runStyle(run)}>
              {run.t}
            </Text>
          ))}
        </Text>
      ))}
      {showEnglish && segment.en ? (
        <Text
          style={[
            styles.english,
            { fontSize: Math.round(fontSize * 0.68), lineHeight: Math.round(fontSize * 1.05), color: colors.textSub },
          ]}
        >
          {segment.en}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  sizeControls: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeBtn: {
    minWidth: 40,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pickerLabel: {
    flex: 1,
  },
  content: {
    padding: 14,
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  segment: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  addedToday: {
    borderWidth: 1,
    borderRadius: 10,
    paddingTop: 4,
    marginBottom: 6,
  },
  addedTodayLabel: {
    textAlign: RIGHT_EDGE,
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  optionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  optionalLabel: {
    flex: 1,
  },
  labeledBody: {
    marginBottom: 6,
  },
  labeledLeftEdge: {
    borderLeftWidth: 2,
    paddingLeft: 4,
  },
  labeledRightEdge: {
    borderRightWidth: 2,
    paddingRight: 4,
  },
  minyanLabel: {
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  hebrew: {
    textAlign: RIGHT_EDGE,
    writingDirection: 'rtl',
  },
  english: {
    fontFamily: fontFamilies.heebo.regular,
    textAlign: LEFT_EDGE,
    writingDirection: 'ltr',
    marginTop: 4,
    marginBottom: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pill: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  doneBtn: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  doneText: {
    textAlign: 'center',
    paddingVertical: 14,
  },
  credits: {
    marginTop: 18,
    paddingHorizontal: 4,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(9,20,32,0.4)',
    padding: 16,
  },
  sheet: {
    maxHeight: '70%',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  sheetList: {
    flexGrow: 0,
    flexShrink: 1,
  },
  sheetAction: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 14,
  },
});
