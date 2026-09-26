import { useCallback, useState } from 'react';
import { sendChatMessage } from '../../services/chatService';

const now = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

const WELCOME = {
  id: 0,
  role: 'bot',
  text: 'Xin chào! Mình là Zoo Assistant. Bạn muốn tìm hiểu loài nào, hay cần chỉ đường trong sở thú?',
  time: now(),
};

/** Quản lý hội thoại. Logic gọi API nằm trong chatService, component chỉ dùng hook này. */
export function useChat() {
  const [messages, setMessages] = useState([WELCOME]);
  const [loading, setLoading] = useState(false);

  const send = useCallback(
    async (text) => {
      const userMsg = { id: Date.now(), role: 'user', text, time: now() };
      setMessages((m) => [...m, userMsg]);
      setLoading(true);
      try {
        const history = messages.map(({ role, text: t }) => ({ role, text: t }));
        const reply = await sendChatMessage(text, history);
        setMessages((m) => [...m, { id: Date.now() + 1, role: 'bot', time: now(), ...reply }]);
      } catch {
        setMessages((m) => [
          ...m,
          { id: Date.now() + 1, role: 'bot', time: now(), text: 'Mình chưa kết nối được máy chủ. Bạn thử gửi lại sau ít phút nhé.' },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

  const reset = () => setMessages([{ ...WELCOME, time: now() }]);

  return { messages, loading, send, reset };
}
