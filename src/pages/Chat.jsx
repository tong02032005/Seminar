import { useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import ChatMessage from '../components/chatbot/ChatMessage';
import ChatInput from '../components/chatbot/ChatInput';
import TypingIndicator from '../components/chatbot/TypingIndicator';
import { useChat } from '../components/chatbot/useChat';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useAsync } from '../hooks/useAsync';
import { getChatSuggestions } from '../services/chatService';

export default function Chat() {
  useDocumentTitle('Zoo Assistant');
  const { messages, loading, send, reset } = useChat();
  const suggestions = useAsync(getChatSuggestions, []);
  const listRef = useRef(null);

  // Tự cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <section className="section chat-page">
      <div className="container chat-container">
        <div className="chat-window">
          <header className="chat-window__head">
            <span className="chat-msg__avatar chat-msg__avatar--lg" aria-hidden="true">🦉</span>
            <div>
              <h1>Zoo Assistant</h1>
              <p><span className="online-dot" /> Trả lời về động vật, bản đồ và dịch vụ</p>
            </div>
            <button className="icon-btn" onClick={reset} aria-label="Bắt đầu cuộc trò chuyện mới" title="Cuộc trò chuyện mới">
              <RotateCcw size={18} />
            </button>
          </header>

          <div className="chat-window__messages" ref={listRef} aria-live="polite">
            {messages.map((m) => <ChatMessage key={m.id} message={m} />)}
            {loading && <TypingIndicator />}
          </div>

          {messages.length <= 2 && suggestions.data?.length > 0 && (
            <div className="chat-suggestions">
              {suggestions.data.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)} disabled={loading}>{s}</button>
              ))}
            </div>
          )}

          <ChatInput onSend={send} disabled={loading} />
        </div>
        <p className="muted chat-note">Đây là bản thử nghiệm, câu trả lời được tạo từ dữ liệu của sở thú trên máy chủ.</p>
      </div>
    </section>
  );
}
