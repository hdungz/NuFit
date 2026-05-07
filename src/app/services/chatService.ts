import type { ApiResponse, ChatMessage } from "../lib/models";
import { readAppData, updateAppData } from "../lib/storage";
import { computeMealMetrics } from "./mealService";
import { computeWorkoutMetrics } from "./workoutService";
import { withMockApi } from "./mockApi";
import { getAuthSession, getPersonaKey } from "./authService";

function buildBotResponse(input: string): string {
  const text = input.toLowerCase();
  const currentData = readAppData();
  const mealMetrics = computeMealMetrics(currentData.mealEntries);
  const workoutMetrics = computeWorkoutMetrics(currentData.workoutPlan);
  const persona = getPersonaKey(getAuthSession()?.email);

  if (persona === "beginner") {
    if (text.includes("tập") || text.includes("workout")) {
      return `Tuyệt vời! Với người mới, bạn đang làm rất tốt: ${workoutMetrics.completedExercises}/${workoutMetrics.totalExercises} bài. Mình gợi ý tập chậm, đúng kỹ thuật trước rồi mới tăng cường độ.`;
    }
    if (text.includes("ăn") || text.includes("calo") || text.includes("meal")) {
      return `Sau buổi tập, bạn nên ưu tiên protein + carb chậm. Hôm nay bạn đang ở mức ${mealMetrics.totalCalories} kcal, mục tiêu là ăn đủ để phục hồi tốt.`;
    }
    return "Mình sẽ hướng dẫn theo từng bước đơn giản. Bạn muốn bắt đầu từ bài tập nào: squat, push-up hay plank?";
  }

  if (persona === "family") {
    if (text.includes("ăn") || text.includes("calo") || text.includes("meal")) {
      return `Cho bữa gia đình tối nay, bạn có thể chọn 1 món đạm nạc + 1 món rau + 1 món tinh bột vừa đủ. Hiện tổng hôm nay là ${mealMetrics.totalCalories} kcal, mình sẽ giữ menu cân bằng hơn.`;
    }
    if (text.includes("tập") || text.includes("workout")) {
      return `Với persona Family Nutrition, ưu tiên hiện tại vẫn là dinh dưỡng ổn định. Bạn có thể thêm 20 phút vận động nhẹ để cả nhà cùng duy trì thói quen.`;
    }
    return "Mình có thể lên thực đơn 3 bữa cho cả gia đình theo ngân sách và thời gian nấu. Bạn muốn mẫu nhanh trong 15 phút hay thực đơn đầy đủ?";
  }

  if (text.includes("tập") || text.includes("workout")) {
    return `Bạn đã hoàn thành ${workoutMetrics.completedExercises}/${workoutMetrics.totalExercises} bài tuần này. Mình đề xuất thêm 1 buổi cardio 20 phút để đạt mốc cao hơn.`;
  }
  if (text.includes("ăn") || text.includes("calo") || text.includes("meal")) {
    return `Hiện bạn đã nạp khoảng ${mealMetrics.totalCalories} kcal hôm nay. Mình gợi ý bữa tiếp theo ưu tiên protein nạc + rau xanh để cân bằng macro.`;
  }
  if (text.includes("bận") || text.includes("ít thời gian")) {
    return "Nếu bận, bạn có thể tập 20 phút theo kiểu circuit: squat, push-up, plank, jumping jack.";
  }
  return "Mình đã ghi nhận nhu cầu của bạn. Bạn muốn ưu tiên giảm mỡ, tăng cơ hay cải thiện sức bền trước?";
}

export async function getChatMessages(): Promise<ApiResponse<ChatMessage[]>> {
  return withMockApi(() => readAppData().chatMessages, { errorMessage: "Không tải được hội thoại. Hãy thử lại." });
}

export async function sendChatMessage(content: string): Promise<ApiResponse<ChatMessage[]>> {
  if (!content.trim()) return { data: null, error: "Tin nhắn không được để trống." };

  return withMockApi(
    () => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        content: buildBotResponse(content),
        createdAt: new Date(Date.now() + 1200).toISOString(),
      };
      const next = updateAppData((current) => ({
        ...current,
        chatMessages: [...current.chatMessages, userMessage, botMessage],
      }));
      return next.chatMessages;
    },
    { errorMessage: "Không gửi được tin nhắn. Hãy thử lại." },
  );
}
