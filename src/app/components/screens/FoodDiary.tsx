import { Pencil, Plus, Trash2, TrendingUp, X, Sun, CloudSun, Moon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ImageWithFallback } from "../ImageWithFallback";
import type { MealEntry, MealTag } from "../../lib/models";
import { formatDateLabel, getLocalDateKey } from "../../lib/utils";
import { addMeal, computeMealMetrics, listMeals, removeMeal, updateMeal } from "../../services/mealService";

const MEAL_TYPE_ORDER = ["Sáng", "Trưa", "Tối", "Snack"] as const;
const MEAL_TYPE_CONFIG: Record<string, { label: string; icon: typeof Sun; color: string; bg: string }> = {
  "Sáng": { label: "Bữa sáng", icon: Sun, color: "text-amber-500", bg: "bg-amber-50" },
  "Trưa": { label: "Bữa trưa", icon: CloudSun, color: "text-emerald-500", bg: "bg-emerald-50" },
  "Tối": { label: "Bữa tối", icon: Moon, color: "text-violet-500", bg: "bg-violet-50" },
  "Snack": { label: "Snack", icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-50" },
};

export function FoodDiary() {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingMeal, setSavingMeal] = useState(false);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", calories: "350", proteinGram: "", carbsGram: "", fatGram: "", mealTag: "Trưa", date: getLocalDateKey() });
  const [editingMealId, setEditingMealId] = useState<string | null>(null);

  const loadMeals = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    const result = await listMeals();
    setLoading(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Không thể tải nhật ký bữa ăn.");
      return;
    }
    setMeals(result.data);
  };

  useEffect(() => {
    void loadMeals();
  }, []);

  const filteredMeals = useMemo(() => {
    const today = getLocalDateKey();
    if (dateFilter === "today") return meals.filter((m) => m.date === today);
    if (dateFilter === "week") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return meals.filter((m) => new Date(m.date) >= weekAgo);
    }
    return meals;
  }, [dateFilter, meals]);

  // Group by date → then by meal type
  const groupedByDate = useMemo(() => {
    const grouped = filteredMeals.reduce<Record<string, MealEntry[]>>((acc, meal) => {
      acc[meal.date] = acc[meal.date] ? [...acc[meal.date], meal] : [meal];
      return acc;
    }, {});
    return Object.entries(grouped)
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([date, dateMeals]) => {
        const byMealType: Record<string, MealEntry[]> = {};
        for (const meal of dateMeals) {
          const mealType = meal.tags.find((t) => MEAL_TYPE_ORDER.includes(t as typeof MEAL_TYPE_ORDER[number])) || "Khác";
          byMealType[mealType] = byMealType[mealType] ? [...byMealType[mealType], meal] : [meal];
        }
        const dayCalories = dateMeals.reduce((s, m) => s + m.calories, 0);
        const dayProtein = dateMeals.reduce((s, m) => s + m.proteinGram, 0);
        const dayCarbs = dateMeals.reduce((s, m) => s + m.carbsGram, 0);
        const dayFat = dateMeals.reduce((s, m) => s + m.fatGram, 0);
        return { date, byMealType, dayCalories, dayProtein, dayCarbs, dayFat };
      });
  }, [filteredMeals]);

  const metrics = computeMealMetrics(meals);

  const saveMeal = async () => {
    if (savingMeal) return;
    const cal = Number(form.calories);
    const payload = {
      date: form.date,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      name: form.name.trim(),
      calories: cal,
      proteinGram: form.proteinGram ? Number(form.proteinGram) : Math.round(cal * 0.08),
      carbsGram: form.carbsGram ? Number(form.carbsGram) : Math.round(cal * 0.12),
      fatGram: form.fatGram ? Number(form.fatGram) : Math.round(cal * 0.03),
      tags: [form.mealTag as MealTag, "Việt Nam" as MealTag],
      image: "",
      source: "manual" as const,
    };
    if (!payload.name || Number.isNaN(payload.calories) || payload.calories <= 0) {
      setError("Vui lòng nhập tên món và calories hợp lệ.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setSavingMeal(true);
    const result = editingMealId ? await updateMeal(editingMealId, payload) : await addMeal(payload);
    setSavingMeal(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Không thể lưu bữa ăn.");
      return;
    }
    setMeals(result.data);
    setEditingMealId(null);
    setForm({ ...form, name: "", calories: "350", proteinGram: "", carbsGram: "", fatGram: "" });
    setShowForm(false);
    setSuccessMessage(editingMealId ? "Đã cập nhật bữa ăn." : "Đã thêm bữa ăn mới.");
  };

  const onDeleteMeal = async (id: string) => {
    if (deletingMealId) return;
    setDeletingMealId(id);
    const result = await removeMeal(id);
    setDeletingMealId(null);
    if (result.error || !result.data) {
      setError(result.error ?? "Không thể xóa bữa ăn.");
      return;
    }
    setMeals(result.data);
    setSuccessMessage("Đã xóa bữa ăn.");
  };

  const CircularProgress = ({ value, max }: { value: number; max: number }) => {
    const size = 80;
    const strokeWidth = 7;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progress = Math.min(value / max, 1);
    const offset = circumference - progress * circumference;
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#3b82f6" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-slate-800">{Math.round(progress * 100)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 px-6 pt-14 pb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Nhật ký bữa ăn</h1>
        <p className="text-blue-100/70 text-sm">Theo dõi và phân tích khẩu vị của bạn</p>
      </div>

      <div className="px-5 pt-4">
        {/* Calorie summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 flex items-center gap-4">
          <CircularProgress value={metrics.totalCalories} max={2000} />
          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-0.5">Calo hôm nay</p>
            <p className="text-xl font-bold text-slate-800">{metrics.totalCalories.toLocaleString("vi-VN")}</p>
            <p className="text-xs text-gray-400">/ 2,000 kcal · Còn {metrics.remainingCalories.toLocaleString("vi-VN")}</p>
            <div className="flex gap-3 mt-1.5 text-[10px] text-gray-400">
              <span>P: {metrics.totalProtein}g</span>
              <span>C: {metrics.totalCarbs}g</span>
              <span>F: {metrics.totalFat}g</span>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditingMealId(null); setForm({ name: "", calories: "350", proteinGram: "", carbsGram: "", fatGram: "", mealTag: "Trưa", date: getLocalDateKey() }); }}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-90 transition-transform"
          >
            {showForm ? <X size={20} className="text-white" /> : <Plus size={20} className="text-white" />}
          </button>
        </div>

        {/* Add/edit form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">{editingMealId ? "Sửa bữa ăn" : "Thêm bữa ăn"}</h3>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Tên món ăn"
              className="w-full bg-slate-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.calories}
                onChange={(e) => setForm((p) => ({ ...p, calories: e.target.value }))}
                placeholder="Calories"
                type="number"
                className="bg-slate-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={form.mealTag}
                onChange={(e) => setForm((p) => ({ ...p, mealTag: e.target.value }))}
                className="bg-slate-50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Sáng</option>
                <option>Trưa</option>
                <option>Tối</option>
                <option>Snack</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                value={form.proteinGram}
                onChange={(e) => setForm((p) => ({ ...p, proteinGram: e.target.value }))}
                placeholder="Protein (g)"
                type="number"
                className="bg-slate-50 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={form.carbsGram}
                onChange={(e) => setForm((p) => ({ ...p, carbsGram: e.target.value }))}
                placeholder="Carbs (g)"
                type="number"
                className="bg-slate-50 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                value={form.fatGram}
                onChange={(e) => setForm((p) => ({ ...p, fatGram: e.target.value }))}
                placeholder="Fat (g)"
                type="number"
                className="bg-slate-50 rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => void saveMeal()}
              disabled={savingMeal}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-xl font-semibold active:scale-[0.97] transition-transform disabled:opacity-60"
            >
              {savingMeal ? "Đang lưu..." : editingMealId ? "Cập nhật" : "Thêm bữa ăn"}
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center mb-3">{error}</p>}
        {successMessage && <p className="text-sm text-emerald-500 text-center mb-3">{successMessage}</p>}

        {/* Filter pills */}
        <div className="flex gap-2 mb-4">
          {(["all", "today", "week"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95 ${
                dateFilter === key
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
            >
              {key === "all" ? "Tất cả" : key === "today" ? "Hôm nay" : "7 ngày"}
            </button>
          ))}
        </div>

        {/* Meal history - grouped by day then by meal type */}
        <div className="space-y-6 mb-6">
          {loading && <p className="text-sm text-gray-400 text-center">Đang tải dữ liệu...</p>}
          {groupedByDate.map(({ date, byMealType, dayCalories, dayProtein, dayCarbs, dayFat }) => (
            <div key={date}>
              {/* Day header with nutrition summary */}
              <div className="bg-white rounded-2xl shadow-sm p-3 mb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700">{formatDateLabel(date)}</h3>
                  <span className="text-sm font-bold text-blue-600">{dayCalories} kcal</span>
                </div>
                <div className="flex gap-4 mt-1.5">
                  <span className="text-[10px] text-rose-500 font-medium">P: {dayProtein}g</span>
                  <span className="text-[10px] text-amber-500 font-medium">C: {dayCarbs}g</span>
                  <span className="text-[10px] text-blue-500 font-medium">F: {dayFat}g</span>
                </div>
                {/* Mini progress bar */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((dayCalories / 2000) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Meals grouped by type */}
              <div className="space-y-2">
                {MEAL_TYPE_ORDER.map((mealType) => {
                  const typeMeals = byMealType[mealType];
                  if (!typeMeals || typeMeals.length === 0) return null;
                  const config = MEAL_TYPE_CONFIG[mealType];
                  const Icon = config?.icon || TrendingUp;
                  const typeCalories = typeMeals.reduce((s, m) => s + m.calories, 0);
                  return (
                    <div key={mealType} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-50">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg ${config?.bg || "bg-gray-50"} flex items-center justify-center`}>
                            <Icon size={12} className={config?.color || "text-gray-500"} />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">{config?.label || mealType}</span>
                        </div>
                        <span className={`text-xs font-medium ${config?.color || "text-gray-500"}`}>{typeCalories} kcal</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {typeMeals.map((meal) => (
                          <div key={meal.id} className="px-3 py-2.5 flex items-center gap-3">
                            {meal.image ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                <ImageWithFallback src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className={`w-10 h-10 rounded-lg ${config?.bg || "bg-gray-50"} flex-shrink-0 flex items-center justify-center`}>
                                <Icon size={14} className={config?.color || "text-gray-400"} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-800 truncate">{meal.name}</p>
                              <p className="text-[10px] text-gray-400">{meal.time} · P:{meal.proteinGram}g C:{meal.carbsGram}g F:{meal.fatGram}g</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs font-semibold text-blue-600 mr-0.5">{meal.calories}</span>
                              <button
                                onClick={() => {
                                  setEditingMealId(meal.id);
                                  setForm({
                                    name: meal.name,
                                    calories: meal.calories.toString(),
                                    proteinGram: meal.proteinGram.toString(),
                                    carbsGram: meal.carbsGram.toString(),
                                    fatGram: meal.fatGram.toString(),
                                    mealTag: meal.tags[0] ?? "Trưa",
                                    date: meal.date,
                                  });
                                  setShowForm(true);
                                }}
                                className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center active:scale-90 transition-transform"
                              >
                                <Pencil size={10} className="text-blue-500" />
                              </button>
                              <button
                                onClick={() => void onDeleteMeal(meal.id)}
                                disabled={deletingMealId === meal.id}
                                className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center active:scale-90 transition-transform"
                              >
                                <Trash2 size={10} className="text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {/* Meals without a recognized meal type tag */}
                {Object.entries(byMealType)
                  .filter(([key]) => !MEAL_TYPE_ORDER.includes(key as typeof MEAL_TYPE_ORDER[number]))
                  .map(([key, typeMeals]) => (
                    <div key={key} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-50">
                        <span className="text-xs font-semibold text-slate-600">{key}</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {typeMeals.map((meal) => (
                          <div key={meal.id} className="px-3 py-2.5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex-shrink-0 flex items-center justify-center">
                              <TrendingUp size={14} className="text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-800 truncate">{meal.name}</p>
                              <p className="text-[10px] text-gray-400">{meal.time} · P:{meal.proteinGram}g C:{meal.carbsGram}g F:{meal.fatGram}g</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs font-semibold text-blue-600">{meal.calories}</span>
                              <button
                                onClick={() => void onDeleteMeal(meal.id)}
                                disabled={deletingMealId === meal.id}
                                className="w-6 h-6 rounded-md bg-red-50 flex items-center justify-center active:scale-90 transition-transform"
                              >
                                <Trash2 size={10} className="text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          {!loading && groupedByDate.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu bữa ăn</p>
          )}
        </div>
      </div>
    </div>
  );
}
