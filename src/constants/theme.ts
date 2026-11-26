export const COLORS = {
  primary: '#0D9488',
  primaryDark: '#0F766E',
  primarySoft: '#CCFBF1',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',

  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  border: '#E2E8F0',

  // Metric accents
  steps: '#0D9488',
  stepsSoft: '#CCFBF1',

  calories: '#EA580C',
  caloriesSoft: '#FFEDD5',

  water: '#0284C7',
  waterSoft: '#E0F2FE',

  // Semantic
  success: '#16A34A',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const DAILY_GOALS = {
  steps: 10000,
  calories: 2500,
  water: 2500, // ml
} as const;

export const VALIDATION_BOUNDS = {
  maxSteps: 100000,
  maxCalories: 20000,
  maxWater: 10000,
} as const;
