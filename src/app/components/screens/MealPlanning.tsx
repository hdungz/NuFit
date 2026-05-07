import { ChevronLeft, ChevronRight, UtensilsCrossed, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { MealPlanEntry } from "../../lib/models";
import { getLocalDateKey } from "../../lib/utils";
import { listMealPlan, removeMealPlanEntry } from "../../services/mealPlanService";
import { Link } from "react-router";

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
  const [planEntries, setPlanEntries] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const baseMonday = getMonday(new Date());
  const currentMonday = new Date(baseMonday);
  currentMonday.setDate(currentMonday.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(currentMonday);

  const today = getLocalDateKey();

  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const idx = weekDates.findIndex((d) => getLocalDateKey(d) === today);
    return idx >= 0 ? idx : 0;
  });

  const selectedDate = getLocalDateKey(weekDates[selectedDayIndex]);

  const loadPlan = async () => {
    setLoading(true);
    setError(null);
    const result = await listMealPlan();
    setLoading(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Không thể tải thực đơn.");
      return;
    }
    setPlanEntries(result.data);
  };

  useEffect(() => {
    void loadPlan();
  }, []);

  const selectedMeals = useMemo(() => planEntries.filter((m) => m.date === selectedDate), [planEntries, selectedDate]);
  const selectedDayCalories = selectedMeals.reduce((sum, m) => sum + m.calories, 0);

  const totalMacros = selectedMeals.reduce(
    (acc, m) => ({ p: acc.p + m.proteinGram, c: acc.c + m.carbsGram, f: acc.f + m.fatGram }),
    { p: 0, c: 0, f: 0 },
  );
  const macroTotal = totalMacros.p + totalMacros.c + totalMacros.f;

  const groupedMeals = {
    breakfast: selectedMeals.filter((m) => m.mealType === "Sáng"),
    lunch: selectedMeals.filter((m) => m.mealType === "Trưa"),
    dinner: selectedMeals.filter((m) => m.mealType === "Tối"),
    snack: selectedMeals.filter((m) => m.mealType === "Snack"),
  };

  // Check which days have plan entries this week
  const weekDateKeys = weekDates.map((d) => getLocalDateKey(d));
  const daysWithPlan = new Set(planEntries.filter((e) => weekDateKeys.includes(e.date)).map((e) => e.date));

  const weekMonthLabel = `Tháng ${currentMonday.getMonth() + 1}`;

  const onDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    const result = await removeMealPlanEntry(id);
    setDeletingId(null);
    if (result.data) setPlanEntries(result.data);
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-6 pt-14 pb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Thực đơn tuần</h1>
        <p className="text-emerald-100/70 text-sm">Kế hoạch dinh dưỡng từ AI Coach</p>
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
              const dateKey = getLocalDateKey(weekDates[i]);
              const isToday = dateKey === today;
              const isSelected = i === selectedDayIndex;
              const hasPlan = daysWithPlan.has(dateKey);
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
                  {hasPlan && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Calorie summary */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Tổng calo kế hoạch</p>
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
            <button onClick={() => void loadPlan()} className="text-xs bg-red-50 text-red-600 rounded-xl px-3 py-1.5 mt-2">Thử lại</button>
          </div>
        )}

        {!loading && !error && selectedMeals.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-4 text-center">
            <UtensilsCrossed size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">Chưa có thực đơn cho ngày này</p>
            <Link to="/chat" className="text-xs text-emerald-600 font-medium">
              Nhờ AI Coach lên thực đơn →
            </Link>
          </div>
        )}

        {!loading && !error && selectedMeals.length > 0 && (
          <div className="space-y-3 mb-5">
            <PlanMealSection title="Bữa sáng" meals={groupedMeals.breakfast} color="amber" onDelete={onDelete} deletingId={deletingId} />
            <PlanMealSection title="Bữa trưa" meals={groupedMeals.lunch} color="emerald" onDelete={onDelete} deletingId={deletingId} />
            <PlanMealSection title="Bữa tối" meals={groupedMeals.dinner} color="violet" onDelete={onDelete} deletingId={deletingId} />
            {groupedMeals.snack.length > 0 && (
              <PlanMealSection title="Snack" meals={groupedMeals.snack} color="amber" onDelete={onDelete} deletingId={deletingId} />
            )}
          </div>
        )}

        {/* Nutrition breakdown */}
        {selectedMeals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Phân bổ dinh dưỡng</h3>
            <div className="space-y-3">
              <NutrientBar label="Protein" grams={totalMacros.p} total={macroTotal} color="bg-rose-500" />
              <NutrientBar label="Carbs" grams={totalMacros.c} total={macroTotal} color="bg-amber-500" />
              <NutrientBar label="Fat" grams={totalMacros.f} total={macroTotal} color="bg-blue-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PlanMealSection({
  title,
  meals,
  color,
  onDelete,
  deletingId,
}: {
  title: string;
  meals: MealPlanEntry[];
  color: string;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    amber: { bg: "bg-amber-50", text: "text-amber-600", icon: "text-amber-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", icon: "text-emerald-500" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", icon: "text-violet-500" },
  };
  const c = colorMap[color] ?? colorMap.emerald;

  if (meals.length === 0) return null;

  const sectionCalories = meals.reduce((sum, m) => sum + m.calories, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-slate-800">{title}</h3>
          <span className={`text-xs font-medium ${c.text} ${c.bg} px-2 py-0.5 rounded-full`}>{sectionCalories} kcal</span>
        </div>
        <div className="space-y-2.5">
          {meals.map((meal) => (
            <div key={meal.id} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                <UtensilsCrossed size={16} className={c.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-800 truncate">{meal.name}</p>
                <p className="text-[10px] text-gray-400">P:{meal.proteinGram}g · C:{meal.carbsGram}g · F:{meal.fatGram}g</p>
              </div>
              <span className="text-sm font-semibold text-emerald-600 flex-shrink-0 mr-1">{meal.calories}</span>
              <button
                onClick={() => onDelete(meal.id)}
                disabled={deletingId === meal.id}
                className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
              >
                <Trash2 size={12} className="text-red-400" />
              </button>
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
