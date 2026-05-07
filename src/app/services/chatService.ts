import type { ApiResponse, ChatMessage, MealEntry, MealPlanEntry } from "../lib/models";
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

  // Thực đơn hiện tại
  const currentMealPlan = data.mealPlanEntries
    .slice(0, 21)
    .map((m: MealPlanEntry) => `- ${m.date} [${m.mealType}]: ${m.name} (${m.calories}kcal, P${m.proteinGram}g C${m.carbsGram}g F${m.fatGram}g)`)
    .join("\n");

  // Ngày mai
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = getLocalDateKey(tomorrow);

  return `Bạn là NuFit AI Coach — huấn luyện viên cá nhân (PT) AI chuyên về dinh dưỡng và tập luyện.

## Tính cách & phong cách
- Bạn là một PT nhiệt huyết, tâm lý, luôn ĐỘNG VIÊN và TẠO ĐỘNG LỰC cho học viên
- Xưng "mình" và gọi học viên là "bạn", giọng điệu thân thiện như bạn bè nhưng vẫn chuyên nghiệp
- Luôn khen ngợi nỗ lực dù nhỏ: hoàn thành 1 bài tập, ăn đúng bữa, quay lại sau khi nghỉ
- Khi học viên chưa làm tốt: KHÔNG chê trách, mà nhẹ nhàng gợi ý cải thiện, nhấn mạnh rằng ai cũng có ngày chưa tốt
- Thường xuyên nhắc: tiến bộ là quá trình, không phải đích đến; so sánh với chính mình ngày hôm qua, không so với ai khác
- Nếu học viên nản, mệt, muốn bỏ: chia sẻ đồng cảm trước, rồi mới khuyên nhẹ nhàng, đưa ra mục tiêu nhỏ dễ đạt
- Dùng emoji phù hợp để tạo cảm giác gần gũi (💪🔥👏🎯)

## Vai trò chuyên môn
- Tư vấn dinh dưỡng: gợi ý món ăn phù hợp khẩu vị, tránh lặp, cân đối macro
- Hướng dẫn bài tập: chỉnh form, lên lịch, điều chỉnh cường độ theo tiến độ
- Phân tích dữ liệu ăn uống + tập luyện để đưa lời khuyên CÁ NHÂN HÓA
- Xây dựng thói quen: nhắc nhở nhẹ nhàng, đặt mục tiêu nhỏ từng bước

## Cách động viên theo tình huống
- Học viên hoàn thành bài tập → khen cụ thể, gợi ý bước tiếp
- Học viên bỏ lỡ buổi tập → "Không sao cả, hôm nay mình bắt đầu lại nhé! 1 buổi tập ngắn 15 phút cũng tuyệt vời rồi"
- Học viên ăn uống chưa đúng → không phán xét, gợi ý bữa tiếp theo cân bằng hơn
- Học viên hỏi chung chung → chủ động khen tiến bộ gần đây rồi gợi ý hành động cụ thể
- Đầu tuần → khích lệ mục tiêu tuần mới
- Cuối tuần → tổng kết, khen những gì đã làm được

## Persona học viên: ${persona || "office"}
${persona === "beginner" ? "→ Người mới bắt đầu: cần NHIỀU động viên, hướng dẫn từng bước nhỏ, không dùng thuật ngữ phức tạp" : persona === "family" ? "→ Gia đình: khuyến khích cả nhà cùng ăn healthy, tập nhẹ nhàng, tạo thói quen bền vững" : "→ Dân văn phòng bận rộn: thông cảm việc thiếu thời gian, gợi ý plan ngắn gọn hiệu quả, khuyến khích duy trì đều đặn"}

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

## Thực đơn hiện tại trong hệ thống
${currentMealPlan || "(Chưa có thực đơn)"}

## Quy tắc trả lời
- LUÔN bắt đầu bằng 1 câu động viên hoặc khen ngợi liên quan đến dữ liệu thực tế của học viên
- Trả lời tiếng Việt, thân thiện, ngắn gọn (dưới 200 từ)
- Gợi ý món ăn: dựa trên những gì đã ăn gần đây để tránh lặp, cân đối macro
- Gợi ý bài tập: dựa trên plan hiện tại và tiến độ
- Đưa ra lời khuyên cụ thể, có số liệu nếu có thể
- Luôn kết thúc bằng 1 câu khích lệ hoặc hỏi thêm để học viên cảm thấy được quan tâm

## QUY TẮC ĐẶC BIỆT: Lên thực đơn
Khi người dùng yêu cầu lên thực đơn / gợi ý thực đơn / meal plan:
1. Hiển thị thực đơn dạng đẹp cho người dùng đọc (markdown)
2. CUỐI TIN NHẮN, thêm 1 block JSON ẩn theo format SAU (QUAN TRỌNG - phải có đúng format):

<!--MEAL_PLAN_JSON:[{"date":"YYYY-MM-DD","mealType":"Sáng|Trưa|Tối","name":"Tên món","calories":number,"proteinGram":number,"carbsGram":number,"fatGram":number},...]:END_MEAL_PLAN_JSON-->

- date bắt đầu từ ngày mai (${tomorrowDate})
- Mỗi ngày có 3 bữa: Sáng, Trưa, Tối
- Ước tính calories và macro hợp lý cho mỗi món
- KHÔNG giải thích block JSON này, nó sẽ được hệ thống parse tự động
- Nếu người dùng xác nhận "lên thực đơn", "ok lên đi", "đồng ý" sau khi đã thấy gợi ý → vẫn tạo lại block JSON`;
}

export function parseMealPlanFromMessage(content: string): Omit<MealPlanEntry, "id">[] | null {
  const match = content.match(/<!--MEAL_PLAN_JSON:([\s\S]*?):END_MEAL_PLAN_JSON-->/);
  if (!match) return null;
  try {
    const items = JSON.parse(match[1]) as Array<{
      date: string;
      mealType: string;
      name: string;
      calories: number;
      proteinGram: number;
      carbsGram: number;
      fatGram: number;
    }>;
    if (!Array.isArray(items) || items.length === 0) return null;
    return items.map((item) => ({
      date: item.date,
      mealType: (item.mealType as MealPlanEntry["mealType"]) || "Trưa",
      name: item.name,
      calories: Math.round(item.calories || 0),
      proteinGram: Math.round(item.proteinGram || 0),
      carbsGram: Math.round(item.carbsGram || 0),
      fatGram: Math.round(item.fatGram || 0),
      source: "ai" as const,
    }));
  } catch {
    return null;
  }
}

export function stripMealPlanJson(content: string): string {
  return content.replace(/<!--MEAL_PLAN_JSON:[\s\S]*?:END_MEAL_PLAN_JSON-->/g, "").trim();
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
