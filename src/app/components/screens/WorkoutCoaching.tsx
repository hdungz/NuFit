import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle2, Camera, Timer, SwitchCamera, Sparkles } from "lucide-react";
import type { WorkoutPlan } from "../../lib/models";
import {
  computeWorkoutMetrics,
  getWorkoutPlan,
  markTodaySession,
  toggleExerciseStatus,
} from "../../services/workoutService";
import { analyzeRepBatch, type RepAnalysisResult } from "../../services/workoutAnalysisService";
import { usePoseDetection, type PoseLandmark } from "../../hooks/usePoseDetection";
import { useRepCapture } from "../../hooks/useRepCapture";
import { PoseOverlay } from "../PoseOverlay";

export function WorkoutCoaching() {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [repFeedback, setRepFeedback] = useState<RepAnalysisResult | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [repCount, setRepCount] = useState(0);
  const [poseEnabled, setPoseEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [currentLandmarks, setCurrentLandmarks] = useState<PoseLandmark[] | null>(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });
  const landmarksRef = useRef<PoseLandmark[] | null>(null);

  // Text-to-speech using Web Speech API
  const speakFeedback = useCallback((text: string) => {
    if (!voiceEnabled || !text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang === "vi-VN") || voices.find(v => v.lang.startsWith("vi"));
      if (viVoice) utterance.voice = viVoice;
      window.speechSynthesis.speak(utterance);
    };

    // Voices may not be loaded yet on some browsers
    if (window.speechSynthesis.getVoices().length > 0) {
      speak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => { speak(); };
    }
  }, [voiceEnabled]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Camera
  const startCamera = useCallback(async () => {
    // Stop existing stream before requesting a new one
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
        // Handle case where metadata is already available
        if (videoRef.current.readyState >= 1) setCameraReady(true);
        void videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraReady(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // MediaPipe Pose Detection
  const { isLoading: poseLoading, isPoseDetected, POSE_CONNECTIONS } = usePoseDetection({
    enabled: poseEnabled && cameraReady,
    videoRef,
    onPoseDetected: (pose) => {
      setCurrentLandmarks(pose.landmarks);
      landmarksRef.current = pose.landmarks;
      if (videoRef.current) {
        setVideoDimensions({
          width: videoRef.current.videoWidth || 640,
          height: videoRef.current.videoHeight || 480,
        });
      }
    },
  });

  // Get active exercise name
  const activeExercise = plan?.exercises.find(e => e.status === "active") || plan?.exercises.find(e => e.status === "pending");
  const exerciseName = activeExercise?.name || "Squat";

  // Rep-based capture
  const { config: repConfig, currentRep, frameCount, completedRep, consumeCompletedRep, isCapturing } = useRepCapture({
    enabled: isWorkoutActive && aiEnabled && poseEnabled,
    exerciseName,
    videoRef,
    landmarksRef,
  });

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
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isWorkoutActive]);

  // When a rep completes, send all frames to GPT for batch analysis
  useEffect(() => {
    if (!completedRep || isAnalyzing) return;

    const analyze = async () => {
      setIsAnalyzing(true);
      try {
        const rep = consumeCompletedRep();
        if (!rep) return;

        setRepCount(rep.repNumber);

        const result = await analyzeRepBatch(rep.frames, exerciseName, rep.repNumber);

        if (result.data) {
          setRepFeedback(result.data);
          setFeedbackVisible(true);
          speakFeedback(result.data.message);
          // Auto-hide after 8 seconds
          setTimeout(() => setFeedbackVisible(false), 8000);
        }
      } catch (err) {
        console.error("Rep analysis error:", err);
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyze();
  }, [completedRep]);

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
          <div className="relative aspect-[4/3] bg-slate-800">
            {/* Video ALWAYS in DOM — CSS hides it until ready (avoids ref=null deadlock) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraReady ? "block" : "hidden"}`}
              style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
            />

            {/* Pose overlay */}
            {poseEnabled && currentLandmarks && (
              <PoseOverlay
                landmarks={currentLandmarks}
                connections={POSE_CONNECTIONS}
                videoWidth={videoDimensions.width}
                videoHeight={videoDimensions.height}
                mirrored={facingMode === "user"}
              />
            )}

            {/* Placeholder while camera initialises */}
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Camera size={48} className="text-white/30 mb-3" />
                <p className="text-white/50 text-sm">Đang khởi động camera…</p>
                <p className="text-white/30 text-xs mt-1">Vui lòng cấp quyền nếu được hỏi</p>
              </div>
            )}

            {/* Overlay grid lines */}
            {cameraReady && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border border-white/10 rounded-xl" />
                <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/5" />
                <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/5" />
                <div className="absolute left-0 right-0 top-1/3 h-px bg-white/5" />
                <div className="absolute left-0 right-0 top-2/3 h-px bg-white/5" />
              </div>
            )}

            {/* Top-right: Recording indicator */}
            {isWorkoutActive && (
              <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2 shadow-lg z-10">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                ĐANG GHI
              </div>
            )}

            {/* Top-right (below indicator) or just Top-right: Switch Camera Button */}
            {!isWorkoutActive && cameraReady && (
              <button
                onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")}
                className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-colors z-10"
              >
                <SwitchCamera size={20} />
              </button>
            )}

            {/* Bottom-left: Timer */}
            <div className="absolute bottom-3 left-3 z-10">
              <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-sm font-mono flex items-center gap-2">
                <Timer size={14} />
                {formatTime(elapsedSeconds)}
              </div>
            </div>
          </div>

          {/* Rep Capture Status */}
          {isWorkoutActive && aiEnabled && isCapturing && (
            <div className="mx-3 -mt-1 mb-1 bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Rep {currentRep} · {exerciseName}</span>
                <span className="font-mono">{frameCount}/{repConfig.framesPerRep} frames</span>
              </div>
              <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(frameCount / repConfig.framesPerRep) * 100}%` }}
                />
              </div>
              {isAnalyzing && (
                <p className="text-[10px] text-orange-500 mt-1 animate-pulse">Đang phân tích rep {repCount}...</p>
              )}
            </div>
          )}

          {/* Rep Feedback */}
          {isWorkoutActive && repFeedback && feedbackVisible && (
            <div className={`mx-3 mt-1 mb-1 rounded-2xl p-3 ${
              repFeedback.type === "success"
                ? "bg-emerald-50 border border-emerald-200"
                : repFeedback.type === "error"
                ? "bg-red-50 border border-red-200"
                : "bg-amber-50 border border-amber-200"
            }`}>
              <div className="flex items-start gap-2">
                {repFeedback.type === "success" ? (
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">Rep {repFeedback.repNumber}</p>
                    <span className={`text-xs font-bold ${
                      repFeedback.overallScore >= 80 ? "text-emerald-600" : repFeedback.overallScore >= 50 ? "text-amber-600" : "text-red-600"
                    }`}>{repFeedback.overallScore}/100</span>
                  </div>
                  <p className={`text-sm font-medium mt-0.5 ${
                    repFeedback.type === "success" ? "text-emerald-700" : "text-amber-700"
                  }`}>
                    {repFeedback.message}
                  </p>
                  {repFeedback.suggestions.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {repFeedback.suggestions.slice(0, 3).map((tip: string, idx: number) => (
                        <p key={idx} className="text-xs text-gray-500">• {tip}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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

        {/* AI Settings Card */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-orange-500" />
              <h3 className="font-semibold text-slate-800 text-sm">AI Coaching</h3>
            </div>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                aiEnabled ? "bg-orange-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  aiEnabled ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>
          
          {/* Pose Detection Toggle */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPoseDetected ? "bg-green-500" : poseLoading ? "bg-yellow-500" : "bg-red-500"}`} />
              <span className="text-xs text-gray-600">Pose Detection</span>
            </div>
            <button
              onClick={() => setPoseEnabled(!poseEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                poseEnabled ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  poseEnabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
          
          {poseEnabled && (
            <p className="text-[10px] text-gray-400 mb-2">
              {isPoseDetected ? "✓ Đã phát hiện cơ thể" : poseLoading ? "⏳ Đang khởi tạo..." : "✗ Chưa phát hiện cơ thể"}
            </p>
          )}
          
          {/* Voice Toggle */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-600">🔊 Đọc thông báo</span>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                voiceEnabled ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  voiceEnabled ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
          
          {aiEnabled && (
            <div className="text-xs text-gray-500 mt-3 border-t pt-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isAnalyzing ? "bg-orange-500 animate-pulse" : isCapturing ? "bg-blue-500 animate-pulse" : "bg-gray-300"}`} />
                <p>{isAnalyzing ? "Đang phân tích..." : isCapturing ? "Đang capture..." : "Sẵn sàng"}</p>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {exerciseName}: {repConfig.framesPerRep} frame/{repConfig.repDurationSec}s mỗi rep · gpt-5.4
              </p>
              <p className="text-[10px] text-gray-400">
                Interval: {repConfig.captureIntervalMs}ms · Rep: {repCount}
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
