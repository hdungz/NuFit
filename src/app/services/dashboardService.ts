import { readAppData } from "../lib/storage";
import { getLocalDateKey } from "../lib/utils";
import { computeMealMetrics } from "./mealService";
import { computeWorkoutMetrics } from "./workoutService";

export async function getDashboardStats() {
  const appData = readAppData();
  const mealMetrics = computeMealMetrics(appData.mealEntries);
  const workoutMetrics = computeWorkoutMetrics(appData.workoutPlan);
  const minutesDone = appData.workoutPlan.sessions
    .filter((session) => session.date === getLocalDateKey())
    .reduce((sum, session) => sum + session.durationMinutes, 0);

  return {
    caloriesLabel: `${mealMetrics.totalCalories.toLocaleString("vi-VN")} / 2,000`,
    workoutMinutesLabel: `${minutesDone} / 45`,
    completionRate: workoutMetrics.completionRate,
  };
}
