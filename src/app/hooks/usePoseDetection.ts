import { useEffect, useRef, useState } from "react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseData {
  landmarks: PoseLandmark[];
  worldLandmarks?: PoseLandmark[];
}

export interface UsePoseDetectionOptions {
  enabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onPoseDetected?: (pose: PoseData) => void;
}

export function usePoseDetection({
  enabled,
  videoRef,
  onPoseDetected,
}: UsePoseDetectionOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPoseDetected, setIsPoseDetected] = useState(false);

  // Stable refs so Pose instance doesn't get re-created on every render
  const poseRef = useRef<Pose | null>(null);
  const rafRef = useRef<number>(0);
  const busyRef = useRef(false);
  const enabledRef = useRef(enabled);
  const onPoseDetectedRef = useRef(onPoseDetected);
  const mountedRef = useRef(true);

  // Keep refs in sync without triggering re-init
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { onPoseDetectedRef.current = onPoseDetected; }, [onPoseDetected]);

  // One-time Pose init + continuous frame loop
  useEffect(() => {
    mountedRef.current = true;

    const initAndRun = async () => {
      // Only init once
      if (!poseRef.current) {
        try {
          setIsLoading(true);
          setError(null);

          const pose = new Pose({
            locateFile: (file) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
          });

          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          pose.onResults((results) => {
            if (!mountedRef.current) return;

            if (results.poseLandmarks && results.poseLandmarks.length > 0) {
              setIsPoseDetected(true);
              onPoseDetectedRef.current?.({
                landmarks: results.poseLandmarks,
                worldLandmarks: results.poseWorldLandmarks,
              });
            } else {
              setIsPoseDetected(false);
            }

            // Mark not busy so the loop can send the next frame
            busyRef.current = false;
          });

          poseRef.current = pose;
          setIsLoading(false);
        } catch (err) {
          console.error("MediaPipe Pose init error:", err);
          setError("Không thể khởi tạo pose detection");
          setIsLoading(false);
          return;
        }
      }

      // Continuous frame loop using requestAnimationFrame
      const loop = () => {
        if (!mountedRef.current) return;

        const video = videoRef.current;
        const pose = poseRef.current;

        if (
          enabledRef.current &&
          pose &&
          video &&
          !busyRef.current &&
          video.readyState >= 2 &&
          video.videoWidth > 0
        ) {
          busyRef.current = true;
          pose.send({ image: video }).catch(() => {
            busyRef.current = false;
          });
        }

        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    };

    initAndRun();

    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(rafRef.current);
      // Close pose to free WASM memory
      if (poseRef.current) {
        poseRef.current.close();
        poseRef.current = null;
      }
    };
    // Only run once on mount — refs handle the rest
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isLoading,
    error,
    isPoseDetected,
    POSE_CONNECTIONS,
  };
}

// Helper function to draw pose on canvas
export function drawPoseOnCanvas(
  canvas: HTMLCanvasElement,
  landmarks: PoseLandmark[],
  connections: readonly [number, number][]
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!landmarks || landmarks.length === 0) return;

  // Set styles
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#00FF00";
  ctx.fillStyle = "#00FF00";

  // Draw connections (skeleton lines)
  for (const [startIdx, endIdx] of connections) {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];

    if (start.visibility && start.visibility < 0.5) continue;
    if (end.visibility && end.visibility < 0.5) continue;

    ctx.beginPath();
    ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
    ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
    ctx.stroke();
  }

  // Draw landmarks (joints)
  for (const landmark of landmarks) {
    if (landmark.visibility && landmark.visibility < 0.3) continue;

    const x = landmark.x * canvas.width;
    const y = landmark.y * canvas.height;

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// Create composite image with pose overlay for API
export function createCompositeImage(
  video: HTMLVideoElement,
  landmarks: PoseLandmark[],
  connections: readonly [number, number][]
): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Draw original video frame
  ctx.drawImage(video, 0, 0);

  // Draw pose overlay with transparency
  ctx.save();
  ctx.globalAlpha = 0.7;

  // Draw connections
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#00FF00";
  ctx.lineCap = "round";

  for (const [startIdx, endIdx] of connections) {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];

    if (start.visibility && start.visibility < 0.5) continue;
    if (end.visibility && end.visibility < 0.5) continue;

    ctx.beginPath();
    ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
    ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
    ctx.stroke();
  }

  // Draw joints
  ctx.fillStyle = "#FF0000";
  for (const landmark of landmarks) {
    if (landmark.visibility && landmark.visibility < 0.3) continue;

    const x = landmark.x * canvas.width;
    const y = landmark.y * canvas.height;

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.8);
}
