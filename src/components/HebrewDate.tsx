import React from 'react';
import { Text } from 'react-native';
import { DateTime } from 'luxon';
import { HebcalService } from '@/services/HebcalService';
import { Location } from '@/types/zmanim';
import { typography } from '@/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/i18n';

type Props = {
  date?: Date;
  location: Location;
  showParasha?: boolean;
};

export function HebrewDate({ date = new Date(), location, showParasha = false }: Props) {
  const { colors } = useTheme();
  const { language } = useI18n();
  const hebrew = HebcalService.getHebrewDateAt(date, location);
  const parasha = showParasha ? HebcalService.getParasha(date, location) : undefined;
  // Was hard-coded to 'he', so an English user saw a Hebrew weekday and month directly under a
  // NavBar subtitle showing the same date in English.
  const greg = DateTime.fromJSDate(date)
    .setLocale(language)
    .toFormat(language === 'he' ? 'cccc · d LLLL' : 'cccc · LLL d');
  const text = parasha ? `${hebrew.hebrewDateStr} · ${greg} · ${parasha}` : `${hebrew.hebrewDateStr} · ${greg}`;

  return (
    <Text style={[typography.micro, { color: colors.headerSub }]} numberOfLines={1}>
      {text}
    </Text>
  );
}
