import type { ApiResponse, ScanResult } from "../lib/models";
import { updateAppData } from "../lib/storage";
import { getLocalDateKey } from "../lib/utils";
import { mealImageMap } from "../lib/mockData";
import { addMeal } from "./mealService";
import { withMockApi } from "./mockApi";

function parseFoodName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("pho")) return "Phở bò";
  if (lower.includes("banhmi")) return "Bánh mì pate";
  if (lower.includes("com") || lower.includes("ga")) return "Cơm gà xối mỡ";
  if (lower.includes("salad")) return "Salad trộn";
  return "Món ăn Việt";
}

const mockMap: Record<string, { calories: number; protein: number; carbs: number; fat: number; ingredients: string[] }> = {
  "Phở bò": { calories: 450, protein: 24, carbs: 55, fat: 12, ingredients: ["Bánh phở", "Thịt bò", "Nước dùng"] },
  "Bánh mì pate": { calories: 380, protein: 14, carbs: 42, fat: 16, ingredients: ["Bánh mì", "Pate", "Rau"] },
  "Cơm gà xối mỡ": { calories: 620, protein: 32, carbs: 68, fat: 18, ingredients: ["Gà", "Cơm", "Nước tương"] },
  "Salad trộn": { calories: 320, protein: 12, carbs: 20, fat: 16, ingredients: ["Rau xanh", "Cà chua", "Sốt dầu giấm"] },
  "Món ăn Việt": { calories: 410, protein: 20, carbs: 46, fat: 14, ingredients: ["Rau", "Tinh bột", "Protein"] },
};

export async function scanFoodFile(file: File): Promise<ApiResponse<ScanResult>> {
  return withMockApi(
    () => {
      const foodName = parseFoodName(file.name);
      const mock = mockMap[foodName];
      const scan: ScanResult = {
        id: crypto.randomUUID(),
        foodName,
        totalCalories: mock.calories,
        confidence: 85 + Math.floor(Math.random() * 12),
        proteinGram: mock.protein,
        carbsGram: mock.carbs,
        fatGram: mock.fat,
        ingredients: mock.ingredients,
        image: mealImageMap[foodName] || mealImageMap["Món ăn Việt"],
        createdAt: new Date().toISOString(),
      };
      updateAppData((current) => ({ ...current, scanHistory: [scan, ...current.scanHistory] }));
      return scan;
    },
    { errorMessage: "Không nhận diện được món ăn từ ảnh này." },
  );
}

export async function saveScanToDiary(scan: ScanResult): Promise<ApiResponse<null>> {
  const now = new Date();
  const time = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const mealType = now.getHours() < 11 ? "Sáng" : now.getHours() < 17 ? "Trưa" : "Tối";
  const saveResult = await addMeal({
    date: getLocalDateKey(now),
    time,
    name: scan.foodName,
    calories: scan.totalCalories,
    proteinGram: scan.proteinGram,
    carbsGram: scan.carbsGram,
    fatGram: scan.fatGram,
    tags: [mealType, "Việt Nam"],
    image: scan.image,
    source: "scanner",
  });
  if (saveResult.error) {
    return {
      data: null,
      error: saveResult.error,
      meta: saveResult.meta,
    };
  }
  return {
    data: null,
    error: null,
    meta: saveResult.meta,
  };
}
