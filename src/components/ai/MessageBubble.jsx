// src/components/ai/MessageBubble.jsx
import { User, Bot } from 'lucide-react';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`message-bubble ${isUser ? 'user' : 'ai'}`}>
      <div className="message-avatar">
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div className="message-content">
        <p>{message.content}</p>
        {message.attachments?.map((url, i) => (
          <img key={i} src={url} alt="attachment" className="msg-attachment" />
        ))}
      </div>
    </div>
  );
}