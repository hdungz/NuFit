import type { ApiResponse, WorkoutPlan } from "../lib/models";
import { readAppData, updateAppData } from "../lib/storage";
import { getLocalDateKey } from "../lib/utils";
import { withMockApi } from "./mockApi";

export async function getWorkoutPlan(): Promise<ApiResponse<WorkoutPlan>> {
  return withMockApi(() => readAppData().workoutPlan, { errorMessage: "Không tải được kế hoạch tập." });
}

export async function toggleExerciseStatus(exerciseId: string): Promise<ApiResponse<WorkoutPlan>> {
  return withMockApi(
    () => {
      const next = updateAppData((current) => ({
        ...current,
        workoutPlan: {
          ...current.workoutPlan,
          exercises: current.workoutPlan.exercises.map((exercise) =>
            exercise.id === exerciseId
              ? { ...exercise, status: exercise.status === "completed" ? "pending" : "completed" }
              : exercise,
          ),
        },
      }));
      return next.workoutPlan;
    },
    { errorMessage: "Không thể cập nhật trạng thái bài tập." },
  );
}

export async function markTodaySession(completed: boolean, durationMinutes: number): Promise<ApiResponse<WorkoutPlan>> {
  return withMockApi(
    () => {
      const today = getLocalDateKey();
      const next = updateAppData((current) => {
        const sessions = [...current.workoutPlan.sessions];
        const existingIndex = sessions.findIndex((session) => session.date === today);
        if (existingIndex >= 0) {
          sessions[existingIndex] = { ...sessions[existingIndex], completed, durationMinutes };
        } else {
          sessions.push({ id: crypto.randomUUID(), date: today, completed, durationMinutes });
        }
        return { ...current, workoutPlan: { ...current.workoutPlan, sessions } };
      });
      return next.workoutPlan;
    },
    { errorMessage: "Không lưu được buổi tập. Thử lại nhé." },
  );
}

export function computeWorkoutMetrics(plan: WorkoutPlan) {
  const totalExercises = plan.exercises.length;
  const completedExercises = plan.exercises.filter((exercise) => exercise.status === "completed").length;
  const completionRate = totalExercises ? Math.round((completedExercises / totalExercises) * 100) : 0;
  const completedSessions = plan.sessions.filter((session) => session.completed).length;

  return {
    completionRate,
    completedExercises,
    totalExercises,
    completedSessions,
  };
}
