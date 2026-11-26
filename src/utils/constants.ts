import { Platform } from 'react-native';

export const DAILY_GOALS = {
  STEPS: 10000,
  CALORIES: 600,
  WATER_ML: 2500,
} as const;

export const VALIDATION_LIMITS = {
  MAX_STEPS: 100000,
  MAX_CALORIES: 10000,
  MAX_WATER_ML: 10000,
} as const;

export const QUICK_WATER_INCREMENT_ML = 250;

export const COLORS = {
  // Primary & Surface Hierarchy (Material Design 3)
  primary: '#0284C7',
  primaryDark: '#0369A1',
  primaryLight: '#E0F2FE',
  background: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border: '#EDF2F7',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  // Semantic Metric Accents
  steps: '#16A34A',
  stepsBg: '#DCFCE7',
  stepsBadge: '#15803D',

  calories: '#EA580C',
  caloriesBg: '#FFEDD5',
  caloriesBadge: '#C2410C',

  water: '#0284C7',
  waterBg: '#E0F2FE',
  waterBadge: '#0369A1',

  // Semantic States
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  error: '#DC2626',
  errorBg: '#FEE2E2',
} as const;

// 8-point spacing grid
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const RADII = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

export const CARD_SHADOW = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: {
    elevation: 2,
  },
  default: {},
});
