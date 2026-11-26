import { HealthFormErrors, HealthFormValues } from '../models/HealthRecord';
import { VALIDATION_LIMITS } from './constants';
import { getTodayISO, isValidISODate } from './dateUtils';

function validatePositiveInt(
  rawValue: string,
  label: string,
  maxInclusive: number,
  unit: string = ''
): string | undefined {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return `${label} is required.`;
  }

  if (trimmed.startsWith('-')) {
    return `${label} cannot be negative.`;
  }

  if (!/^\d+$/.test(trimmed)) {
    return `${label} must contain whole numbers only.`;
  }

  const numeric = Number(trimmed);
  if (!Number.isSafeInteger(numeric) || numeric <= 0) {
    return `${label} must be greater than 0.`;
  }

  if (numeric > maxInclusive) {
    const formattedMax = maxInclusive.toLocaleString();
    const suffix = unit ? ` ${unit}` : '';
    return `${label} must be ${formattedMax}${suffix} or less.`;
  }

  return undefined;
}

export function validateHealthForm(values: HealthFormValues): HealthFormErrors {
  const errors: HealthFormErrors = {};

  const trimmedDate = values.date.trim();
  if (!trimmedDate) {
    errors.date = 'Date is required.';
  } else if (!isValidISODate(trimmedDate)) {
    errors.date = 'Enter a valid date in YYYY-MM-DD format.';
  } else if (trimmedDate > getTodayISO()) {
    errors.date = 'Date cannot be in the future.';
  }

  const stepsError = validatePositiveInt(
    values.steps,
    'Steps',
    VALIDATION_LIMITS.MAX_STEPS
  );
  if (stepsError) {
    errors.steps = stepsError;
  }

  const caloriesError = validatePositiveInt(
    values.calories,
    'Calories',
    VALIDATION_LIMITS.MAX_CALORIES,
    'kcal'
  );
  if (caloriesError) {
    errors.calories = caloriesError;
  }

  const waterError = validatePositiveInt(
    values.water,
    'Water intake',
    VALIDATION_LIMITS.MAX_WATER_ML,
    'ml'
  );
  if (waterError) {
    errors.water = waterError;
  }

  return errors;
}

export function hasValidationErrors(errors: HealthFormErrors): boolean {
  return Object.values(errors).some((msg) => Boolean(msg));
}
