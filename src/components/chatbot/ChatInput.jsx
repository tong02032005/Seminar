import { useState } from 'react';
import { SendHorizontal } from 'lucide-react';

export default function ChatInput({ onSend, disabled }) {
  const [text, setText] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form className="chat-input" onSubmit={submit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Hỏi về động vật, bản đồ, giờ mở cửa…"
        aria-label="Nội dung tin nhắn"
        maxLength={500}
      />
      <button type="submit" className="chat-input__send" disabled={disabled || !text.trim()} aria-label="Gửi">
        <SendHorizontal size={20} />
      </button>
    </form>
  );
}
