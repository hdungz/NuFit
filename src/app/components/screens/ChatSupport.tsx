import { Send, Bot, User, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickReplies =
    persona === "beginner"
      ? ["Bắt đầu từ bài nào?", "Form squat đúng", "Ăn gì sau tập?", "Lịch tập 3 buổi/tuần"]
      : persona === "family"
      ? ["Thực đơn tối cả nhà", "Món healthy trẻ em", "Thay món nào healthy?", "Danh sách đi chợ"]
      : ["Thực đơn tuần sau", "Điều chỉnh bài tập", "Phân tích khẩu vị", "Công thức healthy"];

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

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const handleSend = async (text?: string) => {
    const msgText = text ?? inputValue;
    if (!msgText.trim() || sending) return;
    setInputValue("");
    setSending(true);
    setError(null);
    const result = await sendChatMessage(msgText);
    setSending(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Gửi tin nhắn thất bại.");
      if (!text) setInputValue(msgText);
      return;
    }
    setMessages(result.data);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 px-6 pt-14 pb-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AI Coach</h1>
            <p className="text-indigo-200/70 text-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Đang online
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {loading && <p className="text-sm text-gray-400 text-center">Đang tải...</p>}
        {error && (
          <div className="text-center">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button onClick={() => void loadMessages()} className="text-xs bg-red-50 text-red-600 rounded-xl px-3 py-1.5">Thử lại</button>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                msg.role === "bot" ? "bg-indigo-500" : "bg-gray-300"
              }`}
            >
              {msg.role === "bot" ? <Bot size={14} className="text-white" /> : <User size={14} className="text-white" />}
            </div>
            <div className={`max-w-[75%] ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
              <div
                className={`px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "bot"
                    ? "bg-white shadow-sm rounded-2xl rounded-tl-md text-slate-700"
                    : "bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl rounded-tr-md text-white"
                }`}
              >
                {msg.role === "bot" ? (
                  <div className="prose prose-sm prose-slate max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>h1]:font-bold [&>h2]:font-bold [&>h3]:font-semibold [&>ul]:pl-4 [&>ol]:pl-4 [&>li]:my-0.5 [&>hr]:my-2">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-line">{msg.content}</p>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 px-1">{formatClock(msg.createdAt)}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-1">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white shadow-sm rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick replies + Input - fixed above bottom nav */}
      <div className="flex-shrink-0 px-5 pb-5 bg-slate-50">
        {/* Quick replies */}
        <div className="mb-3 overflow-x-auto flex gap-2 pb-1">
          {quickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => void handleSend(reply)}
              disabled={sending}
              className="flex-shrink-0 bg-white border border-indigo-200 text-indigo-600 px-3 py-1.5 rounded-full text-xs font-medium active:scale-95 transition-transform disabled:opacity-50"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 bg-white rounded-2xl shadow-sm p-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleSend()}
            placeholder="Nhập câu hỏi..."
            className="flex-1 bg-slate-50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => void handleSend()}
            disabled={sending || !inputValue.trim()}
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
