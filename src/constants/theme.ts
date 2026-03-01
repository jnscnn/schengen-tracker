const LIGHT_COLORS = {
  primary: '#4F6BF0',
  primaryDark: '#3B52CC',
  primaryLight: '#E0E7FF',
  accent: '#8B5CF6',
  accentLight: '#EDE9FE',

  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',

  background: '#F5F7FF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',

  text: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  schengenDay: '#4F6BF0',
  freeDay: '#E2E8F0',
  todayRing: '#8B5CF6',
};

const DARK_COLORS: typeof LIGHT_COLORS = {
  primary: '#6B8AF2',
  primaryDark: '#5A7BEE',
  primaryLight: '#1E2A4A',
  accent: '#A78BFA',
  accentLight: '#2D2250',

  success: '#34D399',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#451A03',
  danger: '#F87171',
  dangerLight: '#450A0A',

  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',

  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: '#0F172A',

  border: '#334155',
  borderLight: '#1E293B',

  schengenDay: '#6B8AF2',
  freeDay: '#334155',
  todayRing: '#A78BFA',
};

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof LIGHT_COLORS;

export function getColors(scheme: ColorScheme): ThemeColors {
  return scheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
}

// Default export for backward compat — overridden at runtime by ThemeContext
export let COLORS = LIGHT_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 28,
  hero: 64,
};

export const SCHENGEN = {
  MAX_STAY_DAYS: 90,
  WINDOW_DAYS: 180,
};
