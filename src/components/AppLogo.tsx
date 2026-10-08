import React from 'react';
import Svg, { Circle, Polygon, Path } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';

type Props = { size?: number };

export function AppLogo({ size = 32 }: Props) {
  const { colors, isDark } = useTheme();
  const fill = isDark ? colors.gold : colors.text;
  const stroke = isDark ? colors.bg : colors.headerAccent;
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx={24} cy={24} r={24} fill={fill} />
      <Polygon points="24,8 37,31 11,31" fill="none" stroke={stroke} strokeWidth={2.4} strokeLinejoin="round" />
      <Polygon points="24,40 11,17 37,17" fill="none" stroke={stroke} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M19.5,24.5 L22.5,27.5 L28.5,21" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
