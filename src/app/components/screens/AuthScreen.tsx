import { useState } from "react";
import { Dumbbell, LogIn, UserPlus } from "lucide-react";
import { login, register } from "../../services/authService";

type AuthMode = "login" | "register";

type AuthScreenProps = {
  onAuthSuccess: () => void;
};

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
      mode === "login" ? await login(email, password) : await register(displayName, email, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Không thể xác thực. Vui lòng thử lại.");
      return;
    }
    onAuthSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-3xl shadow-xl mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-xl">
              <Dumbbell size={22} />
            </div>
            <h1 className="text-2xl">Fitness AI Coach</h1>
          </div>
          <p className="text-sm text-blue-100">Đăng nhập để bắt đầu hành trình tập luyện và dinh dưỡng cá nhân hóa.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-5">
          <div className="mb-4 p-3 rounded-xl bg-blue-50 text-blue-900 text-xs">
            Tài khoản demo:
            <br />
            linh.office@demo.com (Office) - nam.beginner@demo.com (Beginner) - hoa.family@demo.com (Family)
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button
              onClick={() => {
                setMode("login");
                setEmail("linh.office@demo.com");
                setPassword("demo123");
              }}
              className="text-[11px] bg-gray-100 hover:bg-gray-200 rounded-lg py-2"
            >
              Office
            </button>
            <button
              onClick={() => {
                setMode("login");
                setEmail("nam.beginner@demo.com");
                setPassword("demo123");
              }}
              className="text-[11px] bg-gray-100 hover:bg-gray-200 rounded-lg py-2"
            >
              Beginner
            </button>
            <button
              onClick={() => {
                setMode("login");
                setEmail("hoa.family@demo.com");
                setPassword("demo123");
              }}
              className="text-[11px] bg-gray-100 hover:bg-gray-200 rounded-lg py-2"
            >
              Family
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-xl p-1 mb-5">
            <button
              onClick={() => setMode("login")}
              className={`py-2 rounded-lg text-sm ${mode === "login" ? "bg-white shadow text-blue-700" : "text-gray-600"}`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => setMode("register")}
              className={`py-2 rounded-lg text-sm ${mode === "register" ? "bg-white shadow text-blue-700" : "text-gray-600"}`}
            >
              Đăng ký
            </button>
          </div>

          <div className="space-y-3">
            {mode === "register" && (
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Tên hiển thị"
                className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              type="email"
              className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mật khẩu"
              type="password"
              className="w-full bg-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={() => void submit()}
              disabled={submitting}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {mode === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}
              {submitting ? "Đang xử lý..." : mode === "login" ? "Vào ứng dụng" : "Tạo tài khoản"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
