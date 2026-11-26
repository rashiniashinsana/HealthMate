import { UserGoals } from '../types/goals';
import { COLORS } from './constants';

export type ActivityLevel = 'light' | 'moderate' | 'active';

export interface BmiResult {
  bmi: number;
  category: string;
  color: string;
  tint: string;
  healthRisk: string;
}

export interface BmiInputErrors {
  height?: string;
  weight?: string;
}

export const BMI_LIMITS = {
  MIN_HEIGHT_CM: 50,
  MAX_HEIGHT_CM: 260,
  MIN_WEIGHT_KG: 20,
  MAX_WEIGHT_KG: 300,
} as const;

export function validateBmiInputs(
  heightRaw: string,
  weightRaw: string
): BmiInputErrors {
  const errors: BmiInputErrors = {};

  const trimmedHeight = heightRaw.trim();
  if (!trimmedHeight) {
    errors.height = 'Height is required.';
  } else if (!/^\d+(\.\d+)?$/.test(trimmedHeight)) {
    errors.height = 'Enter a valid positive number.';
  } else {
    const h = Number(trimmedHeight);
    if (h < BMI_LIMITS.MIN_HEIGHT_CM || h > BMI_LIMITS.MAX_HEIGHT_CM) {
      errors.height = `Height must be between ${BMI_LIMITS.MIN_HEIGHT_CM} and ${BMI_LIMITS.MAX_HEIGHT_CM} cm.`;
    }
  }

  const trimmedWeight = weightRaw.trim();
  if (!trimmedWeight) {
    errors.weight = 'Weight is required.';
  } else if (!/^\d+(\.\d+)?$/.test(trimmedWeight)) {
    errors.weight = 'Enter a valid positive number.';
  } else {
    const w = Number(trimmedWeight);
    if (w < BMI_LIMITS.MIN_WEIGHT_KG || w > BMI_LIMITS.MAX_WEIGHT_KG) {
      errors.weight = `Weight must be between ${BMI_LIMITS.MIN_WEIGHT_KG} and ${BMI_LIMITS.MAX_WEIGHT_KG} kg.`;
    }
  }

  return errors;
}

export function calculateBMI(weightKg: number, heightCm: number): BmiResult {
  const heightMeters = heightCm / 100;
  const rawBmi = weightKg / (heightMeters * heightMeters);
  const bmi = Math.round(rawBmi * 10) / 10;

  if (bmi < 18.5) {
    return {
      bmi,
      category: 'Underweight',
      color: COLORS.water,
      tint: COLORS.waterBg,
      healthRisk: 'Consider nutrient-dense meals to build healthy body mass.',
    };
  }

  if (bmi < 25.0) {
    return {
      bmi,
      category: 'Normal weight',
      color: COLORS.steps,
      tint: COLORS.stepsBg,
      healthRisk: 'Healthy range. Maintain balanced nutrition and daily movement.',
    };
  }

  if (bmi < 30.0) {
    return {
      bmi,
      category: 'Overweight',
      color: COLORS.warning,
      tint: COLORS.warningBg,
      healthRisk: 'Moderate risk. Increasing daily steps can support weight balance.',
    };
  }

  return {
    bmi,
    category: 'Obese',
    color: COLORS.calories,
    tint: COLORS.caloriesBg,
    healthRisk: 'Elevated metabolic risk. Prioritize steady activity and guidance.',
  };
}

const STEP_TARGETS: Record<ActivityLevel, number> = {
  light: 7500,
  moderate: 10000,
  active: 12500,
};

// Active burn kcal per kg of bodyweight across activity tiers.
const CALORIE_FACTORS: Record<ActivityLevel, number> = {
  light: 5.5,
  moderate: 7.5,
  active: 10,
};

export function getRecommendedBaselines(
  weightKg: number,
  activityLevel: ActivityLevel
): UserGoals {
  const rawWater = weightKg * 35;
  const waterGoal = Math.min(10000, Math.round(rawWater / 50) * 50);

  const stepGoal = STEP_TARGETS[activityLevel];
  const rawCalories = Math.round(weightKg * CALORIE_FACTORS[activityLevel]);
  const calorieGoal = Math.max(250, Math.min(1500, rawCalories));

  return {
    stepGoal,
    calorieGoal,
    waterGoal,
  };
}
