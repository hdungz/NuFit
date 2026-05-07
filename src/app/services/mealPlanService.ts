import type { ApiResponse, MealPlanEntry } from "../lib/models";
import { readAppData, updateAppData } from "../lib/storage";

export async function listMealPlan(): Promise<ApiResponse<MealPlanEntry[]>> {
  return { data: readAppData().mealPlanEntries, error: null };
}

export async function addMealPlanEntries(entries: Omit<MealPlanEntry, "id">[]): Promise<ApiResponse<MealPlanEntry[]>> {
  const next = updateAppData((current) => ({
    ...current,
    mealPlanEntries: [
      ...entries.map((e) => ({ ...e, id: crypto.randomUUID() })),
      ...current.mealPlanEntries,
    ],
  }));
  return { data: next.mealPlanEntries, error: null };
}

export async function replaceMealPlanForDates(
  dates: string[],
  entries: Omit<MealPlanEntry, "id">[],
): Promise<ApiResponse<MealPlanEntry[]>> {
  const dateSet = new Set(dates);
  const next = updateAppData((current) => ({
    ...current,
    mealPlanEntries: [
      ...entries.map((e) => ({ ...e, id: crypto.randomUUID() })),
      ...current.mealPlanEntries.filter((e) => !dateSet.has(e.date)),
    ],
  }));
  return { data: next.mealPlanEntries, error: null };
}

export async function removeMealPlanEntry(id: string): Promise<ApiResponse<MealPlanEntry[]>> {
  const next = updateAppData((current) => ({
    ...current,
    mealPlanEntries: current.mealPlanEntries.filter((e) => e.id !== id),
  }));
  return { data: next.mealPlanEntries, error: null };
}

export async function clearMealPlan(): Promise<ApiResponse<MealPlanEntry[]>> {
  const next = updateAppData((current) => ({ ...current, mealPlanEntries: [] }));
  return { data: next.mealPlanEntries, error: null };
}
