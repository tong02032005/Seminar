import { Link } from 'react-router-dom';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`chat-msg ${isUser ? 'chat-msg--user' : 'chat-msg--bot'}`}>
      {!isUser && <span className="chat-msg__avatar" aria-hidden="true">🦉</span>}
      <div className="chat-msg__bubble">
        <p>{message.text}</p>
        {message.link && (
          <Link to={message.link.to} className="chat-msg__link">{message.link.label}</Link>
        )}
        <time>{message.time}</time>
      </div>
    </div>
  );
}
