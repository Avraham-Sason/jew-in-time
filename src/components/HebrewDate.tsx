import React from 'react';
import { Text } from 'react-native';
import { DateTime } from 'luxon';
import { HebcalService } from '@/services/HebcalService';
import { Location } from '@/types/zmanim';
import { typography } from '@/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';

type Props = {
  date?: Date;
  location: Location;
  showParasha?: boolean;
};

export function HebrewDate({ date = new Date(), location, showParasha = false }: Props) {
  const { colors } = useTheme();
  const hebrew = HebcalService.getHebrewDate(date);
  const parasha = showParasha ? HebcalService.getParasha(date, location) : undefined;
  const greg = DateTime.fromJSDate(date).setLocale('he').toFormat('cccc · d LLLL');
  const text = parasha ? `${hebrew.hebrewDateStr} · ${greg} · ${parasha}` : `${hebrew.hebrewDateStr} · ${greg}`;

  return (
    <Text style={[typography.micro, { color: colors.headerSub }]} numberOfLines={1}>
      {text}
    </Text>
  );
}
