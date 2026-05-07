import { useState } from "react";
import { Dumbbell, LogIn, UserPlus, Scan, User } from "lucide-react";
import { login, register } from "../../services/authService";

type AuthMode = "login" | "register";

type AuthScreenProps = {
  onAuthSuccess: () => void;
};

const personas = [
  {
    name: "Linh",
    email: "linh.office@demo.com",
    label: "Dân văn phòng",
    desc: "Bận rộn, tập nhanh",
    gradient: "from-blue-500 to-blue-600",
  },
  {
    name: "Nam",
    email: "nam.beginner@demo.com",
    label: "Người mới",
    desc: "Bắt đầu tập gym",
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    name: "Hoa",
    email: "hoa.family@demo.com",
    label: "Gia đình",
    desc: "Dinh dưỡng cả nhà",
    gradient: "from-violet-500 to-violet-600",
  },
];

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    const result =
      mode === "login"
        ? await login(email, password)
        : await register(displayName, email, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Không thể xác thực. Vui lòng thử lại.");
      return;
    }
    onAuthSuccess();
  };

  const quickLogin = async (personaEmail: string) => {
    setError(null);
    setSubmitting(true);
    const result = await login(personaEmail, "demo123");
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Không thể đăng nhập.");
      return;
    }
    onAuthSuccess();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 via-blue-950 to-violet-950 overflow-y-auto">
      {/* Top section - Logo & branding */}
      <div className="flex-shrink-0 flex flex-col items-center pt-16 pb-8 px-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-6">
          <Dumbbell size={36} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">NuFit</h1>
        <p className="text-blue-200/70 text-center text-sm leading-relaxed">
          Theo dõi dinh dưỡng & tập luyện{"\n"}cá nhân hóa bằng AI
        </p>
      </div>

      {/* Main card */}
      <div className="flex-1 px-5 pb-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10">
          {/* Segmented control */}
          <div className="flex bg-white/10 rounded-2xl p-1 mb-5">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-white/60"
              }`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-white/60"
              }`}
            >
              Đăng ký
            </button>
          </div>

          {/* Form */}
          <div className="space-y-3">
            {mode === "register" && (
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tên hiển thị"
                  className="w-full bg-white/10 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-white/40 outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all text-sm"
                />
              </div>
            )}
            <div className="relative">
              <Scan size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full bg-white/10 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-white/40 outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all text-sm"
              />
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xs">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                type="password"
                className="w-full bg-white/10 border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder-white/40 outline-none focus:border-blue-400/50 focus:bg-white/15 transition-all text-sm"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm px-1">{error}</p>
            )}

            <button
              onClick={() => void submit()}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.97] transition-transform disabled:opacity-60"
            >
              {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
              {submitting
                ? "Đang xử lý..."
                : mode === "login"
                ? "Đăng nhập"
                : "Tạo tài khoản"}
            </button>
          </div>
        </div>

        {/* Quick login personas */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/40 text-xs">Trải nghiệm nhanh</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {personas.map((p) => (
              <button
                key={p.email}
                onClick={() => void quickLogin(p.email)}
                disabled={submitting}
                className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-95 transition-all hover:bg-white/10 disabled:opacity-50"
              >
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${p.gradient} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                  {p.name[0]}
                </div>
                <div className="text-center">
                  <p className="text-white text-xs font-semibold">{p.name}</p>
                  <p className="text-white/40 text-[10px] leading-tight">{p.label}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
