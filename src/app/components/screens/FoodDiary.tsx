import { Calendar, Pencil, Plus, Trash2, TrendingUp } from "lucide-react";
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
  const [form, setForm] = useState({ name: "", calories: "350", mealTag: "Trưa", date: getLocalDateKey() });
  const [editingMealId, setEditingMealId] = useState<string | null>(null);

  const insights = [
    {
      title: "Khẩu vị yêu thích",
      description: "Bạn thích các món Việt Nam truyền thống, đặc biệt là phở và bún",
      color: "bg-purple-500",
    },
    {
      title: "Thói quen ăn uống",
      description: "Bạn thường ăn 3 bữa chính trong ngày, ít ăn vặt",
      color: "bg-blue-500",
    },
    {
      title: "Dinh dưỡng cân đối",
      description: "Chế độ ăn của bạn cân bằng giữa protein, carbs và chất béo",
      color: "bg-green-500",
    },
  ];

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
    if (dateFilter === "today") return meals.filter((meal) => meal.date === today);
    if (dateFilter === "week") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return meals.filter((meal) => new Date(meal.date) >= weekAgo);
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
      image:
        "https://images.unsplash.com/photo-1544510806-e28d3cd4d4e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
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

  return (
    <div className="min-h-full bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-8">
        <h1 className="text-2xl mb-1">Nhật ký bữa ăn</h1>
        <p className="text-blue-100 text-sm">Theo dõi và phân tích khẩu vị của bạn</p>
      </div>

      <div className="px-6 mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Calo hôm nay</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.totalCalories.toLocaleString("vi-VN")} / 2,000</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Còn lại</p>
              <p className="text-xl font-semibold text-gray-900">{metrics.remainingCalories.toLocaleString("vi-VN")} kcal</p>
            </div>
          </div>
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.progressPercent}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Tên món ăn"
              className="col-span-2 bg-gray-100 rounded-xl px-3 py-2 text-sm"
            />
            <input
              value={form.calories}
              onChange={(event) => setForm((prev) => ({ ...prev, calories: event.target.value }))}
              placeholder="Calories"
              type="number"
              className="bg-gray-100 rounded-xl px-3 py-2 text-sm"
            />
            <select
              value={form.mealTag}
              onChange={(event) => setForm((prev) => ({ ...prev, mealTag: event.target.value }))}
              className="bg-gray-100 rounded-xl px-3 py-2 text-sm"
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
            className="w-full bg-blue-600 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            {savingMeal ? "Đang lưu..." : editingMealId ? "Cập nhật bữa ăn" : "Thêm bữa ăn"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
        </div>

        <h2 className="text-lg mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600" />
          Phân tích khẩu vị
        </h2>
        <div className="grid gap-3 mb-6">
          {insights.map((insight, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-4 flex gap-4">
              <div className={`${insight.color} w-12 h-12 rounded-xl flex-shrink-0`} />
              <div>
                <h3 className="font-semibold mb-1">{insight.title}</h3>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-lg mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          Lịch sử bữa ăn
        </h2>
        <div className="flex gap-2 mb-3">
          {[
            { key: "all", label: "Tất cả" },
            { key: "today", label: "Hôm nay" },
            { key: "week", label: "7 ngày" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setDateFilter(item.key as "all" | "today" | "week")}
              className={`px-3 py-1 rounded-full text-xs ${dateFilter === item.key ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="space-y-6 mb-6">
          {loading && <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>}
          {!loading && error && (
            <button onClick={() => void loadMeals()} className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-xs mb-2">
              Thử tải lại danh sách
            </button>
          )}
          {groupedEntries.map(([date, dateMeals]) => {
            const dayTotal = dateMeals.reduce((sum, meal) => sum + meal.calories, 0);
            return (
            <div key={date}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">{formatDateLabel(date)}</h3>
                <span className="text-sm text-gray-600">{dayTotal} kcal</span>
              </div>
              <div className="space-y-3">
                {dateMeals.map((meal) => (
                  <div key={meal.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="flex gap-4 p-4">
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                        <ImageWithFallback src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-xs text-gray-600">{meal.time}</p>
                            <h4 className="font-semibold">{meal.name}</h4>
                          </div>
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                            {meal.calories} kcal
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {meal.tags.map((tag) => (
                            <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => {
                              setEditingMealId(meal.id);
                              setForm((prev) => ({
                                ...prev,
                                name: meal.name,
                                calories: meal.calories.toString(),
                                mealTag: meal.tags[0] ?? "Trưa",
                                date: meal.date,
                              }));
                            }}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg flex items-center gap-1"
                          >
                            <Pencil size={12} /> Sửa
                          </button>
                          <button
                            onClick={() => void onDeleteMeal(meal.id)}
                            disabled={deletingMealId === meal.id}
                            className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-lg flex items-center gap-1"
                          >
                            <Trash2 size={12} /> {deletingMealId === meal.id ? "Đang xóa..." : "Xóa"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}
