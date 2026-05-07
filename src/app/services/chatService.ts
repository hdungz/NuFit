import type { ApiResponse, ChatMessage, MealEntry } from "../lib/models";
import { readAppData, updateAppData } from "../lib/storage";
import { computeMealMetrics } from "./mealService";
import { computeWorkoutMetrics } from "./workoutService";
import { getAuthSession, getPersonaKey } from "./authService";
import { getLocalDateKey } from "../lib/utils";

const TROLLLLM_API_KEY = import.meta.env.VITE_TROLLLLM_API_KEY || "";
const TROLLLLM_API_URL = "https://chat.trollllm.xyz/v1/chat/completions";
const CHAT_MODEL = "gpt-5.4";

function buildSystemPrompt(): string {
  const data = readAppData();
  const mealMetrics = computeMealMetrics(data.mealEntries);
  const workoutMetrics = computeWorkoutMetrics(data.workoutPlan);
  const persona = getPersonaKey(getAuthSession()?.email);
  const today = getLocalDateKey();

  // Lấy 10 bữa ăn gần nhất
  const recentMeals = data.mealEntries
    .slice(0, 10)
    .map((m: MealEntry) => `- ${m.date} ${m.time}: ${m.name} (${m.calories}kcal, P${m.proteinGram}g C${m.carbsGram}g F${m.fatGram}g) [${m.tags.join(", ")}]`)
    .join("\n");

  // Danh sách bài tập
  const exercises = data.workoutPlan.exercises
    .map(e => `- ${e.name}: ${e.reps} / ${e.duration} [${e.status}]`)
    .join("\n");

  // Lịch sử tập gần đây
  const recentSessions = data.workoutPlan.sessions
    .slice(-7)
    .map(s => `- ${s.date}: ${s.completed ? "✓" : "✗"} ${s.durationMinutes} phút`)
    .join("\n");

  return `Bạn là NuFit AI Coach — huấn luyện viên cá nhân AI chuyên về dinh dưỡng và tập luyện.

## Vai trò
- Bạn là PT (Personal Trainer) AI thông minh, thân thiện, nói tiếng Việt
- Tư vấn dinh dưỡng, gợi ý món ăn phù hợp khẩu vị và mục tiêu
- Hướng dẫn bài tập, chỉnh form, lên lịch tập
- Phân tích dữ liệu ăn uống + tập luyện để đưa ra lời khuyên cá nhân hóa

## Persona người dùng: ${persona || "office"}
${persona === "beginner" ? "→ Người mới tập, cần hướng dẫn cơ bản, động viên nhiều" : persona === "family" ? "→ Gia đình, ưu tiên dinh dưỡng cân bằng cho cả nhà" : "→ Dân văn phòng, bận rộn, cần plan hiệu quả"}

## Dữ liệu hôm nay (${today})
- Calories: ${mealMetrics.totalCalories}/${2000} kcal (còn ${mealMetrics.remainingCalories} kcal)
- Protein: ${mealMetrics.totalProtein}g | Carbs: ${mealMetrics.totalCarbs}g | Fat: ${mealMetrics.totalFat}g
- Bài tập hoàn thành: ${workoutMetrics.completedExercises}/${workoutMetrics.totalExercises}
- Tổng buổi tập đã xong: ${workoutMetrics.completedSessions}

## Bữa ăn gần đây
${recentMeals || "(Chưa có dữ liệu)"}

## Kế hoạch tập
${exercises || "(Chưa có)"}

## Lịch sử buổi tập
${recentSessions || "(Chưa có)"}

## Quy tắc trả lời
- LUÔN trả lời bằng tiếng Việt, thân thiện, ngắn gọn
- Khi gợi ý món ăn: dựa trên những gì đã ăn gần đây để tránh lặp, cân đối macro
- Khi gợi ý bài tập: dựa trên plan hiện tại và tiến độ
- Đưa ra lời khuyên cụ thể, có số liệu nếu có thể
- Nếu người dùng hỏi chung chung, chủ động gợi ý dựa trên dữ liệu
- Giữ câu trả lời dưới 200 từ, chia đoạn rõ ràng`;
}

function buildConversationHistory(messages: ChatMessage[]): Array<{ role: string; content: string }> {
  // Lấy 10 tin gần nhất để giữ context nhưng không quá dài
  return messages.slice(-10).map(m => ({
    role: m.role === "bot" ? "assistant" : "user",
    content: m.content,
  }));
}

export async function getChatMessages(): Promise<ApiResponse<ChatMessage[]>> {
  return {
    data: readAppData().chatMessages,
    error: null,
    meta: { requestId: crypto.randomUUID(), status: 200, simulated: true, retryable: false, latencyMs: 0 },
  };
}

export async function sendChatMessage(content: string): Promise<ApiResponse<ChatMessage[]>> {
  if (!content.trim()) return { data: null, error: "Tin nhắn không được để trống." };

  // Save user message immediately
  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  updateAppData((current) => ({
    ...current,
    chatMessages: [...current.chatMessages, userMessage],
  }));

  // Call GPT API
  try {
    if (!TROLLLLM_API_KEY || TROLLLLM_API_KEY === "your_trollllm_api_key_here") {
      throw new Error("API key chưa cấu hình");
    }

    const currentMessages = readAppData().chatMessages;
    const history = buildConversationHistory(currentMessages);

    const response = await fetch(TROLLLLM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TROLLLLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        max_tokens: 600,
        temperature: 0.7,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          ...history,
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: "Unknown" } }));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    const botContent = result.choices?.[0]?.message?.content || "Xin lỗi, mình không thể trả lời lúc này.";

    const botMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "bot",
      content: botContent,
      createdAt: new Date().toISOString(),
    };

    const next = updateAppData((current) => ({
      ...current,
      chatMessages: [...current.chatMessages, botMessage],
    }));

    return {
      data: next.chatMessages,
      error: null,
      meta: { requestId: crypto.randomUUID(), status: 200, simulated: true, retryable: false, latencyMs: 0 },
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Lỗi không xác định";

    // Fallback: save error as bot message
    const botMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "bot",
      content: `⚠️ Không thể kết nối AI: ${errMsg}. Hãy thử lại sau.`,
      createdAt: new Date().toISOString(),
    };

    const next = updateAppData((current) => ({
      ...current,
      chatMessages: [...current.chatMessages, botMessage],
    }));

    return {
      data: next.chatMessages,
      error: null,
      meta: { requestId: crypto.randomUUID(), status: 500, simulated: true, retryable: true, latencyMs: 0 },
    };
  }
}
