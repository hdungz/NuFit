import { Camera, Upload, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { ImageWithFallback } from "../ImageWithFallback";
import { Link } from "react-router";
import type { ScanResult } from "../../lib/models";
import { scanFoodFile, saveScanToDiary } from "../../services/scannerService";
import { readAppData } from "../../lib/storage";

export function CalorieScanner() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>(() => readAppData().scanHistory);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const runScan = async (fileName: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    const file = new File(["mock"], fileName, { type: "image/jpeg" });
    const result = await scanFoodFile(file);
    setLoading(false);
    if (result.error || !result.data) {
      setErrorMessage(result.error ?? "Không quét được món ăn.");
      return;
    }
    setScanResult(result.data);
    setRecentScans(readAppData().scanHistory);
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
    setSuccessMessage("Đã lưu vào nhật ký bữa ăn thành công.");
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-6 py-8">
        <h1 className="text-2xl mb-1">Scan Calories</h1>
        <p className="text-pink-100 text-sm">Phân tích dinh dưỡng bằng AI</p>
      </div>

      <div className="px-6 mt-6">
        {!scanResult ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-12 flex flex-col items-center justify-center mb-6">
              <div className="bg-pink-100 p-4 rounded-full mb-4">
                <Camera className="text-pink-600" size={32} />
              </div>
              <h3 className="font-semibold text-lg mb-2">Chụp ảnh món ăn</h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                AI sẽ nhận diện và tính toán calo tự động
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => void runScan("camera-com-ga.jpg")}
                  disabled={loading}
                  className="flex-1 bg-pink-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-pink-700 transition-colors"
                >
                  <Camera size={20} />
                  Chụp ảnh
                </button>
                <button
                  onClick={() => void runScan("upload-pho.jpg")}
                  disabled={loading}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-300 transition-colors"
                >
                  <Upload size={20} />
                  Tải ảnh lên
                </button>
              </div>
              {loading && <p className="text-xs text-gray-500 mt-3">Đang phân tích hình ảnh...</p>}
              {errorMessage && <p className="text-xs mt-3 text-red-600">{errorMessage}</p>}
              {successMessage && <p className="text-xs mt-3 text-green-600">{successMessage}</p>}
            </div>

            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="text-pink-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-pink-900 mb-1">AI nhận diện món Việt</p>
                  <p className="text-sm text-pink-800">
                    Đặc biệt tối ưu cho các món ăn Việt Nam phổ biến với độ chính xác cao
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="relative bg-gray-900 aspect-video">
              <ImageWithFallback
                src={scanResult.image}
                alt="Scanned food"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                <CheckCircle2 size={14} />
                Đã nhận diện
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{scanResult.foodName}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Độ chính xác:</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-medium">
                      {scanResult.confidence}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-pink-600">{scanResult.totalCalories}</p>
                  <p className="text-sm text-gray-600">kcal</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h4 className="font-semibold mb-3">Thành phần dinh dưỡng</h4>
                <div className="space-y-3">
                  {[
                    { name: "Protein", amount: `${scanResult.proteinGram}g`, percentage: 28 },
                    { name: "Carbs", amount: `${scanResult.carbsGram}g`, percentage: 52 },
                    { name: "Fat", amount: `${scanResult.fatGram}g`, percentage: 20 },
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{item.name}</span>
                        <span className="text-sm font-semibold">{item.amount}</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-pink-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">Nguyên liệu chính</h4>
                <div className="flex flex-wrap gap-2">
                  {scanResult.ingredients.map((ingredient, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => void onSaveToDiary()}
                  className="flex-1 bg-pink-600 text-white py-3 rounded-xl font-semibold hover:bg-pink-700 transition-colors disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu vào nhật ký"}
                </button>
                <button
                  onClick={() => setScanResult(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Quét lại
                </button>
              </div>
              <Link
                to="/food-diary"
                className="mt-3 w-full inline-block text-center bg-pink-100 text-pink-700 py-3 rounded-xl font-semibold hover:bg-pink-200 transition-colors"
              >
                Mở nhật ký bữa ăn
              </Link>
              {errorMessage && <p className="text-xs mt-3 text-red-600">{errorMessage}</p>}
              {successMessage && <p className="text-xs mt-3 text-green-600">{successMessage}</p>}
            </div>
          </div>
        )}

        {recentScans.length > 0 && (
          <>
            <h2 className="text-lg mb-4">Lịch sử quét</h2>
            <div className="space-y-3 mb-6">
              {recentScans.map((scan) => (
                <div key={scan.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="flex gap-4 p-4">
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                      <ImageWithFallback src={scan.image} alt={scan.foodName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold mb-1">{scan.foodName}</h4>
                          <p className="text-xs text-gray-600">{new Date(scan.createdAt).toLocaleString("vi-VN")}</p>
                        </div>
                        <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-lg text-xs font-medium">
                          {scan.totalCalories} kcal
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
