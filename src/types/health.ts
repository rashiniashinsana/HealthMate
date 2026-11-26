export interface HealthRecord {
  id: number;
  date: string;
  steps: number;
  calories: number;
  water: number;
}

export interface NewHealthRecordInput {
  date: string;
  steps: number;
  calories: number;
  water: number;
}

export interface DailySummary {
  totalSteps: number;
  totalCalories: number;
  totalWater: number;
}

export interface DayMetric {
  date: string;
  label: string;
  steps: number;
  calories: number;
  water: number;
}

export interface WeeklyAnalyticsSummary {
  days: DayMetric[];
  avgSteps: number;
  avgCalories: number;
  avgWater: number;
}
