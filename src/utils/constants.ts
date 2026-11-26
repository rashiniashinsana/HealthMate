import { Platform } from 'react-native';

export const DAILY_GOALS = {
  STEPS: 10000,
  CALORIES: 600,
  WATER_ML: 2500,
} as const;

export const VALIDATION_LIMITS = {
  MAX_STEPS: 100000,
  MAX_CALORIES: 15000,
  MAX_WATER_ML: 10000,
} as const;

export const QUICK_WATER_INCREMENT_ML = 250;

export const COLORS = {
  // Brand & Surfaces (Material Design 3 / iOS HIG inspired)
  primary: '#0F766E',
  primaryDark: '#115E59',
  primaryLight: '#CCFBF1',
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  border: '#E2E8F0',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',

  // Metric Accents
  steps: '#0F766E',
  stepsBg: '#CCFBF1',
  calories: '#EA580C',
  caloriesBg: '#FFEDD5',
  water: '#0284C7',
  waterBg: '#E0F2FE',

  // Semantic States
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  error: '#DC2626',
  errorBg: '#FEE2E2',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const RADII = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 999,
} as const;

export const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: {
    elevation: 2,
  },
  default: {},
});
