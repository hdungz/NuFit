import { useState } from "react";
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle2, Camera } from "lucide-react";
import { ImageWithFallback } from "../ImageWithFallback";
import { useEffect } from "react";
import type { WorkoutPlan } from "../../lib/models";
import { computeWorkoutMetrics, getWorkoutPlan, markTodaySession, toggleExerciseStatus } from "../../services/workoutService";

export function WorkoutCoaching() {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formFeedback = [
    { type: "warning", message: "Lưng cần thẳng hơn một chút" },
    { type: "success", message: "Tư thế tay hoàn hảo!" },
    { type: "warning", message: "Hạ thấp hông xuống thêm 5cm" },
  ];

  const loadPlan = async () => {
    setLoading(true);
    setError(null);
    const result = await getWorkoutPlan();
    setLoading(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Không thể tải kế hoạch tập.");
      return;
    }
    setPlan(result.data);
  };

  useEffect(() => {
    void loadPlan();
  }, []);

  const metrics = plan ? computeWorkoutMetrics(plan) : null;

  const toggleWorkout = async () => {
    if (savingAction) return;
    const nextActive = !isWorkoutActive;
    setIsWorkoutActive(nextActive);
    if (!nextActive) {
      setSavingAction(true);
      const result = await markTodaySession(true, 25);
      setSavingAction(false);
      if (result.error || !result.data) {
        setError(result.error ?? "Không thể lưu buổi tập.");
        return;
      }
      setPlan(result.data);
    }
  };

  const resetToday = async () => {
    if (savingAction) return;
    setSavingAction(true);
    const result = await markTodaySession(false, 0);
    setSavingAction(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Không thể reset buổi tập.");
      return;
    }
    setPlan(result.data);
  };

  const onToggleExercise = async (exerciseId: string) => {
    if (savingAction) return;
    setSavingAction(true);
    const result = await toggleExerciseStatus(exerciseId);
    setSavingAction(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Không thể cập nhật bài tập.");
      return;
    }
    setPlan(result.data);
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-8">
        <h1 className="text-2xl mb-1">Huấn luyện AI</h1>
        <p className="text-orange-100 text-sm">Điều chỉnh dáng tập real-time</p>
      </div>

      <div className="px-6 mt-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1734189605012-f03d97a4d98f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxmaXRuZXNzJTIwd29ya291dCUyMHRyYWluaW5nfGVufDF8fHx8MTc3NjcyMjEzNHww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Workout camera view"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Camera className="text-white mb-2" size={48} />
              <p className="text-white text-sm">Camera theo dõi tư thế</p>
            </div>
            {isWorkoutActive && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                ĐANG GHI
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Bài tập: {plan?.title ?? "Đang tải..."}</h3>
                <p className="text-sm text-gray-600">
                  {metrics ? `Hoàn thành ${metrics.completedExercises}/${metrics.totalExercises} bài` : "Đang đồng bộ..."}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">{metrics?.completionRate ?? 0}%</p>
                <p className="text-xs text-gray-600">Tiến độ tuần</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => void toggleWorkout()}
                disabled={savingAction}
                className={`flex-1 ${
                  isWorkoutActive ? "bg-gray-600" : "bg-orange-600"
                } text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity`}
              >
                {isWorkoutActive ? (
                  <>
                    <Pause size={20} /> Tạm dừng
                  </>
                ) : (
                  <>
                    <Play size={20} /> Bắt đầu
                  </>
                )}
              </button>
              <button
                onClick={() => void resetToday()}
                disabled={savingAction}
                className="bg-gray-200 text-gray-700 px-4 rounded-xl hover:bg-gray-300 transition-colors"
              >
                <RotateCcw size={20} />
              </button>
            </div>
            {loading && <p className="text-xs text-gray-500 mt-2">Đang tải kế hoạch tập...</p>}
            {error && (
              <div className="mt-2">
                <p className="text-xs text-red-600">{error}</p>
                <button onClick={() => void loadPlan()} className="text-xs bg-red-50 text-red-700 rounded-lg px-2 py-1 mt-1">
                  Thử lại
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg mb-3">Phản hồi tư thế</h2>
          <div className="bg-white rounded-2xl shadow-lg p-4 space-y-3">
            {formFeedback.map((feedback, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-xl ${
                  feedback.type === "success" ? "bg-green-50" : "bg-yellow-50"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="text-green-600 flex-shrink-0" size={20} />
                ) : (
                  <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                )}
                <p className={`text-sm ${feedback.type === "success" ? "text-green-800" : "text-yellow-800"}`}>
                  {feedback.message}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 mb-6">
          <h2 className="text-lg mb-3">Danh sách bài tập</h2>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {plan?.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                onClick={() => void onToggleExercise(exercise.id)}
                className={`flex items-center justify-between p-4 border-b last:border-b-0 ${
                  exercise.status === "active" ? "bg-orange-50" : ""
                } cursor-pointer ${savingAction ? "opacity-70 pointer-events-none" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      exercise.status === "completed"
                        ? "bg-green-500"
                        : exercise.status === "active"
                        ? "bg-orange-500"
                        : "bg-gray-200"
                    }`}
                  >
                    {exercise.status === "completed" ? (
                      <CheckCircle2 className="text-white" size={20} />
                    ) : (
                      <span className="text-white font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{exercise.name}</h3>
                    <p className="text-sm text-gray-600">{exercise.reps}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{exercise.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
