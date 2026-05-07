import { Send, Bot, User, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { formatClock } from "../../lib/utils";
import { getChatMessages, sendChatMessage } from "../../services/chatService";
import type { ChatMessage } from "../../lib/models";
import { getAuthSession, getPersonaKey } from "../../services/authService";

export function ChatSupport() {
  const persona = getPersonaKey(getAuthSession()?.email);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  const quickReplies =
    persona === "beginner"
      ? [
          "Tôi mới tập, bắt đầu từ bài nào?",
          "Giải thích form squat đúng",
          "Ăn gì sau buổi tập đầu tiên?",
          "Lịch tập nhẹ 3 buổi/tuần",
        ]
      : persona === "family"
      ? [
          "Lên thực đơn tối cho cả nhà",
          "Món ít calo trẻ em dễ ăn",
          "Tối nay nên thay món nào healthy hơn?",
          "Danh sách đi chợ 3 bữa",
        ]
      : [
          "Lên thực đơn cho tuần sau",
          "Tôi bận hôm nay, điều chỉnh bài tập",
          "Phân tích khẩu vị của tôi",
          "Công thức món ăn healthy",
        ];

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    const result = await getChatMessages();
    setLoading(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Không thể tải lịch sử hội thoại.");
      return;
    }
    setMessages(result.data);
  };

  useEffect(() => {
    void loadMessages();
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;
    const nextInput = inputValue;
    setInputValue("");
    setSending(true);
    setError(null);
    const result = await sendChatMessage(nextInput);
    setSending(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Gửi tin nhắn thất bại. Hãy thử lại.");
      setInputValue(nextInput);
      return;
    }
    setMessages(result.data);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 max-w-md mx-auto">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-6 flex items-center gap-3 shadow-lg">
        <div className="bg-white/20 p-2 rounded-full">
          <Bot size={24} />
        </div>
        <div>
          <h1 className="text-xl">AI Coach</h1>
          <p className="text-indigo-100 text-sm flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            Đang online - {persona === "beginner" ? "Chế độ Beginner" : persona === "family" ? "Chế độ Family" : "Chế độ Office"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-32">
        {loading && <p className="text-sm text-gray-500">Đang tải lịch sử hội thoại...</p>}
        {error && (
          <div className="text-sm">
            <p className="text-red-600 mb-2">{error}</p>
            <button onClick={() => void loadMessages()} className="px-3 py-1 rounded-lg bg-red-50 text-red-700 text-xs">
              Thử lại tải hội thoại
            </button>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === "bot" ? "bg-indigo-500" : "bg-gray-400"
              }`}
            >
              {message.role === "bot" ? <Bot size={18} className="text-white" /> : <User size={18} className="text-white" />}
            </div>
            <div className={`flex-1 ${message.role === "user" ? "flex flex-col items-end" : ""}`}>
              <div
                className={`inline-block px-4 py-3 rounded-2xl ${
                  message.role === "bot" ? "bg-white shadow-md" : "bg-indigo-600 text-white"
                } max-w-[80%]`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1 px-1">{formatClock(message.createdAt)}</p>
            </div>
          </div>
        ))}
        {sending && <p className="text-sm text-gray-500">AI Coach đang soạn phản hồi...</p>}
      </div>

      <div className="fixed bottom-20 left-0 right-0 max-w-md mx-auto px-6">
        <div className="bg-white rounded-2xl shadow-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-indigo-600" size={16} />
            <p className="text-xs text-gray-600">Gợi ý câu hỏi:</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => setInputValue(reply)}
                className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs hover:bg-indigo-100 transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-3 flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleSend()}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => void handleSend()}
            disabled={sending || !inputValue.trim()}
            className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-colors flex-shrink-0 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
