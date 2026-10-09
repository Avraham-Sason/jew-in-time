import React from 'react';
import Svg, { Circle, Polygon, Path } from 'react-native-svg';
import { BRAND } from '@/theme/colors';

type Props = { size?: number };

export function AppLogo({ size = 32 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx={24} cy={24} r={24} fill={BRAND.navy} />
      <Circle cx={24} cy={24} r={23} stroke={BRAND.gold} strokeWidth={1.5} fill="none" />
      <Polygon points="24,8 37,31 11,31" fill="none" stroke={BRAND.gold} strokeWidth={2.4} strokeLinejoin="round" />
      <Polygon points="24,40 11,17 37,17" fill="none" stroke={BRAND.gold} strokeWidth={2.4} strokeLinejoin="round" />
      <Path
        d="M19.5,24.5 L22.5,27.5 L28.5,21"
        stroke={BRAND.white}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
