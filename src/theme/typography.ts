import { TextStyle } from 'react-native';

export const fontFamilies = {
  heebo: {
    light: 'Heebo_300Light',
    regular: 'Heebo_400Regular',
    medium: 'Heebo_500Medium',
    semibold: 'Heebo_600SemiBold',
    bold: 'Heebo_700Bold',
    extrabold: 'Heebo_800ExtraBold',
    black: 'Heebo_900Black',
  },
} as const;

type Variant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyBold'
  | 'caption'
  | 'captionBold'
  | 'small'
  | 'micro';

export const typography: Record<Variant, TextStyle> = {
  display: { fontFamily: fontFamilies.heebo.black, fontSize: 28, lineHeight: 34 },
  title: { fontFamily: fontFamilies.heebo.extrabold, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: fontFamilies.heebo.bold, fontSize: 16, lineHeight: 22 },
  subheading: { fontFamily: fontFamilies.heebo.semibold, fontSize: 14, lineHeight: 20 },
  body: { fontFamily: fontFamilies.heebo.regular, fontSize: 14, lineHeight: 20 },
  bodyBold: { fontFamily: fontFamilies.heebo.bold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamilies.heebo.regular, fontSize: 12, lineHeight: 16 },
  captionBold: { fontFamily: fontFamilies.heebo.bold, fontSize: 12, lineHeight: 16 },
  small: { fontFamily: fontFamilies.heebo.regular, fontSize: 11, lineHeight: 14 },
  micro: { fontFamily: fontFamilies.heebo.regular, fontSize: 10, lineHeight: 13 },
};
