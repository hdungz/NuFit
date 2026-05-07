import { describe, expect, it } from "vitest";
import type { MealEntry } from "../lib/models";
import { computeMealMetrics } from "./mealService";

describe("computeMealMetrics", () => {
  it("calculates totals for current day only", () => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const meals: MealEntry[] = [
      {
        id: "1",
        date: dateKey,
        time: "08:00",
        name: "Phở bò",
        calories: 450,
        proteinGram: 24,
        carbsGram: 55,
        fatGram: 12,
        tags: ["Sáng", "Việt Nam"] as const,
        image: "img",
        source: "manual" as const,
      },
      {
        id: "2",
        date: "2099-01-01",
        time: "12:30",
        name: "Bún chả",
        calories: 550,
        proteinGram: 28,
        carbsGram: 61,
        fatGram: 17,
        tags: ["Trưa", "Việt Nam"] as const,
        image: "img",
        source: "manual" as const,
      },
    ];

    const result = computeMealMetrics(meals, 2000);
    expect(result.totalCalories).toBe(450);
    expect(result.remainingCalories).toBe(1550);
  });
});
