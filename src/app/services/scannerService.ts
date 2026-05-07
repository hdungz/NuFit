import type { ApiResponse, ScanResult, DetectedFoodItem } from "../lib/models";
import { updateAppData } from "../lib/storage";
import { getLocalDateKey } from "../lib/utils";
import { addMeal } from "./mealService";

// TrollLLM API Configuration
const TROLLLLM_API_KEY = import.meta.env.VITE_TROLLLLM_API_KEY || "";
const TROLLLLM_API_URL = "https://chat.trollllm.xyz/v1/chat/completions";
const TROLLLLM_MODEL = "gpt-5.4";

// Food recognition prompt template - supports multiple food items
const FOOD_RECOGNITION_PROMPT = `Phân tích hình ảnh và nhận diện TẤT CẢ các món ăn/xuất hiện trong đó.

Yêu cầu:
1. Liệt kê TẤT CẢ các món ăn nhìn thấy trong ảnh (có thể có nhiều món)
2. Với mỗi món, ước tính số lượng/khẩu phần (vd: "1 bát", "2 miếng", "1 đĩa nhỏ")
3. Ưu tiên món Việt Nam, nhưng có thể nhận diện món quốc tế
4. Tính tổng dinh dưỡng của toàn bộ bữa ăn

Trả về JSON với định dạng:

{
  "items": [
    {
      "name": "Tên món ăn",
      "quantity": "Số lượng/khẩu phần (vd: 1 bát, 2 miếng)",
      "estimatedWeightGrams": số nguyên,
      "calories": số nguyên,
      "proteinGram": số nguyên,
      "carbsGram": số nguyên,
      "fatGram": số nguyên,
      "ingredients": ["Nguyên liệu chính 1", "Nguyên liệu chính 2"]
    }
  ],
  "summary": {
    "totalCalories": số nguyên (tổng từ tất cả món),
    "totalProteinGram": số nguyên,
    "totalCarbsGram": số nguyên,
    "totalFatGram": số nguyên,
    "foodCount": số nguyên (số món ăn),
    "confidence": số 0-100 (độ tin cậy tổng thể)
  }
}

Lưu ý:
- Chỉ trả về JSON, không giải thích
- Ước tính thực tế, không cần quá chính xác
- Nếu không nhận diện được gì, trả về items rỗng và confidence 0`;

interface LLMFoodItem {
  name: string;
  quantity: string;
  estimatedWeightGrams: number;
  calories: number;
  proteinGram: number;
  carbsGram: number;
  fatGram: number;
  ingredients: string[];
}

interface LLMMultiFoodResponse {
  items: LLMFoodItem[];
  summary: {
    totalCalories: number;
    totalProteinGram: number;
    totalCarbsGram: number;
    totalFatGram: number;
    foodCount: number;
    confidence: number;
  };
}

