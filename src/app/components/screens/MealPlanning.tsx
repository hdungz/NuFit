import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ImageWithFallback } from "../ImageWithFallback";
import type { MealEntry } from "../../lib/models";
import { getLocalDateKey } from "../../lib/utils";
import { computeMealMetrics, listMeals } from "../../services/mealService";

// Helper functions for week calculation
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(d.setDate(diff));
}

function getWeekInfo(date: Date) {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const weekNumber = Math.ceil(
    (date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay() - 1) / 7
  );
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const startDateStr = `${String(monday.getDate()).padStart(2, "0")}/${String(monday.getMonth() + 1).padStart(2, "0")}`;
  const endDateStr = `${String(sunday.getDate()).padStart(2, "0")}/${String(sunday.getMonth() + 1).padStart(2, "0")}/${year}`;

  return { monday, sunday, weekNumber, month, startDateStr, endDateStr, year };
}

function getWeekDates(monday: Date) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export function MealPlanning() {
  const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

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
    // Update current date every minute
    const interval = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const today = getLocalDateKey(currentDate);
  const todayMeals = useMemo(() => meals.filter((meal) => meal.date === today), [meals, today]);
  const mealMetrics = computeMealMetrics(meals);
  
  // Calculate week information
  const weekInfo = getWeekInfo(currentDate);
  const weekDates = getWeekDates(weekInfo.monday);
  const todayIndex = weekDates.findIndex((date) => getLocalDateKey(date) === today);

  const groupedMealByTag = {
    breakfast: todayMeals.find((meal) => meal.tags.includes("Sáng")) ?? todayMeals[0],
    lunch: todayMeals.find((meal) => meal.tags.includes("Trưa")) ?? todayMeals[1],
    dinner: todayMeals.find((meal) => meal.tags.includes("Tối")) ?? todayMeals[2],
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-8">
        <h1 className="text-2xl mb-1">Thực đơn tuần</h1>
        <p className="text-green-100 text-sm">Kế hoạch dinh dưỡng được cá nhân hóa</p>
      </div>

      <div className="px-6 mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="text-center">
              <h2 className="font-semibold">Tuần {weekInfo.weekNumber} - Tháng {weekInfo.month}</h2>
              <p className="text-sm text-gray-600">{weekInfo.startDateStr} - {weekInfo.endDateStr}</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex justify-around mb-4">
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg ${
                  index === todayIndex ? "bg-green-500 text-white" : "text-gray-600"
                }`}
              >
                <span className="text-xs">{day}</span>
                <span className={`text-sm font-semibold ${index === todayIndex ? "text-white" : "text-gray-900"}`}>
                  {weekDates[index].getDate()}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng calo trong ngày</p>
                <p className="text-2xl font-bold text-green-700">{mealMetrics.totalCalories} kcal</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Mục tiêu</p>
                <p className="text-lg font-semibold">2,000 kcal</p>
              </div>
            </div>
            <div className="bg-gray-200 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-green-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${mealMetrics.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg">Thực đơn hôm nay</h2>
          <button className="flex items-center gap-2 text-green-600 text-sm font-medium hover:text-green-700">
            <Download size={16} />
            Tải xuống
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {loading && <p className="text-sm text-gray-500">Đang tải thực đơn...</p>}
          {error && (
            <div>
              <p className="text-sm text-red-600">{error}</p>
              <button onClick={() => void loadMeals()} className="text-xs mt-2 bg-red-50 text-red-700 rounded-lg px-2 py-1">
                Thử lại tải dữ liệu
              </button>
            </div>
          )}
          {!loading && !error && (
            <>
              <MealCard title="Bữa sáng" time="7:00 - 8:00" meal={groupedMealByTag.breakfast} />
              <MealCard title="Bữa trưa" time="12:00 - 13:00" meal={groupedMealByTag.lunch} />
              <MealCard title="Bữa tối" time="18:00 - 19:00" meal={groupedMealByTag.dinner} />
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="font-semibold mb-3">Phân bổ dinh dưỡng hôm nay</h3>
          <div className="space-y-3">
            <NutritionBar label="Protein" value={25} color="bg-red-500" />
            <NutritionBar label="Carbs" value={50} color="bg-yellow-500" />
            <NutritionBar label="Fat" value={25} color="bg-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MealCard({ title, time, meal }: { title: string; time: string; meal?: { name: string; calories: number; image: string } }) {
  if (!meal) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-xs text-gray-600 mb-3">{time