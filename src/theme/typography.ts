import { TextStyle } from 'react-native';

export const fontFamilies = {
  heebo: {
    regular: 'Heebo_400Regular',
    semibold: 'Heebo_600SemiBold',
    bold: 'Heebo_700Bold',
    extrabold: 'Heebo_800ExtraBold',
    black: 'Heebo_900Black',
  },
  siddur: {
    regular: 'NotoSerifHebrew_400Regular',
    bold: 'NotoSerifHebrew_700Bold',
  },
} as const;

type Variant =
  'display' | 'title' | 'heading' | 'subheading' | 'body' | 'bodyBold' | 'caption' | 'captionBold' | 'small' | 'micro';

export const typography: Record<Variant, TextStyle> = {
  display: { fontFamily: fontFamilies.heebo.black, fontSize: 28, lineHeight: 34 },
  title: { fontFamily: fontFamilies.heebo.extrabold, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: fontFamilies.heebo.bold, fontSize: 17, lineHeight: 24 },
  subheading: { fontFamily: fontFamilies.heebo.semibold, fontSize: 15, lineHeight: 22 },
  body: { fontFamily: fontFamilies.heebo.regular, fontSize: 15, lineHeight: 22 },
  bodyBold: { fontFamily: fontFamilies.heebo.bold, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fontFamilies.heebo.regular, fontSize: 13, lineHeight: 18 },
  captionBold: { fontFamily: fontFamilies.heebo.bold, fontSize: 13, lineHeight: 18 },
  small: { fontFamily: fontFamilies.heebo.regular, fontSize: 12, lineHeight: 16 },
  micro: { fontFamily: fontFamilies.heebo.regular, fontSize: 11, lineHeight: 14 },
};

export const APP_FONTS = [
  'Heebo_400Regular',
  'Heebo_600SemiBold',
  'Heebo_700Bold',
  'Heebo_800ExtraBold',
  'Heebo_900Black',
  'NotoSerifHebrew_400Regular',
  'NotoSerifHebrew_700Bold',
] as const;
