import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Appearance } from 'react-native';
import { THEMES, ThemeColors, ThemeName, isDarkTheme } from './colors';
import { useUserStore } from '@/stores/useUserStore';

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  name: ThemeName;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const name = useUserStore((s) => s.theme);
  const isDark = isDarkTheme(name);
  useEffect(() => {
    if (typeof Appearance.setColorScheme === 'function') Appearance.setColorScheme(isDark ? 'dark' : 'light');
  }, [isDark]);
  const value = useMemo<ThemeContextValue>(() => ({ colors: THEMES[name], isDark, name }), [name, isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
