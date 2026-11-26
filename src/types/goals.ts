export interface UserGoals {
  stepGoal: number;
  calorieGoal: number;
  waterGoal: number;
}

export const DEFAULT_USER_GOALS: UserGoals = {
  stepGoal: 10000,
  calorieGoal: 500,
  waterGoal: 2500,
};
