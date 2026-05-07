import { Pencil, Plus, Trash2, TrendingUp, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ImageWithFallback } from "../ImageWithFallback";
import type { MealEntry, MealTag } from "../../lib/models";
import { formatDateLabel, getLocalDateKey } from "../../lib/utils";
import { addMeal, computeMealMetrics, listMeals, removeMeal, updateMeal } from "../../services/mealService";

export function FoodDiary() {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingMeal, setSavingMeal] = useState(false);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", calories: "350", mealTag: "Trưa", date: getLocalDateKey() });
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

  const groupedEntries = useMemo(() => {
    const grouped = filteredMeals.reduce<Record<string, MealEntry[]>>((acc, meal) => {
      acc[meal.date] = acc[meal.date] ? [...acc[meal.date], meal] : [meal];
      return acc;
    }, {});
    return Object.entries(grouped).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filteredMeals]);

  const metrics = computeMealMetrics(meals);

  const saveMeal = async () => {
    if (savingMeal) return;
    const payload = {
      date: form.date,
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      name: form.name.trim(),
      calories: Number(form.calories),
      proteinGram: Math.round(Number(form.calories) * 0.08),
      carbsGram: Math.round(Number(form.calories) * 0.12),
      fatGram: Math.round(Number(form.calories) * 0.03),
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
    setForm({ ...form, name: "", calories: "350" });
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
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditingMealId(null); setForm({ name: "", calories: "350", mealTag: "Trưa", date: getLocalDateKey() }); }}
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

        {/* Meal history */}
        <div className="space-y-5 mb-6">
          {loading && <p className="text-sm text-gray-400 text-center">Đang tải dữ liệu...</p>}
          {groupedEntries.map(([date, dateMeals]) => {
            const dayTotal = dateMeals.reduce((sum, m) => sum + m.calories, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">{formatDateLabel(date)}</h3>
                  <span className="text-xs text-gray-400">{dayTotal} kcal</span>
                </div>
                <div className="space-y-2">
                  {dateMeals.map((meal) => (
                    <div key={meal.id} className="bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3">
                      {meal.image ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <ImageWithFallback src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0 flex items-center justify-center">
                          <TrendingUp size={16} className="text-blue-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">{meal.name}</p>
                        <p className="text-[10px] text-gray-400">{meal.time} · {meal.tags.join(", ")}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600 mr-1">{meal.calories}</span>
                        <button
                          onClick={() => {
                            setEditingMealId(meal.id);
                            setForm({ name: meal.name, calories: meal.calories.toString(), mealTag: meal.tags[0] ?? "Trưa", date: meal.date });
                            setShowForm(true);
                          }}
                          className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <Pencil size={12} className="text-blue-500" />
                        </button>
                        <button
                          onClick={() => void onDeleteMeal(meal.id)}
                          disabled={deletingMealId === meal.id}
                          className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center active:scale-90 transition-transform"
                        >
                          <Trash2 size={12} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {!loading && groupedEntries.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu bữa ăn</p>
          )}
        </div>
      </div>
    </div>
  );
}
