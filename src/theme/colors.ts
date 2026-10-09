export type ThemeColors = {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  textSub: string;
  textMuted: string;
  border: string;
  gold: string;
  onGold: string;
  goldLight: string;
  goldText: string;
  urgent: string;
  onUrgent: string;
  urgentBg: string;
  urgentBorder: string;
  warning: string;
  safe: string;
  optional: string;
  optionalBg: string;
  minyan: string;
  headerBg: string;
  headerText: string;
  headerSub: string;
  headerAccent: string;
  tabBg: string;
  tabBorder: string;
  shadow: string;
  shadowStrong: string;
  bezel: string;
  overlay: string;
};

export type ThemeName = 'gold' | 'dark' | 'plum';

export const THEME_NAMES: readonly ThemeName[] = ['gold', 'dark', 'plum'];
export const DARK_THEMES: readonly ThemeName[] = ['dark', 'plum'];

export const T_LIGHT: ThemeColors = {
  bg: '#F5EFE4',
  surface: '#FFFFFF',
  surface2: '#EDE7DB',
  text: '#1C2B4A',
  textSub: '#6A7280',
  textMuted: '#6E7781',
  border: '#DDD5C5',
  gold: '#C9922A',
  // White on gold is 2.4:1 — far below AA for button labels. This is 5.1:1 on the same fill.
  onGold: '#1C2B4A',
  goldLight: '#FDF0D8',
  // Gold reads 2.75:1 on white, so it is never a text colour; this is the accent dark enough for text.
  goldText: '#7F5A0F',
  urgent: '#D63030',
  onUrgent: '#FFFFFF',
  urgentBg: '#FEF2F2',
  urgentBorder: '#FECACA',
  warning: '#D97020',
  safe: '#0F9060',
  optional: '#1F5F6E',
  optionalBg: '#E8F2F4',
  minyan: '#6B3FA0',
  headerBg: '#1C2B4A',
  headerAccent: '#C9922A',
  headerText: '#FFFFFF',
  headerSub: 'rgba(255,255,255,0.55)',
  tabBg: '#FFFFFF',
  tabBorder: '#EDE7DB',
  shadow: 'rgba(28,43,74,0.09)',
  shadowStrong: 'rgba(28,43,74,0.20)',
  bezel: '#111827',
  overlay: 'rgba(9,20,32,0.5)',
};

export const T_DARK: ThemeColors = {
  bg: '#0D1925',
  surface: '#18293C',
  surface2: '#1F3347',
  text: '#EDE7DB',
  textSub: '#7A8A99',
  textMuted: '#8C9AA8',
  border: '#253547',
  gold: '#D4A030',
  onGold: '#12202F',
  goldLight: '#2A2010',
  goldText: '#D4A030',
  urgent: '#EF4444',
  onUrgent: '#0D1925',
  urgentBg: '#2A1515',
  urgentBorder: '#7F1D1D',
  warning: '#F59E0B',
  safe: '#10B981',
  optional: '#8FCFDC',
  optionalBg: '#1C3646',
  minyan: '#C9A8EE',
  headerBg: '#091420',
  headerAccent: '#D4A030',
  headerText: '#EDE7DB',
  headerSub: 'rgba(237,231,219,0.45)',
  tabBg: '#18293C',
  tabBorder: '#253547',
  shadow: 'rgba(0,0,0,0.30)',
  shadowStrong: 'rgba(0,0,0,0.55)',
  bezel: '#050D18',
  overlay: 'rgba(0,0,0,0.6)',
};

export const T_PLUM: ThemeColors = {
  bg: '#1A1026',
  surface: '#261735',
  surface2: '#31204A',
  text: '#F4E9F8',
  textSub: '#BBA3CC',
  textMuted: '#C4AED3',
  border: '#3E2A56',
  gold: '#F48FBC',
  onGold: '#2A0F20',
  goldLight: '#3C2238',
  goldText: '#F48FBC',
  urgent: '#FF6B6B',
  onUrgent: '#1A1026',
  urgentBg: '#3A1A24',
  urgentBorder: '#7F2A3A',
  warning: '#F5B041',
  safe: '#3DD598',
  optional: '#9DD6E8',
  optionalBg: '#1E3240',
  minyan: '#C9A8EE',
  headerBg: '#120A1C',
  headerAccent: '#F48FBC',
  headerText: '#F4E9F8',
  headerSub: 'rgba(244,233,248,0.55)',
  tabBg: '#261735',
  tabBorder: '#3E2A56',
  shadow: 'rgba(0,0,0,0.35)',
  shadowStrong: 'rgba(0,0,0,0.60)',
  bezel: '#0B0612',
  overlay: 'rgba(0,0,0,0.6)',
};

export const THEMES: Record<ThemeName, ThemeColors> = {
  gold: T_LIGHT,
  dark: T_DARK,
  plum: T_PLUM,
};

export const BRAND = {
  navy: '#1C2B4A',
  gold: '#C9922A',
  parchment: '#F5EFE4',
  white: '#FFFFFF',
} as const;

export const isDarkTheme = (name: ThemeName): boolean => DARK_THEMES.includes(name);
