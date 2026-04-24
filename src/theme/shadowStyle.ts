import { Platform, ViewStyle } from 'react-native';

type ShadowSpec = {
  x: number;
  y: number;
  blur: number;
  elevation: number;
};

export const shadowPresets = {
  card: { x: 0, y: 2, blur: 14, elevation: 2 },
  cardSoft: { x: 0, y: 2, blur: 12, elevation: 2 },
  raised: { x: 0, y: 4, blur: 20, elevation: 4 },
  glow: { x: 0, y: 0, blur: 12, elevation: 6 },
} as const satisfies Record<string, ShadowSpec>;

export function shadowStyle(color: string, spec: ShadowSpec): ViewStyle {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${spec.x}px ${spec.y}px ${spec.blur}px ${color}`,
    } as ViewStyle;
  }

  return {
    shadowColor: color,
    shadowOffset: { width: spec.x, height: spec.y },
    shadowOpacity: 1,
    shadowRadius: spec.blur,
    elevation: spec.elevation,
  };
}
