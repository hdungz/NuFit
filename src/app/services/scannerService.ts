import type { ApiResponse, ScanResult } from "../lib/models";
import { updateAppData } from "../lib/storage";
import { getLocalDateKey } from "../lib/utils";
import { addMeal } from "./mealService";
import { withMockApi } from "./mockApi";

/** Extended Vietnamese food database for realistic random scanning */
const foodDatabase = [
  { name: "Phở bò Hà Nội", calories: 450, protein: 24, carbs: 55, fat: 12, ingredients: ["Bánh phở", "Thịt bò", "Nước dùng", "Hành lá", "Giá đỗ"] },
  { name: "Bún chả Hà Nội", calories: 520, protein: 28, carbs: 58, fat: 16, ingredients: ["Bún", "Thịt nướng", "Nước mắm", "Rau sống", "Đu đủ"] },
  { name: "Cơm gà xối mỡ", calories: 620, protein: 32, carbs: 68, fat: 18, ingredients: ["Cơm", "Đùi gà", "Nước tương", "Hành phi"] },
  { name: "Bánh mì thịt", calories: 380, protein: 14, carbs: 42, fat: 16, ingredients: ["Bánh mì", "Pate", "Chả", "Rau mùi", "Ớt"] },
  { name: "Gỏi cuốn tôm thịt", calories: 180, protein: 12, carbs: 22, fat: 4, ingredients: ["Bánh tráng", "Tôm", "Thịt", "Bún", "Rau sống"] },
  { name: "Bún bò Huế", calories: 490, protein: 26, carbs: 52, fat: 18, ingredients: ["Bún", "Thịt bò", "Giò heo", "Sả", "Mắm ruốc"] },
  { name: "Cơm tấm sườn", calories: 580, protein: 30, carbs: 62, fat: 20, ingredients: ["Cơm tấm", "Sườn nướng", "Bì", "Trứng ốp la"] },
  { name: "Mì Quảng", calories: 420, protein: 22, carbs: 48, fat: 14, ingredients: ["Mì Quảng", "Tôm", "Thịt heo", "Đậu phộng", "Rau sống"] },
  { name: "Bánh xèo", calories: 350, protein: 16, carbs: 38, fat: 14, ingredients: ["Bột gạo", "Tôm", "Thịt", "Giá đỗ", "Nghệ"] },
  { name: "Chả giò", calories: 280, protein: 14, carbs: 24, fat: 14, ingredients: ["Bánh tráng", "Thịt heo", "Miến", "Mộc nhĩ", "Cà rốt"] },
  { name: "Canh chua cá", calories: 220, protein: 18, carbs: 16, fat: 8, ingredients: ["Cá", "Me", "Cà chua", "Đậu bắp", "Giá"] },
  { name: "Cá kho tộ", calories: 320, protein: 24, carbs: 12, fat: 20, ingredients: ["Cá", "Nước mắm", "Tiêu", "Hành", "Đường thắng"] },
  { name: "Salad rau củ", calories: 210, protein: 8, carbs: 20, fat: 12, ingredients: ["Rau xanh", "Cà chua", "Dưa chuột", "Sốt dầu giấm"] },
  { name: "Bò lúc lắc", calories: 480, protein: 34, carbs: 18, fat: 28, ingredients: ["Thịt bò", "Tỏi", "Tiêu", "Bơ", "Rau xà lách"] },
  { name: "Hủ tiếu Nam Vang", calories: 400, protein: 22, carbs: 48, fat: 12, ingredients: ["Hủ tiếu", "Tôm", "Thịt heo", "Gan", "Giá"] },
  { name: "Cháo gà", calories: 280, protein: 18, carbs: 36, fat: 6, ingredients: ["Gạo", "Gà", "Gừng", "Hành phi", "Rau mùi"] },
  { name: "Bánh cuốn", calories: 260, protein: 14, carbs: 32, fat: 8, ingredients: ["Bột gạo", "Thịt heo", "Mộc nhĩ", "Hành phi"] },
  { name: "Xôi gà", calories: 450, protein: 20, carbs: 55, fat: 16, ingredients: ["Nếp", "Gà xé", "Hành phi", "Mỡ hành"] },
];

function getRandomFood() {
  return foodDatabase[Math.floor(Math.random() * foodDatabase.length)];
}

/**
 * Scan a food image - uses random selection from Vietnamese food database.
 * The capturedImageUrl parameter allows passing a data URL from a captured photo.
 */
export async function scanFoodFromCamera(capturedImageUrl?: string): Promise<ApiResponse<ScanResult>> {
  return withMockApi(
    () => {
      const food = getRandomFood();
      const scan: ScanResult = {
        id: crypto.randomUUID(),
        foodName: food.name,
        totalCalories: food.calories,
        confidence: 82 + Math.floor(Math.random() * 16), // 82-97%
        proteinGram: food.protein,
        carbsGram: food.carbs,
        fatGram: food.fat,
        ingredients: food.ingredients,
        image: capturedImageUrl ?? "",
        createdAt: new Date().toISOString(),
      };
      updateAppData((current) => ({ ...current, scanHistory: [scan, ...current.scanHistory] }));
      return scan;
    },
    { errorMessage: "Không nhận diện được món ăn từ ảnh này." },
  );
}

/** Legacy function kept for compatibility */
export async function scanFoodFile(file: File): Promise<ApiResponse<ScanResult>> {
  return scanFoodFromCamera();
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
    return { data: null, error: saveResult.error, meta: saveResult.meta };
  }
  return { data: null, error: null, meta: saveResult.meta };
}
