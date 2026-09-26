export default function TypingIndicator() {
  return (
    <div className="chat-msg chat-msg--bot" role="status" aria-label="Zoo Assistant đang trả lời">
      <span className="chat-msg__avatar" aria-hidden="true">🦉</span>
      <div className="chat-msg__bubble typing"><i /><i /><i /></div>
    </div>
  );
}
