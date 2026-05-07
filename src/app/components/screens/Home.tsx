import { Link } from "react-router";
import { Dumbbell, ScanLine, UtensilsCrossed, Book, Calendar, ChefHat, Settings, LogOut, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { getDashboardStats } from "../../services/dashboardService";
import { getAuthSession, getPersonaLabel } from "../../services/authService";
import { useAuth } from "../../auth/AuthContext";
import { resetAppData } from "../../lib/storage";

function CircularProgress({
  value,
  max,
  color,
  size = 100,
  strokeWidth = 8,
  label,
  unit,
}: {
  value: number;
  max: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  label: string;
  unit: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const offset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-slate-800">{value}</span>
          <span className="text-[10px] text-gray-400">{unit}</span>
        </div>
      </div>
      <span className="text-xs text-gray-500 mt-2 font-medium">{label}</span>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export function Home() {
  const authSession = getAuthSession();
  const displayName = authSession?.displayName ?? "Bạn";
  const personaLabel = getPersonaLabel(authSession?.email);
  const { onLogout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);

  const [stats, setStats] = useState({
    caloriesLabel: "0 / 2,000",
    workoutMinutesLabel: "0 / 45",
    completionRate: 0,
    totalCalories: 0,
    workoutMinutes: 0,
  });

  useEffect(() => {
    const load = async () => {
      const s = await getDashboardStats();
      // Parse calorie value from label
      const calMatch = s.caloriesLabel.match(/^[\d,.]+/);
      const calValue = calMatch ? parseInt(calMatch[0].replace(/\./g, "").replace(",", ""), 10) : 0;
      const minMatch = s.workoutMinutesLabel.match(/^[\d]+/);
      const minValue = minMatch ? parseInt(minMatch[0], 10) : 0;
      setStats({
        ...s,
        totalCalories: calValue,
        workoutMinutes: minValue,
      });
    };
    void load();
  }, []);

  const features = [
    {
      title: "Huấn luyện AI",
      desc: "Camera theo dõi tư thế",
      icon: Dumbbell,
      path: "/workout",
      gradient: "from-orange-400 to-rose-500",
      shadow: "shadow-orange-500/20",
    },
    {
      title: "Scan Calories",
      desc: "Chụp ảnh nhận diện món",
      icon: ScanLine,
      path: "/calorie-scanner",
      gradient: "from-pink-500 to-violet-500",
      shadow: "shadow-pink-500/20",
    },
    {
      title: "Thực đơn tuần",
      desc: "Kế hoạch dinh dưỡng",
      icon: UtensilsCrossed,
      path: "/meal-plan",
      gradient: "from-emerald-400 to-teal-500",
      shadow: "shadow-emerald-500/20",
    },
    {
      title: "Nhật ký ăn",
      desc: "Theo dõi bữa ăn",
      icon: Book,
      path: "/food-diary",
      gradient: "from-blue-400 to-indigo-500",
      shadow: "shadow-blue-500/20",
    },
    {
      title: "Lịch tập",
      desc: "Kế hoạch hàng tuần",
      icon: Calendar,
      path: "/calendar",
      gradient: "from-purple-400 to-violet-500",
      shadow: "shadow-purple-500/20",
    },
    {
      title: "Công thức",
      desc: "Món Việt healthy",
      icon: ChefHat,
      path: "/recipes",
      gradient: "from-amber-400 to-orange-500",
      shadow: "shadow-amber-500/20",
    },
  ];

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 px-6 pt-14 pb-20 rounded-b-[2rem]">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-blue-200/60 text-sm mb-1">{getGreeting()}</p>
            <h1 className="text-2xl font-bold text-white">{displayName}</h1>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs">
              {personaLabel}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Settings size={20} className="text-white/70" />
            </button>
            {showSettings && (
              <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl py-2 w-44 z-50">
                <button
                  onClick={() => {
                    resetAppData();
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                >
                  <RotateCcw size={16} /> Reset dữ liệu
                </button>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 active:bg-red-100"
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats rings - overlapping header */}
      <div className="px-6 -mt-12">
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 p-6">
          <div className="flex justify-around">
            <CircularProgress
              value={stats.totalCalories}
              max={2000}
              color="#3b82f6"
              label="Calo"
              unit="kcal"
            />
            <CircularProgress
              value={stats.workoutMinutes}
              max={45}
              color="#10b981"
              label="Tập luyện"
              unit="phút"
            />
            <CircularProgress
              value={stats.completionRate}
              max={100}
              color="#8b5cf6"
              label="Tiến độ"
              unit="%"
            />
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Tính năng</h2>
        <div className="grid grid-cols-2 gap-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.path}
                to={f.path}
                className={`bg-white rounded-2xl p-4 shadow-md ${f.shadow} hover:shadow-lg active:scale-[0.97] transition-all`}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 shadow-sm`}>
                  <Icon size={22} className="text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick action CTA */}
      <div className="px-6 mt-6 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-violet-600 rounded-2xl p-5 shadow-lg shadow-blue-500/20">
          <h3 className="text-white font-semibold text-lg mb-1">Bắt đầu ngay</h3>
          <p className="text-blue-100/80 text-sm mb-4">
            Quét món ăn, theo dõi calo, và nhận tư vấn từ AI Coach.
          </p>
          <div className="flex gap-2">
            <Link
              to="/calorie-scanner"
              className="flex-1 bg-white text-blue-600 py-2.5 rounded-xl text-sm font-semibold text-center active:scale-95 transition-transform"
            >
              Quét món ăn
            </Link>
            <Link
              to="/chat"
              className="flex-1 bg-white/20 text-white py-2.5 rounded-xl text-sm font-semibold text-center active:scale-95 transition-transform"
            >
              Chat AI Coach
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
