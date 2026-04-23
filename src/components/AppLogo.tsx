import React from 'react';
import Svg, { Circle, Polygon, Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

type Props = { size?: number; isDark?: boolean };

export function AppLogo({ size = 32, isDark: isDarkProp }: Props) {
  const { isDark: ctxDark } = useTheme();
  const isDark = isDarkProp ?? ctxDark;
  const fill = isDark ? '#D4A030' : '#1C2B4A';
  const stroke = isDark ? '#0D1925' : '#C9922A';
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx={24} cy={24} r={24} fill={fill} />
      <Polygon points="24,8 37,31 11,31" fill="none" stroke={stroke} strokeWidth={2.4} strokeLinejoin="round" />
      <Polygon points="24,40 11,17 37,17" fill="none" stroke={stroke} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M19.5,24.5 L22.5,27.5 L28.5,21" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
