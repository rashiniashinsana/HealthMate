import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_USER_GOALS, UserGoals } from '../types/goals';

const GOALS_STORAGE_KEY = 'healthmate:user_goals';

function isValidGoalValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

export async function getStoredGoals(): Promise<UserGoals> {
  try {
    const raw = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_USER_GOALS;
    }

    const parsed = JSON.parse(raw) as Partial<UserGoals>;
    return {
      stepGoal: isValidGoalValue(parsed.stepGoal)
        ? parsed.stepGoal
        : DEFAULT_USER_GOALS.stepGoal,
      calorieGoal: isValidGoalValue(parsed.calorieGoal)
        ? parsed.calorieGoal
        : DEFAULT_USER_GOALS.calorieGoal,
      waterGoal: isValidGoalValue(parsed.waterGoal)
        ? parsed.waterGoal
        : DEFAULT_USER_GOALS.waterGoal,
    };
  } catch {
    return DEFAULT_USER_GOALS;
  }
}

export async function saveStoredGoals(goals: UserGoals): Promise<void> {
  await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
}
