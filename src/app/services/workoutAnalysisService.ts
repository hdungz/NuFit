import type { ApiResponse } from "../lib/models";

// TrollLLM API Configuration
const TROLLLLM_API_KEY = import.meta.env.VITE_TROLLLLM_API_KEY || "";
const TROLLLLM_API_URL = "https://chat.trollllm.xyz/v1/chat/completions";

// gpt-5.4 for workout analysis
const FAST_MODEL = "gpt-5.4";
const ACCURATE_MODEL = "gpt-5.4";

export interface FormAnalysisResult {
  type: "success" | "warning" | "error";
  message: string;
  details?: string;
  exerciseDetected?: string;
  repCount?: number;
  suggestions: string[];
}

// Prompt yêu cầu trả lời hoàn toàn bằng tiếng Việt
const FAST_PROMPT = `Phân tích tư thế tập gym trong ảnh. Đường xanh lá là khung xương đã detect.
Trả về CHỈ JSON: {"type":"success"|"warning"|"error","message":"1 câu nhận xét tiếng Việt","exerciseDetected":"tên bài tập","suggestions":["gợi ý tiếng Việt"]}
Quy tắc: success=form đẹp, warning=cần chỉnh, error=không thấy người. Nhận xét cụ thể về góc độ, tư thế. PHẢI viết tiếng Việt.`;

// Downscale image for faster upload & processing
function shrinkImage(dataUrl: string, maxWidth = 320): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      ctx?.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", 0.5));
    };
    img.onerror = () => resolve(dataUrl); // fallback
    img.src = dataUrl;
  });
}

export async function analyzeForm(
  imageDataUrl: string,
  currentExercise?: string,
  usePremium: boolean = false
): Promise<ApiResponse<FormAnalysisResult>> {
  if (!TROLLLLM_API_KEY || TROLLLLM_API_KEY === "your_trollllm_api_key_here") {
    return {
      data: null,
      error: "Vui lòng cấu hình VITE_TROLLLLM_API_KEY để sử dụng AI coaching.",
      meta: {
        requestId: crypto.randomUUID(),
        status: 401,
        simulated: true,
        retryable: false,
        latencyMs: 0,
      },
    };
  }

  try {
    const startTime = Date.now();
    const model = usePremium ? ACCURATE_MODEL : FAST_MODEL;

    // Shrink image to ~320px wide for fast upload
    const smallImage = await shrinkImage(imageDataUrl, 320);

    // Build minimal prompt
    let prompt = FAST_PROMPT;
    if (currentExercise) {
      prompt += ` Exercise: ${currentExercise}.`;
    }

    const response = await fetch(TROLLLLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TROLLLLM_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 200,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: smallImage, detail: "low" },
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
    const parsedData = parseAnalysisResponse(responseText);

    if (!parsedData) {
      return {
        data: null,
        error: "Không thể phân tích phản hồi từ AI.",
        meta: {
          requestId: crypto.randomUUID(),
          status: 422,
          simulated: true,
          retryable: true,
          latencyMs: Date.now() - startTime,
        },
      };
    }

    return {
      data: parsedData,
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
    return {
      data: null,
      error: `Lỗi phân tích tư thế: ${errorMessage}`,
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

/**
 * Quick rep counting without detailed form analysis
 * Faster and cheaper for just counting reps
 */
export async function countReps(
  imageDataUrl: string,
  exerciseName: string
): Promise<ApiResponse<{ repCount: number; confidence: number }>> {
  const prompt = `Đếm số rep của bài tập "${exerciseName}" trong hình ảnh này.

Trả về JSON:
{
  "repCount": số nguyên (số rep đã thực hiện, ước tính nếu không chắc chắn),
  "confidence": số 0-100 (độ tin cậy vào số đếm)
}

Chỉ trả về JSON.`;

  if (!TROLLLLM_API_KEY) {
    return {
      data: null,
      error: "API key not configured",
      meta: {
        requestId: crypto.randomUUID(),
        status: 401,
        simulated: true,
        retryable: false,
        latencyMs: 0,
      },
    };
  }

  try {
    const startTime = Date.now();

    const response = await fetch(TROLLLLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TROLLLLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || "";

    // Extract JSON
    let jsonText = text.trim();
    if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7);
    if (jsonText.startsWith("```")) jsonText = jsonText.slice(3);
    if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3);
    jsonText = jsonText.trim();

    const parsed = JSON.parse(jsonText);

    return {
      data: {
        repCount: Math.round(parsed.repCount || 0),
        confidence: Math.min(Math.max(Math.round(parsed.confidence || 50), 0), 100),
      },
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
    return {
      data: null,
      error: "Không thể đếm rep",
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

function parseAnalysisResponse(text: string): FormAnalysisResult | null {
  try {
    let jsonText = text.trim();

    // Remove markdown code block
    if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7);
    else if (jsonText.startsWith("```")) jsonText = jsonText.slice(3);
    if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3);

    jsonText = jsonText.trim();

    const parsed = JSON.parse(jsonText);

    // Validate and provide defaults
    return {
      type: ["success", "warning", "error"].includes(parsed.type) ? parsed.type : "warning",
      message: parsed.message || "Không có nhận xét",
      details: parsed.details,
      exerciseDetected: parsed.exerciseDetected,
      repCount: typeof parsed.repCount === "number" ? parsed.repCount : undefined,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch {
    return null;
  }
}
