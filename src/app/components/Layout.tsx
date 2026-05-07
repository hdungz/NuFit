import { Outlet, Link, useLocation } from "react-router";
import { Home, Dumbbell, ScanLine, UtensilsCrossed, MessageCircle } from "lucide-react";

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Trang chủ" },
    { path: "/workout", icon: Dumbbell, label: "Tập luyện" },
    { path: "/calorie-scanner", icon: ScanLine, label: "Scan", highlight: true },
    { path: "/meal-plan", icon: UtensilsCrossed, label: "Thực đơn" },
    { path: "/chat", icon: MessageCircle, label: "Hỗ trợ" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 max-w-md mx-auto relative">
      {/* Main scrollable content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* iOS-style bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto">
        <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200/60">
          <div className="flex justify-around items-end px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const isHighlight = item.highlight;

              if (isHighlight) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex flex-col items-center -mt-5"
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                        active
                          ? "bg-gradient-to-br from-blue-500 to-violet-600 shadow-blue-500/30"
                          : "bg-gradient-to-br from-blue-500 to-violet-600 shadow-blue-500/20"
                      }`}
                    >
                      <Icon size={26} className="text-white" strokeWidth={2} />
                    </div>
                    <span className={`text-[10px] mt-1 ${active ? "text-blue-600 font-semibold" : "text-gray-500"}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-0.5 py-1 px-3 transition-all active:scale-90"
                >
                  <Icon
                    size={24}
                    className={`transition-colors ${active ? "text-blue-600" : "text-gray-400"}`}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  <span
                    className={`text-[10px] transition-colors ${
                      active ? "text-blue-600 font-semibold" : "text-gray-400"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
