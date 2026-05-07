import { useEffect, useRef } from "react";
import type { PoseLandmark } from "../hooks/usePoseDetection";

interface PoseOverlayProps {
  landmarks: PoseLandmark[] | null;
  connections: readonly [number, number][];
  videoWidth: number;
  videoHeight: number;
  mirrored?: boolean;
}

export function PoseOverlay({ 
  landmarks, 
  connections, 
  videoWidth, 
  videoHeight,
  mirrored = false 
}: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarksRef = useRef(landmarks);

  // Keep landmarks ref fresh for the draw loop
  landmarksRef.current = landmarks;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;

    const draw = () => {
      const lm = landmarksRef.current;
      if (!lm || videoWidth === 0 || videoHeight === 0) {
        raf = requestAnimationFrame(draw);
        return;
      }

      // Resize canvas only when needed
      if (canvas.width !== videoWidth) canvas.width = videoWidth;
      if (canvas.height !== videoHeight) canvas.height = videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      if (mirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      const w = canvas.width;
      const h = canvas.height;

      // Draw skeleton lines
      ctx.strokeStyle = "#00FF00";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (const [si, ei] of connections) {
        const s = lm[si];
        const e = lm[ei];
        if (!s || !e) continue;
        if ((s.visibility ?? 1) < 0.5 || (e.visibility ?? 1) < 0.5) continue;

        ctx.beginPath();
        ctx.moveTo(s.x * w, s.y * h);
        ctx.lineTo(e.x * w, e.y * h);
        ctx.stroke();
      }

      // Draw joints
      for (const pt of lm) {
        if (!pt || (pt.visibility ?? 1) < 0.3) continue;
        const x = pt.x * w;
        const y = pt.y * h;

        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = "#FF4444";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }

      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [videoWidth, videoHeight, mirrored, connections]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}
