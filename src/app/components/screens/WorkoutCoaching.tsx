import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle2, Camera, Timer } from "lucide-react";
import type { WorkoutPlan } from "../../lib/models";
import {
  computeWorkoutMetrics,
  getWorkoutPlan,
  markTodaySession,
  toggleExerciseStatus,
} from "../../services/workoutService";

const feedbackPool = [
  { type: "warning" as const, message: "Lưng cần thẳng hơn một chút" },
  { type: "success" as const, message: "Tư thế tay hoàn hảo!" },
  { type: "warning" as const, message: "Hạ thấp hông xuống thêm 5cm" },
  { type: "success" as const, message: "Giữ nhịp thở rất tốt!" },
  { type: "warning" as const, message: "Đầu gối không vượt quá mũi chân" },
  { type: "success" as const, message: "Góc squat chuẩn 90 độ!" },
  { type: "warning" as const, message: "Siết cơ bụng khi thực hiện" },
  { type: "success" as const, message: "Phạm vi chuyển động rất tốt!" },
  { type: "warning" as const, message: "Vai cần hạ xuống, tránh shrug" },
  { type: "success" as const, message: "Tốc độ thực hiện ổn định!" },
  { type: "warning" as const, message: "Chậm hơn ở giai đoạn eccentric" },
  { type: "success" as const, message: "Core engagement tuyệt vời!" },
];

export function WorkoutCoaching() {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState(feedbackPool[0]);
  const [feedbackVisible, setFeedbackVisible] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
    } catch {
      setCameraReady(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    void startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Load plan
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

  // Timer
  useEffect(() => {
    if (isWorkoutActive) {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
      // Dynamic feedback rotation
      feedbackRef.current = setInterval(() => {
        setFeedbackVisible(false);
        setTimeout(() => {
          setCurrentFeedback(feedbackPool[Math.floor(Math.random() * feedbackPool.length)]);
          setFeedbackVisible(true);
        }, 300);
      }, 5000 + Math.random() * 3000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackRef.current) clearInterval(feedbackRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackRef.current) clearInterval(feedbackRef.current);
    };
  }, [isWorkoutActive]);

  const metrics = plan ? computeWorkoutMetrics(plan) : null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const toggleWorkout = async () => {
    if (savingAction) return;
    const nextActive = !isWorkoutActive;
    setIsWorkoutActive(nextActive);
    if (!nextActive && elapsedSeconds > 0) {
      setSavingAction(true);
      const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const result = await markTodaySession(true, minutes);
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
    setIsWorkoutActive(false);
    setElapsedSeconds(0);
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
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 px-6 pt-14 pb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Huấn luyện AI</h1>
        <p className="text-orange-100/70 text-sm">Camera theo dõi tư thế real-time</p>
      </div>

      <div className="px-5 pt-4">
        {/* Camera view */}
        <div className="bg-black rounded-3xl overflow-hidden shadow-xl mb-5">
          <div className="relative aspect-[4/3]">
            {cameraReady ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                <Camera size={48} className="text-white/30 mb-3" />
                <p className="text-white/50 text-sm">Camera theo dõi tư thế</p>
              </div>
            )}

            {/* Overlay grid lines */}
            {cameraReady && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Grid */}
                <div className="absolute inset-4 border border-white/10 rounded-xl" />
                <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/5" />
                <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/5" />
                <div className="absolute left-0 right-0 top-1/3 h-px bg-white/5" />
                <div className="absolute left-0 right-0 top-2/3 h-px bg-white/5" />
              </div>
            )}

            {/* Recording indicator */}
            {isWorkoutActive && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2 shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                ĐANG GHI
              </div>
            )}

            {/* Timer overlay */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-sm font-mono flex items-center gap-2">
              <Timer size={14} />
              {formatTime(elapsedSeconds)}
            </div>

            {/* Live feedback overlay */}
            {isWorkoutActive && (
              <div
                className={`absolute top-4 left-4 right-16 transition-all duration-300 ${
                  feedbackVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                }`}
              >
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${
                    currentFeedback.type === "success"
                      ? "bg-emerald-500/90 text-white"
                      : "bg-amber-500/90 text-white"
                  }`}
                >
                  {currentFeedback.type === "success" ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                  {currentFeedback.message}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 py-4 bg-black/90">
            <button
              onClick={() => void toggleWorkout()}
              disabled={savingAction}
              className={`px-8 py-3 rounded-2xl font-semibold flex items-center gap-2 active:scale-95 transition-all ${
                isWorkoutActive
                  ? "bg-gray-600 text-white"
                  : "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30"
              }`}
            >
              {isWorkoutActive ? (
                <>
                  <Pause size={20} /> Tạm dừng
                </>
              ) : (
                <>
                  <Play size={20} /> {elapsedSeconds > 0 ? "Tiếp tục" : "Bắt đầu"}
                </>
              )}
            </button>
            <button
              onClick={() => void resetToday()}
              disabled={savingAction}
              className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
            >
              <RotateCcw size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Progress card */}
        {metrics && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-800">{plan?.title ?? "Bài tập"}</h3>
                <p className="text-xs text-gray-400">
                  {metrics.completedExercises}/{metrics.totalExercises} bài hoàn thành
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-500">{metrics.completionRate}%</p>
                <p className="text-[10px] text-gray-400">Tiến độ</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${metrics.completionRate}%` }}
              />
            </div>
          </div>
        )}

        {loading && <p className="text-sm text-gray-400 text-center mb-4">Đang tải kế hoạch tập...</p>}
        {error && (
          <div className="text-center mb-4">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => void loadPlan()}
              className="text-xs bg-red-50 text-red-600 rounded-xl px-3 py-1.5 mt-2"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Exercise list */}
        {plan && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Danh sách bài tập</h2>
            <div className="space-y-2">
              {plan.exercises.map((exercise, index) => (
                <button
                  key={exercise.id}
                  onClick={() => void onToggleExercise(exercise.id)}
                  disabled={savingAction}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98] ${
                    exercise.status === "completed"
                      ? "bg-emerald-50 border border-emerald-200"
                      : exercise.status === "active"
                      ? "bg-orange-50 border border-orange-200"
                      : "bg-white border border-gray-100 shadow-sm"
                  } ${savingAction ? "opacity-60" : ""}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      exercise.status === "completed"
                        ? "bg-emerald-500"
                        : exercise.status === "active"
                        ? "bg-orange-500"
                        : "bg-gray-200"
                    }`}
                  >
                    {exercise.status === "completed" ? (
                      <CheckCircle2 className="text-white" size={20} />
                    ) : (
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h3
                      className={`font-semibold text-sm ${
                        exercise.status === "completed" ? "text-emerald-700 line-through" : "text-slate-800"
                      }`}
                    >
                      {exercise.name}
                    </h3>
                    <p className="text-xs text-gray-400">{exercise.reps} · {exercise.duration}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