function parseLLMResponse(text: string): LLMMultiFoodResponse | null {
  try {
    // Extract JSON from the response (handle markdown code blocks)
    let jsonText = text.trim();
    
    // Remove markdown code block markers if present
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    
    jsonText = jsonText.trim();
    
    const parsed = JSON.parse(jsonText) as LLMMultiFoodResponse;
    
    // Validate required fields
    if (!Array.isArray(parsed.items) || typeof parsed.summary?.totalCalories !== "number") {
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Scan a food image using TrollLLM API (OpenAI-compatible)
 * Model: gpt-5.4
 * The capturedImageUrl parameter allows passing a data URL from a captured photo.
 */
export async function scanFoodFromCamera(capturedImageUrl?: string): Promise<ApiResponse<ScanResult>> {
  // Check if API key is configured
  if (!TROLLLLM_API_KEY || TROLLLLM_API_KEY === "your_trollllm_api_key_here") {
    return {
      data: null,
      error: "Vui lòng cấu hình VITE_TROLLLLM_API_KEY trong file .env để sử dụng tính năng nhận diện.",
      meta: {
        requestId: crypto.randomUUID(),
        status: 401,
        simulated: true,
        retryable: false,
        latencyMs: 0,
      },
    };
  }

  // Check if image is provided
  if (!capturedImageUrl) {
    return {
      data: null,
      error: "Không có ảnh để phân tích.",
      meta: {
        requestId: crypto.randomUUID(),
        status: 400,
        simulated: true,
        retryable: false,
        latencyMs: 0,
      },
    };
  }

  try {
    const startTime = Date.now();
    
    // Extract base64 data from data URL
    const base64Data = capturedImageUrl.split(",")[1];
    if (!base64Data) {
      throw new Error("Invalid image data");
    }

    // Call TrollLLM API with gpt-5.4 model
    const response = await fetch(TROLLLLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TROLLLLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: TROLLLLM_MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: FOOD_RECOGNITION_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: capturedImageUrl,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    const responseText = result.choices?.[0]?.message?.content || "";
    const parsedData = parseLLMResponse(responseText);

    if (!parsedData) {
      return {
        data: null,
        error: "Không thể phân tích phản hồi từ AI. Vui lòng thử lại.",
        meta: {
          requestId: crypto.randomUUID(),
          status: 422,
          simulated: true,
          retryable: true,
          latencyMs: Date.now() - startTime,
        },
      };
    }

    // Map items to DetectedFoodItem format
    const detectedItems: DetectedFoodItem[] = parsedData.items.map(item => ({
      name: item.name,
      quantity: item.quantity || "1 phần",
      estimatedWeightGrams: Math.round(item.estimatedWeightGrams || 0),
      calories: Math.round(item.calories || 0),
      proteinGram: Math.round(item.proteinGram || 0),
      carbsGram: Math.round(item.carbsGram || 0),
      fatGram: Math.round(item.fatGram || 0),
      ingredients: item.ingredients || [],
    }));

    // Build food name summary (e.g., "Phở bò + Trà đá + ...")
    const foodNameSummary = detectedItems.length > 0
      ? detectedItems.slice(0, 3).map(i => i.name).join(" + ") + (detectedItems.length > 3 ? ` + ${detectedItems.length - 3} món khác` : "")
      : "Không nhận diện được";

    // Aggregate all ingredients
    const allIngredients = detectedItems.flatMap(item => item.ingredients);
    const uniqueIngredients = [...new Set(allIngredients)];

    // Create scan result with multiple items
    const scan: ScanResult = {
      id: crypto.randomUUID(),
      foodName: foodNameSummary,
      totalCalories: Math.round(parsedData.summary.totalCalories),
      confidence: Math.min(Math.max(Math.round(parsedData.summary.confidence), 0), 100),
      proteinGram: Math.round(parsedData.summary.totalProteinGram || 0),
      carbsGram: Math.round(parsedData.summary.totalCarbsGram || 0),
      fatGram: Math.round(parsedData.summary.totalFatGram || 0),
      ingredients: uniqueIngredients,
      image: capturedImageUrl,
      createdAt: new Date().toISOString(),
      items: detectedItems,
      foodCount: parsedData.summary.foodCount || detectedItems.length,
    };

    // Save to scan history
    updateAppData((current) => ({ ...current, scanHistory: [scan, ...current.scanHistory] }));

    return {
      data: scan,
      error: null,
      meta: {
        requestId: crypto.randomUUID(),
        status: 200,
        simulated: true,
        retryable: false,
        latencyMs: Date.now() - startTime,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
    
    // Check for rate limit error
    if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
      return {
        data: null,
        error: "API đã đạt giới hạn requests (429). Vui lòng đợi và thử lại sau.",
        meta: {
          requestId: crypto.randomUUID(),
          status: 429,
          simulated: true,
          retryable: true,
          latencyMs: 0,
        },
      };
    }
    
    return {
      data: null,
      error: `Lỗi khi gọi TrollLLM API: ${errorMessage}. Vui lòng kiểm tra API key và thử lại.`,
      meta: {
        requestId: crypto.randomUUID(),
        status: 500,
        simulated: true,
        retryable: true,
        latencyMs: 0,
      },
    };
  }
}

/** Legacy function kept for compatibility - now uses TrollLLM API */
export async function scanFoodFile(file: File): Promise<ApiResponse<ScanResult>> {
  // Convert file to base64 data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      void scanFoodFromCamera(dataUrl).then(resolve);
    };
    reader.onerror = () => {
      resolve({
        data: null,
        error: "Không thể đọc file ảnh.",
        meta: {
          requestId: crypto.randomUUID(),
          status: 400,
          simulated: true,
          retryable: false,
          latencyMs: 0,
        },
      });
    };
    reader.readAsDataURL(file);
  });
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
