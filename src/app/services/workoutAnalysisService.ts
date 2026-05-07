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

/**
 * Batch rep analysis: gửi tất cả frame trong 1 rep cho GPT đánh giá
 */
export interface RepAnalysisResult {
  type: "success" | "warning" | "error";
  repNumber: number;
  message: string;
  frameNotes: string[];
  suggestions: string[];
  overallScore: number; // 0-100
}

const REP_ANALYSIS_PROMPT = `Bạn nhận được nhiều ảnh chụp liên tiếp trong 1 rep của bài tập gym.
Mỗi ảnh có khung xương (đường xanh lá) overlay lên người tập.
Các ảnh theo thứ tự thời gian từ đầu đến cuối rep.

Phân tích toàn bộ rep này và trả về CHỈ JSON:
{
  "type": "success" | "warning" | "error",
  "message": "Đánh giá tổng thể 1 câu tiếng Việt",
  "frameNotes": ["Nhận xét frame 1", "Nhận xét frame 2", ...],
  "suggestions": ["Gợi ý chỉnh form 1", "Gợi ý 2"],
  "overallScore": số 0-100
}

Quy tắc:
- success (80-100): Form tốt, không cần chỉnh nhiều
- warning (40-79): Cần chỉnh sửa
- error (0-39): Form sai nghiêm trọng hoặc không thấy người
- frameNotes phải có đúng số phần tử = số ảnh
- PHẢI viết tiếng Việt`;

export async function analyzeRepBatch(
  frames: string[],
  exerciseName: string,
  repNumber: number,
): Promise<ApiResponse<RepAnalysisResult>> {
  if (!TROLLLLM_API_KEY || TROLLLLM_API_KEY === "your_trollllm_api_key_here") {
    return {
      data: null,
      error: "API key chưa cấu hình",
      meta: { requestId: crypto.randomUUID(), status: 401, simulated: true, retryable: false, latencyMs: 0 },
    };
  }

  try {
    const startTime = Date.now();

    // Shrink all frames
    const smallFrames = await Promise.all(frames.map((f) => shrinkImage(f, 320)));

    // Build content: prompt + all images
    const content: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = [
      { type: "text", text: `${REP_ANALYSIS_PROMPT}\n\nBài tập: ${exerciseName}. Rep số: ${repNumber}. Số ảnh: ${frames.length}.` },
    ];

    for (let i = 0; i < smallFrames.length; i++) {
      content.push({
        type: "image_url",
        image_url: { url: smallFrames[i], detail: "low" },
      });
    }

    const response = await fetch(TROLLLLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TROLLLLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: FAST_MODEL,
        max_tokens: 500,
        temperature: 0.3,
        messages: [{ role: "user", content }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: "Unknown" } }));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || "";
    const parsed = parseRepResponse(text, repNumber);

    if (!parsed) {
      return {
        data: null,
        error: "Không parse được response",
        meta: { requestId: crypto.randomUUID(), status: 422, simulated: true, retryable: true, latencyMs: Date.now() - startTime },
      };
    }

    return {
      data: parsed,
      error: null,
      meta: { requestId: crypto.randomUUID(), status: 200, simulated: true, retryable: false, latencyMs: Date.now() - startTime },
    };
  } catch (error) {
    return {
      data: null,
      error: `Lỗi phân tích rep: ${error instanceof Error ? error.message : "Unknown"}`,
      meta: { requestId: crypto.randomUUID(), status: 500, simulated: true, retryable: true, latencyMs: 0 },
    };
  }
}

function parseRepResponse(text: string, repNumber: number): RepAnalysisResult | null {
  try {
    let json = text.trim();
    if (json.startsWith("```json")) json = json.slice(7);
    else if (json.startsWith("```")) json = json.slice(3);
    if (json.endsWith("```")) json = json.slice(0, -3);
    json = json.trim();
    const p = JSON.parse(json);
    return {
      type: ["success", "warning", "error"].includes(p.type) ? p.type : "warning",
      repNumber,
      message: p.message || "Không có nhận xét",
      frameNotes: Array.isArray(p.frameNotes) ? p.frameNotes : [],
      suggestions: Array.isArray(p.suggestions) ? p.suggestions : [],
      overallScore: typeof p.overallScore === "number" ? Math.min(100, Math.max(0, p.overallScore)) : 50,
    };
  } catch {
    return null;
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
