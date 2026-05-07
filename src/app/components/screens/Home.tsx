import { Link } from "react-router";
import { Dumbbell, Calendar, UtensilsCrossed, Book, Camera, ChefHat, TrendingUp, Activity } from "lucide-react";
import { ImageWithFallback } from "../ImageWithFallback";
import { useEffect, useState } from "react";
import { getDashboardStats } from "../../services/dashboardService";
import { getAuthSession, getPersonaKey, getPersonaLabel } from "../../services/authService";

export function Home() {
  const authSession = getAuthSession();
  const displayName = authSession?.displayName ?? "Bạn";
  const personaLabel = getPersonaLabel(authSession?.email);
  const personaKey = getPersonaKey(authSession?.email);
  const [quickStats, setQuickStats] = useState([
    { label: "Calo hôm nay", value: "0 / 2,000", icon: Activity, color: "bg-blue-500" },
    { label: "Phút tập luyện", value: "0 / 45", icon: TrendingUp, color: "bg-green-500" },
  ]);
  const [completionRate, setCompletionRate] = useState(0);

  useEffect(() => {
    const load = async () => {
      const stats = await getDashboardStats();
      setQuickStats([
        { label: "Calo hôm nay", value: stats.caloriesLabel, icon: Activity, color: "bg-blue-500" },
        { label: "Phút tập luyện", value: stats.workoutMinutesLabel, icon: TrendingUp, color: "bg-green-500" },
      ]);
      setCompletionRate(stats.completionRate);
    };
    void load();
  }, []);

  const features = [
    {
      title: "Huấn luyện AI",
      description: "Điều chỉnh dáng tập real-time",
      icon: Dumbbell,
      path: "/workout",
      color: "bg-orange-500",
      image: "https://images.unsplash.com/photo-1766287453739-c3ffc3f37d05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwd29ya291dCUyMHRyYWluaW5nfGVufDF8fHx8MTc3NjcyMjEzNHww&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Lịch tập luyện",
      description: "Tự động điều chỉnh theo lịch trình",
      icon: Calendar,
      path: "/calendar",
      color: "bg-purple-500",
      image: "https://images.unsplash.com/photo-1573858129122-33bdb25d6950?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxmaXRuZXNzJTIwd29ya291dCUyMHRyYWluaW5nfGVufDF8fHx8MTc3NjcyMjEzNHww&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Thực đơn tuần",
      description: "Lên kế hoạch dinh dưỡng theo tuần",
      icon: UtensilsCrossed,
      path: "/meal-plan",
      color: "bg-green-500",
      image: "https://images.unsplash.com/photo-1766415007387-e4c0a5720733?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGh5JTIwdmlldG5hbWVzZSUyMGZvb2QlMjBtZWFsfGVufDF8fHx8MTc3Njc3NjMyMnww&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Nhật ký bữa ăn",
      description: "Theo dõi & phân tích khẩu vị",
      icon: Book,
      path: "/food-diary",
      color: "bg-blue-500",
      image: "https://images.unsplash.com/photo-1640116309648-79c20583e1c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxoZWFsdGh5JTIwdmlldG5hbWVzZSUyMGZvb2QlMjBtZWFsfGVufDF8fHx8MTc3Njc3NjMyMnww&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Scan Calories",
      description: "Chụp ảnh để phân tích dinh dưỡng",
      icon: Camera,
      path: "/calorie-scanner",
      color: "bg-pink-500",
      image: "https://images.unsplash.com/photo-1544510806-e28d3cd4d4e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxoZWFsdGh5JTIwdmlldG5hbWVzZSUyMGZvb2QlMjBtZWFsfGVufDF8fHx8MTc3Njc3NjMyMnww&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Công thức món Việt",
      description: "Cá nhân hóa theo khẩu vị của bạn",
      icon: ChefHat,
      path: "/recipes",
      color: "bg-yellow-500",
      image: "https://images.unsplash.com/photo-1506267594256-7667b0040d31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxoZWFsdGh5JTIwdmlldG5hbWVzZSUyMGZvb2QlMjBtZWFsfGVufDF8fHx8MTc3Njc3NjMyMnww&ixlib=rb-4.1.0&q=80&w=1080"
    },
  ];

  return (
    <div className="min-h-full bg-gradient-to-b from-blue-50 to-white">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-lg">
        <h1 className="text-3xl mb-2">Xin chào, {displayName}!</h1>
        <p className="text-blue-100">
          {personaKey === "beginner"
            ? "Hôm nay ưu tiên tập đúng form và duy trì thói quen."
            : personaKey === "family"
            ? "Hôm nay ưu tiên thực đơn cân bằng cho cả gia đình."
            : "Sẵn sàng cho ngày mới năng động"}
        </p>
        <div className="mt-3 inline-flex px-3 py-1.5 rounded-full bg-white/20 text-xs">{personaLabel}</div>
      </div>

      <div className="px-6 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-2 gap-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-3">
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <Icon className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                  <p className="font-semibold text-sm">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 mt-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-indigo-900 mb-2">
            {personaKey === "beginner"
              ? "Flow demo Beginner 5 bước"
              : personaKey === "family"
              ? "Flow demo Family 5 bước"
              : "Flow demo Office 5 bước"}
          </h2>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {personaKey === "beginner" ? (
              <>
                <Link to="/workout" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 1: Bắt đầu buổi tập và hoàn thành 1 bài
                </Link>
                <Link to="/meal-plan" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 2: Xem thực đơn hỗ trợ phục hồi
                </Link>
                <Link to="/chat" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 3: Hỏi AI về form và bữa sau tập
                </Link>
                <Link to="/food-diary" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 4: Kiểm tra nạp dinh dưỡng
                </Link>
                <Link to="/" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 5: Quay lại Home xem tiến độ
                </Link>
              </>
            ) : personaKey === "family" ? (
              <>
                <Link to="/meal-plan" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 1: Xem thực đơn gia đình hôm nay
                </Link>
                <Link to="/food-diary" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 2: Kiểm tra lịch sử 7 ngày
                </Link>
                <Link to="/calorie-scanner" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 3: Quét món mới và lưu nhật ký
                </Link>
                <Link to="/chat" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 4: Xin gợi ý bữa tối ít calo
                </Link>
                <Link to="/" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 5: Quay lại Home xem KPI
                </Link>
              </>
            ) : (
              <>
                <Link to="/calorie-scanner" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 1: Quét món ăn và lưu nhật ký
                </Link>
                <Link to="/food-diary" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 2: Xác nhận dữ liệu trong nhật ký
                </Link>
                <Link to="/chat" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 3: Hỏi AI coach theo dữ liệu mới
                </Link>
                <Link to="/workout" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 4: Cập nhật buổi tập
                </Link>
                <Link to="/" className="bg-white rounded-lg px-3 py-2 text-indigo-800 hover:bg-indigo-100">
                  Bước 5: Quay lại Home xem KPI
                </Link>
              </>
            )}
          </div>
        </div>
        <h2 className="text-xl mb-4">Tính năng</h2>
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.path}
                to={feature.path}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-32 overflow-hidden">
                  <ImageWithFallback
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className={`absolute top-3 right-3 ${feature.color} p-2 rounded-lg`}>
                    <Icon className="text-white" size={18} />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="px-6 mt-6 mb-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl mb-2">Mục tiêu hôm nay</h3>
          <p className="text-sm text-green-100 mb-2">Tiến độ plan tuần của bạn hiện tại là {completionRate}%.</p>
          <p className="text-sm text-green-100 mb-4">Luồng demo nhanh: quét món ăn -&gt; lưu nhật ký -&gt; chat xin tư vấn -&gt; cập nhật bài tập.</p>
          <div className="flex gap-2 flex-wrap">
            <Link
              to="/calorie-scanner"
              className="inline-block bg-white text-green-600 px-4 py-2 rounded-xl font-semibold hover:bg-green-50 transition-colors"
            >
              Quét món ăn
            </Link>
            <Link
              to="/chat"
              className="inline-block bg-green-900/30 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-900/40 transition-colors"
            >
              Chat AI Coach
            </Link>
            <Link
              to="/workout"
              className="inline-block bg-green-900/30 text-white px-4 py-2 rounded-xl font-semibold hover:bg-green-900/40 transition-colors"
            >
              Cập nhật tập luyện
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
