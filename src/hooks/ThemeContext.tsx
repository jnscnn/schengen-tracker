import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, ColorScheme, ThemeColors, COLORS as DEFAULT_COLORS } from '../constants/theme';

// Mutate the module-level COLORS export so existing components pick it up
import * as theme from '../constants/theme';

interface ThemeContextType {
  colors: ThemeColors;
  scheme: ColorScheme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);
const THEME_KEY = '@schengen_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme() as ColorScheme | null;
  const [scheme, setScheme] = useState<ColorScheme>(systemScheme || 'light');
  const [loaded, setLoaded] = useState(false);

  // Load saved preference
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'light') {
          setScheme(saved);
        } else if (systemScheme) {
          setScheme(systemScheme);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const colors = getColors(scheme);

  // Keep module-level COLORS in sync
  (theme as any).COLORS = colors;

  const toggle = useCallback(() => {
    const next = scheme === 'light' ? 'dark' : 'light';
    setScheme(next);
    AsyncStorage.setItem(THEME_KEY, next);
  }, [scheme]);

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{ colors, scheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
