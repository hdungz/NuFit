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
    {
      day: "Thứ 2",
      date: "21/04",
      workload: "Bận",
      workout: "Yoga nhẹ - 15 phút",
      intensity: "low",
      googleEvent: "Họp team 9:00 - 17:00",
    },
    {
      day: "Thứ 3",
      date: "22/04",
      workload: "Rảnh",
      workout: "HIIT cao cường độ - 45 phút",
      intensity: "high",
      googleEvent: "Không có lịch",
    },
    {
      day: "Thứ 4",
      date: "23/04",
      workload: "Trung bình",
      workout: "Cardio & Core - 30 phút",
      intensity: "medium",
      googleEvent: "Meeting 14:00 - 15:30",
    },
    {
      day: "Thứ 5",
      date: "24/04",
      workload: "Bận",
      workout: "Stretching - 20 phút",
      intensity: "low",
      googleEvent: "Deadline dự án",
    },
    {
      day: "Thứ 6",
      date: "25/04",
      workload: "Rảnh",
      workout: "Full Body Workout - 50 phút",
      intensity: "high",
      googleEvent: "Không có lịch",
    },
  ];

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getIntensityIcon = (intensity: string) => {
    switch (intensity) {
      case "high":
        return <Zap className="text-white" size={16} />;
      case "medium":
        return <Clock className="text-white" size={16} />;
      case "low":
        return <Moon className="text-white" size={16} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-8">
        <h1 className="text-2xl mb-1">Lịch tập luyện</h1>
        <p className="text-purple-100 text-sm">Tự động điều chỉnh theo lịch trình của bạn</p>
      </div>

      <div className="px-6 mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Tuần này</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <CalendarIcon size={16} />
              <span>21 - 27 Tháng 4</span>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <CalendarIcon className="text-blue-600 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="font-semibold text-blue-900 mb-1">Kết nối Google Calendar</p>
                <p className="text-sm text-blue-800">
                  AI tự động phân tích lịch trình của bạn và điều chỉnh cường độ tập luyện phù hợp cho từng ngày.
                </p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-lg mb-4">Kế hoạch tuần</h2>
        <div className="space-y-4 mb-6">
          {schedule.map((item, index) => (
            <div
              key={item.day}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
                index === 0 ? "border-2 border-purple-500" : ""
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{item.day}</h3>
                      {index === 0 && (
                        <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">Hôm nay</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{item.date}</p>
                  </div>
                  <div className={`${getIntensityColor(item.intensity)} p-2 rounded-lg`}>
                    {getIntensityIcon(item.intensity)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="text-gray-600" size={16} />
                    <p className="text-sm text-gray-600">Lịch Google:</p>
                  </div>
                  <p className="text-sm font-medium">{item.googleEvent}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Bài tập đề xuất</p>
                    <p className="font-semibold text-purple-700">{item.workout}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.workload === "Bận"
                        ? "bg-red-100 text-red-700"
                        : item.workload === "Rảnh"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {item.workload}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
          <h3 className="text-lg mb-2">AI đề xuất</h3>
          <p className="text-sm text-purple-100 mb-4">
            Dựa trên tiến độ hiện tại, bạn đã hoàn thành {workoutMetrics.completedExercises}/{workoutMetrics.totalExercises} bài tuần này.
          </p>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <p className="text-xs text-purple-100 mb-1">Mục tiêu tuần này</p>
            <div className="flex items-center justify-between">
              <p className="font-semibold">{Math.min(workoutMetrics.completedSessions * 30, 200)} / 200 phút</p>
              <p className="text-sm">{Math.min(workoutMetrics.completionRate, 100)}%</p>
            </div>
            <div className="bg-white/30 rounded-full h-2 mt-2 overflow-hidden">
              <div className="bg-white h-full rounded-full" style={{ width: `${Math.min(workoutMetrics.completionRate, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
