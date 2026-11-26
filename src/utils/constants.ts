import { Platform } from 'react-native';
import { Theme } from '../constants/theme';

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
  // Primary & Surface Hierarchy derived from master Theme tokens
  primary: Theme.colors.water.primary,
  primaryDark: Theme.colors.water.dark,
  primaryLight: Theme.colors.water.surface,
  background: Theme.colors.neutral.canvas,
  surface: Theme.colors.neutral.card,
  surfaceMuted: '#F1F5F9',
  border: Theme.colors.neutral.borderSubtle,

  // Typography
  textPrimary: Theme.colors.neutral.textPrimary,
  textSecondary: Theme.colors.neutral.textSecondary,
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  // Semantic Metric Accents
  steps: Theme.colors.steps.primary,
  stepsBg: Theme.colors.steps.surface,
  stepsBorder: Theme.colors.steps.border,
  stepsBadge: Theme.colors.steps.dark,

  calories: Theme.colors.calories.primary,
  caloriesBg: Theme.colors.calories.surface,
  caloriesBorder: Theme.colors.calories.border,
  caloriesBadge: Theme.colors.calories.dark,

  water: Theme.colors.water.primary,
  waterBg: Theme.colors.water.surface,
  waterBorder: Theme.colors.water.border,
  waterBadge: Theme.colors.water.dark,

  // Semantic States
  success: Theme.colors.steps.primary,
  successBg: Theme.colors.steps.surface,
  warning: '#D97706',
  warningBg: '#FEF3C7',
  error: Theme.colors.neutral.danger,
  errorBg: '#FEE2E2',
} as const;

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
