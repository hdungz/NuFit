import type { ApiResponse, MealEntry } from "../lib/models";
import { readAppData, updateAppData } from "../lib/storage";
import { getLocalDateKey } from "../lib/utils";
import { withMockApi } from "./mockApi";

type MealPayload = Omit<MealEntry, "id">;

export async function listMeals(): Promise<ApiResponse<MealEntry[]>> {
  return withMockApi(() => readAppData().mealEntries, { errorMessage: "Không tải được dữ liệu bữa ăn." });
}

export async function addMeal(payload: MealPayload): Promise<ApiResponse<MealEntry[]>> {
  return withMockApi(
    () => {
      const next = updateAppData((current) => ({
        ...current,
        mealEntries: [{ ...payload, id: crypto.randomUUID() }, ...current.mealEntries],
      }));
      return next.mealEntries;
    },
    { errorMessage: "Không thể lưu bữa ăn lúc này." },
  );
}

export async function updateMeal(mealId: string, payload: Partial<MealPayload>): Promise<ApiResponse<MealEntry[]>> {
  return withMockApi(
    () => {
      const next = updateAppData((current) => ({
        ...current,
        mealEntries: current.mealEntries.map((meal) => (meal.id === mealId ? { ...meal, ...payload } : meal)),
      }));
      return next.mealEntries;
    },
    { errorMessage: "Không thể cập nhật bữa ăn." },
  );
}

export async function removeMeal(mealId: string): Promise<ApiResponse<MealEntry[]>> {
  return withMockApi(
    () => {
      const next = updateAppData((current) => ({
        ...current,
        mealEntries: current.mealEntries.filter((meal) => meal.id !== mealId),
      }));
      return next.mealEntries;
    },
    { errorMessage: "Không thể xóa bữa ăn." },
  );
}

export function computeMealMetrics(meals: MealEntry[], targetCalories = 2000) {
  const today = getLocalDateKey();
  const todayMeals = meals.filter((meal) => meal.date === today);
  const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = todayMeals.reduce((sum, meal) => sum + meal.proteinGram, 0);
  const totalCarbs = todayMeals.reduce((sum, meal) => sum + meal.carbsGram, 0);
  const totalFat = todayMeals.reduce((sum, meal) => sum + meal.fatGram, 0);

  return {
    totalCalories,
    remainingCalories: Math.max(targetCalories - totalCalories, 0),
    progressPercent: Math.min((totalCalories / targetCalories) * 100, 100),
    totalProtein,
    totalCarbs,
    totalFat,
  };
}
