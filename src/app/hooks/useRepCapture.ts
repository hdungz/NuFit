import { useCallback, useEffect, useRef, useState } from "react";
import { getExerciseConfig, type ExerciseRepConfig } from "../services/exerciseConfig";
import { createCompositeImage, type PoseLandmark } from "./usePoseDetection";
import { POSE_CONNECTIONS } from "@mediapipe/pose";

export interface RepFrames {
  repNumber: number;
  frames: string[]; // base64 images
  startTime: number;
  endTime: number;
}

export interface UseRepCaptureOptions {
  enabled: boolean;
  exerciseName: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  landmarksRef: React.MutableRefObject<PoseLandmark[] | null>;
}

/**
 * Hook tự động capture screenshots theo rep cycle.
 *
 * Flow:
 * 1. Lấy config bài tập → biết repDurationSec + framesPerRep
 * 2. Mỗi captureIntervalMs → chụp 1 frame (video + pose overlay)
 * 3. Khi đủ framesPerRep → gom thành 1 RepFrames, tăng repNumber
 * 4. Trả về completedRep để caller gửi lên API
 */
export function useRepCapture({
  enabled,
  exerciseName,
  videoRef,
  landmarksRef,
}: UseRepCaptureOptions) {
  const [config, setConfig] = useState<ExerciseRepConfig>(() => getExerciseConfig(exerciseName));
  const [currentRep, setCurrentRep] = useState(1);
  const [frameCount, setFrameCount] = useState(0);
  const [completedRep, setCompletedRep] = useState<RepFrames | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const framesBuffer = useRef<string[]>([]);
  const repStartTime = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const enabledRef = useRef(enabled);

  // Sync refs
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  // Update config when exercise changes
  useEffect(() => {
    const newConfig = getExerciseConfig(exerciseName);
    setConfig(newConfig);
    // Reset capture state
    framesBuffer.current = [];
    setFrameCount(0);
    setCurrentRep(1);
    setCompletedRep(null);
  }, [exerciseName]);

  // Capture a single frame
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;

    const landmarks = landmarksRef.current;
    let imageData: string;

    if (landmarks && landmarks.length > 0) {
      imageData = createCompositeImage(video, landmarks, POSE_CONNECTIONS);
    } else {
      // Fallback: plain video frame
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      imageData = canvas.toDataURL("image/jpeg", 0.6);
    }

    framesBuffer.current.push(imageData);
    setFrameCount(framesBuffer.current.length);
  }, [videoRef, landmarksRef]);

  // Main capture loop
  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsCapturing(false);
      return;
    }

    setIsCapturing(true);
    framesBuffer.current = [];
    setFrameCount(0);
    repStartTime.current = Date.now();

    timerRef.current = setInterval(() => {
      if (!enabledRef.current) return;

      captureFrame();

      // Check if rep is complete
      if (framesBuffer.current.length >= config.framesPerRep) {
        const completed: RepFrames = {
          repNumber: currentRep,
          frames: [...framesBuffer.current],
          startTime: repStartTime.current,
          endTime: Date.now(),
        };

        setCompletedRep(completed);
        setCurrentRep((r) => r + 1);

        // Reset for next rep
        framesBuffer.current = [];
        setFrameCount(0);
        repStartTime.current = Date.now();
      }
    }, config.captureIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, config, captureFrame, currentRep]);

  // Clear completed rep after consumer reads it
  const consumeCompletedRep = useCallback(() => {
    const rep = completedRep;
    setCompletedRep(null);
    return rep;
  }, [completedRep]);

  return {
    config,
    currentRep,
    frameCount,
    completedRep,
    consumeCompletedRep,
    isCapturing,
  };
}
