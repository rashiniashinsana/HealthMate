import { HealthFormErrors, HealthFormValues } from '../models/HealthRecord';
import { VALIDATION_LIMITS } from './constants';
import { getTodayISO, isValidISODate } from './dateUtils';

/**
 * Validates a single positive integer field against an exclusive upper bound.
 */
function validatePositiveInt(
  rawValue: string,
  label: string,
  maxExclusive: number,
  unit: string = ''
): string | undefined {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return `${label} is required.`;
  }

  if (!/^\d+$/.test(trimmed)) {
    return `${label} must be a whole positive number.`;
  }

  const numeric = Number(trimmed);
  if (!Number.isSafeInteger(numeric) || numeric <= 0) {
    return `${label} must be greater than 0.`;
  }

  if (numeric >= maxExclusive) {
    const formattedMax = maxExclusive.toLocaleString();
    const suffix = unit ? ` ${unit}` : '';
    return `${label} must be less than ${formattedMax}${suffix}.`;
  }

  return undefined;
}

/**
 * Validates all fields of the Add / Edit Health Record form.
 */
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

/**
 * Returns `true` if the error map contains at least one validation message.
 */
export function hasValidationErrors(errors: HealthFormErrors): boolean {
  return Object.values(errors).some((msg) => Boolean(msg));
}
