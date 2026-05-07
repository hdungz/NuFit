/**
 * Cấu hình thời gian rep và số frame capture cho từng bài tập.
 *
 * repDurationSec: thời gian trung bình hoàn thành 1 rep (giây)
 * framesPerRep:   số screenshot cần capture trong 1 rep
 *   → interval giữa 2 frame = repDurationSec / framesPerRep
 *
 * Tham khảo:
 * - Squat:   3-4s/rep  (xuống 2s + lên 2s), 4 frame đủ bắt top-mid-bottom-mid
 * - Push-up: 2-3s/rep  (xuống 1s + lên 1s), 3 frame
 * - Plank:   isometric (giữ yên), chỉ cần 2 frame/5s kiểm tra form
 * - Lunges:  3-4s/rep  (bước 1.5s + lên 1.5s), 4 frame
 * - Deadlift:4-5s/rep  (kéo 2s + hạ 2s), 5 frame
 * - Bench:   3-4s/rep  (hạ 2s + đẩy 1.5s), 4 frame
 * - Curl:    2-3s/rep  (cuốn 1.5s + hạ 1.5s), 3 frame
 * - Shoulder Press: 3s/rep, 3 frame
 */

export interface ExerciseRepConfig {
  repDurationSec: number;
  framesPerRep: number;
  /** Tính tự động: khoảng cách giữa 2 lần capture (ms) */
  captureIntervalMs: number;
  /** Là bài tập giữ yên (plank, wall sit...) thay vì đếm rep */
  isIsometric: boolean;
}

const EXERCISE_CONFIGS: Record<string, Omit<ExerciseRepConfig, "captureIntervalMs">> = {
  "squat":          { repDurationSec: 4, framesPerRep: 4, isIsometric: false },
  "push-up":        { repDurationSec: 3, framesPerRep: 3, isIsometric: false },
  "push up":        { repDurationSec: 3, framesPerRep: 3, isIsometric: false },
  "pushup":         { repDurationSec: 3, framesPerRep: 3, isIsometric: false },
  "plank":          { repDurationSec: 5, framesPerRep: 2, isIsometric: true },
  "lunges":         { repDurationSec: 4, framesPerRep: 4, isIsometric: false },
  "lunge":          { repDurationSec: 4, framesPerRep: 4, isIsometric: false },
  "deadlift":       { repDurationSec: 5, framesPerRep: 5, isIsometric: false },
  "bench press":    { repDurationSec: 4, framesPerRep: 4, isIsometric: false },
  "bench":          { repDurationSec: 4, framesPerRep: 4, isIsometric: false },
  "bicep curl":     { repDurationSec: 3, framesPerRep: 3, isIsometric: false },
  "curl":           { repDurationSec: 3, framesPerRep: 3, isIsometric: false },
  "shoulder press": { repDurationSec: 3, framesPerRep: 3, isIsometric: false },
  "overhead press": { repDurationSec: 3, framesPerRep: 3, isIsometric: false },
  "pull-up":        { repDurationSec: 4, framesPerRep: 4, isIsometric: false },
  "pullup":         { repDurationSec: 4, framesPerRep: 4, isIsometric: false },
  "sit-up":         { repDurationSec: 3, framesPerRep: 3, isIsometric: false },
  "crunch":         { repDurationSec: 2, framesPerRep: 3, isIsometric: false },
  "burpee":         { repDurationSec: 5, framesPerRep: 5, isIsometric: false },
};

// Default cho bài tập chưa biết
const DEFAULT_CONFIG = { repDurationSec: 4, framesPerRep: 4, isIsometric: false };

export function getExerciseConfig(exerciseName: string): ExerciseRepConfig {
  const key = exerciseName.toLowerCase().trim();
  const config = EXERCISE_CONFIGS[key] || DEFAULT_CONFIG;
  return {
    ...config,
    captureIntervalMs: Math.round((config.repDurationSec * 1000) / config.framesPerRep),
  };
}
