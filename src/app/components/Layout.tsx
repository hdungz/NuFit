import { Outlet, Link, useLocation } from "react-router";
import { Home, Dumbbell, Calendar, UtensilsCrossed, Camera, BookOpen, MessageCircle, LogOut, RotateCcw } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { resetAppData } from "../lib/storage";

export function Layout() {
  const location = useLocation();
  const { onLogout } = useAuth();

  const navItems = [
    { path: "/", icon: Home, label: "Trang chủ" },
    { path: "/workout", icon: Dumbbell, label: "Tập luyện" },
    { path: "/calorie-scanner", icon: Camera, label: "Scan Calories", highlight: true, hideLabel: true },
    { path: "/meal-plan", icon: UtensilsCrossed, label: "Thực đơn" },
    { path: "/chat", icon: MessageCircle, label: "Hỗ trợ" },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 max-w-md mx-auto">
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="sticky top-0 z-10 max-w-md mx-auto px-4 pt-3 flex justify-end gap-2">
          <button
            onClick={() => {
              resetAppData();
              window.location.reload();
            }}
            className="bg-white text-gray-700 shadow px-3 py-2 rounded-xl text-xs flex items-center gap-1 hover:bg-gray-50"
          >
            <RotateCcw size={14} />
            Reset demo
          </button>
          <button
            onClick={onLogout}
            className="bg-white text-gray-700 shadow px-3 py-2 rounded-xl text-xs flex items-center gap-1 hover:bg-gray-50"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
        <div className="flex justify-around items-center">
          {navItems.map((item: any) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            const isHighlight = item.highlight;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  isHighlight
                    ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg scale-110"
                    : active
                    ? "text-blue-600"
                    : "text-gray-600"
                }`}
              >
                <Icon size={isHighlight ? 32 : 24} strokeWidth={active && !isHighlight ? 2.5 : 2} />
                {!item.hideLabel && <span className="text-xs">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
