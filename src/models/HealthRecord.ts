/**
 * Domain model representing a single persisted row in `health_records`.
 */
export interface HealthRecord {
  id: number;
  /** ISO 8601 calendar date string (`YYYY-MM-DD`). */
  date: string;
  steps: number;
  calories: number;
  /** Water intake in milliliters (ml). */
  water: number;
}

/**
 * Payload used when creating or updating a health record.
 */
export type HealthRecordInput = Omit<HealthRecord, 'id'>;

/**
 * Aggregated totals for a single day (used on the Dashboard).
 */
export interface DailySummary {
  date: string;
  totalSteps: number;
  totalCalories: number;
  totalWater: number;
  recordCount: number;
}

/**
 * 7-day rolling statistics for distinction-level analytics.
 */
export interface WeeklyStats {
  averageSteps: number;
  averageCalories: number;
  averageWater: number;
  daysLogged: number;
  totalSteps: number;
  totalCalories: number;
  totalWater: number;
}

/**
 * String-backed form state for Add / Edit Record screen.
 */
export interface HealthFormValues {
  date: string;
  steps: string;
  calories: string;
  water: string;
}

/**
 * Field-level validation error messages.
 */
export type HealthFormErrors = Partial<Record<keyof HealthFormValues, string>>;
