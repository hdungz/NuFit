import { Camera, Upload, CheckCircle2, Sparkles, X, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import type { ScanResult } from "../../lib/models";
import { scanFoodFromCamera, saveScanToDiary } from "../../services/scannerService";
import { readAppData } from "../../lib/storage";

type ScanState = "camera" | "analyzing" | "result";

export function CalorieScanner() {
  const [scanState, setScanState] = useState<ScanState>("camera");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>(() => readAppData().scanHistory);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Attach event BEFORE play() to handle all timing scenarios
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
        // If metadata already loaded (srcObject set synchronously), fire manually
        if (videoRef.current.readyState >= 1) {
          setCameraReady(true);
        }
        void videoRef.current.play().catch(() => {
          // autoplay might be blocked; cameraReady will still be set via onloadedmetadata
        });
      }
    } catch {
      // Camera not available - show upload-only mode
      setCameraReady(false);
    }
  }, []);

  // Stop camera
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

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(dataUrl);
    stopCamera();
    void runAnalysis(dataUrl);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      stopCamera();
      void runAnalysis(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Run mock analysis with progress animation
  const runAnalysis = async (imageUrl: string) => {
    setScanState("analyzing");
    setErrorMessage(null);
    setSuccessMessage(null);
    setAnalyzeProgress(0);

    // Animate progress bar
    const duration = 1500 + Math.random() * 1000; // 1.5-2.5s
    const startTime = Date.now();
    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 95);
      setAnalyzeProgress(progress);
      if (progress < 95) requestAnimationFrame(animateProgress);
    };
    requestAnimationFrame(animateProgress);

    const result = await scanFoodFromCamera(imageUrl);

    setAnalyzeProgress(100);
    await new Promise((r) => setTimeout(r, 300));

    if (result.error || !result.data) {
      setErrorMessage(result.error ?? "Không quét được món ăn.");
      setScanState("camera");
      void startCamera();
      return;
    }

    setScanResult(result.data);
    setRecentScans(readAppData().scanHistory);
    setScanState("result");
  };

  const onSaveToDiary = async () => {
    if (!scanResult || saving) return;
    setSaving(true);
    const result = await saveScanToDiary(scanResult);
    setSaving(false);
    if (result.error) {
      setErrorMessage(result.error);
      return;
    }
    setErrorMessage(null);
    setSuccessMessage("Đã lưu vào nhật ký bữa ăn!");
  };

  const resetScanner = () => {
    setScanResult(null);
    setCapturedImage(null);
    setScanState("camera");
    setSuccessMessage(null);
    setErrorMessage(null);
    void startCamera();
  };

  // Macro bar component
  const MacroBar = ({ label, grams, color, total }: { label: string; grams: number; color: string; total: number }) => {
    const percent = total > 0 ? Math.round((grams / total) * 100) : 0;
    return (
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-500">{label}</span>
          <span className="text-xs font-semibold text-slate-700">{grams}g <span className="text-gray-400">({percent}%)</span></span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-600 via-rose-600 to-violet-700 px-6 pt-14 pb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Scan Calories</h1>
        <p className="text-pink-100/70 text-sm">Chụp ảnh để nhận diện món ăn bằng AI</p>
      </div>

      <div className="px-5 -mt-0 pt-4">
        {/* Camera / Analyzing / Result view */}
        {scanState === "camera" && (
          <div className="bg-black rounded-3xl overflow-hidden shadow-xl mb-5">
            <div className="relative aspect-[4/3] bg-black">
              {/* Video is ALWAYS in the DOM so videoRef.current is always available.
                  cameraReady=false only hides it via CSS – never unmounts it. */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraReady ? "block" : "hidden"}`}
              />

              {/* Placeholder shown while camera is initialising */}
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
                  <Camera size={48} className="text-white/30 mb-3" />
                  <p className="text-white/50 text-sm mb-1">Đang khởi động camera…</p>
                  <p className="text-white/30 text-xs">Vui lòng cấp quyền nếu được hỏi</p>
                </div>
              )}

              {/* Scan overlay frame – only visible when camera is ready */}
              {cameraReady && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/40 rounded-3xl">
                      <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-3 border-l-3 border-white rounded-tl-3xl" />
                      <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-3 border-r-3 border-white rounded-tr-3xl" />
                      <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-3 border-l-3 border-white rounded-bl-3xl" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-3 border-r-3 border-white rounded-br-3xl" />
                    </div>
                  </div>
                  <p className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-xs">
                    Đặt món ăn vào khung hình
                  </p>
                </>
              )}
            </div>

            {/* Camera controls */}
            <div className="flex items-center justify-center gap-6 py-5 bg-black/90">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Upload size={20} className="text-white" />
              </button>
              <button
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="w-18 h-18 rounded-full bg-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-30 shadow-lg"
                style={{ width: 72, height: 72 }}
              >
                <div className="w-16 h-16 rounded-full border-4 border-slate-200" />
              </button>
              <div className="w-12 h-12" /> {/* spacer */}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {scanState === "analyzing" && capturedImage && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl mb-5">
            <div className="relative aspect-[4/3]">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-4 flex flex-col items-center">
                  <Sparkles size={28} className="text-pink-500 mb-2 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-800 mb-3">AI đang phân tích...</p>
                  <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-violet-500 rounded-full transition-all duration-200"
                      style={{ width: `${analyzeProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{Math.round(analyzeProgress)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {scanState === "result" && scanResult && (
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl mb-5">
            {/* Captured image with result badge */}
            {capturedImage && (
              <div className="relative aspect-[16/9]">
                <img src={capturedImage} alt="Scanned" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow-lg">
                  <CheckCircle2 size={14} />
                  Đã nhận diện
                </div>
              </div>
            )}

            <div className="p-5">
              {/* Food name + calories */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{scanResult.foodName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">Độ chính xác:</span>
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {scanResult.confidence}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-pink-600">{scanResult.totalCalories}</p>
                  <p className="text-xs text-gray-400">kcal</p>
                </div>
              </div>

              {/* Macros */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Thành phần dinh dưỡng</h4>
                <MacroBar
                  label="Protein"
                  grams={scanResult.proteinGram}
                  color="bg-rose-500"
                  total={scanResult.proteinGram + scanResult.carbsGram + scanResult.fatGram}
                />
                <MacroBar
                  label="Carbs"
                  grams={scanResult.carbsGram}
                  color="bg-amber-500"
                  total={scanResult.proteinGram + scanResult.carbsGram + scanResult.fatGram}
                />
                <MacroBar
                  label="Fat"
                  grams={scanResult.fatGram}
                  color="bg-blue-500"
                  total={scanResult.proteinGram + scanResult.carbsGram + scanResult.fatGram}
                />
              </div>

              {/* Ingredients */}
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Nguyên liệu chính</h4>
                <div className="flex flex-wrap gap-2">
                  {scanResult.ingredients.map((ing, i) => (
                    <span key={i} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => void onSaveToDiary()}
                  disabled={saving || !!successMessage}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-violet-600 text-white py-3.5 rounded-2xl font-semibold active:scale-[0.97] transition-transform disabled:opacity-60 shadow-lg shadow-pink-500/20"
                >
                  {saving ? "Đang lưu..." : successMessage ? "Đã lưu!" : "Lưu vào nhật ký"}
                </button>
                <button
                  onClick={resetScanner}
                  className="w-14 bg-gray-100 text-gray-600 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
                >
                  <RotateCcw size={20} />
                </button>
              </div>

              {errorMessage && <p className="text-xs mt-3 text-red-500 text-center">{errorMessage}</p>}
              {successMessage && (
                <Link
                  to="/food-diary"
                  className="mt-3 block text-center text-sm text-pink-600 font-medium"
                >
                  Xem nhật ký bữa ăn →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Error for camera state */}
        {scanState === "camera" && errorMessage && (
          <p className="text-sm text-red-500 text-center mb-4">{errorMessage}</p>
        )}

        {/* Recent scans */}
        {recentScans.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Lịch sử quét gần đây</h2>
            <div className="space-y-2">
              {recentScans.slice(0, 5).map((scan) => (
                <div key={scan.id} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles size={18} className="text-pink-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">{scan.foodName}</p>
                    <p className="text-xs text-gray-400">{new Date(scan.createdAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <span className="text-sm font-semibold text-pink-600 flex-shrink-0">{scan.totalCalories} kcal</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
