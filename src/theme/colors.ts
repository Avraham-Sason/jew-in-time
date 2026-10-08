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
  urgent: string;
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
};

export type ThemeName = 'gold' | 'pink' | 'purple' | 'blue' | 'dark';

export const THEME_NAMES: readonly ThemeName[] = ['gold', 'pink', 'purple', 'blue', 'dark'];

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
  urgent: '#D63030',
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
};

export const T_PINK: ThemeColors = {
  bg: '#FFF4F8',
  surface: '#FFFFFF',
  surface2: '#FCE4EC',
  text: '#3A1F2E',
  textSub: '#7D6472',
  textMuted: '#806A77',
  border: '#F5CFDD',
  gold: '#C92B63',
  onGold: '#FFFFFF',
  goldLight: '#FDE7EF',
  urgent: '#D63030',
  urgentBg: '#FEF2F2',
  urgentBorder: '#FECACA',
  warning: '#D97020',
  safe: '#0F9060',
  optional: '#1F5F6E',
  optionalBg: '#E8F2F4',
  minyan: '#6B3FA0',
  headerBg: '#A61E55',
  headerAccent: '#FFC2D6',
  headerText: '#FFFFFF',
  headerSub: 'rgba(255,255,255,0.78)',
  tabBg: '#FFFFFF',
  tabBorder: '#FCE4EC',
  shadow: 'rgba(166,30,85,0.10)',
  shadowStrong: 'rgba(166,30,85,0.22)',
  bezel: '#3B0F24',
};

export const T_PURPLE: ThemeColors = {
  bg: '#F7F4FE',
  surface: '#FFFFFF',
  surface2: '#ECE6FA',
  text: '#261C3F',
  textSub: '#6E6686',
  textMuted: '#746C8C',
  border: '#DCD2F2',
  gold: '#7538E0',
  onGold: '#FFFFFF',
  goldLight: '#EDE4FF',
  urgent: '#D63030',
  urgentBg: '#FEF2F2',
  urgentBorder: '#FECACA',
  warning: '#D97020',
  safe: '#0F9060',
  optional: '#1F5F6E',
  optionalBg: '#E8F2F4',
  minyan: '#0F766E',
  headerBg: '#4A1F9E',
  headerAccent: '#D4C2FF',
  headerText: '#FFFFFF',
  headerSub: 'rgba(255,255,255,0.62)',
  tabBg: '#FFFFFF',
  tabBorder: '#ECE6FA',
  shadow: 'rgba(74,31,158,0.10)',
  shadowStrong: 'rgba(74,31,158,0.22)',
  bezel: '#2A1366',
};

export const T_BLUE: ThemeColors = {
  bg: '#F2F6FC',
  surface: '#FFFFFF',
  surface2: '#E4ECF7',
  text: '#14213D',
  textSub: '#5C6B84',
  textMuted: '#66758C',
  border: '#CDDAEB',
  gold: '#1F5FD0',
  onGold: '#FFFFFF',
  goldLight: '#DEE9FB',
  urgent: '#D63030',
  urgentBg: '#FEF2F2',
  urgentBorder: '#FECACA',
  warning: '#D97020',
  safe: '#0F9060',
  optional: '#1F5F6E',
  optionalBg: '#E8F2F4',
  minyan: '#6B3FA0',
  headerBg: '#1B3A80',
  headerAccent: '#BCD3FF',
  headerText: '#FFFFFF',
  headerSub: 'rgba(255,255,255,0.62)',
  tabBg: '#FFFFFF',
  tabBorder: '#E4ECF7',
  shadow: 'rgba(27,58,128,0.10)',
  shadowStrong: 'rgba(27,58,128,0.22)',
  bezel: '#0B1A3A',
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
  urgent: '#EF4444',
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
};

export const THEMES: Record<ThemeName, ThemeColors> = {
  gold: T_LIGHT,
  pink: T_PINK,
  purple: T_PURPLE,
  blue: T_BLUE,
  dark: T_DARK,
};

export const isDarkTheme = (name: ThemeName): boolean => name === 'dark';
