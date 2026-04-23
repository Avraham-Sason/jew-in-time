import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { T_DARK, T_LIGHT, ThemeColors } from './colors';
import { useUserStore } from '@/stores/useUserStore';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const mode = useUserStore((s) => s.theme);
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  const value = useMemo<ThemeContextValue>(
    () => ({ colors: isDark ? T_DARK : T_LIGHT, isDark, mode }),
    [isDark, mode],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
