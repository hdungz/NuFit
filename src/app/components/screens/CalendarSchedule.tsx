import { Calendar as CalendarIcon, Clock, Zap, Moon } from "lucide-react";
import { readAppData } from "../../lib/storage";
import { computeWorkoutMetrics } from "../../services/workoutService";

export function CalendarSchedule() {
  const today = new Date();
  const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const currentDay = today.getDay();

  const appData = readAppData();
  const workoutMetrics = computeWorkoutMetrics(appData.workoutPlan);

  const schedule = [
    { day: "Thứ 2", date: "Hôm nay", workload: "Bận", workout: "Yoga nhẹ - 15 phút", intensity: "low", event: "Họp team 9:00 - 17:00" },
    { day: "Thứ 3", date: "Ngày mai", workload: "Rảnh", workout: "HIIT cao cường độ - 45 phút", intensity: "high", event: "Không có lịch" },
    { day: "Thứ 4", date: "", workload: "Trung bình", workout: "Cardio & Core - 30 phút", intensity: "medium", event: "Meeting 14:00 - 15:30" },
    { day: "Thứ 5", date: "", workload: "Bận", workout: "Stretching - 20 phút", intensity: "low", event: "Deadline dự án" },
    { day: "Thứ 6", date: "", workload: "Rảnh", workout: "Full Body Workout - 50 phút", intensity: "high", event: "Không có lịch" },
  ];

  const intensityConfig: Record<string, { color: string; icon: typeof Zap; bg: string }> = {
    high: { color: "text-rose-500", icon: Zap, bg: "bg-rose-500" },
    medium: { color: "text-amber-500", icon: Clock, bg: "bg-amber-500" },
    low: { color: "text-emerald-500", icon: Moon, bg: "bg-emerald-500" },
  };

  const workloadColors: Record<string, string> = {
    "Bận": "bg-rose-50 text-rose-600",
    "Rảnh": "bg-emerald-50 text-emerald-600",
    "Trung bình": "bg-amber-50 text-amber-600",
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-600 px-6 pt-14 pb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Lịch tập luyện</h1>
        <p className="text-purple-100/70 text-sm">Tự động điều chỉnh theo lịch trình</p>
      </div>

      <div className="px-5 pt-4">
        {/* Week day pills */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex justify-between">
            {weekDays.map((day, i) => {
              const isToday = i === currentDay;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl ${
                    isToday ? "bg-violet-500 text-white shadow-md shadow-violet-500/30" : "text-gray-400"
                  }`}
                >
                  <span className="text-[10px] font-medium">{day}</span>
                  <span className="text-sm font-bold">
                    {new Date(today.getFullYear(), today.getMonth(), today.getDate() - currentDay + i).getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Google Calendar info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
          <CalendarIcon className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-semibold text-blue-800">Google Calendar</p>
            <p className="text-xs text-blue-600/70">AI phân tích lịch và điều chỉnh cường độ tập</p>
          </div>
        </div>

        {/* Schedule */}
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Kế hoạch tuần</h2>
        <div className="space-y-3 mb-5">
          {schedule.map((item, i) => {
            const config = intensityConfig[item.intensity] ?? intensityConfig.low;
            const Icon = config.icon;
            return (
              <div
                key={i}
                className={`bg-white rounded-2xl shadow-sm p-4 ${i === 0 ? "border-2 border-violet-400" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-slate-800">{item.day}</h3>
                      {i === 0 && (
                        <span className="bg-violet-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">Hôm nay</span>
                      )}
                    </div>
                    {item.date && i !== 0 && <p className="text-[10px] text-gray-400">{item.date}</p>}
                  </div>
                  <div className={`${config.bg} w-8 h-8 rounded-lg flex items-center justify-center`}>
                    <Icon size={16} className="text-white" />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 mb-3 flex items-center gap-2">
                  <CalendarIcon size={14} className="text-gray-400" />
                  <p className="text-xs text-gray-600">{item.event}</p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-violet-700">{item.workout}</p>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${workloadColors[item.workload]}`}>
                    {item.workload}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI suggestion */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-5 mb-6 shadow-lg shadow-violet-500/20">
          <h3 className="text-white font-semibold mb-2">AI đề xuất</h3>
          <p className="text-violet-100/80 text-sm mb-3">
            Hoàn thành {workoutMetrics.completedExercises}/{workoutMetrics.totalExercises} bài tuần này.
          </p>
          <div className="bg-white/15 rounded-xl p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-violet-200">Mục tiêu tuần</span>
              <span className="text-xs text-white font-semibold">{Math.min(workoutMetrics.completionRate, 100)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${Math.min(workoutMetrics.completionRate, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
