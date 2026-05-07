import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ImageWithFallback } from "../ImageWithFallback";
import type { MealEntry } from "../../lib/models";
import { getLocalDateKey } from "../../lib/utils";
import { computeMealMetrics, listMeals } from "../../services/mealService";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekDates(monday: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    return date;
  });
}

export function MealPlanning() {
  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const baseMonday = getMonday(new Date());
  const currentMonday = new Date(baseMonday);
  currentMonday.setDate(currentMonday.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(currentMonday);

  const today = getLocalDateKey();
  const todayIndex = weekDates.findIndex((d) => getLocalDateKey(d) === today);

  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const idx = weekDates.findIndex((d) => getLocalDateKey(d) === today);
    return idx >= 0 ? idx : 0;
  });

  const selectedDate = getLocalDateKey(weekDates[selectedDayIndex]);

  const loadMeals = async () => {
    setLoading(true);
    setError(null);
    const result = await listMeals();
    setLoading(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Không thể tải dữ liệu thực đơn.");
      return;
    }
    setMeals(result.data);
  };

  useEffect(() => {
    void loadMeals();
  }, []);

  const selectedMeals = useMemo(() => meals.filter((m) => m.date === selectedDate), [meals, selectedDate]);
  const mealMetrics = computeMealMetrics(meals);
  const selectedDayCalories = selectedMeals.reduce((sum, m) => sum + m.calories, 0);

  const totalMacros = selectedMeals.reduce(
    (acc, m) => ({ p: acc.p + m.proteinGram, c: acc.c + m.carbsGram, f: acc.f + m.fatGram }),
    { p: 0, c: 0, f: 0 },
  );
  const macroTotal = totalMacros.p + totalMacros.c + totalMacros.f;

  const groupedMeals = {
    breakfast: selectedMeals.filter((m) => m.tags.includes("Sáng")),
    lunch: selectedMeals.filter((m) => m.tags.includes("Trưa")),
    dinner: selectedMeals.filter((m) => m.tags.includes("Tối")),
  };

  const weekMonthLabel = `Tháng ${currentMonday.getMonth() + 1}`;

  return (
    <div className="min-h-full bg-slate-50">
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-6 pt-14 pb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Thực đơn tuần</h1>
        <p className="text-emerald-100/70 text-sm">Kế hoạch dinh dưỡng được cá nhân hóa</p>
      </div>

      <div className="px-5 pt-4">
        {/* Week selector */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => { setWeekOffset((w) => w - 1); setSelectedDayIndex(0); }}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-slate-700 text-sm">{weekMonthLabel}</span>
            <button
              onClick={() => { setWeekOffset((w) => w + 1); setSelectedDayIndex(0); }}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex justify-between">
            {weekDays.map((day, i) => {
              const isToday = getLocalDateKey(weekDates[i]) === today;
              const isSelected = i === selectedDayIndex;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDayIndex(i)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all active:scale-90 ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                      : isToday
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-gray-500"
                  }`}
                >
                  <span className="text-[10px] font-medium">{day}</span>
                  <span className="text-sm font-bold">{weekDates[i].getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Calorie summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Tổng calo</p>
              <p className="text-2xl font-bold text-emerald-600">{selectedDayCalories}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-0.5">Mục tiêu</p>
              <p className="text-lg font-semibold text-slate-700">2,000 kcal</p>
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((selectedDayCalories / 2000) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Meals by category */}
        {loading && <p className="text-sm text-gray-400 text-center mb-4">Đang tải thực đơn...</p>}
        {error && (
          <div className="text-center mb-4">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={() => void loadMeals()} className="text-xs bg-red-50 text-red-600 rounded-xl px-3 py-1.5 mt-2">Thử lại</button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3 mb-5">
            <MealSection title="Bữa sáng" time="7:00 - 8:00" meals={groupedMeals.breakfast} color="amber" />
            <MealSection title="Bữa trưa" time="12:00 - 13:00" meals={groupedMeals.lunch} color="emerald" />
            <MealSection title="Bữa tối" time="18:00 - 19:00" meals={groupedMeals.dinner} color="violet" />
          </div>
        )}

        {/* Nutrition breakdown */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Phân bổ dinh dưỡng</h3>
          <div className="space-y-3">
            <NutrientBar label="Protein" grams={totalMacros.p} total={macroTotal} color="bg-rose-500" />
            <NutrientBar label="Carbs" grams={totalMacros.c} total={macroTotal} color="bg-amber-500" />
            <NutrientBar label="Fat" grams={totalMacros.f} total={macroTotal} color="bg-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MealSection({ title, time, meals, color }: { title: string; time: string; meals: MealEntry[]; color: string }) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  };
  const badge = colorMap[color] ?? "bg-gray-50 text-gray-600";

  if (meals.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm text-slate-800">{title}</h3>
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>
        <p className="text-xs text-gray-400">Chưa có dữ liệu cho bữa này</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-slate-800">{title}</h3>
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>
        <div className="space-y-3">
          {meals.map((meal) => (
            <div key={meal.id} className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                <ImageWithFallback src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-800 truncate">{meal.name}</p>
                <div className="flex gap-1 mt-1">
                  {meal.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${badge}`}>{tag}</span>
                  ))}
                </div>
              </div>
              <span className="text-sm font-semibold text-emerald-600 flex-shrink-0">{meal.calories}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NutrientBar({ label, grams, total, color }: { label: string; grams: number; total: number; color: string }) {
  const percent = total > 0 ? Math.round((grams / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-semibold text-slate-700">{grams}g ({percent}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
