export type ThemeColors = {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  textSub: string;
  textMuted: string;
  border: string;
  gold: string;
  goldLight: string;
  urgent: string;
  urgentBg: string;
  urgentBorder: string;
  warning: string;
  safe: string;
  headerBg: string;
  headerText: string;
  headerSub: string;
  tabBg: string;
  tabBorder: string;
  shadow: string;
  shadowStrong: string;
  bezel: string;
};

export const T_LIGHT: ThemeColors = {
  bg: '#F5EFE4',
  surface: '#FFFFFF',
  surface2: '#EDE7DB',
  text: '#1C2B4A',
  textSub: '#6A7280',
  textMuted: '#A8B0B8',
  border: '#DDD5C5',
  gold: '#C9922A',
  goldLight: '#FDF0D8',
  urgent: '#D63030',
  urgentBg: '#FEF2F2',
  urgentBorder: '#FECACA',
  warning: '#D97020',
  safe: '#0F9060',
  headerBg: '#1C2B4A',
  headerText: '#FFFFFF',
  headerSub: 'rgba(255,255,255,0.55)',
  tabBg: '#FFFFFF',
  tabBorder: '#EDE7DB',
  shadow: 'rgba(28,43,74,0.09)',
  shadowStrong: 'rgba(28,43,74,0.20)',
  bezel: '#111827',
};

export const T_DARK: ThemeColors = {
  bg: '#0D1925',
  surface: '#18293C',
  surface2: '#1F3347',
  text: '#EDE7DB',
  textSub: '#7A8A99',
  textMuted: '#445566',
  border: '#253547',
  gold: '#D4A030',
  goldLight: '#2A2010',
  urgent: '#EF4444',
  urgentBg: '#2A1515',
  urgentBorder: '#7F1D1D',
  warning: '#F59E0B',
  safe: '#10B981',
  headerBg: '#091420',
  headerText: '#EDE7DB',
  headerSub: 'rgba(237,231,219,0.45)',
  tabBg: '#18293C',
  tabBorder: '#253547',
  shadow: 'rgba(0,0,0,0.30)',
  shadowStrong: 'rgba(0,0,0,0.55)',
  bezel: '#050D18',
};

export const themes = { light: T_LIGHT, dark: T_DARK };
